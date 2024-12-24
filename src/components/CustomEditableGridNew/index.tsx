import { Box, Button, Dialog, IconButton, MenuItem } from '@mui/material';
import { isEmpty, orderBy, sortBy, uniqBy } from 'lodash';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import ArrangeView from 'src/components/CustomReactTable/ArrangeView';
import CustomTable from 'src/components/CustomEditableGridNew/CustomTable';
import { generateColumn, generateRows, yupSchemaForBulkEdit } from 'src/components/CustomEditableGridNew/helper';
import { TActios, TInitialState } from 'src/components/CustomEditableGridNew/hooks/tableReducer';
import { useGridMetaData } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AddField } from 'src/components/FormBuilder/AddField';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import AddExistingProduct from 'src/components/productBuilder/AddExistingProduct';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import IconWithPulse from 'src/components/IconWithPulse';
import InfoIcon from '@material-ui/icons/Info';

export * from 'src/components/CustomEditableGridNew/hooks/tableReducer';

var levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];

type CustomEditableGridProps = {
  state: TInitialState;
  dispatch: React.Dispatch<TActios>;
  onClose: () => void;
  fields?: any[];
  data: any[];
  extraDisabledFields: any;
  handleSave: (data: any[]) => void;
  isSubmitting: boolean;
  referenceId: string | null;
  restData: any[];
  renderedFrom;
};

const CustomEditableGrid = ({
  state,
  dispatch,
  onClose,
  fields = [],
  data,
  extraDisabledFields,
  handleSave,
  isSubmitting,
  referenceId = null,
  restData = [],
  renderedFrom = ''
}: CustomEditableGridProps) => {
  const { columnOrder, loading, visibleColumns } = state;

  const toastConfig = useContext(CustomToastContext);
  const { gridMetaData } = useGridMetaData();
  const tableData = gridMetaData[renderedFrom] || { order: [], hide: [] };

  const [columns, setColumns] = useState<any[]>(null);
  const [allFields, setAllFields] = useState([]);
  const [flatRows, setFlatRows] = useState(null);
  const [constColummns, setConstColummns] = useState([]);
  const [error, setError] = useState<any>({});
  const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
  const [isAddField, setIsAddField] = useState(false);
  const [addedField, setAddedField] = useState([]);
  const [scrollToHeader, setScrollToHeader] = useState('');

  useEffect(() => {
    if (referenceId) {
      fetchColumns();
    } else {
      setAllFields(JSON.parse(JSON.stringify(fields)));
      const { newColumns, constColumns } = generateColumn(fields);
      setColumns(newColumns);
      setConstColummns(constColumns);
    }
  }, []);

  const fetchColumns = () => {
    const productId = data[0]?._id;
    axiosInstance()
      .get(`/productbuilder/getoneproduct/${referenceId}/${productId}`)
      .then(({ data: { data } }) => {
        setAllFields(data.productData.fields);
        var _fields = data.productData.fields;
        _fields = orderBy(_fields, 'order', 'asc');
        _fields = sortBy(_fields, function (item) {
          return levalOrderBy.indexOf(item.leval);
        });
        setAllFields(JSON.parse(JSON.stringify(_fields)));
        const { newColumns, constColumns } = generateColumn(_fields);
        setColumns(newColumns);
        setConstColummns(constColumns);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    const rows = generateRows(JSON.parse(JSON.stringify(data)), allFields);
    setFlatRows(rows);
  }, [data, allFields]);

  useEffect(() => {
    if (flatRows) {
      setError(
        yupSchemaForBulkEdit(
          constColummns?.filter((c) => visibleColumns[c?.fieldName]),
          flatRows
        )
      );
    }
  }, [flatRows]);

  const updateData = async (row, value, inputField = '') => {
    let temflatRows = flatRows;
    let tempIndex = temflatRows.findIndex((obj) => obj._id === row._id);
    let obj: any = {};
    if (!inputField) {
      obj = value;
    } else {
      obj[inputField] = value;
    }
    temflatRows = flatRows.map((d, i) => {
      if (i === tempIndex && row?._id === d?._id) {
        return { ...d, ...obj };
      } else {
        return d;
      }
    });
    setFlatRows(temflatRows);
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <HtmlTooltip title="Add Existing Products">
          <MenuItem
            onClick={() => {
              setIsAddExistingProduct(true);
            }}
          >
            Add Existing Products
          </MenuItem>
        </HtmlTooltip>
      </>
    );
  };

  const handleAdd = (rows) => {
    setFlatRows([...flatRows, ...rows?.map((r, i) => ({ ...r, index: flatRows?.length + i + 1, id: r?._id }))]);
  };

  const finalColumns = useMemo(() => {
    return columns
      ?.filter((c) => visibleColumns[c.id])
      .sort((a, b) => columnOrder.findIndex((c) => c === a.id) - columnOrder.findIndex((c) => c === b.id));
  }, [columnOrder, columns, visibleColumns]);

  const rightSideContents = () => {
    return (
      <>
        {columns?.filter((c) => c?.required && !visibleColumns[c?.id])?.length > 0 && (
          <IconWithPulse>
            <IconButton
              size="small"
              title={`Required Hidden Columns :- ${columns
                ?.filter((c) => c?.required && !visibleColumns[c?.id])
                ?.map((c) => c?.id || '')
                ?.join(', ')}`}
            >
              <InfoIcon fontSize="small" color={'primary'} />{' '}
            </IconButton>
          </IconWithPulse>
        )}
        <ArrangeView
          table={null}
          columns={columns}
          hideSelection={true}
          renderedFrom={renderedFrom}
          dispatchTable={dispatch}
          state={state}
          expander={false}
          appliedView={tableData}
        />
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => {
            setIsAddField(true);
          }}
        >
          Add Field
        </Button>
      </>
    );
  };

  const handleAddField = (_field) => {
    _field.leval = 'price-builder-custom';
    if (allFields?.filter((_f) => _f.sectionName === _field?.sectionName).length) {
      if (allFields?.filter((_f) => _f.sectionName === _field?.sectionName)[0].leval !== 'price-template') {
        _field.leval = 'product-builder-custom';
      }
    }

    setAddedField([...addedField, { ..._field }]);
    setAllFields(JSON.parse(JSON.stringify([...allFields, { ..._field }])));
    const { newColumns, constColumns } = generateColumn([...allFields, { ..._field }]);
    setColumns(newColumns);
    setConstColummns(constColumns);

    let dataRows = [...flatRows];

    if (_field?.type === 'formula' || _field?.isFormula) {
      dataRows = dataRows?.map((_data) => {
        var extraCalculatedValue: any = {};
        var inputValues = {};
        _field?.inputFields &&
          _field?.inputFields.forEach((_f) => {
            inputValues[_f] = _data[_f] ? _data[_f] : 0;
          });
        extraCalculatedValue = autoCalculateSpecificFields(inputValues, _data, [...allFields, { ..._field }]);
        return {
          ..._data,
          ...extraCalculatedValue
        };
      });
    }

    setFlatRows(dataRows);
    setIsAddField(false);
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
    >
      <>
        <CustomDialogHeader isMinimized={false} showManimizeMaximize={false} showRequiredLabel={false} title={`Edit `} onClose={onClose} />
        {columns ? (
          <>
            <CustomDialogContent>
              <Box>
                <DetailsPageHeader
                  isAddButtonVisible={true}
                  addButtonMenuItems={addButtonMenuItems()}
                  isActionButtonVisible={false}
                  rightSideContents={rightSideContents()}
                  hasXpadding={false}
                />

                <CustomTable
                  columns={finalColumns}
                  flatRows={flatRows}
                  setFlatRows={setFlatRows}
                  constColummns={constColummns}
                  fields={allFields}
                  extraDisabledFields={extraDisabledFields}
                  error={error}
                  updateData={updateData}
                  scrollToHeader={scrollToHeader}
                />
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" color="primary" onClick={onClose}>
                Close
              </Button>
              <CustomButton
                loading={isSubmitting}
                disabled={isSubmitting}
                variant="contained"
                color="primary"
                type="submit"
                onClick={() => {
                  if (isEmpty(error)) {
                    handleSave([...flatRows?.map((f) => ({ ...f, fields: [...(f?.fields || []), ...addedField] })), ...restData]);
                  } else {
                    const err = Object.keys(error);
                    if (err?.length) {
                      setScrollToHeader(err[0]);
                    }
                  }
                }}
              >
                Save
              </CustomButton>
            </CustomDialogFooter>
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {isAddExistingProduct && (
          <AddExistingProduct
            addProductInBuilder={handleAdd}
            handleClose={() => setIsAddExistingProduct(false)}
            referenceData={{ productCategory: data[0]?.productCategoryId, productTemplate: data[0]?.productTemplateId }}
          />
        )}

        {isAddField && (
          <AddField
            refrence="formAddInlineEdit"
            fieldData={null}
            handleClose={() => {
              setIsAddField(false);
            }}
            handleAddField={handleAddField}
            fields={allFields}
            section={uniqBy(allFields, 'sectionName')?.map((_section) => _section?.sectionName)}
          />
        )}
      </>
    </Dialog>
  );
};

export default CustomEditableGrid;

import { Box, Button, Dialog } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition } from 'src/constants/helpers';
import { useContext, useEffect, useState } from 'react';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import { isEmpty, orderBy, sortBy } from 'lodash';
import { generateColumn, generateRows, yupSchemaForBulkEdit } from 'src/components/CustomEditableGridNew/helper';
import CustomTable from 'src/components/CustomEditableGridNew/CustomTable';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

var levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];

const CustomEditableGrid = ({ onClose, fields, data, extraDisabledFields, handleSave, isSubmitting, referenceId = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [flatRows, setFlatRows] = useState(null);
  const [constColummns, setConstColummns] = useState([]);
  const [error, setError] = useState<any>({});

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
      setError(yupSchemaForBulkEdit(constColummns, flatRows));
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
        <CustomDialogHeader isMinimized={false} showManimizeMaximize={false} showRequiredLabel={false} title={`Bulk Edit `} onClose={onClose} />
        {columns ? (
          <>
            <CustomDialogContent>
              <div
                style={{
                  display: 'block',
                  overflow: 'auto',
                  height: '100%'
                }}
                className="custom-react-table editable-table-v1 border"
              >
                <CustomTable
                  columns={columns}
                  flatRows={flatRows}
                  constColummns={constColummns}
                  fields={allFields}
                  extraDisabledFields={extraDisabledFields}
                  error={error}
                  updateData={updateData}
                />
              </div>
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
                    handleSave(flatRows);
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
      </>
    </Dialog>
  );
};

export default CustomEditableGrid;

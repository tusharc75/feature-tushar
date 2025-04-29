import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import axiosInstance from 'src/axios/axiosInstance';
import {
  CHILD_RESOURCE,
  TECHNICIAN_STATUS,
  MATERIAL_TYPE,
  PRICING_SETUP_TYPE,
  fieldServiceOrder,
  getObjKeysWithValues,
  sidebarResource
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { IconButton, MenuItem, TextField, Typography } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { flattenArray } from 'src/constants/columns';
import Autocomplete from '@mui/material/Autocomplete';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import MaterialQtyDialog from './MaterialQtyDialog';
import EditIcon from '@mui/icons-material/Edit';
import { camelCase, isEmpty } from 'lodash';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import { getPricingConditions, getPricingValue, getTaxList } from 'src/components/PricingCondition';
import { useData } from 'src/StateProvider/Provider';
import AddQuotationDataDialog from 'src/pages/FieldTicket/material/AddQuotationDataDialog';

const Consumables = ({
  allowedToEdit,
  serviceOrderData,
  serviceOrderFields,
  stepFullScreen,
  fetchData: fetchserviceOrderData,
  technicians,
  fetchConsumablesData,
  allConsumables,
  setSelectedRecords = null
}) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldServiceOrder)}_Consumables`;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isConsumableEdit, setIsConsumableEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any>({ technicianName: 'All', technicianId: 'All' });
  const [addQuotationDataDialog, setAddQuotationDataDialog] = useState(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, resources }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
  }, [serviceOrderData]);

  useEffect(() => {
    fetchData();
  }, [selectedTechnician, allConsumables]);

  const fetchColumns = async () => {
    let fields = await fetch_child_resource_fields_perm(CHILD_RESOURCE.fieldServiceOrderDetails, serviceOrderData?.currency, allowedToEdit);
    setAllFields(JSON.parse(JSON.stringify(fields)));
    fields = fields?.filter((f) => f?.isRead);
    const newColumns = generateColumns(renderedFrom, fields, null, false, serviceOrderData?.currency);
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        cell: ({ row }) => <p className="text-truncate">{row?.original?.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];

    let data;
    const response = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [{ resource: sidebarResource.product, fieldNames: ['productName', 'productNumber', 'productDescription'] }]
    });
    data = response?.data?.data;
    const productFields = data?.find((e) => e.resource === 'Product')?.fieldNames || [];
    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          disabled: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          primaryField: true,
          cell: ({ row, table }) => (
            <div className="flex items-center gap-2">
              {!allowedToEdit ? (
                <p>{row?.original[e?.fieldName]}</p>
              ) : (
                <p
                  onClick={() => {
                    openMaterial(row, table.getRowModel().rows);
                  }}
                  className="link text-truncate"
                  title={row?.original[e?.fieldName]}
                >
                  {row?.original[e?.fieldName]}
                </p>
              )}
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row.original?.materialId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          )
        });
      } else {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          cell: ({ row }) => {
            return row.original[e?.fieldName] ? <p className="text-truncate">{row.original[e?.fieldName]}</p> : <NoDataCell />;
          }
        });
      }
    });

    const extracolumns: any = [
      {
        accessor: 'technician',
        Header: 'Technician',
        width: 200,
        cell: ({ row }) =>
          row?.original?.technician ? (
            <div className="flex items-center gap-2">
              <p> {row.original?.technician}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.employeeMasterDetail.path}/${row.original?.technicianId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      ...newColumns,
      {
        accessor: 'action',
        Header: 'Actions',
        width: 150,
        minWidth: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row, table }: any) => (
          <>
            <HtmlTooltip title={'Edit'}>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={!allowedToEdit}
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
              >
                <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title={allowedToEdit && row?.original?.canDelete ? 'Delete' : 'Already dispatched/returned'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={!allowedToEdit || !row?.original?.canDelete}
                  onClick={() => {
                    setDeleteData([{ id: row.original._id }]);
                  }}
                >
                  <DeleteIcon fontSize="small" color={row.original?.canDelete && allowedToEdit ? 'error' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        )
      }
    ];

    if (setSelectedRecords) {
      column?.forEach((e) => delete e?.Footer);
      extracolumns?.forEach((e) => delete e?.Footer);
    }
    setColumns([...column, ...extracolumns]);
  };

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });
      let consumables = allConsumables;
      if (selectedTechnician?.technicianId && selectedTechnician?.technicianId !== 'All') {
        consumables = consumables?.filter((e) => e?.technicianId === selectedTechnician?.technicianId);
      }
      dispatch({ type: 'initialize', data: consumables || [], count: consumables?.length || 0 });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    var taxCodeData: any = null;
    const taxCodeOptions = await getTaxList(user, serviceOrderData, serviceOrderFields, MATERIAL_TYPE.product);
    if (taxCodeOptions?.length) {
      taxCodeData = taxCodeOptions[0];
    }
    const material: any = [];
    if (addQuotationDataDialog) {
      rows?.forEach((e: any) => {
        let element: any = e;
        const values = { estimateStartDate: serviceOrderData?.estimateStartDate || new Date(), estimateEndDate: serviceOrderData?.estimateEndDate || new Date() };
        const calValues = autoCalculateSpecificFields(values, element, allFields);
        Object.assign(element, calValues);
        element = { materialId: e.materialId, type: MATERIAL_TYPE.product, ...getObjKeysWithValues(element, allFields) };
        element.technician = selectedTechnician?.technicianId === 'All' ? null : selectedTechnician?.technicianId;
        material.push(element);
      });
      AddMaterial(material, null);
    } else {
      rows.forEach((d) => {
        let element: any = {};
        element.qty = d.qty ? parseFloat(d.qty) : 1;
        element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
        element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
        element.estimateStartDate = serviceOrderData ? serviceOrderData?.estimateStartDate : new Date();
        element.estimateEndDate = serviceOrderData ? serviceOrderData?.estimateEndDate : new Date();
        const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
        Object.assign(element, calValues);
        if (taxCodeData) {
          element.taxCode = taxCodeData?.optionValue;
          element.taxPercentage = taxCodeData?.taxRate || 0;
        }
        element = { ...getObjKeysWithValues(element, allFields) };
        element.technician = selectedTechnician?.technicianId === 'All' ? null : selectedTechnician?.technicianId;
        element.materialId = d._id;
        element.type = MATERIAL_TYPE.product;;
        material.push(element);
      });
      if (serviceOrderData?.pricingCondition?.optionValue) {
        const priceData: any = await getPricingConditions(sidebarResource.fieldServiceOrder, serviceOrderData, material, PRICING_SETUP_TYPE.rent);
        AddMaterial(material, priceData);
      } else {
        AddMaterial(material, null);
      }
    }
  };

  const AddMaterial = async (material, priceData) => {
    const tempMaterial = [...material];
    if (priceData && allFields?.find((e) => e?.fieldName === 'pricingCondition')) {
      tempMaterial.forEach((element) => {
        if (element.listPrice) {
          const priceFieldName = `price_${serviceOrderData?.currency?.toLowerCase()}`;
          element[priceFieldName] = element.listPrice;
          const calValues = autoCalculateSpecificFields({ [priceFieldName]: element.listPrice }, element, allFields);
          Object.assign(element, calValues);
        } else {
          const calValues = getPricingValue(element, priceData, serviceOrderData?.currency, allFields);
          Object.assign(element, calValues);
        }
      });
    }
    axiosInstance()
      .post(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material`, { material })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setConsumablesDialog(false);
        setAddQuotationDataDialog(false);
        fetchserviceOrderData();
        dispatch({ type: 'loading', loading: true });
        fetchConsumablesData();
        setSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
      });
  };

  const handleDelete = async (rows) => {
    try {
      setDeleting(true);
      const response = await axiosInstance().put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material/delete`, { ids: rows });
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: response?.data?.message
      });
      setDeleting(false);
      dispatch({ type: 'loading', loading: true });
      fetchConsumablesData();
      fetchserviceOrderData();
      setDeleteData(null);
    } catch (error) {
      setDeleting(false);
      toastConfig.setToastConfig(error);
      setDeleteData(null);
    }
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    try {
      setUpdating(true);
      const response = await axiosInstance().put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material`, { material: rows });
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: response?.data?.message
      });
      dispatch({ type: 'loading', loading: true });
      fetchConsumablesData();
      if (saveAndNext) {
        const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
        setIsConsumableEdit({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
      } else {
        setIsConsumableEdit({ open: false, data: null, showSaveAndNext: false });
      }
      setUpdating(false);
      setIsBulkEdit(false);
    } catch (err) {
      setUpdating(false);
      toastConfig.setToastConfig(err);
    }
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const dataRow = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qty')) {
      if (!dataRow?.canDelete) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Already dispatched/returned'
        });
        return;
      }
    }
    let rows: any = [{ ...dataRow, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, serviceOrderData?.currency);
    handleSaveData(rows);
  };

  const openMaterial = (data, rows) => {
    setIsConsumableEdit({
      open: true,
      data: data.original,
      showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
    });
    setIsBulkEdit(false);
  };

  const AddButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setConsumablesDialog(true);
          }}
          id={'add-existing-products-menu-item'}
        >
          Add Products/Consumables
        </MenuItem>
        {serviceOrderData?.quotation?.optionValue && serviceOrderData?.quotationVersion?.optionValue && (
          <MenuItem
            onClick={() => {
              setAddQuotationDataDialog(true);
            }}
          >
            {`Add Products/Consumables From ${resources?.quotation?.titleSingular}`}
          </MenuItem>
        )}
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords?.some((e) => !e?.canDelete)}
          onClick={() => {
            setIsConsumableEdit({ open: true, data: null, showSaveAndNext: false });
            setIsBulkEdit(true);
          }}
        >
          Bulk Edit
        </MenuItem>
        <MenuItem
          disabled={isDeleting || selectedRecords?.some((e) => !e?.canDelete)}
          onClick={() => {
            setDeleteData(
              selectedRecords?.map((d) => {
                return {
                  id: d?._id
                };
              })
            );
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {!setSelectedRecords && (
        <Box style={{ maxWidth: '400px' }} mb={3}>
          <Autocomplete
            id={'select-technician'}
            size="small"
            style={{ minWidth: '300px' }}
            fullWidth
            options={[{ technicianName: 'All', technicianId: 'All' }, ...(technicians || [])]}
            autoHighlight
            value={selectedTechnician}
            getOptionLabel={(option: any) => option?.technicianName || ''}
            isOptionEqualToValue={(option, val) => (option ? option?.technicianId === val?.technicianId : false)}
            onChange={(_, val) => {
              let value = val;
              if (!val) {
                value = { technicianName: 'All', technicianId: 'All' };
              }
              dispatch({ type: 'update', data: [] });
              setSelectedTechnician(value);
            }}
            renderInput={(params) => <TextField {...params} label={'Select Technician'} variant="outlined" />}
          />
        </Box>
      )}
      {setSelectedRecords ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 12, sm: 12 }}>
            {columns ? (
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 300px)' : '300px'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                onSaveEdit={onSaveInlineEdit}
                renderedFrom={`${renderedFrom}_Dialog`}
                isClientSideGrid={true}
                hideSelection={false}
                hideAction={true}
                refreshGrid={fetchConsumablesData}
                onSelect={(data) => {
                  setSelectedRecords(data);
                }}
              />
            ) : (
              <Box p={2} height={300}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Grid>
        </Grid>
      ) : (
        <>
          <Box className="container-with-border" p={2} style={{ WebkitBorderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <Box mb={1}>
              <Typography variant="subtitle2">Products/Consumables</Typography>
            </Box>
            <DetailsPageHeader
              isAddButtonVisible={
                isEmpty(selectedTechnician) ||
                selectedTechnician?.technicianId === 'All' ||
                [TECHNICIAN_STATUS.reserved, TECHNICIAN_STATUS.returned]?.includes(selectedTechnician?.status)
              }
              addButtonMenuItems={<AddButtonMenuItems />}
              isActionButtonVisible={true}
              actionButtonMenuItems={actionButtonMenuItems()}
              actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
              hasXpadding
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 12, sm: 12 }}>
                {columns ? (
                  <CustomReactTable
                    height={stepFullScreen ? 'calc(100vh - 300px)' : '300px'}
                    columns={columns}
                    state={state}
                    dispatch={dispatch}
                    onSaveEdit={onSaveInlineEdit}
                    renderedFrom={renderedFrom}
                    isClientSideGrid={true}
                    hideSelection={allowedToEdit ? false : true}
                    hideAction={allowedToEdit ? false : true}
                    refreshGrid={fetchConsumablesData}
                  />
                ) : (
                  <Box p={2} height={300}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
          {consumablesDialog && (
            <AssignProductDialog
              handleCloseDialog={() => setConsumablesDialog(false)}
              ids={dataRows?.map((d) => d?.materialId)}
              onSuccess={(rows) => {
                handleAdd(rows);
              }}
              serialized={false}
              isSubmitting={isSubmitting}
              pricingCondition={serviceOrderData?.pricingCondition?.optionValue || null}
            />
          )}

          {isConsumableEdit.open && (
            <MaterialQtyDialog
              onClose={() => {
                setIsConsumableEdit({ open: false, data: null, showSaveAndNext: false });
                setIsBulkEdit(false);
              }}
              isBulkedit={isBulkEdit}
              handleSaveData={handleSaveData}
              serviceOrderData={serviceOrderData}
              serviceOrderFields={serviceOrderFields}
              rowData={!isBulkEdit ? isConsumableEdit.data : selectedRecords}
              material={dataRows}
              selectedServices={selectedRecords}
              loading={isUpdating}
              showSaveAndNext={isConsumableEdit.showSaveAndNext}
              referenceType={'consumables'}
            />
          )}

          {deleteData && (
            <ConfirmationDialog
              open={true}
              message={`Are you sure you want to delete the record(s)?`}
              onClose={() => setDeleteData(null)}
              onOk={() => handleDelete(deleteData)}
              okBtnLoading={isDeleting}
            />
          )}
          {addQuotationDataDialog && (
            <AddQuotationDataDialog
              onClose={() => {
                setAddQuotationDataDialog(false);
              }}
              onSuccess={(rows) => {
                handleAdd(rows);
              }}
              referenceData={serviceOrderData}
              isSubmitting={isSubmitting}
              materialType={MATERIAL_TYPE.product}
            />
          )}
        </>
      )}
    </>
  );
};

export default Consumables;

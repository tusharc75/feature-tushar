import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import axiosInstance from 'src/axios/axiosInstance';
import { CHILD_RESOURCE, FIELD_SERVICE_ORDER_TECHNICIAN_STATUS, MATERIAL_TYPE, PRICING_SETUP_TYPE, fieldServiceOrder, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { IconButton, MenuItem, TextField } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { flattenArray } from 'src/constants/columns';
import Autocomplete from '@mui/material/Autocomplete';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import MaterialQtyDialog from './MaterialQtyDialog';
import EditIcon from '@mui/icons-material/Edit';
import { camelCase, isEmpty } from 'lodash';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import { getPricingConditions, getPricingValue } from 'src/components/PricingCondition';

const Consumables = ({ allowedToEdit, serviceOrderData, stepFullScreen, fetchData: fetchserviceOrderData, technicians, refreshChild, fetchConsumablesData }) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldServiceOrder)}_Consumables`;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isConsumableEdit, setIsConsumableEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchColumns();
  }, [serviceOrderData]);

  useEffect(() => {
    fetchData();
  }, [tabValue, selectedTechnician, refreshChild]);

  const fetchColumns = async () => {
    let fields = await fetch_child_resource_fields_perm(
      CHILD_RESOURCE.fieldServiceOrderDetails,
      serviceOrderData?.currency,
      allowedToEdit
    );
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
      fields: [{ resource: 'Product', fieldNames: ['productName', 'productNumber', 'productDescription'] }]
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
            <HtmlTooltip title={allowedToEdit && row?.original?.canDelete ? 'Edit' : 'Technician for this product/consumable is already dispatched or returned'}>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={!allowedToEdit || !row?.original?.canDelete}
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
              >
                <EditIcon fontSize="small" color={row.original?.canDelete && allowedToEdit ? 'primary' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title={allowedToEdit && row?.original?.canDelete ? 'Delete' : 'Technician for this product/consumable is already dispatched or returned'}>
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

    setColumns([...column, ...extracolumns]);
  };

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });
      let consumables;
      let api = `${fieldServiceOrder.api}/${serviceOrderData?._id}/material?type=${MATERIAL_TYPE.product}`;
      if (selectedTechnician?.technicianId) {
        api = `${api}&technician=${selectedTechnician?.technicianId}`;
      }
      const response = await axiosInstance().get(api);
      consumables = response?.data?.data?.material;

      consumables?.forEach((parent, i) => {
        parent.index = i + 1;
        parent.productName = parent?.productDetail?.productName;
        parent.productDescription = parent?.productDetail?.productDescription;
        parent.productNumber = parent?.productDetail?.productNumber;
        parent.technicianId = parent?.technician?.optionValue;
        parent.technician = parent?.technician?.optionLabel;
      });
      dispatch({ type: 'initialize', data: consumables || [], count: consumables?.length || 0 });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = async (rows) => {
    setSubmitting(true);
    var taxCodeData: any = null;
    if (serviceOrderData?.taxCode) {
      const {
        data: { data }
      } = await axiosInstance().get(
        `${routes?.taxMaster.path}/by-zipcode?taxCode=${serviceOrderData?.taxCode?.optionValue}&materialType=${MATERIAL_TYPE.product}`
      );
      if (data?.length) {
        taxCodeData = data[0];
      }
    }
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = MATERIAL_TYPE.product;
      element.technician = selectedTechnician?.technicianId;
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
      material.push(element);
    });
    if (serviceOrderData?.pricingCondition?.optionValue) {
      const priceData: any = await getPricingConditions(serviceOrderData, material, PRICING_SETUP_TYPE.rent);
      AddMaterial(material, priceData);
    } else {
      AddMaterial(material, null);
    }

  };

  const AddMaterial = async (material, priceData) => {
    const tempMaterial = [...material];
    if (priceData) {
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
        fetchData();
        fetchserviceOrderData();
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
      fetchData();
      fetchserviceOrderData();
      fetchConsumablesData();
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
      fetchData();
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
    if (!inputField.canDelete) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Technician for this product/consumable is already dispatched or returned'
      });
      return;
    }
    const dataRow = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qty')) {
      if (parseInt(inputField.qty) === 0) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Quantity cannot be zero'
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

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    dispatch({ type: 'update', data: [] });
    setTabValue(newValue);
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
      <Box style={{ maxWidth: '400px' }} mb={3}>
        <Autocomplete
          id={'select-technician'}
          size="small"
          style={{ minWidth: '300px' }}
          fullWidth
          options={technicians || []}
          autoHighlight
          value={selectedTechnician}
          getOptionLabel={(option: any) => option?.technicianName || ''}
          isOptionEqualToValue={(option, val) => (option ? option?.technicianId === val?.technicianId : false)}
          onChange={(_, val) => {
            dispatch({ type: 'update', data: [] });
            setSelectedTechnician(val);
          }}
          renderInput={(params) => <TextField {...params} label={'Select Technician'} variant="outlined" />}
        />
      </Box>
      <CustomTabs value={tabValue} onChange={handleMainTabChange} tabVariant="underlined">
        <CustomTab value={0} label={'Products/Consumables'} id={'products-consumables-tab'} />
      </CustomTabs>
      <TabPanel value={tabValue} index={0}>
        {allowedToEdit && (
          <>
            <DetailsPageHeader
              isAddButtonVisible={!isEmpty(selectedTechnician) && selectedTechnician?.status === FIELD_SERVICE_ORDER_TECHNICIAN_STATUS.reserved}
              addButtonProps={{ onClick: () => setConsumablesDialog(true), id: 'add-product-consumable' }}
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
                    refreshGrid={fetchData}
                  />
                ) : (
                  <Box p={2} height={300}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                  </Box>
                )}
              </Grid>
            </Grid>
          </>
        )}
      </TabPanel>
      {consumablesDialog && (
        <AssignProductDialog
          handleCloseDialog={() => setConsumablesDialog(false)}
          ids={dataRows?.map((d) => d?.materialId)}
          onSuccess={(rows) => {
            handleSubmit(rows);
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
    </>
  );
};

export default Consumables;

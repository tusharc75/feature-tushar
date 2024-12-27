import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import axiosInstance from 'src/axios/axiosInstance';
import { CHILD_RESOURCE, MATERIAL_TYPE, asyncForEach, fieldTicket, restoreObjKeysWithValues, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, IconButton, MenuItem, TextField } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { flattenArray } from 'src/constants/columns';
import Autocomplete from '@mui/material/Autocomplete';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Technicians from './Technicians';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { calculatePrice, calculateRowsField } from 'src/components/RentalManagment/helper';
import MaterialQtyDialog from './MaterialQtyDialog';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ConsumablesQtyDialog from 'src/pages/WorkOrder/Consumables/ConsumablesQtyDialog';
import History from '../../ProductInventory/LedgerHistory';
import QtyRequestLog from 'src/pages/WorkOrder/Consumables/QtyRequestLog';
import { camelCase } from 'lodash';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { deleteOne, findAll, findOne, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { FiExternalLink } from 'react-icons/fi';

const Consumables = ({ allowedToEdit, services, fieldTicketData, fetchMaterial, stepFullScreen, fetchData: fetchFieldTicketData, refreshChild }) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldTicket)}_Consumables`;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [serviceOption, setServiceOption] = useState(null);
  const [selectedServiceOption, setSelectedServiceOption] = useState({ optionLabel: 'All', optionValue: 'All', _id: null });
  const [isConsumableEdit, setIsConsumableEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [consumeRequest, setConsumeRequest] = useState(false);
  const [openConsumablesQtyDialog, setOpenConsumablesQtyDialog] = useState(false);
  const [openLogDialog, setOpenLogDialog] = useState({ open: false, product: '', uniqueId: null, data: null });
  const [historyDialog, setHistoryDialog] = useState({ open: false, _id: '', product: '', productName: '' });
  const [isSubmitting, setSubmitting] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    setServiceOption([
      { optionLabel: 'All', optionValue: 'All' },
      ...services?.map((s) => {
        return {
          optionLabel: s?.detail,
          optionValue: s?.materialId,
          _id: s?._id
        };
      })
    ]);
    if (selectedServiceOption?.optionValue !== 'All' && !services?.some((s) => s?._id === selectedServiceOption?._id)) {
      setSelectedServiceOption({ optionLabel: 'All', optionValue: 'All', _id: null });
    }
  }, [services]);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    var allowRequest = false;
    if (user?.user?.brandPolicy?.workOrderConsumableRequest) {
      if (
        (fieldTicketData?.warehouse?.manager && fieldTicketData?.warehouse?.manager?.includes(user?.user?._id)) ||
        (fieldTicketData?.warehouse?.materialHandlers && fieldTicketData?.warehouse?.materialHandlers?.includes(user?.user?._id))
      ) {
        allowRequest = false;
      } else {
        allowRequest = true;
      }
    }
    setConsumeRequest(allowRequest);
    fetchColumns();
  }, [fieldTicketData]);

  useEffect(() => {
    fetchData();
  }, [selectedServiceOption, tabValue, refreshChild]);

  const fetchColumns = async () => {
    let fields = await fetch_child_resource_fields_perm(
      CHILD_RESOURCE.fieldTicketMateial,
      fieldTicketData?.currency,
      allowedToEdit && !fieldTicketData?.quotation,
      isOffline
    );
    setAllFields(JSON.parse(JSON.stringify(fields)));
    fields = fields?.filter((f) => f?.isRead);
    const newColumns = generateColumns(renderedFrom, fields, null, false, fieldTicketData?.currency);
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
    if (isOffline) {
      data = await findOne(objectStore.resource, 'fieldTicketMaterialProduct');
    } else {
      const response = await axiosInstance().put(`/field/find-field-labels`, {
        fields: [{ resource: 'Product', fieldNames: ['productName', 'productNumber', 'productDescription'] }]
      });
      data = response?.data?.data;
    }
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
              {!allowedToEdit || fieldTicketData?.quotation ? (
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
        accessor: 'service',
        Header: 'Service',
        width: 200,
        cell: ({ row }) =>
          row?.original?.service ? (
            <div className="flex items-center gap-2">
              <p> {row.original?.service}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original?.serviceId}`);
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
        accessor: 'requestedQty',
        Header: 'Requested Qty',
        width: 150,
        cell: ({ row }) => <p className="text-truncate">{row?.original?.requestedQty || <NoDataCell />}</p>
      },
      {
        accessor: 'consumedQty',
        Header: 'Consumed Qty',
        primaryField: true,
        width: 150,
        cell: ({ row }) => <p className="text-truncate">{row?.original?.consumedQty || <NoDataCell />}</p>
      },
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
            <HtmlTooltip title={allowedToEdit ? 'Edit' : ''}>
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
            {row.original?.isqtyRequestLog && !isOffline && (
              <HtmlTooltip title="View Requests">
                <IconButton
                  size="small"
                  aria-label="Requests"
                  onClick={() => {
                    setOpenLogDialog({ open: true, product: row?.original?.materialId, uniqueId: row.original._id, data: row.original });
                  }}
                >
                  <FormatListBulletedIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {!isOffline && (
              <HtmlTooltip title="History">
                <IconButton
                  size="small"
                  aria-label="History"
                  onClick={() => {
                    setHistoryDialog({
                      open: true,
                      _id: row?.original?._id,
                      product: row?.original?.materialId,
                      productName: row?.original?.productName
                    });
                  }}
                >
                  <HistoryIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            <HtmlTooltip title={'Delete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={row?.original?.consumedQty || row?.original?.requestedQty ? true : false}
                  onClick={() => {
                    setDeleteData([{ id: row.original._id }]);
                  }}
                >
                  <DeleteIcon fontSize="small" color={row?.original?.consumedQty || row?.original?.requestedQty ? 'disabled' : 'error'} />
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
      if (isOffline) {
        consumables = await findAll(objectStore.fieldTicketMaterial);
        consumables = consumables?.filter((e) => e?.fieldTicketId === fieldTicketData?._id && e?.type === MATERIAL_TYPE.product && !e?.isRental);
        if (selectedServiceOption && selectedServiceOption?.optionValue !== 'All') {
          consumables = consumables?.filter(
            (e) => e?.service?.optionValue === selectedServiceOption?.optionValue && e?.uniqueId === selectedServiceOption?._id
          );
        }
      } else if (/^[0-9a-fA-F]{24}$/.test(fieldTicketData?._id)) {
        let api = `${fieldTicket.api}/${fieldTicketData?._id}/material?type=${MATERIAL_TYPE.product}`;
        if (selectedServiceOption && selectedServiceOption?.optionValue !== 'All') {
          api = `${api}&uniqueId=${selectedServiceOption?._id}`;
        }
        const response = await axiosInstance().get(api);
        consumables = response?.data?.data?.material;
      }
      consumables?.forEach((parent, i) => {
        parent.index = i + 1;
        parent.productName = parent?.productDetail?.productName;
        parent.productDescription = parent?.productDetail?.productDescription;
        parent.productNumber = parent?.productDetail?.productNumber;
        parent.serviceId = parent?.service?.optionValue;
        parent.service = parent?.service?.optionLabel;
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
    if (isOffline) {
      const material = [];
      for (const d of rows) {
        const element: any = {};
        element.materialId = d._id;
        element.type = MATERIAL_TYPE.product;
        element.service = selectedServiceOption?.optionValue !== 'All' ? selectedServiceOption : null;
        element.uniqueId = selectedServiceOption?.optionValue !== 'All' ? selectedServiceOption?._id : null;
        element.qty = d.qty ? parseFloat(d.qty) : 1;
        element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
        element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
        element.estimateStartDate = fieldTicketData ? fieldTicketData?.estimateStartDate : new Date();
        element.estimateEndDate = fieldTicketData ? fieldTicketData?.estimateEndDate : new Date();
        const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
        Object.assign(element, calValues);
        let id = Math.floor(Math.random() * 1000000).toString();
        element.productDetail = {
          productName: d.productName,
          productDescription: d.productDescription,
          productNumber: d.productNumber,
          unit: d?.unitMain?.length ? d.unitMain : [],
          pricingMethod: d?.pricingMethodMain?.length ? d.pricingMethodMain : []
        };
        element.fieldTicketId = fieldTicketData?._id;
        element._id = id;
        await insertUpdate(objectStore.fieldTicketMaterial, id, restoreObjKeysWithValues(element, allFields));
        material.push(element);
      }
      if (/^[0-9a-fA-F]{24}$/.test(fieldTicketData?._id)) {
        let result = await findOne(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`);
        let updatedData = [...(result?.data || []), ...material];
        await insertUpdate(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`, {
          ...result,
          data: updatedData,
          type: 'fieldTicketMaterial'
        });
      } else {
        let result = await findOne(objectStore.offlineDataSync, fieldTicketData?._id);
        let updatedData = { ...result?.data, material: [...(result?.data?.material || []), ...material] };
        await insertUpdate(objectStore.offlineDataSync, fieldTicketData?._id, { ...result, data: updatedData });
      }
      setConsumablesDialog(false);
      fetchData();
      setSubmitting(false);
    } else {
      var taxCodeData: any = null;
      if (fieldTicketData?.taxCode) {
        const {
          data: { data }
        } = await axiosInstance().get(
          `${routes?.taxMaster.path}/by-zipcode?taxCode=${fieldTicketData?.taxCode?.optionValue}&materialType=${MATERIAL_TYPE.product}`
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
        element.service = selectedServiceOption?.optionValue !== 'All' ? selectedServiceOption?.optionValue : null;
        element.uniqueId = selectedServiceOption?.optionValue !== 'All' ? selectedServiceOption?._id : null;
        element.qty = d.qty ? parseFloat(d.qty) : 1;
        element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
        element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
        element.estimateStartDate = fieldTicketData ? fieldTicketData?.estimateStartDate : new Date();
        element.estimateEndDate = fieldTicketData ? fieldTicketData?.estimateEndDate : new Date();
        const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
        Object.assign(element, calValues);
        if (taxCodeData) {
          element.taxCode = taxCodeData?.optionValue;
          element.taxPercentage = taxCodeData?.taxRate || 0;
        }
        material.push(element);
      });
      if (fieldTicketData?.pricingCondition?.optionValue) {
        const priceData: any = await calculatePrice(fieldTicketData, material);
        AddMaterial(
          material,
          priceData?.filter((e) => e.conditionId === fieldTicketData?.pricingCondition?.optionValue)
        );
      } else {
        AddMaterial(material, null);
      }
    }
  };

  const AddMaterial = async (material, priceData) => {
    const tempMaterial = [...material];
    if (priceData) {
      tempMaterial.forEach((element) => {
        const rateResult = priceData?.filter(
          (e) => e.materialId === element.materialId && e.materialType === element.type && e.unit === element.unit
        );
        if (element.listPrice) {
          const priceFieldName = `price_${fieldTicketData?.currency?.toLowerCase()}`;
          element[priceFieldName] = element.listPrice;
          const calValues = autoCalculateSpecificFields({ [priceFieldName]: element.listPrice }, element, allFields);
          Object.assign(element, calValues);
        } else if (rateResult.length && rateResult[0].mrp) {
          const priceFieldName = `price_${fieldTicketData?.currency?.toLowerCase()}`;
          element[priceFieldName] = rateResult[0].mrp;
          element['pricingCondition'] = rateResult[0].conditionId;
          element['pricingMethod'] = rateResult[0].pricingMethod?.trim();
          const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
          Object.assign(element, calValues);
        }
      });
    }
    axiosInstance()
      .post(`${fieldTicket.api}/${fieldTicketData?._id}/material`, { material })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setConsumablesDialog(false);
        fetchData();
        fetchFieldTicketData();
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
      if (isOffline) {
        const materialIdsToDelete = rows.map((d) => d.id);

        [...materialIdsToDelete].forEach((id) => {
          deleteOne(objectStore.fieldTicketMaterial, id);
        });

        if (/^[0-9a-fA-F]{24}$/.test(fieldTicketData?._id)) {
          let result = await findOne(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`);
          const alreadyOfflineDataSyncStoredRows = result?.data || [];
          let updatedData = alreadyOfflineDataSyncStoredRows.filter((d: any) => !materialIdsToDelete.includes(d._id));
          await insertUpdate(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`, { ...result, data: updatedData });
        } else {
          let result = await findOne(objectStore.offlineDataSync, fieldTicketData?._id);
          const material = result?.data?.material || [];
          const updatedMaterial = material.filter((d: any) => !materialIdsToDelete.includes(d._id));
          let updatedData = { ...result?.data, material: updatedMaterial };
          await insertUpdate(objectStore.offlineDataSync, fieldTicketData?._id, { ...result, data: updatedData });
        }
        //for onlineSync
        const deleteData = {
          cost: [],
          material: materialIdsToDelete,
          fieldTicketId: fieldTicketData?._id
        };
        let id = Math.floor(Math.random() * 1000000).toString();
        await insertUpdate(objectStore.offlineDataSync, id, { type: 'fieldTicketMaterialDelete', data: deleteData, _id: id });
      } else {
        const response = await axiosInstance().put(`${fieldTicket.api}/${fieldTicketData?._id}/material/delete`, { ids: rows });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: response?.data?.message
        });
      }
      setDeleting(false);
      fetchData();
      fetchFieldTicketData();
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
      if (isOffline) {
        let alreadyOfflineDataSyncStoredRows = [],
          result;
        if (/^[0-9a-fA-F]{24}$/.test(fieldTicketData?._id)) {
          result = await findOne(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`);
          alreadyOfflineDataSyncStoredRows = result?.data || [];
        } else {
          result = await findOne(objectStore.offlineDataSync, fieldTicketData?._id);
          alreadyOfflineDataSyncStoredRows = result?.data?.material || [];
        }
        const toAddOfflineDataSyncStoreRows = [];
        for (const row of rows) {
          row.fieldTicketId = fieldTicketData?._id;
          row.type = MATERIAL_TYPE.product;
          const existingRow = await findOne(objectStore.fieldTicketMaterial, row._id);
          await insertUpdate(objectStore.fieldTicketMaterial, row._id, { ...existingRow, ...restoreObjKeysWithValues(row, allFields) });
          const foundIndex = alreadyOfflineDataSyncStoredRows.findIndex((d: any) => d._id === row._id);
          if (foundIndex !== -1) {
            alreadyOfflineDataSyncStoredRows[foundIndex] = { ...existingRow, ...row };
          } else {
            toAddOfflineDataSyncStoreRows.push({ ...existingRow, ...row });
          }
        }
        if (/^[0-9a-fA-F]{24}$/.test(fieldTicketData?._id)) {
          let updatedData = [...alreadyOfflineDataSyncStoredRows, ...toAddOfflineDataSyncStoreRows];
          await insertUpdate(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`, { ...result, data: updatedData });
        } else {
          let updatedData = { ...result?.data, material: [...alreadyOfflineDataSyncStoredRows, ...toAddOfflineDataSyncStoreRows] };
          await insertUpdate(objectStore.offlineDataSync, fieldTicketData?._id, { ...result, data: updatedData });
        }
      } else {
        const response = await axiosInstance().put(`${fieldTicket.api}/${fieldTicketData?._id}/material`, { material: rows });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: response?.data?.message
        });
      }
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
      if (parseInt(inputField.qty) < (updatedData?.consumedQty || 0) + (updatedData?.requestedQty || 0)) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Quantity can not be less than consumed quantity'
        });
        return;
      }
    }
    let rows: any = [{ ...dataRow, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, fieldTicketData?.currency);
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

  const rightSideContents = () => {
    return (
      <>
        <HideWhenOffline>
          <Button
            disabled={!Boolean(selectedRecords?.length)}
            onClick={() => setOpenConsumablesQtyDialog(true)}
            color="primary"
            size="small"
            variant="contained"
          >
            {consumeRequest ? 'Request ' : 'Consume '} {selectedRecords?.length > 0 ? '(' + selectedRecords?.length + ')' : ''}
          </Button>
        </HideWhenOffline>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setIsConsumableEdit({ open: true, data: null, showSaveAndNext: false });
            setIsBulkEdit(true);
          }}
        >
          Bulk Edit
        </MenuItem>

        <MenuItem
          disabled={isDeleting || selectedRecords?.some((e) => e?.requestedQty || e?.consumedQty)}
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
      {allowedToEdit && !fieldTicketData?.quotation && serviceOption?.length > 0 && (
        <Box style={{ maxWidth: '400px' }} mb={3}>
          <Autocomplete
            id={'select-service'}
            size="small"
            style={{ minWidth: '300px' }}
            fullWidth
            options={serviceOption ? serviceOption : []}
            autoHighlight
            value={selectedServiceOption}
            getOptionLabel={(option: any) => option?.optionLabel || ''}
            isOptionEqualToValue={(option, val) => (option ? option?.optionLabel === val?.optionLabel : false)}
            onChange={(_, val) => {
              let value = val;
              if (!val) {
                value = { optionLabel: 'All', optionValue: 'All' };
              }
              dispatch({ type: 'update', data: [] });
              setSelectedServiceOption(value);
            }}
            renderInput={(params) => <TextField {...params} label={'Select Service'} variant="outlined" />}
          />
        </Box>
      )}
      <CustomTabs value={tabValue} onChange={handleMainTabChange} style={{ marginBottom: -1 }}>
        <CustomTab value={0} label={'Products/Consumables'} primaryColor={true} id={'products-consumables-tab'} />
        {!isOffline && <CustomTab value={1} label={'Technicians'} primaryColor={true} id={'technicians-tab'} />}
      </CustomTabs>

      <TabPanel value={tabValue} index={0}>
        <Box className="container-with-border" p={2} style={{ WebkitBorderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {allowedToEdit && !fieldTicketData?.quotation && (
            <>
              <DetailsPageHeader
                isAddButtonVisible={true}
                addButtonProps={{ onClick: () => setConsumablesDialog(true), id: 'add-product-consumable' }}
                isActionButtonVisible={!isOffline}
                actionButtonMenuItems={actionButtonMenuItems()}
                actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
                rightSideContents={rightSideContents()}
                hasXpadding
              />
            </>
          )}
          <Grid container spacing={2}>
            <Grid size={{xs:12, md:12, sm:12}}>
              {columns ? (
                <CustomReactTable
                  height={stepFullScreen ? 'calc(100vh - 300px)' : '300px'}
                  columns={columns}
                  state={state}
                  dispatch={dispatch}
                  onSaveEdit={onSaveInlineEdit}
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                  hideSelection={allowedToEdit && !fieldTicketData?.quotation ? false : true}
                  hideAction={allowedToEdit && !fieldTicketData?.quotation ? false : true}
                  refreshGrid={fetchData}
                />
              ) : (
                <Box p={2} height={300}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <Technicians
          allowedToEdit={allowedToEdit}
          fieldTicketData={fieldTicketData}
          selectedService={selectedServiceOption}
          stepFullScreen={stepFullScreen}
        />
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
          pricingCondition={fieldTicketData?.pricingCondition?.optionValue || null}
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
          fieldTicketData={fieldTicketData}
          rowData={!isBulkEdit ? isConsumableEdit.data : selectedRecords}
          material={dataRows}
          selectedServices={selectedRecords}
          loading={isUpdating}
          showSaveAndNext={isConsumableEdit.showSaveAndNext}
          referenceType={'consumables'}
        />
      )}
      {openConsumablesQtyDialog && (
        <ConsumablesQtyDialog
          referenceId={fieldTicketData?._id}
          referenceType={sidebarResource.fieldTicket}
          onClose={() => setOpenConsumablesQtyDialog(false)}
          onSuccess={() => {
            fetchData();
            fetchMaterial();
            setOpenConsumablesQtyDialog(false);
          }}
          warehouse={fieldTicketData?.warehouse}
          selectedRecords={selectedRecords?.map((e) => ({ ...e, product: e?.productName }))}
          serviceName={null}
          consumeRequest={consumeRequest}
          serialNumberRequired={false}
        />
      )}
      {openLogDialog.open && (
        <QtyRequestLog
          uniqueId={openLogDialog.uniqueId}
          referenceId={fieldTicketData?._id}
          referenceType={sidebarResource.fieldTicket}
          productName={openLogDialog?.data?.productName}
          product={openLogDialog?.product}
          onClose={() => {
            setOpenLogDialog({
              open: false,
              uniqueId: null,
              product: null,
              data: null
            });
            fetchData();
          }}
        />
      )}

      {historyDialog.open && (
        <History
          handleClose={() => setHistoryDialog({ open: false, _id: '', product: '', productName: '' })}
          productName={historyDialog.productName}
          referenceId={fieldTicketData?._id}
          uniqueId={historyDialog._id}
          product={historyDialog.product}
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

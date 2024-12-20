import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase, isArray, isObject } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculatePrice, calculateRowsField, getNestedSubRows } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { CHILD_RESOURCE, FIELD_TICKET_STATUS, MATERIAL_TYPE, SERVICE_TYPE, asyncForEach, fieldTicket, restoreObjKeysWithValues, sidebarResource, treeToFlatArray } from 'src/constants/helpers';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import Consumables from './Consumables';
import MaterialQtyDialog from './MaterialQtyDialog';
import AddCostDialog from './AddCostDialog';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import AddRentalDataDialog from './AddRentalDataDialog';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { deleteOne, findAll, findOne, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { ownerAndColaborator } from 'src/constants/messageHelpers';
import Add from '@material-ui/icons/Add';
import { FiExternalLink } from 'react-icons/fi';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import {
  generateAddExistingService,
  generateAddManualEntry,
  generateAddNewService,
  generateAddProductConsumable,
  generateAddTechnician,
  generateEditManualEntry,
  generateEditService
} from '../walkmeSteps';
import { nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';

const Material = ({ fieldTicketData, stepFullScreen, allowedToEdit, setNextStep, handleChangeStatus, resourcePolicy, fetchData }) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldTicket)}_Material`;
  const { setWalkmeData } = useSetWalkmeData();
  const walkmeInstance = useGetWalkmeInstance();
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const [materialDialog, setMaterialDialog] = useState({ open: false, type: '', parentId: null });
  const [allFields, setAllFields] = useState([]);
  const [isServiceEdit, setIsServiceEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCostDialog, setShowCostDialog] = useState({ open: false, data: null, showSaveAndNext: false });
  const [costFields, setCostFields] = useState([]);
  const [assignRentalDataDialog, setAssignRentalDataDialog] = useState({ open: false, type: '' });

  const [refreshChild, setRefreshChild] = useState(false);

  const {
    state: { user, permissions, resources }
  }: any = useData();
  const isStepDataSet = useRef(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { isOffline } = useContext(CustomOfflineContext);
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, [fieldTicketData]);

  useEffect(() => {
    if (columns) {
      fetchMaterial();
    }
  }, [columns]);

  useEffect(() => {
    let stepData = [
      generateAddExistingService(),
      generateAddManualEntry(),
      generateAddNewService(),
      generateAddProductConsumable(),
      generateAddTechnician()
    ];
    if (dataRows?.length) {
      const serviceIndex = dataRows.findIndex((d) => d.type === MATERIAL_TYPE.service);
      const manualEntryIndex = dataRows.findIndex((d) => d.type === MATERIAL_TYPE.manualEntry);
      if (serviceIndex !== -1) {
        stepData.push(generateEditService(false, serviceIndex));
      }
      if (manualEntryIndex !== -1) {
        stepData.push(generateEditManualEntry(false, manualEntryIndex));
      }
      if (walkmeInstance && walkmeInstance.type === 'flow' && !isStepDataSet.current) {
        isStepDataSet.current = true;
        let steps = [];
        if (serviceIndex !== -1 && !dataRows[serviceIndex]?.isValid) {
          steps = generateEditService(false, serviceIndex).steps;
        } else if (manualEntryIndex !== -1 && !dataRows[serviceIndex]?.isValid) {
          steps = generateEditManualEntry(false, manualEntryIndex).steps;
        }
        steps.push({ ...nextButtonStep, waitForStepInsertion: true });
        walkmeInstance.instance.push(steps);
        walkmeInstance.handleNext();
      }
    }
    setWalkmeData(stepData);
  }, [dataRows]);

  const fetchFields = async () => {
    let data = await fetch_child_resource_fields_perm(
      CHILD_RESOURCE.fieldTicketMateial,
      fieldTicketData?.currency,
      allowedToEdit && !fieldTicketData?.quotation,
      isOffline
    );
    setAllFields(JSON.parse(JSON.stringify(data)));
    data = data?.filter((f) => f?.isRead);
    let costField: any = await fetch_child_resource_fields_perm(CHILD_RESOURCE.fieldTicketCost, fieldTicketData?.currency, true, isOffline);
    costField = costField?.filter((f) => f?.isRead);
    setCostFields(costField);
    const newColumns = generateColumns(renderedFrom, data, null, false, fieldTicketData?.currency);
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {!allowedToEdit || fieldTicketData?.quotation ? (
              <p> {row.original.detail}</p>
            ) : row.original.detail ? (
              <p
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            ) : (
              <NoDataCell />
            )}
            {row.original.type === MATERIAL_TYPE.package && (
              <>
                <span>{row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}</span>
                {!isOffline && allowedToEdit && (
                  <Box ml={1}>
                    <HtmlTooltip title={`Add ${resources?.packages?.titleSingular}`}>
                      <IconButton
                        onClick={() => {
                          setMaterialDialog({ open: true, type: MATERIAL_TYPE.package, parentId: row.original._id });
                        }}
                        size="small"
                      >
                        <Add color="primary" fontSize="small" />
                      </IconButton>
                    </HtmlTooltip>
                  </Box>
                )}
              </>
            )}
            {row.original.type !== MATERIAL_TYPE.manualEntry && !isOffline && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.package) {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'competencyType',
        Header: 'Competency Type',
        width: 250,
        Cell: ({ row }) => (row.original['competencyType'] ? <p>{row.original?.competencyType}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => (row.original['competencies'] ? <p>{row.original?.competencies}</p> : <NoDataCell />)
      }
    ];
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => {
        return (
          <>
            <HtmlTooltip title={allowedToEdit ? 'Edit' : ownerAndColaborator}>
              <IconButton
                size="small"
                aria-label="Edit"
                disabled={!allowedToEdit}
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
                id={`edit-${row?.original?.type}-button-${row.index || 0}`}
              >
                <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title={'Delete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={!allowedToEdit || !row?.original?.canDelete}
                  onClick={() => {
                    const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                    getNestedSubRows(obj, row.original);
                    setDeleteData(obj);
                  }}
                >
                  <DeleteIcon fontSize="small" color={!allowedToEdit || !row?.original?.canDelete ? 'disabled' : 'error'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        );
      }
    });
    setColumns(column);
  };

  const fetchMaterial = async () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let data;
    if (isOffline) {
      data = await findAll(objectStore.fieldTicketMaterial);
      data = data?.filter(
        (d: any) => d?.fieldTicketId === fieldTicketData?._id && [MATERIAL_TYPE.service, MATERIAL_TYPE.manualEntry]?.includes(d?.type)
      );
    } else {
      const response = await axiosInstance().get(`${fieldTicket.api}/${fieldTicketData?._id}/material?type=${MATERIAL_TYPE.service}`);
      const costResponse = await axiosInstance().get(`${fieldTicket.api}/${fieldTicketData?._id}/cost`);
      let costData = costResponse?.data?.data;
      costData = costData?.map((e: any) => {
        return { ...e, type: MATERIAL_TYPE.manualEntry };
      });
      data = [...response?.data?.data?.material, ...costData];
    }

    const isPriceRequired = allFields?.filter((el) => el.fieldName === 'price' && el.required).length > 0;

    let rows = data?.filter((d: any) => !d.parentId);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.service
          ? parent.serviceDetail?.serviceName
          : parent.type === MATERIAL_TYPE.serializedAsset
            ? parent.serializedAssetDetail?.assetNumber
            : parent.type === MATERIAL_TYPE.product
              ? parent.productDetail?.productName
              : parent.type === MATERIAL_TYPE.package
                ? parent.packageDetail?.packageName
                : parent.type === MATERIAL_TYPE.manualEntry
                  ? parent.detail || ''
                  : '';
      parent.description =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription || ''
            : parent.description || '';
      parent.competencyType = `${parent?.serviceDetail?.competencyType?.optionLabel || ''}`;
      parent.isValid = parent['finalPrice_' + fieldTicketData?.currency?.toLowerCase()] ? true : !isPriceRequired;
      parent.canDelete = parent.canDelete ?? true;
      parent.subRows = generateNestedData(data, parent, isPriceRequired);
    });
    if (rows?.length) {
      if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
    setRefreshChild(!refreshChild);
  };

  const generateNestedData = (material, parent, isPriceRequired) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = _subRow.type === MATERIAL_TYPE.package ? _subRow?.packageDetail?.packageName : '';
      _subRow.description = _subRow.type === MATERIAL_TYPE.package ? _subRow?.packageDetail?.packageDescription || '' : '';
      _subRow.competencyType = `${_subRow?.serviceDetail?.competencyType?.optionLabel || ''}`;
      _subRow.qty = _subRow.qty * parent.qty;
      _subRow.isValid = _subRow['finalPrice_' + fieldTicketData?.currency?.toLowerCase()] ? true : !isPriceRequired;
      _subRow.canDelete = _subRow.canDelete ?? true;
      _subRow.subRows = generateNestedData(material, _subRow, isPriceRequired);
    });
    return subRows;
  };

  const openMaterial = (data, rows) => {
    if (data?.original?.type === MATERIAL_TYPE.manualEntry) {
      setShowCostDialog({ open: true, data: data.original, showSaveAndNext: data?.index < rows?.length - 1 ? true : false });
    } else {
      setIsServiceEdit({
        open: true,
        data: data.original,
        showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
      });
      setIsBulkEdit(false);
    }
  };

  const handleAdd = async (rows: any, type: string) => {
    setIsSubmitting(true);
    if (isOffline) {
      const material = [];
      for (const d of rows) {
        const element: any = {};
        element.materialId = d._id;
        element.type = type;
        element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
        element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
        element.qty = d.qty ? parseFloat(d.qty) : 1;
        element.estimateStartDate = fieldTicketData ? new Date(fieldTicketData?.estimateStartDate) : new Date();
        element.estimateEndDate = fieldTicketData ? new Date(fieldTicketData?.estimateEndDate) : new Date();
        element.isRental = false;
        const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
        Object.assign(element, calValues);
        let id = Math.floor(Math.random() * 1000000).toString();
        element._id = id;
        element.serviceDetail = {
          serviceName: d.serviceName,
          serviceDescription: d.serviceDescription,
          competencyType: { optionLabel: d.competencyType, optionValue: d.competencyTypeId },
          unit: d?.unitMain?.length ? d.unitMain : [],
          pricingMethod: d?.pricingMethodMain?.length ? d.pricingMethodMain : []
        };
        element.fieldTicketId = fieldTicketData?._id;
        material.push(element);
        await insertUpdate(objectStore.fieldTicketMaterial, id, restoreObjKeysWithValues(element, allFields));
        fetchMaterial();
        setMaterialDialog({ open: false, type: '', parentId: null });
        setAssignRentalDataDialog({ open: false, type: '' });
        setIsSubmitting(false);
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
    } else {
      const isRental = assignRentalDataDialog.open;
      var taxCodeData: any = null;
      if (fieldTicketData?.taxCode) {
        const {
          data: { data }
        } = await axiosInstance().get(`${routes?.taxMaster.path}/by-zipcode?taxCode=${fieldTicketData?.taxCode?.optionValue}&materialType=${type}`);
        if (data?.length) {
          taxCodeData = data[0];
        }
      }
      const material: any = [];
      if (isRental) {
        const currency = fieldTicketData?.currency?.toLowerCase();
        rows?.forEach((d: any) => {
          const element: any = {};
          element.materialId = d.materialId;
          element.type = type;
          element.unit = d.unit ? d.unit : '';
          element.pricingMethod = d.pricingMethod ? d.pricingMethod : '';
          element.qty = d.qty ? parseFloat(d.qty) : 1;
          element.uniqueId = d._id;
          element.estimateStartDate = d?.estimateStartDate ? d?.estimateStartDate : new Date();
          element.estimateEndDate = d?.estimateEndDate ? d?.estimateEndDate : new Date();
          element.estimateJobDuration = d?.estimateJobDuration;
          const wellNumberField = allFields?.find((e) => e?.fieldName === 'wellNumber');
          if (wellNumberField && d?.wellNumber) {
            if (wellNumberField?.type === 'multiSelect') {
              if (isArray(d?.wellNumber)) {
                element.wellNumber = d?.wellNumber?.map((e) => e.optionValue);
              } else if (isObject(d?.wellNumber)) {
                element.wellNumber = [d?.wellNumber?.optionValue];
              }
            } else {
              if (isArray(d?.wellNumber)) {
                element.wellNumber = d?.wellNumber[0]?.optionValue;
              } else if (isObject(d?.wellNumber)) {
                element.wellNumber = d?.wellNumber?.optionValue;
              }
            }
          }
          element['tax_' + currency] = d['tax_' + currency] || 0;
          element['discount_' + currency] = d['discount_' + currency] || 0;
          element['price_' + currency] = d['price_' + currency] || 0;
          element.taxPercentage = d.taxPercentage;
          element.discountPercentage = d.discountPercentage;
          if (d?.taxCode && allFields?.find((e) => e?.fieldName === 'taxCode')) {
            element.taxCode = d?.taxCode?.optionValue;
          }
          element['totalPrice_' + currency] = d['totalPrice_' + currency] || 0;
          element['finalPrice_' + currency] = d['finalPrice_' + currency] || 0;
          element.isRental = true;
          material.push(element);
        });
        AddMaterial(material, null);
      } else {
        rows.forEach((d) => {
          const element: any = {};
          element.materialId = d._id;
          element.type = type;
          element.parentId = materialDialog.parentId;
          element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
          element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
          element.qty = d.qty ? parseFloat(d.qty) : 1;
          element.estimateStartDate = fieldTicketData ? fieldTicketData?.estimateStartDate : new Date();
          element.estimateEndDate = fieldTicketData ? fieldTicketData?.estimateEndDate : new Date();
          element.isRental = false;
          if (taxCodeData) {
            element.taxCode = taxCodeData?.optionValue;
            element.taxPercentage = taxCodeData?.taxRate || 0;
          }
          const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
          Object.assign(element, calValues);
          material.push(element);
        });
        let priceData: any = await calculatePrice(fieldTicketData, material);
        if (fieldTicketData?.pricingCondition?.optionValue) {
          priceData = priceData?.filter((e) => e.conditionId === fieldTicketData?.pricingCondition?.optionValue);
        }
        AddMaterial(material, priceData);
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
          const calValues1 = autoCalculateSpecificFields({ pricingMethod: element['pricingMethod'] }, element, allFields);
          Object.assign(element, calValues1);
          const calValues2 = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
          Object.assign(element, calValues2);
        }
      });
    }
    await axiosInstance()
      .post(`${fieldTicket.api}/${fieldTicketData?._id}/material`, { material: tempMaterial })
      .then(() => {
        if (fieldTicketData?.status === FIELD_TICKET_STATUS.new) {
          handleChangeStatus(FIELD_TICKET_STATUS.inProgress);
        }
        fetchMaterial();
        fetchData();
        setMaterialDialog({ open: false, type: '', parentId: null });
        setAssignRentalDataDialog({ open: false, type: '' });
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleAddCost = async (rows) => {
    setUpdating(true);
    if (isOffline) {
      for (const d of rows) {
        let id = Math.floor(Math.random() * 1000000).toString();
        d._id = id;
        d.fieldTicketId = fieldTicketData?._id;
        d.type = MATERIAL_TYPE.manualEntry;
        await insertUpdate(objectStore.fieldTicketMaterial, id, restoreObjKeysWithValues(d, allFields));
        fetchMaterial();
        fetchData();
        setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        setUpdating(false);
      }
      if (/^[0-9a-fA-F]{24}$/.test(fieldTicketData?._id)) {
        let result = await findOne(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`);
        let updatedData = [...(result?.data || []), ...rows];
        await insertUpdate(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`, {
          ...result,
          data: updatedData,
          type: 'fieldTicketMaterial'
        });
      } else {
        let result = await findOne(objectStore.offlineDataSync, fieldTicketData?._id);
        let updatedData = { ...result?.data, cost: [...(result?.data?.cost || []), ...rows] };
        await insertUpdate(objectStore.offlineDataSync, fieldTicketData?._id, { ...result, data: updatedData });
      }
    } else {
      axiosInstance()
        .post(`${routes.fieldTicket?.path}/${fieldTicketData?._id}/cost`, [...rows])
        .then(() => {
          fetchMaterial();
          fetchData();
          setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
          setUpdating(false);
        })
        .catch((error) => {
          setUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleUpdateCost = async (rows, saveAndNext = false) => {
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
          alreadyOfflineDataSyncStoredRows = result?.data?.cost || [];
        }
        const toAddOfflineDataSyncStoreRows = [];
        for (const row of rows) {
          row.fieldTicketId = fieldTicketData?._id;
          row.type = MATERIAL_TYPE.manualEntry;
          await insertUpdate(objectStore.fieldTicketMaterial, row._id, restoreObjKeysWithValues(row, allFields));
          const foundIndex = alreadyOfflineDataSyncStoredRows.findIndex((d: any) => d._id === row._id);
          if (foundIndex !== -1) {
            alreadyOfflineDataSyncStoredRows[foundIndex] = row;
          } else {
            toAddOfflineDataSyncStoreRows.push(row);
          }
        }
        if (/^[0-9a-fA-F]{24}$/.test(fieldTicketData?._id)) {
          let updatedData = [...alreadyOfflineDataSyncStoredRows, ...toAddOfflineDataSyncStoreRows];
          await insertUpdate(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`, {
            ...result,
            data: updatedData,
            type: 'fieldTicketMaterial'
          });
        } else {
          let updatedData = { ...result?.data, cost: [...alreadyOfflineDataSyncStoredRows, ...toAddOfflineDataSyncStoreRows] };
          await insertUpdate(objectStore.offlineDataSync, fieldTicketData?._id, { ...result, data: updatedData });
        }
      } else {
        await axiosInstance().put(`${routes.fieldTicket?.path}/${fieldTicketData?._id}/cost`, [...rows]);
      }
      setUpdating(false);
      fetchMaterial();
      if (saveAndNext) {
        const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
        if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
          setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
        } else {
          setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
          setIsServiceEdit({
            open: true,
            data: dataRows[rowIndex + 1],
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        }
      } else {
        setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
      }
    } catch (error) {
      setUpdating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = async (rows) => {
    try {
      setDeleting(true);
      const material = rows?.filter((ele) => ele.type !== MATERIAL_TYPE.manualEntry)?.map((ele) => ({ id: ele.id, materialId: ele.materialId }));
      const cost = rows?.filter((ele) => ele.type === MATERIAL_TYPE.manualEntry).map((e) => e?.id);
      if (isOffline) {
        let materialIdsToDelete = material.map((e) => e.id);
        let serviceIdsOfMaterialToDelete = material.map((e) => e.materialId);
        let fieldTicketOfflineMaterial = await findAll(objectStore.fieldTicketMaterial);

        const productsToDelete = fieldTicketOfflineMaterial
          ?.map((e: any) => {
            if (e?.type === MATERIAL_TYPE.product && serviceIdsOfMaterialToDelete.includes(e?.service?.optionValue)) {
              return e._id;
            }
            return null;
          })
          .filter(Boolean);

        materialIdsToDelete = [...materialIdsToDelete, ...productsToDelete];

        //Offline Data Deletion
        [...materialIdsToDelete, ...cost].forEach((id) => {
          deleteOne(objectStore.fieldTicketMaterial, id);
        });

        //Updating offlineDataSync Store
        if (/^[0-9a-fA-F]{24}$/.test(fieldTicketData?._id)) {
          let result = await findOne(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`);
          const alreadyOfflineDataSyncStoredRows = result?.data || [];
          let updatedData = alreadyOfflineDataSyncStoredRows.filter((d: any) => !materialIdsToDelete.includes(d._id));
          updatedData = updatedData?.filter((d: any) => !cost.includes(d._id));
          await insertUpdate(objectStore.offlineDataSync, `${fieldTicketData?._id}_material`, { ...result, data: updatedData });
        } else {
          let result = await findOne(objectStore.offlineDataSync, fieldTicketData?._id);
          const material = result?.data?.material || [];
          const costs = result?.data?.cost || [];
          const updatedMaterial = material.filter((d: any) => !materialIdsToDelete.includes(d._id));
          const updatedCost = costs.filter((d: any) => !cost.includes(d._id));
          let updatedData = { ...result?.data, material: updatedMaterial, cost: updatedCost };
          await insertUpdate(objectStore.offlineDataSync, fieldTicketData?._id, { ...result, data: updatedData });
        }
        //for onlineSync
        const deleteData = {
          cost: cost,
          material: materialIdsToDelete,
          fieldTicketId: fieldTicketData?._id
        };
        let id = Math.floor(Math.random() * 1000000).toString();
        await insertUpdate(objectStore.offlineDataSync, id, { type: 'fieldTicketMaterialDelete', data: deleteData, _id: id });
      } else {
        if (material?.length) {
          await axiosInstance().put(`${fieldTicket.api}/${fieldTicketData?._id}/material/delete`, { ids: material });
        }
        if (cost?.length) {
          await axiosInstance().put(`${routes?.fieldTicket?.path}/${fieldTicketData?._id}/cost/remove`, { ids: cost });
        }
      }
      setDeleting(false);
      fetchMaterial();
      fetchData();
      setDeleteData(null);
    } catch (error) {
      setDeleting(false);
      toastConfig.setToastConfig(error);
      setDeleteData(null);
    }
  };

  const handleSaveData = async (rows: any, saveAndNext = false, showNext = false) => {
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
          row.type = MATERIAL_TYPE.service;
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
        if (!showNext) {
          await axiosInstance().put(`${fieldTicket.api}/${fieldTicketData?._id}/material`, { material: rows });
        }
      }
      fetchMaterial();
      if (saveAndNext) {
        const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
        if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
          setIsServiceEdit({
            open: false,
            data: null,
            showSaveAndNext: false
          });
          setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
        } else {
          setIsServiceEdit({
            open: true,
            data: dataRows[rowIndex + 1],
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        }
      } else {
        setIsServiceEdit({ open: false, data: null, showSaveAndNext: false });
      }
      setUpdating(false);
      setIsBulkEdit(false);
    } catch (error) {
      setUpdating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qty')) {
      if (parseInt(inputField?.qty) === 0) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Quantity cannot be zero'
        });
        return;
      }
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    if (updatedData?.type === MATERIAL_TYPE.manualEntry) {
      rows = await calculateRowsField(flattenArray(dataRows), inputField, costFields, updatedData, fieldTicketData?.currency);
      await handleUpdateCost(rows);
    } else {
      rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, fieldTicketData?.currency);
      handleSaveData(rows);
    }
  };

  const AddButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setMaterialDialog({ open: true, type: MATERIAL_TYPE.service, parentId: null });
          }}
          id={'add-existing-service-menu-item'}
        >
          Add Existing Service
        </MenuItem>
        {permissions?.serviceMaster?.isCreate && !isOffline && (
          <MenuItem
            onClick={() => {
              setMaterialDialog({ open: true, type: 'newService', parentId: null });
            }}
            id={'add-new-service-menu-item'}
          >
            Add New Service
          </MenuItem>
        )}
        {permissions?.packages?.isRead && resourcePolicy?.showAddPackages && !isOffline && (
          <MenuItem
            onClick={() => {
              setMaterialDialog({ open: true, type: MATERIAL_TYPE.package, parentId: null });
            }}
            id={'add-existing-package-menu-item'}
          >
            Add Existing Package
          </MenuItem>
        )}
        {costFields?.length > 0 && (
          <MenuItem
            onClick={() => {
              setShowCostDialog({ open: true, data: null, showSaveAndNext: false });
            }}
            id={'add-manual-entry-menu-item'}
          >
            Add Manual Entry
          </MenuItem>
        )}
        {resourcePolicy?.showRentalAddMaterial && fieldTicketData?.rentalJob?.optionValue && !isOffline && (
          <>
            <MenuItem
              onClick={() => {
                setAssignRentalDataDialog({ open: true, type: MATERIAL_TYPE.serializedAsset });
              }}
            >
              Add Rental Assets
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAssignRentalDataDialog({ open: true, type: MATERIAL_TYPE.product });
              }}
            >
              Add Rental Consumables
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAssignRentalDataDialog({ open: true, type: MATERIAL_TYPE.package });
              }}
            >
              Add Rental Packages
            </MenuItem>
          </>
        )}
      </>
    );
  };

  const ActionButtonMenuItms = () => {
    return (
      <>
        <HtmlTooltip title={Boolean(selectedRecords?.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
          <MenuItem
            disabled={selectedRecords.some((e) => e.type === MATERIAL_TYPE.manualEntry)}
            onClick={() => {
              setIsServiceEdit({ open: true, data: null, showSaveAndNext: false });
              setIsBulkEdit(true);
            }}
          >
            Bulk Edit
          </MenuItem>
        </HtmlTooltip>
        <HtmlTooltip title={Boolean(selectedRecords?.length) ? 'Delete selected records' : 'Select records to delete'}>
          <MenuItem
            disabled={isDeleting || selectedRecords.some((ele) => !ele?.canDelete)}
            onClick={() => {
              const obj: any = [];
              const dataToDelete = selectedRecords && selectedRecords.filter((e) => !e.hideSelection);
              dataToDelete?.forEach((ele) => {
                obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
              });
              dataToDelete?.forEach((ele) => {
                getNestedSubRows(obj, ele);
              });
              setDeleteData(obj);
            }}
          >
            Delete
          </MenuItem>
        </HtmlTooltip>
      </>
    );
  };

  return (
    <>
      {allowedToEdit && !fieldTicketData?.quotation && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={<AddButtonMenuItems />}
            isActionButtonVisible={!isOffline}
            actionButtonMenuItems={<ActionButtonMenuItms />}
            actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
            hasXpadding
          />
        </>
      )}
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 300px)' : '300px'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            hideSelection={allowedToEdit && !fieldTicketData?.quotation ? false : true}
            hideAction={allowedToEdit && !fieldTicketData?.quotation ? false : true}
            onSaveEdit={onSaveInlineEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchMaterial}
            expander={resourcePolicy?.showAddPackages ? true : false}
          />
        </Box>
      ) : (
        <Box p={2} height={300}>
          <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
        </Box>
      )}
      <Box mt={3}>
        <Consumables
          allowedToEdit={allowedToEdit}
          services={dataRows?.filter((e) => e.type === MATERIAL_TYPE.service)}
          fieldTicketData={fieldTicketData}
          fetchMaterial={fetchMaterial}
          stepFullScreen={stepFullScreen}
          fetchData={fetchData}
          refreshChild={refreshChild}
        />
      </Box>
      {materialDialog?.open && materialDialog?.type === MATERIAL_TYPE.service && (
        <AssignServiceDialog
          onSuccess={(rows) => {
            handleAdd(rows, MATERIAL_TYPE.service);
          }}
          handleClose={() => {
            setMaterialDialog({ open: false, type: '', parentId: null });
          }}
          extraStaticFilter={[{ field: 'serviceType', term: SERVICE_TYPE.fieldService }]}
          isSubmitting={isSubmitting}
          pricingCondition={fieldTicketData?.pricingCondition?.optionValue || null}
          currency={fieldTicketData.currency}
        />
      )}
      {materialDialog?.open && materialDialog?.type === MATERIAL_TYPE.package && (
        <AssignPackageDialog
          onSuccess={(rows) => {
            handleAdd(rows, MATERIAL_TYPE.package);
          }}
          handleClose={() => {
            setMaterialDialog({ open: false, type: '', parentId: null });
          }}
          ids={treeToFlatArray(dataRows, 'subRows')?.map((e) => e.materialId)}
          isSubmitting={isSubmitting}
        />
      )}
      {materialDialog.open && materialDialog.type === 'newService' && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={null}
          onClose={() => setMaterialDialog({ open: false, type: '', parentId: null })}
          onSuccess={(data) => {
            const row = data?.data;
            row.unitMain = row?.unit;
            row.pricingMethodMain = row?.pricingMethod;
            handleAdd([row], MATERIAL_TYPE.service);
            setMaterialDialog({ open: false, type: '', parentId: null });
          }}
          isRedirectToDetailPage={false}
          referenceData={{ serviceType: SERVICE_TYPE.fieldService }}
        />
      )}

      {isServiceEdit.open && (
        <MaterialQtyDialog
          onClose={() => {
            setIsServiceEdit({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          isBulkedit={isBulkEdit}
          handleSaveData={handleSaveData}
          fieldTicketData={fieldTicketData}
          rowData={!isBulkEdit ? isServiceEdit.data : selectedRecords}
          material={dataRows}
          selectedServices={selectedRecords}
          loading={isUpdating}
          showSaveAndNext={isServiceEdit.showSaveAndNext}
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
      {showCostDialog.open && (
        <AddCostDialog
          onClose={() => {
            setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          fieldTicketData={fieldTicketData}
          costData={showCostDialog?.data}
          showSaveAndNext={showCostDialog.showSaveAndNext}
          loadingEdit={isUpdating}
        />
      )}
      {assignRentalDataDialog?.open && (
        <AddRentalDataDialog
          type={assignRentalDataDialog?.type}
          onClose={() => {
            setAssignRentalDataDialog({ open: false, type: '' });
          }}
          onSuccess={(rows) => {
            handleAdd(rows, assignRentalDataDialog?.type);
          }}
          rentalId={fieldTicketData?.rentalJob?.optionValue}
          currency={fieldTicketData?.currency}
          isSubmitting={isSubmitting}
          ids={dataRows?.map((row) => (assignRentalDataDialog?.type === MATERIAL_TYPE.package ? row?.uniqueId : row?.materialId))}
        />
      )}
    </>
  );
};

export default Material;

import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField, getNestedSubRows } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import {
  CHILD_RESOURCE,
  MATERIAL_TYPE,
  PRICING_SETUP_TYPE,
  SERVICE_ORDER_STATUS,
  SERVICE_TYPE,
  fieldServiceOrder,
  sidebarResource,
} from 'src/constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import { ownerAndColaborator } from 'src/constants/messageHelpers';
import { FiExternalLink } from 'react-icons/fi';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import { getPricingConditions, getPricingValue } from 'src/components/PricingCondition';
import MaterialQtyDialog from 'src/pages/FieldServiceOrder/Technicians/MaterialQtyDialog';


const Services = ({ serviceOrderData, stepFullScreen, allowedToEdit, handleChangeStatus, fetchData, setNextStep }) => {

  const renderedFrom = `${camelCase(sidebarResource.fieldServiceOrder)}_Services`;
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const [materialDialog, setMaterialDialog] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [isServiceEdit, setIsServiceEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshChild, setRefreshChild] = useState(false);

  const {
    state: { permissions, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, [serviceOrderData]);

  useEffect(() => {
    if (columns) {
      fetchMaterial();
    }
  }, [columns]);

  const fetchFields = async () => {
    let data = await fetch_child_resource_fields_perm(
      CHILD_RESOURCE.fieldServiceOrderDetails,
      serviceOrderData?.currency,
      allowedToEdit
    );
    setAllFields(JSON.parse(JSON.stringify(data)));
    data = data?.filter((f) => f?.isRead);
    const newColumns = generateColumns(renderedFrom, data, null, false, serviceOrderData?.currency);
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
            {!allowedToEdit ? (
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
        Cell: ({ row }) => <DropdownCell
          permissions={permissions}
          permissionForLinks={{}}
          field={{
            fieldName: 'competencyType',
            lookupResource: sidebarResource.competencyType
          }}
          original={row?.original}
        />
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) =>
          <DropdownCell
            permissions={permissions}
            permissionForLinks={{}}
            field={{
              fieldName: 'competencies',
              lookupResource: sidebarResource.competencies
            }}
            original={row?.original}
          />
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
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let data;
    setNextStep(true);
    const response = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material?type=${MATERIAL_TYPE.service}`);
    data = response?.data?.data?.material;

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
      parent.competencyType = parent?.serviceDetail?.competencyType;
      parent.competencies = parent?.serviceDetail?.competencies;
      parent.isValid = parent['finalPrice_' + serviceOrderData?.currency?.toLowerCase()] ? true : !isPriceRequired;
      parent.canDelete = parent.canDelete ?? true;
      parent.subRows = generateNestedData(data, parent, isPriceRequired);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
      setNextStep(false);
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
    setRefreshChild(!refreshChild);
  };

  const generateNestedData = (material, parent, isPriceRequired) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail = _subRow.type === MATERIAL_TYPE.package ? _subRow?.packageDetail?.packageName : _subRow.type === MATERIAL_TYPE.service ? _subRow?.serviceDetail?.serviceName : _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.productName : '';
      _subRow.description = _subRow.type === MATERIAL_TYPE.package ? _subRow?.packageDetail?.packageDescription || '' : _subRow.type === MATERIAL_TYPE.service ? _subRow?.serviceDetail?.serviceDescription : _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.productDescription : '';
      _subRow.competencyType = _subRow?.serviceDetail?.competencyType;
      _subRow.competencies = _subRow?.serviceDetail?.competencies;
      _subRow.qty = _subRow.qty * parent.qty;
      _subRow.isValid = _subRow['finalPrice_' + serviceOrderData?.currency?.toLowerCase()] ? true : !isPriceRequired;
      _subRow.canDelete = _subRow.canDelete ?? true;
      _subRow.subRows = generateNestedData(material, _subRow, isPriceRequired);
    });
    if (subRows.filter((_subRow) => _subRow.isValid === false).length > 0) {
      setNextStep(false);
    }
    return subRows;
  };

  const openMaterial = (data, rows) => {
    setIsServiceEdit({
      open: true,
      data: data.original,
      showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
    });
    setIsBulkEdit(false);
  };

  const handleAdd = async (rows: any, type: string) => {
    setIsSubmitting(true);
    var taxCodeData: any = null;
    if (serviceOrderData?.taxCode) {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes?.taxMaster.path}/by-zipcode?taxCode=${serviceOrderData?.taxCode?.optionValue}&materialType=${type}`);
      if (data?.length) {
        taxCodeData = data[0];
      }
    }
    const material: any = [];

    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = type;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.estimateStartDate = serviceOrderData ? serviceOrderData?.estimateStartDate : new Date();
      element.estimateEndDate = serviceOrderData ? serviceOrderData?.estimateEndDate : new Date();
      if (taxCodeData) {
        element.taxCode = taxCodeData?.optionValue;
        element.taxPercentage = taxCodeData?.taxRate || 0;
      }
      const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
      Object.assign(element, calValues);
      material.push(element);
    });
    let priceData: any = await getPricingConditions(serviceOrderData, material, PRICING_SETUP_TYPE.rent);
    AddMaterial(material, priceData);
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
    await axiosInstance()
      .post(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material`, { material: tempMaterial })
      .then(() => {
        if (serviceOrderData?.status === SERVICE_ORDER_STATUS.new) {
          handleChangeStatus(SERVICE_ORDER_STATUS.inProgress);
        }
        fetchMaterial();
        fetchData();
        setMaterialDialog(false);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleDelete = async (rows) => {
    try {
      setDeleting(true);
      const material = rows?.map((ele) => ({ id: ele.id, materialId: ele.materialId }));
      if (material?.length) {
        await axiosInstance().put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material/delete`, { ids: material });
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

      if (!showNext) {
        await axiosInstance().put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/material`, { material: rows });
      }
      fetchMaterial();
      if (saveAndNext) {
        const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);

        setIsServiceEdit({
          open: true,
          data: dataRows[rowIndex + 1],
          showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
        });
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

    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, serviceOrderData?.currency);
    handleSaveData(rows);
  };

  const AddButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setMaterialDialog(true);
          }}
          id={'add-existing-service-menu-item'}
        >
          Add Existing Service
        </MenuItem>
      </>
    );
  };

  const ActionButtonMenuItms = () => {
    return (
      <>
        <HtmlTooltip title={Boolean(selectedRecords?.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
          <MenuItem
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
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={<AddButtonMenuItems />}
            isActionButtonVisible={true}
            actionButtonMenuItems={<ActionButtonMenuItms />}
            actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
            hasXpadding
          />
        </>
      )}
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            hideSelection={allowedToEdit ? false : true}
            hideAction={allowedToEdit ? false : true}
            onSaveEdit={onSaveInlineEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchMaterial}
          />
        </Box>
      ) : (
        <Box p={2} height={300}>
          <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
        </Box>
      )}
      {materialDialog && (
        <AssignServiceDialog
          onSuccess={(rows) => {
            handleAdd(rows, MATERIAL_TYPE.service);
          }}
          handleClose={() => {
            setMaterialDialog(false);
          }}
          extraStaticFilter={[{ field: 'serviceType', term: SERVICE_TYPE.fieldService }]}
          isSubmitting={isSubmitting}
          pricingCondition={serviceOrderData?.pricingCondition?.optionValue || null}
          currency={serviceOrderData.currency}
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
          serviceOrderData={serviceOrderData}
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
    </>
  );
};

export default Services;

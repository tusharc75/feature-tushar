import { Box, IconButton, MenuItem, Typography } from '@mui/material';
import { CheckCircle, Delete, Edit } from '@mui/icons-material';
import { flatMap, map, orderBy, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  ACTIVITY_RESOURCE,
  ATTACHMENT_TYPE,
  CHILD_RESOURCE,
  MATERIAL_SUB_TYPE,
  MATERIAL_TYPE,
  sidebarResource,
  WORK_ORDER_STATUS,
  WORK_ORDER_TYPE,
  workOrder,
  WORKORDER_SERVICE_STATUS
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import SyncIcon from '@mui/icons-material/Sync';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { AutoCompleteWorkOrder } from 'src/assets/svg/svgIcons';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import { flattenArray } from 'src/constants/columns';
import AssignTechniciansDialog from 'src/pages/WorkOrder/Service/AssignTechniciansDialog';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import PackageNumberDialog from 'src/pages/AssemblyOrder/WorkOrder/PackageNumberDialog';
import DescriptionIcon from '@mui/icons-material/Description';
import DiagramDialog from 'src/pages/WorkOrder/Diagram/DiagramDialog';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import PreviewDownload from 'src/components/PreviewDownload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ProductQtyDialog from 'src/pages/AssemblyOrder/WorkOrder/ProductQtyDialog';
import PreviewDownloadNew from 'src/components/PreviewDownloadNew';

const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const WorkOrder = ({
  renderedFrom,
  assemblyOrderData,
  setNextStep,
  stepFullScreen,
  allowedToEdit,
  setCurrentStep,
  nextStep,
  fetchAssembleOrderData
}) => {
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [autoCompleteData, setAutoCompleteData] = useState(null);
  const [completeConfirmBox, setCompleteConfirmBox] = useState(false);
  const [isCompleting, setCompleting] = useState(false);
  const [addServicesDialog, setAddServicesDialog] = useState({ open: false, new: false });
  const [isSubmitting, setSubmitting] = useState(false);
  const [userAssignDialog, setUserAssignDialog] = useState({ open: false, assignedUsers: [] });
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState({ open: false, assignedWorkStations: [] });
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, ids: [], data: null });
  const [arrangeView, setArrangeView] = useState(false);
  const [openSerializedPackageDialog, setOpenSerializedPackageDialog] = useState({ open: false, ids: [] });
  const [showDrawingDialog, setShowDrawingDialog] = useState({ open: false, data: null });
  const [productQtyEdit, setProductQtyEdit] = useState({ open: false, data: null });

  const { generateColumns, getMaterialLabel } = useColumns();

  useEffect(() => {
    setNextStep(false);
    checkAllWorkOrderComplete();
    fetchData();
  }, []);

  const autoCreateWorkOrder = async () => {
    try {
      setIsAutoCreating(true);
      await axiosInstance().post(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}`);
      toastConfig.setToastConfig({
        open: true,
        message: `Automatic ${resources?.workOrder?.titlePlural} has been successfully generated.`,
        type: 'success'
      });
      setIsAutoCreating(false);
      fetchData();
    } catch (error) {
      setIsAutoCreating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const checkAllWorkOrderComplete = async () => {
    const response = await axiosInstance().get(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}/check-all-work-order-complete`);
    if (!!response?.data?.data?.isCompletedAll) {
      setNextStep(true);
    }
    if (response?.data?.data?.materialCount) {
      autoCreateWorkOrder();
    }
  };

  useEffect(() => {
    fetchFields();
  }, [assemblyOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.assemblyOrderMaterial, assemblyOrderData?.currency || 'USD', false);
    var data = response;
    const {
      data: { data: serializedPackageFieldData }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: sidebarResource.serializedPackages,
          fieldNames: ['serializedPackageNumber']
        }
      ]
    });
    const serializedPackageField = serializedPackageFieldData?.find((d) => d.resource === sidebarResource.serializedPackages)?.fieldNames || [];

    const newColumns = generateColumns(renderedFrom, data?.filter((e) => !['detail', 'description']?.includes(e?.fieldName)), null, false, assemblyOrderData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 100,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${getMaterialLabel(row.original?.type)}
          ${row.original['type'] === MATERIAL_TYPE.product ? row.original?.productDetail?.serializedProduct ? ' (Serialized)' : ' (Non-Serialized)' : ''}`}</h5> : <NoDataCell />),
        accessorFn: (original) => {
          return getMaterialLabel(original?.type);
        }
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 200,
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.detail}</h5>
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === MATERIAL_TYPE.product) {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.package) {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.service) {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div >
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['description'] ? <div>
            <h5 className="text-truncate" title={row.original.description}>{row.original.description}</h5>
          </div> : <NoDataCell />;
        }
      },
      {
        accessor: 'workOrderNumber',
        Header: 'Work Order',
        width: 200,
        Cell: ({ row }) =>
          row.original.workOrderNumber ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row.original?.workOrderNumber}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes?.workOrderDetail?.path}/${row.original?.workOrderId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['status'] ? <h5 className="text-truncate">{row.original.status}</h5> : <NoDataCell />;
        }
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'serializedPackageNumber',
      Header: serializedPackageField[0]?.fieldLabel || 'Serialized Package Number',
      width: 200,
      show: false,
      Cell: ({ row }) => {
        return row.original?.serializedPackageNumber ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.serializedPackageNumber}</h5>{' '}
            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.serializedPackagesDetail.path}/${row.original.serializedPackageId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        ) : (
          <NoDataCell />
        );
      }
    });
    coloum.push({
      accessor: 'assignedUsers',
      Header: 'Assigned Technician',
      width: 200,
      Cell: ({ row }) => (
        <DropdownCell
          permissions={permissions}
          permissionForLinks={{}}
          field={{
            fieldName: 'assignedUsers',
            lookupResource: sidebarResource.user
          }}
          original={row?.original}
        />
      )
    });
    if (permissions?.workStations) {
      coloum.push({
        accessor: 'assignedWorkStations',
        Header: 'Assigned Work Station',
        width: 200,
        Cell: ({ row }) => (
          <DropdownCell
            permissions={permissions}
            permissionForLinks={{}}
            field={{
              fieldName: 'assignedWorkStations',
              lookupResource: sidebarResource.workStations
            }}
            original={row?.original}
          />
        )
      });
    }
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 130,
      width: 130,
      sticky: 'right',
      Cell: ({ row }) => {
        return (
          <>
            {row.original.type === MATERIAL_TYPE.package && row.original?.workOrderId && (
              <HtmlTooltip title="Auto Complete Work Order">
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setAutoCompleteData([row.original]);
                    setCompleteConfirmBox(true);
                  }}
                  disabled={row?.original?.canAutoCompleteWorkOrder ? false : true}
                >
                  {row.original['workOrderStatus'] === WORK_ORDER_STATUS.completed ? (
                    <CheckCircle className="text-[var(--chip-color-completed)] [font-size:19px_!important] dark:text-green-400" />
                  ) : (
                    <AutoCompleteWorkOrder size={20} className={`${row?.original?.canAutoCompleteWorkOrder ? 'text-[var(--primary-text)]' : ''}`} />
                  )}
                </IconButton>
              </HtmlTooltip>
            )}
            {row?.original?.workOrderId && ![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(row?.original?.workOrderStatus) &&
              [MATERIAL_TYPE.service, MATERIAL_TYPE.package]?.includes(row?.original?.type) &&
              !user?.user?.brandPolicy?.workOrderConsumableHide && (
                <HtmlTooltip title="Add Products/Consumables">
                  <IconButton
                    size="small"
                    aria-label="Add Products/Consumables"
                    onClick={() => {
                      var ids = [];
                      if (row?.original?.type === MATERIAL_TYPE.package) {
                        ids = flattenArray(dataRows)
                          ?.filter((e) => e?.workOrderId === row?.original?.workOrderId && e?.type === MATERIAL_TYPE.product)
                          ?.map((e) => e.materialId);
                      } else {
                        ids = flattenArray(dataRows)
                          ?.filter((e) => row?.original?._id === e?.parentId)
                          ?.map((e) => e.materialId);
                      }
                      setConsumablesDialog({ open: true, ids: ids, data: [row?.original] });
                    }}
                  >
                    <AddCircleOutlineIcon fontSize="small" color={'primary'} />
                  </IconButton>
                </HtmlTooltip>
              )}

            {row.original?.workOrderId && ![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(row?.original?.workOrderStatus)
              && [MATERIAL_TYPE.product]?.includes(row?.original?.type) && (
                <HtmlTooltip title={'Edit'}      >
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Edit"
                      onClick={() => {
                        setProductQtyEdit({ open: true, data: row?.original });
                      }}
                    >
                      <Edit fontSize="small" color={'primary'} />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              )}

            {row.original?.workOrderId && (
              <HtmlTooltip title="Drawings">
                <IconButton
                  size="small"
                  aria-label="Drawings"
                  onClick={() => {
                    setShowDrawingDialog({ open: true, data: row?.original });
                  }}
                >
                  <DescriptionIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}

            <HtmlTooltip
              title={
                !row?.original?.canDelete
                  ? row?.original?.assetQty
                    ? 'Asset has already assigned'
                    : row?.original?.consumedQty
                      ? 'Product has already consumed'
                      : 'Delete'
                  : 'Delete'
              }
            >
              <span>
                <IconButton
                  disabled={row?.original?.canDelete ? false : true}
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    setDeleteData([row.original]);
                    setShowDeleteConfirmBox(true);
                  }}
                >
                  <Delete fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        );
      }
    });
    setColumns(coloum);
  };

  const fetchData = async () => {
    setNextStep(false);

    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    const {
      data: { data }
    } = await axiosInstance().get(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}`);

    setMaterial(JSON.parse(JSON.stringify(data)));

    let rows = data?.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent?.detail || parent.packageDetail?.packageName || '';
      parent.description = parent?.description || parent?.packageDetail?.packageDescription || '';
      parent.qty = parent.qty;
      if (parent?.workOrder) {
        parent.workOrderId = parent?.workOrder?._id;
        parent.workOrderNumber = parent?.workOrder?.workOrderNumber;
        parent.status = parent?.workOrder?.status || '';
        parent.workOrderStatus = parent?.workOrder?.status || '';
        if (parent?.workOrder?.status === WORK_ORDER_STATUS.new) {
          parent.canAutoCompleteWorkOrder = true;
        }
        if (parent?.workOrder?.status === WORK_ORDER_STATUS.completed) {
          parent.hideSelection = true;
          if (parent?.serializedPackage) {
            parent.serializedPackageId = parent?.serializedPackage?.optionValue;
            parent.serializedPackageNumber = parent?.serializedPackage?.optionLabel;
          }
        }
      }
      parent.subRows = generateNestedData(data, parent);
      parent.canDelete = false;
      if (parent?.workOrder) {
        if (parent?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
          parent.canDelete = parent.subRows.length === 0 ? true : false;
          if (parent.subRows?.length && parent.subRows?.find((e) => !e?.canDelete)) {
            parent.canDelete = false;
          }
        }
      }
    });

    if (rows?.every((r) => r?.workOrderStatus === WORK_ORDER_STATUS.completed)) {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    var subPackage: any = material.filter((e) => e?.parentId === parent?._id && e?.type === MATERIAL_TYPE.package);
    subPackage.forEach((_subPackage, index) => {
      _subPackage.index = parent.index + '.' + `${index + 1}`;
      _subPackage.detail = _subPackage?.detail || _subPackage.packageDetail?.packageName || '';
      _subPackage.description = _subPackage?.description || _subPackage?.packageDetail?.packageDescription || '';
      _subPackage.qty = _subPackage.qty;
      if (_subPackage?.workOrder) {
        _subPackage.workOrderId = _subPackage?.workOrder?._id;
        _subPackage.workOrderNumber = _subPackage?.workOrder?.workOrderNumber;
        _subPackage.status = _subPackage?.workOrder?.status || '';
        _subPackage.workOrderStatus = _subPackage?.workOrder?.status || '';
        if (_subPackage?.workOrder?.status === WORK_ORDER_STATUS.new) {
          _subPackage.canAutoCompleteWorkOrder = true;
        }
        if (_subPackage?.workOrder?.status === WORK_ORDER_STATUS.completed) {
          _subPackage.hideSelection = true;
          if (_subPackage?.serializedPackage) {
            _subPackage.serializedPackageId = _subPackage?.serializedPackage?.optionValue;
            _subPackage.serializedPackageNumber = _subPackage?.serializedPackage?.optionLabel;
          }
        }
      }
      _subPackage.subRows = generateNestedData(material, _subPackage);
      _subPackage.canDelete = false;
      if (_subPackage?.workOrder) {
        if (_subPackage?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
          _subPackage.canDelete = _subPackage.subRows.length === 0 ? true : false;
          if (_subPackage.subRows?.length && _subPackage.subRows?.find((e) => !e?.canDelete)) {
            _subPackage.canDelete = false;
          }
        }
      }
    });

    var subRows: any = material.filter((e) => e?.parentId === parent?._id && [MATERIAL_TYPE.product, MATERIAL_TYPE.service]?.includes(e?.type));
    subRows = orderBy(subRows, ['type'], ['desc']);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === MATERIAL_TYPE.service ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail = _subRow.detail
        ? _subRow.detail
        : _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow.productDetail?.productName
            : '';
      _subRow.description = _subRow.description
        ? _subRow.description
        : _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription
            : '';
      _subRow.qty = _subRow.qty;
      _subRow.workOrder = parent?.workOrder;
      _subRow.workOrderId = parent?.workOrderId;
      _subRow.workOrderNumber = parent?.workOrderNumber;
      _subRow.workOrderStatus = parent?.workOrderStatus;
      _subRow.hideSelection = false;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === MATERIAL_TYPE.service ? serviceIndex++ : productIndex++;
      if (_subRow?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        _subRow.hideSelection = true;
      }
      _subRow.canDelete = false;
      if (_subRow?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
        if (_subRow.type === MATERIAL_TYPE.product) {
          _subRow.canDelete = _subRow?.consumedQty || _subRow?.requestedQty || _subRow?.assetQty ? false : true;
        }
        if (_subRow.type === MATERIAL_TYPE.service && _subRow?.workOrder?.status != WORK_ORDER_STATUS.onHold) {
          _subRow.canDelete = _subRow?.status === WORKORDER_SERVICE_STATUS.pending ? true : false;
        }
        if (_subRow.subRows?.length && _subRow.subRows?.find((e) => !e?.canDelete)) {
          _subRow.canDelete = false;
        }
      }
    });
    return [...subRows, ...subPackage];
  };

  const handleDelete = async () => {
    setDeleting(true);
    if (deleteData?.some((e) => [MATERIAL_TYPE.service, MATERIAL_TYPE.product]?.includes(e.type))) {
      const records: any = [];
      deleteData?.forEach((data) => {
        const index = records?.findIndex((d) => d?.workOrder === data?.workOrderId);
        if (index >= 0) {
          records[index].ids = [...records[index].ids, data?._id];
        } else {
          records.push({
            workOrder: data?.workOrderId,
            ids: [data?._id]
          });
        }
      });
      await axiosInstance().put(`${workOrder.api}/${assemblyOrderData?._id}/material/remove`, records);
      setDeleting(false);
      setShowDeleteConfirmBox(false);
      fetchData();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Deleted Successfully'
      });
    } else {
      if (deleteData?.filter((e: any) => !e?.subRows?.length && e?.status !== WORK_ORDER_STATUS.completed)?.length) {
        handleDeleteWorkOrder(
          deleteData?.filter((e: any) => !e?.subRows?.length && e?.status !== WORK_ORDER_STATUS.completed)?.map((e) => e.workOrderId)
        );
      }
    }
  };

  const handleDeleteWorkOrder = (ids) => {
    axiosInstance()
      .put(`${workOrder.api}/remove`, { ids: ids })
      .then(({ data }) => {
        setDeleting(false);
        setShowDeleteConfirmBox(false);
        setCurrentStep((prevStep) => {
          const newStep = prevStep - 1;
          return newStep;
        });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((err) => {
        setShowDeleteConfirmBox(false);
        setDeleting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleAutoComplete = (ids, serializedPackages = null) => {
    setCompleting(true);
    const data: any = {
      workOrders: ids
    };
    if (serializedPackages) {
      data.serializedPackages = serializedPackages;
    }
    if (ids.length) {
      axiosInstance()
        .put(`${routes.assemblyOrder.path}/work-order/${assemblyOrderData._id}/auto-complete`, data)
        .then(({ data }) => {
          setCompleting(false);
          setCompleteConfirmBox(false);
          setOpenSerializedPackageDialog({ open: false, ids: [] });
          fetchData();
          checkAllWorkOrderComplete();
          fetchAssembleOrderData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
        })
        .catch((err) => {
          setCompleting(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      setCompleting(false);
      setCompleteConfirmBox(false);
      fetchData();
    }
  };

  const checkParentProduct = (selectedRecords, parentId = null, rows = []) => {
    if (parentId && rows?.length > 0) {
      return (
        [MATERIAL_TYPE.product, MATERIAL_TYPE.package].includes(selectedRecords[0]?.type) &&
        selectedRecords[0]?.parentId &&
        !rows?.find((r) => r?.original?._id === parentId)?.original?.parentId
      );
    } else if (parentId && rows?.length === 0) {
      return selectedRecords[0]?.type === MATERIAL_TYPE.product && !material?.find((m) => m?._id === parentId)?.parentId;
    }
    return selectedRecords?.filter((e) => !material?.find((m) => m?._id === e?.parentId)?.parentId)?.length ? true : false;
  };

  const checkUniqWorkOrder = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (
      uniq(
        map(
          selectedRecords?.filter((r) => r?.workOrderId),
          'workOrderId'
        )
      ).length === 1
    ) {
      return true;
    } else {
      return false;
    }
  };

  const handleAddService = (ids) => {
    setSubmitting(true);
    const allWorkOrders = selectedRecords?.filter((r) => r?.workOrderId)?.map((e) => e.workOrderId);
    const data: any = {};
    data.serviceIds = ids;
    data.workOrderIds = [...new Set(allWorkOrders)];
    axiosInstance()
      .post(`${workOrder.api}/service`, data)
      .then(() => {
        setAddServicesDialog({ open: false, new: false });
        fetchData();
        setSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setSubmitting(false);
      });
  };

  const handleAddConsumables = (rows, records = []) => {
    setSubmitting(true);
    const data: any = [];
    let workOrderId = '';
    const _package = records?.find((s) => s.type === MATERIAL_TYPE.package);
    if (_package) {
      workOrderId = _package?.workOrderId;
      rows?.forEach((e) => {
        data.push({
          product: e._id,
          qty: parseInt(e.qty) || 1,
          subType: MATERIAL_SUB_TYPE.consumable,
          service: null,
          uniqueId: null,
          stepId: null
        });
      });
    } else {
      const services = records?.filter((s) => s.type === MATERIAL_TYPE.service);
      workOrderId = services[0]?.workOrderId;
      services?.forEach((s) => {
        rows?.forEach((e) => {
          data.push({
            product: e._id,
            qty: parseInt(e.qty) || 1,
            subType: MATERIAL_SUB_TYPE.consumable,
            service: s?.serviceDetail?._id,
            uniqueId: s?.uniqueId,
            stepId: null,
            parentId: s?._id
          });
        });
      });
    }
    axiosInstance()
      .post(`${workOrder.api}/${workOrderId}/consumable`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setSubmitting(false);
        setConsumablesDialog({ open: false, ids: [], data: null });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleArrangeUpdate = (rows: any[], workOrderId) => {
    rows?.forEach((e: any) => {
      delete e.name;
      delete e.preWork;
    });
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/order`, { data: rows || [] })
      .then(({ data }) => {
        fetchData();
        setArrangeView(false);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          type: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const rightSideContents = () => {
    return (
      <> {assemblyOrderData?.customPdfTemplate ?
        <PreviewDownloadNew
          fileName={`${resources?.assemblyOrder?.titleSingular}-${assemblyOrderData?.assemblyOrderNumber}`}
          resource={sidebarResource.assemblyOrder}
          referenceId={assemblyOrderData?._id}
          hideDetailButton={true}
          isAsyncDownload={true}
        /> :
        <PreviewDownload
          fileName={`${resources?.assemblyOrder?.titlePlural}-${assemblyOrderData?.assemblyOrderNumber}`}
          resource={sidebarResource.assemblyOrder}
          referenceId={assemblyOrderData._id}
          referenceLabel={assemblyOrderData?.assemblyOrderNumber}
          columns={columns}
          isAsyncDownload={true}
          defaultColumns={['index', `detail`, `description`, `qty`]}
        />}
      </>
    );
  };

  const updateWorkOrdetStatus = () => {
    setSubmitting(true);
    const ids = selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.package && e?.status === WORK_ORDER_STATUS.draft)?.map((e) => e?.workOrderId);
    const data: any = { status: WORK_ORDER_STATUS.new, ids: ids };
    axiosInstance()
      .put(`${workOrder.api}/update-multiple-status`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateQty = (data) => {
    setSubmitting(true);
    axiosInstance()
      .put(`${workOrder.api}/${productQtyEdit?.data?.workOrder?._id}/consumable/update-qty`, [
        {
          ...data
        }
      ])
      .then(({ data }) => {
        setSubmitting(false);
        fetchData();
        setProductQtyEdit({ open: false, data: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  }

  return (
    <>
      {isAutoCreating && (
        <Box p={1} display="flex" alignItems="center">
          <SyncIcon className="rotate" /> <Typography variant="subtitle2">Work order Auto Creation in Progress </Typography>
        </Box>
      )}
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={
          <ActionButtonMenuItems
            {...{
              selectedRecords,
              allowedToEdit,
              permissions,
              user,
              checkUniqWorkOrder,
              setDeleteData,
              setShowDeleteConfirmBox,
              setAutoCompleteData,
              setCompleteConfirmBox,
              checkParentProduct,
              setAddServicesDialog,
              setUserAssignDialog,
              setWorkStationAssignDialog,
              dataRows,
              setConsumablesDialog,
              setArrangeView,
              setShowDrawingDialog,
              updateWorkOrdetStatus
            }}
          />
        }
        actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
        hasXpadding
        rightSideContents={rightSideContents()}
      />
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              setWholeRowsCellColor={(rowData) => (rowData.type === 'service' ? 'isService' : '')}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              expander={true}
              isClientSideGrid={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {productQtyEdit.open && (
        <ProductQtyDialog
          onClose={() => {
            setProductQtyEdit({ open: false, data: null });
          }}
          rowData={productQtyEdit.data}
          handleSave={(data) => {
            handleUpdateQty(data)
          }}
          loading={isSubmitting}
        />
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete this item(s)`}
          onClose={() => {
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {completeConfirmBox && (
        <ConfirmationDialog
          open={completeConfirmBox}
          okBtnLoading={isCompleting}
          message={`Are you sure you want to Auto Complete this Work Order(s)`}
          onClose={() => {
            setCompleteConfirmBox(false);
          }}
          onOk={() => {
            let ids = [];
            if (autoCompleteData && autoCompleteData.length > 0) {
              autoCompleteData.forEach((d) => {
                if (d?.workOrderId) {
                  if (!ids?.includes(d?.workOrderId)) {
                    ids.push(d?.workOrderId);
                  }
                }
              });
            }
            if (autoCompleteData?.every((e) => e.type === MATERIAL_TYPE.package && e?.workOrderType === WORK_ORDER_TYPE.assemblyOrder)) {
              setOpenSerializedPackageDialog({ open: true, ids: ids });
            } else {
              handleAutoComplete(ids);
            }
          }}
        />
      )}

      {openSerializedPackageDialog.open && (
        <PackageNumberDialog
          onClose={() => {
            setOpenSerializedPackageDialog({ open: false, ids: [] });
            setCompleteConfirmBox(false);
          }}
          assemblyOrderId={assemblyOrderData._id}
          workOrderIds={openSerializedPackageDialog.ids}
          onSuccess={(_data) => {
            setCompleteConfirmBox(false);
            handleAutoComplete(openSerializedPackageDialog.ids, _data);
          }}
          isSubmitting={isCompleting}
        />
      )}

      {addServicesDialog.open && !addServicesDialog.new && (
        <AssignServiceDialog
          handleClose={() => setAddServicesDialog({ open: false, new: false })}
          onSuccess={(data) => {
            handleAddService(
              data?.map((e) => {
                return { _id: e._id, qty: parseInt(e?.qty) || 1 };
              })
            );
          }}
          isSubmitting={isSubmitting}
          hideQty={true}
        />
      )}

      {addServicesDialog.open && addServicesDialog.new && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={null}
          onClose={() => setAddServicesDialog({ open: false, new: false })}
          onSuccess={({ data }) => {
            handleAddService([{ _id: data._id, qty: 1 }]);
          }}
          isRedirectToDetailPage={false}
        />
      )}

      {userAssignDialog.open && (
        <AssignTechniciansDialog
          warehouse={assemblyOrderData?.warehouse?.optionValue}
          workOrderData={selectedRecords
            .filter((e) => e.type === MATERIAL_TYPE.service)
            .map((d) => {
              return {
                uniqueId: d?.uniqueId,
                workOrderId: d?.workOrder?._id
              };
            })}
          reference="service"
          assignedUsers={userAssignDialog.assignedUsers}
          handleClose={() => {
            setUserAssignDialog({ open: false, assignedUsers: [] });
          }}
          handleSucess={() => {
            fetchData();
            setUserAssignDialog({ open: false, assignedUsers: [] });
          }}
          competencies={uniq(
            flatMap(selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.map((e) => e?.serviceDetail?.competencies || []))
          )}
        />
      )}

      {workStationAssignDialog.open && (
        <AssignWorkStationDialog
          warehouse={assemblyOrderData?.warehouse?.optionValue}
          workOrderData={selectedRecords
            .filter((e) => e.type === MATERIAL_TYPE.service)
            .map((d) => {
              return {
                uniqueId: d?.uniqueId,
                workOrderId: d?.workOrderId
              };
            })}
          workStations={workStationAssignDialog.assignedWorkStations}
          handleClose={() => {
            setWorkStationAssignDialog({ open: false, assignedWorkStations: [] });
          }}
          handleSucess={() => {
            fetchData();
            setWorkStationAssignDialog({ open: false, assignedWorkStations: [] });
          }}
        />
      )}

      {consumablesDialog.open && (
        <AssignProductDialog
          handleCloseDialog={() => setConsumablesDialog({ open: false, ids: [], data: null })}
          ids={consumablesDialog.ids}
          onSuccess={(rows) => {
            handleAddConsumables(rows, consumablesDialog?.data ? consumablesDialog?.data : selectedRecords);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {arrangeView && (
        <ArrangeView
          data={
            flattenArray(dataRows)
              ?.filter((e) => e.type === MATERIAL_TYPE.service && e?.workOrderId === selectedRecords[0]?.workOrderId)
              ?.map((d) => {
                return { _id: d?.uniqueId, name: d?.serviceDetail?.serviceName, order: d?.order, preWork: d?.preWork };
              }) || []
          }
          title={'Arrange Services'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={(data) => handleArrangeUpdate(data, selectedRecords[0]?.workOrderId)}
          loading={false}
        />
      )}

      {showDrawingDialog.open && (
        <DiagramDialog
          referenceId={showDrawingDialog?.data?.workOrder?._id}
          handleClose={() => {
            setShowDrawingDialog({ open: false, data: null });
          }}
          referenceLabel={showDrawingDialog?.data?.detail}
          uniqueId={[MATERIAL_TYPE.service, MATERIAL_TYPE.product]?.includes(showDrawingDialog?.data?.type) ? showDrawingDialog?.data?.uniqueId : null}
          resource={ACTIVITY_RESOURCE.workOrder}
          attachmentType={showDrawingDialog?.data?.type === MATERIAL_TYPE.package ? ATTACHMENT_TYPE.drawing : null}
          showMaterialFilter={[MATERIAL_TYPE.service, MATERIAL_TYPE.product]?.includes(showDrawingDialog?.data?.type) ? false : true}
        />
      )}

    </>
  );
};

export default WorkOrder;

const ActionButtonMenuItems = ({
  selectedRecords,
  allowedToEdit,
  permissions,
  user,
  checkUniqWorkOrder,
  setDeleteData,
  setShowDeleteConfirmBox,
  setAutoCompleteData,
  setCompleteConfirmBox,
  checkParentProduct,
  setAddServicesDialog,
  setUserAssignDialog,
  setWorkStationAssignDialog,
  dataRows,
  setConsumablesDialog,
  setArrangeView,
  setShowDrawingDialog,
  updateWorkOrdetStatus
}) => {
  const checkUniqWorkOrderType = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (selectedRecords?.find((e) => !e?.workOrderType)) {
      return true;
    } else if (
      uniq(
        map(
          selectedRecords?.filter((r) => r?.workOrderType),
          'workOrderType'
        )
      ).length === 1
    ) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <>
      <MenuItem
        disabled={!checkParentProduct(selectedRecords)}
        onClick={() => {
          setAddServicesDialog({ open: true, new: false });
        }}
      >
        Add Existing Services
      </MenuItem>
      <MenuItem
        disabled={!checkParentProduct(selectedRecords)}
        onClick={() => {
          setAddServicesDialog({ open: true, new: true });
        }}
      >
        Add New Service
      </MenuItem>
      <MenuItem
        disabled={selectedRecords?.filter((d) => d.type === MATERIAL_TYPE.service)?.length ? false : true}
        onClick={() => {
          const uniqueAssignedUsers: any = flatMap(
            selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.map((e) => e?.assignedUsers || [])
          );
          const assignedUsers = [];
          uniqueAssignedUsers?.forEach((e: any) => {
            if (!assignedUsers?.find((ele) => ele.optionValue === e.optionValue)) {
              assignedUsers.push(e);
            }
          });
          setUserAssignDialog({ open: true, assignedUsers: assignedUsers });
        }}
      >
        Assign Technician
      </MenuItem>
      {allowedToEdit && permissions?.workStations?.isRead && (
        <MenuItem
          disabled={selectedRecords?.filter((d) => d.type === MATERIAL_TYPE.service)?.length > 0 ? false : true}
          onClick={() => {
            const uniqueAssignedWorkStations: any = flatMap(
              selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.map((e) => e?.assignedWorkStations || [])
            );
            const assignedWorkStations = [];
            uniqueAssignedWorkStations?.forEach((e: any) => {
              if (!assignedWorkStations?.find((ele) => ele.optionValue === e.optionValue)) {
                assignedWorkStations.push(e);
              }
            });
            setWorkStationAssignDialog({ open: true, assignedWorkStations: assignedWorkStations });
          }}
        >
          Assign Work Station
        </MenuItem>
      )}
      {!user?.user?.brandPolicy?.workOrderConsumableHide && (
        <MenuItem
          disabled={
            selectedRecords?.filter((d) => [MATERIAL_TYPE.package, MATERIAL_TYPE.service]?.includes(d.type))?.length > 0 && checkUniqWorkOrder()
              ? false
              : true
          }
          onClick={() => {
            var ids = [];
            if (selectedRecords?.find((e) => e.type === MATERIAL_TYPE.package)) {
              const packages = selectedRecords?.find((e) => e.type === MATERIAL_TYPE.package);
              ids = flattenArray(dataRows)
                ?.filter((e) => e?.workOrderId === packages?.workOrderId)
                ?.map((e) => e.materialId);
            } else {
              const serviceIds = selectedRecords?.filter((d) => d?.type === MATERIAL_TYPE.service)?.map((e) => e._id);
              ids = flattenArray(dataRows)
                ?.filter((e) => serviceIds?.includes(e?.parentId))
                ?.map((e) => e.materialId);
            }
            setConsumablesDialog({ open: true, ids: ids, data: null });
          }}
        >
          Add Products/Consumables
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          setArrangeView(true);
        }}
        disabled={
          selectedRecords?.length &&
            selectedRecords?.find((d) => d.type === MATERIAL_TYPE.service || checkParentProduct([d], d?.parentId)) &&
            selectedRecords?.every((d) => d.workOrderId === selectedRecords[0]?.workOrderId)
            ? false
            : true
        }
      >
        Arrange Services
      </MenuItem>
      {selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.package && e?.status === WORK_ORDER_STATUS.draft)?.length > 0 &&
        <MenuItem
          onClick={() => {
            updateWorkOrdetStatus()
          }}
        >
          Ready to Build
        </MenuItem>}
      <MenuItem
        onClick={() => {
          setAutoCompleteData(selectedRecords?.filter((e) => e?.canAutoCompleteWorkOrder));
          setCompleteConfirmBox(true);
        }}
        disabled={
          checkUniqWorkOrderType() &&
            selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.package)?.length > 0 &&
            selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.package).every((e) => e?.canAutoCompleteWorkOrder)
            ? false
            : true
        }
      >
        Auto Complete Work Order(s)
      </MenuItem>
      <MenuItem
        disabled={
          checkUniqWorkOrder() &&
            (selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.length === 1 ||
              selectedRecords?.filter((e) => checkParentProduct([e], e?.parentId))?.length === 1)
            ? false
            : true
        }
        onClick={() => {
          const parentProduct = selectedRecords?.find((e) => checkParentProduct([e], e?.parentId));
          if (parentProduct) {
            setShowDrawingDialog({ open: true, data: parentProduct });
          } else {
            const service = selectedRecords?.find((e) => e.type === MATERIAL_TYPE.service);
            setShowDrawingDialog({ open: true, data: service });
          }
        }}
      >
        Upload Attachments
      </MenuItem>
      <MenuItem
        onClick={() => {
          setDeleteData(selectedRecords?.filter((e) => e?.canDelete));
          setShowDeleteConfirmBox(true);
        }}
        disabled={selectedRecords?.some((e) => e?.canDelete) ? false : true}
      >
        Delete
      </MenuItem>
    </>
  );
};

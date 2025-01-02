import { Box, IconButton, MenuItem, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Delete } from '@mui/icons-material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import Autocomplete from '@mui/material/Autocomplete';
import { capitalize, map, orderBy, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { AutoCompleteWorkOrder, PostWorkIcon, PreWorkIcon } from 'src/assets/svg/svgIcons';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { flattenArray } from 'src/constants/columns';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import AssetDetailsChangeDialog from 'src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog';
import { generateAutoCompleteSteps, nextButtonStep } from 'src/pages/RepairOrder/walkmeSteps';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import DiagramDialog from 'src/pages/WorkOrder/Diagram/DiagramDialog';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import {
  ASSET_STATUS,
  CHILD_RESOURCE,
  MATERIAL_SUB_TYPE,
  MATERIAL_TYPE,
  REPAIR_ORDER_STATUS,
  REPAIR_ORDER_TYPE,
  WORKORDER_SERVICE_STATUS,
  WORK_ORDER_STATUS,
  asyncForEach,
  checkIsAllowedToDelete,
  repairOrder,
  sidebarResource,
  workOrder
} from '../../../constants/helpers';
import UpdateWorkOrderDialog from './UpdateWorkOrderDialog';

const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const dataAdded = {
  nextButtonAdded: false,
  autoCompleteDataAdded: false
};

const WorkOrder = ({
  fetchRepairOrderData,
  stepNames,
  repairOrderData,
  setNextStep,
  stepFullScreen,
  allowedToEdit,
  isPostWorkService,
  setCurrentStep,
  createNewVersionQuote,
  currentStepName = 'Work Order',
  resourcePolicy
}) => {
  const renderedFrom = 'repair_order_workorder';
  const toastConfig = useContext(CustomToastContext);
  const walkmeInstance = useGetWalkmeInstance();
  const { setWalkmeData } = useSetWalkmeData();
  const { id } = useParams();

  const {
    state: { user, permissions }
  } = useData();

  const [columns, setColumns] = useState(null);
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [autoCompleteData, setAutoCompleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isCompleting, setCompleting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [completeConfirmBox, setCompleteConfirmBox] = useState(false);
  const [addServicesDialog, setAddServicesDialog] = useState({ open: false, new: false });
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);
  const [arrangeView, setArrangeView] = useState({ open: false, workOrderIds: [], currentIndex: 0 });
  const [isUpdating, setUpdating] = useState(false);
  const [allAssignedUsers, setAllAssignedUsers] = useState([]);
  const [allAssignedWorkStations, setAllAssignedWorkStations] = useState([]);
  const [updateDialog, setUpdateDialog] = useState({ open: false, data: null });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, ids: [], data: null });
  const [isSubmitting, setSubmitting] = useState(false);
  const [reviseQuotation, setReviseQuotation] = useState(false);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedServiceOption, setSelectedServiceOption] = useState(null);
  const [showServiceActionConfirmBox, setShowServiceActionConfirmBox] = useState({ open: false, action: '' });
  const [showCloseReopenConfirmation, setShowCloseReopenConfirmation] = useState({ open: false, type: '' });
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, _ids: null });
  const [showDrawingDialog, setShowDrawingDialog] = useState({ open: false, workOrder: null });

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.serviceMaster}`)
      .then(({ data: { data } }) => {
        setServiceOptions(data[sidebarResource.serviceMaster]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  // useEffect(() => {
  //   setWalkmeData([]);
  // }, []);

  const handleAddWalkmeData = (rows: any[]) => {
    if (!rows || !rows.length) return;
    if (currentStepName === 'Work Order') {
      if (walkmeInstance && walkmeInstance.type === 'flow' && !dataAdded.nextButtonAdded) {
        dataAdded.nextButtonAdded = true;
        const newSteps = [nextButtonStep(true)];
        walkmeInstance.instance.push(newSteps);
        walkmeInstance.handleNext();
      } else {
        setWalkmeData([]);
      }
    } else {
      if (
        rows[0]?.type === MATERIAL_TYPE.serializedAsset &&
        walkmeInstance &&
        walkmeInstance.type === 'flow' &&
        rows[0]?.canAutoCompleteWorkOrder &&
        !dataAdded.autoCompleteDataAdded
      ) {
        dataAdded.autoCompleteDataAdded = true;
        const steps = generateAutoCompleteSteps(false, renderedFrom).steps;
        const newSteps = [...steps, nextButtonStep(true)];
        walkmeInstance.instance.push(newSteps);
        walkmeInstance.handleNext();
      }
      if (rows[0]?.type === MATERIAL_TYPE.serializedAsset && rows[0]?.canAutoCompleteWorkOrder) {
        setWalkmeData([generateAutoCompleteSteps(false, renderedFrom)]);
      }
    }
  };

  useEffect(() => {
    fetchFields();
    fetchData();
    fetchPolicy();
  }, [repairOrderData]);

  useEffect(() => {
    const assignedUsersArrays = selectedRecords?.filter((product) => product?.assignedUsers).map((product) => product?.assignedUsers);
    const assignedUsers = assignedUsersArrays?.flat();

    const uniqueAssignedUsers = assignedUsers.filter(
      (obj, index, self) => index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(obj))
    );
    setAllAssignedUsers(uniqueAssignedUsers);

    const assignedWorkStationsArrays = selectedRecords
      ?.filter((product) => product?.assignedWorkStations)
      .map((product) => product?.assignedWorkStations);
    const assignedWorkStations = assignedWorkStationsArrays?.flat();

    const uniqueAssignedWorkStations = assignedWorkStations.filter(
      (obj, index, self) => index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(obj))
    );
    setAllAssignedWorkStations(uniqueAssignedWorkStations);
  }, [selectedRecords]);

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAsset}`);
      if (data) {
        setAssetPolicyData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.workOrderService, repairOrderData?.currency, allowedToEdit);
    const newColumns = generateColumns(renderedFrom, data, null, false, repairOrderData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'type',
        Header: 'Type',
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <p className="text-truncate">{row.original.type === MATERIAL_TYPE.serializedAsset ? 'Asset' : capitalize(row.original.type)}</p>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        width: 250,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.type === 'service' && row?.original?.status !== WORKORDER_SERVICE_STATUS.completed ? (
              <p
                onClick={() => {
                  openMaterial(row);
                }}
                className="link text-truncate"
                title={row.original?.detail}
              >
                {row.original?.detail}
              </p>
            ) : (
              <p className="text-truncate">{row.original?.detail}</p>
            )}

            {user?.user?.brandPolicy?.servicePrePost && row.original.type === 'service' && (
              <>
                {row?.original?.preWork ? (
                  <HtmlTooltip title="Pre Work Service">
                    <span>
                      <PreWorkIcon />
                    </span>
                  </HtmlTooltip>
                ) : (
                  <HtmlTooltip title="Post Work Service">
                    <span>
                      <PostWorkIcon />
                    </span>
                  </HtmlTooltip>
                )}
              </>
            )}
            {row.original?.subRows?.length ? <span>{`(${row.original?.subRows?.length})`}</span> : null}
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === MATERIAL_TYPE.service) {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.product) {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                } else {
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
        accessor: 'workOrderNumber',
        Header: 'Work Order',
        width: 200,
        Cell: ({ row }) =>
          row.original['workOrder'] ? (
            <div className="d-flex align-items-center gap-2">
              <p className="text-truncate">{row.original['workOrderNumber']}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes?.workOrderDetail?.path}/${row.original['workOrder']._id}`);
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
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        Cell: ({ row }) =>
          row.original.productName ? (
            <div className="d-flex align-items-center gap-2">
              <p className="text-truncate" title={row.original?.productName}>
                {row.original.productName}
              </p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row.original?.productId}`);
                }}
              ></IconButton>
            </div>
          ) : (
            <NoDataCell />
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
        accessor: 'status',
        Header: 'Status',
        Cell: ({ row }) => (row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'serviceStatus',
        Header: 'Result',
        Cell: ({ row }) => (row?.original['serviceStatus'] ? <p> {row?.original?.serviceStatus}</p> : <NoDataCell />)
      },
      {
        accessor: 'assignedUsers',
        Header: 'Assigned Technician',
        disableFilters: true,
        Cell: ({ row }) => (
          <div>
            {row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
              row?.original['assignedUsers']?.map((e, i) => {
                return i === row?.original['assignedUsers'].length - 1 ? (
                  <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`} rel="noreferrer">
                    {e?.optionLabel}
                  </a>
                ) : (
                  <a className="link text-truncate" target="_blank" href={`${routes.userDetail.path}/${e.optionValue}`} rel="noreferrer">
                    {e?.optionLabel},{' '}
                  </a>
                );
              })
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        Cell: ({ row }) => (row.original['qty'] ? <p> {row?.original?.qty}</p> : <NoDataCell />)
      }
    ];

    if (permissions?.workStations?.isRead) {
      const workStationColumn = {
        accessor: 'assignedWorkStations',
        Header: 'Assigned Work Station',
        disableFilters: true,
        Cell: ({ row }) => (
          <div>
            {row?.original['assignedWorkStations'] && row?.original['assignedWorkStations']?.length ? (
              row?.original['assignedWorkStations']?.map((e, i) => {
                return i === row?.original['assignedWorkStations'].length - 1 ? (
                  <a
                    className="link text-truncate [flex-grow:0_!important]"
                    target="_blank"
                    href={`${routes.workStationsDetail.path}/${e.optionValue}`}
                    rel="noreferrer"
                  >
                    {e?.optionLabel}
                  </a>
                ) : (
                  <>
                    <a
                      className="link text-truncate [flex-grow:0_!important]"
                      target="_blank"
                      href={`${routes.workStationsDetail.path}/${e.optionValue}`}
                      rel="noreferrer"
                    >
                      {e?.optionLabel},
                    </a>
                    &nbsp;
                  </>
                );
              })
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      };
      coloum.push(workStationColumn);
    }
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.type === MATERIAL_TYPE.service && (
              <HtmlTooltip title="Edit">
                <IconButton
                  size="small"
                  aria-label="Edit"
                  onClick={() => {
                    openMaterial(row);
                  }}
                  disabled={row?.original?.status === WORKORDER_SERVICE_STATUS?.completed ? true : false}
                >
                  <EditIcon fontSize="small" color={row?.original?.status === WORKORDER_SERVICE_STATUS?.completed ? 'disabled' : 'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row?.original?.type === MATERIAL_TYPE.serializedAsset && (
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
                  <AutoCompleteWorkOrder size={20} className={`${row?.original?.canAutoCompleteWorkOrder ? 'text-[var(--primary-text)]' : ''}`} />
                </IconButton>
              </HtmlTooltip>
            )}
            {row?.original?.workOrder &&
              [MATERIAL_TYPE.service, MATERIAL_TYPE.serializedAsset]?.includes(row?.original?.type) &&
              !user?.user?.brandPolicy?.workOrderConsumableHide && (
                <HtmlTooltip title="Add Products/Consumables">
                  <IconButton
                    size="small"
                    aria-label="Add Products/Consumables"
                    onClick={() => {
                      var ids = [];
                      if (row?.original?.type === MATERIAL_TYPE.serializedAsset) {
                        ids = flattenArray(dataRows)
                          ?.filter((e) => e?.workOrder?._id === row?.original?.workOrder?._id)
                          ?.map((e) => e.materialId);
                      } else {
                        ids = flattenArray(dataRows)
                          ?.filter((e) => row?.original?._id === e?.parentId)
                          ?.map((e) => e.materialId);
                      }
                      setConsumablesDialog({ open: true, ids: ids, data: [row?.original] });
                    }}
                  >
                    <AddCircleOutlineIcon
                      fontSize="small"
                      // color={row?.original?.workOrder?.status !== WORK_ORDER_STATUS.completed ? 'primary' : 'disabled'}
                      color={'primary'}
                    />
                  </IconButton>
                </HtmlTooltip>
              )}
            <HtmlTooltip title="Delete">
              <span>
                <IconButton
                  disabled={row?.original?.canDelete ? false : true}
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setDeleteData([row.original]);
                    setShowConfirmBox(true);
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

  const openMaterial = (row) => {
    setUpdateDialog({
      open: true,
      data: row.original
    });
    setIsBulkEdit(false);
  };

  const handleWorkOrderDelete = (ids) => {
    axiosInstance()
      .put(`${workOrder.api}/remove`, { ids: ids })
      .then(({ data }) => {
        setDeleting(false);
        setShowConfirmBox(false);
        setCurrentStep((prevStep) => {
          const newStep = prevStep - 1;
          dynamicFormUpdateProcessStatus(sidebarResource.repairOrder, stepNames[newStep], id);
          return newStep;
        });

        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((err) => {
        setShowConfirmBox(false);
        setDeleting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = async () => {
    if (deleteData?.some((e) => [MATERIAL_TYPE.product, MATERIAL_TYPE.service, MATERIAL_TYPE.package]?.includes(e.type))) {
      setDeleting(true);

      const records: any = [];

      deleteData?.forEach((data) => {
        const index = records?.findIndex((d) => d?.workOrder === data?.workOrder?._id);
        if (index >= 0) {
          records[index].ids = [...records[index].ids, data?._id];
        } else {
          records.push({
            workOrder: data?.workOrder?._id,
            ids: [data?._id]
          });
        }
      });
      await axiosInstance().put(`${workOrder.api}/${repairOrderData?._id}/material/remove`, records);
      if (
        deleteData?.filter((e) => [MATERIAL_TYPE.service, MATERIAL_TYPE.package]?.includes(e.type))?.length &&
        isPostWorkService &&
        repairOrderData?.type === REPAIR_ORDER_TYPE.external
      ) {
        setReviseQuotation(true);
      }

      setDeleting(false);
      setShowConfirmBox(false);
      fetchData();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Deleted Successfully'
      });
    } else {
      if (deleteData?.filter((e: any) => !e?.subRows?.length && e?.serviceStatus !== WORK_ORDER_STATUS.completed)?.length) {
        handleWorkOrderDelete(
          deleteData?.filter((e: any) => !e?.subRows?.length && e?.serviceStatus !== WORK_ORDER_STATUS.completed)?.map((e) => e.workOrder?._id)
        );
      }
    }
  };

  const checkAssetPolicy = (status) => {
    let result: any = null;
    const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === status);
    if (statusPolicy) {
      if (statusPolicy?.products && statusPolicy?.products?.length > 0) {
        const assetIds = autoCompleteData?.filter((r) => statusPolicy?.products?.includes(r?.productId))?.map((a) => a?.materialId);
        if (assetIds && assetIds?.length > 0) {
          result = { statusPolicy: statusPolicy, assetIds: assetIds };
        }
      } else {
        result = { statusPolicy: statusPolicy, assetIds: autoCompleteData?.map((a) => a?.materialId) };
      }
    }
    return result;
  };

  const handleAutoComplete = (assetData = null) => {
    let ids = [];
    if (autoCompleteData && autoCompleteData.length > 0) {
      autoCompleteData.forEach((d) => {
        if (d?.canAutoCompleteWorkOrder) {
          ids.push(d?.workOrder?._id);
        }
      });
    }
    setCompleting(true);
    if (ids.length) {
      axiosInstance()
        .put(`${repairOrder.api}/${repairOrderData._id}/work-order/auto-complete`, {
          workOrders: ids,
          assets: assetData ? assetData : []
        })
        .then(({ data }) => {
          setCompleting(false);
          setCompleteConfirmBox(false);
          setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null });
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          fetchRepairOrderData();
        })
        .catch((err) => {
          setCompleteConfirmBox(false);
          setCompleting(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      setCompleting(false);
      setCompleteConfirmBox(false);
      fetchData();
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    if (selectedServiceOption) {
      setSelectedServiceOption(null);
    }
    dispatch({ type: 'selection', selectedRecords: [] });
    setNextStep(false);
    var data: any = [];

    const response = await axiosInstance().get(`${repairOrder.api}/${repairOrderData._id}/work-order/service`);
    data = response?.data?.data;

    const rows = data.material?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset);

    createWorkorderService(rows);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === MATERIAL_TYPE.service
        ? parent?.serviceDetail?.serviceName
        : parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productName
          : parent.type === MATERIAL_TYPE.serializedAsset
            ? parent?.serializedAssetDetail?.assetNumber
            : parent?.packageDetail?.packageName
        }`;
      parent.description =
        parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productDescription || ''
            : parent.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === MATERIAL_TYPE.serializedAsset
                ? parent?.serializedAssetDetail?.product?.productDescription || ''
                : '';
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.qty = parent.qty;
      parent.status = `${parent.type === MATERIAL_TYPE.service
        ? parent.serviceDetail?.status
        : parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.status
          : parent.type === MATERIAL_TYPE.serializedAsset
            ? parent.serializedAssetDetail.status
            : parent.packageDetail?.status
        }`;
      parent.workOrderNumber = parent?.workOrder?.workOrderNumber;

      parent.hideSelection = false;
      parent.workOrderStatus = parent?.workOrder?.status;
      if (parent.workOrderStatus === WORK_ORDER_STATUS.completed) {
        parent.serviceStatus = parent.workOrderStatus;
      }
      parent.subRows = generateNestedData(data.material, parent);
      if (
        parent.subRows?.filter((e) => e.type === MATERIAL_TYPE.service)?.every((e) => e.status === WORKORDER_SERVICE_STATUS.pending) &&
        ![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(parent?.workOrder?.status)
      ) {
        parent.canAutoCompleteWorkOrder = true;
      }
      parent.canDelete = false;
      if (
        parent?.subRows?.length === 0 &&
        parent?.workOrder &&
        permissions?.workOrder?.isDelete &&
        checkIsAllowedToDelete(user, sidebarResource.workOrder, parent?.workOrder?.owner) &&
        ![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(parent.workOrderStatus)
      ) {
        parent.canDelete = true;
      }
    });

    if (isPostWorkService || (!repairOrderData.addQuotationStep && !user?.user?.brandPolicy?.repairOrderPrice)) {
      if (rows?.some((e) => e.type === MATERIAL_TYPE.serializedAsset && e.serviceStatus === WORK_ORDER_STATUS.completed)) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
    } else {
      if (repairOrderData.addQuotationStep || user?.user?.brandPolicy?.repairOrderPrice) {
        if (
          data?.material?.filter(
            (e) =>
              e?.type === MATERIAL_TYPE.service &&
              e?.serviceDetail?.preWork &&
              [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress]?.includes(e?.status)
          )?.length
        ) {
          setNextStep(false);
        } else {
          setNextStep(true);
        }
      } else {
        if (rows?.every((e) => e.type === MATERIAL_TYPE.serializedAsset && e.serviceStatus === WORK_ORDER_STATUS.completed)) {
          setNextStep(true);
        } else {
          setNextStep(false);
        }
      }
    }
    handleAddWalkmeData(rows);
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id)?.sort((a, b) => b?.serviceDetail?.preWork - a?.serviceDetail?.preWork);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === MATERIAL_TYPE.service ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productName
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? _subRow?.serializedAsset?.assetNumber
              : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.preWork = _subRow.type === MATERIAL_TYPE.service ? _subRow?.serviceDetail?.preWork : false;
      _subRow.workOrder = parent?.workOrder;
      _subRow.workOrderNumber = parent?.workOrder?.workOrderNumber;
      _subRow.workOrderStatus = parent?.workOrderStatus;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === MATERIAL_TYPE.service ? serviceIndex++ : productIndex++;
      _subRow.isValid = true;

      _subRow.canDelete = false;
      if (_subRow.type === MATERIAL_TYPE.product) {
        _subRow.canDelete = _subRow?.consumedQty || _subRow?.requestedQty ? false : true;
      }
      if (![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(_subRow?.workOrder?.status)) {
        if (_subRow.type === MATERIAL_TYPE.service) {
          _subRow.canDelete = _subRow?.status === WORKORDER_SERVICE_STATUS.pending ? true : false;
        }
        if (_subRow.type === MATERIAL_TYPE.package) {
          _subRow.canDelete = _subRow.subRows.length === 0 ? true : false;
        }
        if (_subRow.subRows?.length && _subRow.subRows?.find((e) => !e?.canDelete)) {
          _subRow.canDelete = false;
        }
      }
      _subRow.hideSelection = false;
    });
    if (subRows.length === 0 && parent.type === MATERIAL_TYPE.package) {
      parent.isValid = false;
    }
    if (parent.type === MATERIAL_TYPE.package) {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return orderBy(subRows, ['type'], ['desc']);
  };

  const handleAddService = (ids) => {
    setSubmitting(true);
    const allWorkOrders = selectedRecords?.map((e) => e.workOrder?._id);
    const data: any = {};
    data.serviceIds = ids;
    data.workOrderIds = [...new Set(allWorkOrders)];
    axiosInstance()
      .post(`${workOrder.api}/service`, data)
      .then(() => {
        setAddServicesDialog({ open: false, new: false });
        if (isPostWorkService && repairOrderData?.addQuotationStep) {
          setReviseQuotation(true);
        }
        fetchData();
        setSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setSubmitting(false);
      });
  };

  const createWorkorderService = (rows) => {
    const rowsForWorkorder = rows.filter((d) => d.type === MATERIAL_TYPE.serializedAsset && !d.workOrder);
    if (rowsForWorkorder.length > 0) {
      const data: any = [];
      rowsForWorkorder?.forEach((e) => {
        if (e?.serializedAssetDetail?.status !== ASSET_STATUS.lost) {
          data.push({
            _id: e?._id,
            product: e?.serializedAssetDetail?.product?.optionValue,
            serializedAsset: e?.serializedAssetDetail?._id
          });
        }
      });
      if (data?.length) {
        axiosInstance()
          .post(`${repairOrder.api}/${repairOrderData._id}/work-order/create-many`, data)
          .then(({ data }) => {
            fetchData();
            fetchRepairOrderData();
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      }
    }
  };

  const handleArrangeUpdate = (rows: any[], workOrderId) => {
    setSubmitting(true);
    rows?.forEach((e: any) => {
      delete e.name;
      delete e.preWork;
    });
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/order`, { data: rows || [] })
      .then(({ data }) => {
        if (arrangeView.currentIndex + 1 < arrangeView.workOrderIds.length) {
          setArrangeView((prev) => ({ ...prev, currentIndex: arrangeView.currentIndex + 1 }));
        } else {
          setArrangeView({ open: false, workOrderIds: [], currentIndex: 0 });
          fetchData();
        }
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          type: 'success'
        });
        setSubmitting(false);
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleSaveData = async (rows: any) => {
    setUpdating(true);
    const workOrderIds = uniq(rows?.map((e) => e?.workOrder?._id));
    try {
      await asyncForEach(workOrderIds, async (id: any) => {
        const data: any = JSON.parse(JSON.stringify(rows?.filter((e) => e?.workOrder?._id === id)));
        data?.forEach((e) => {
          delete e.workOrder;
        });
        await axiosInstance().put(`${workOrder.api}/${id}/material`, { material: data });
        setUpdating(false);
        fetchData();
        setIsBulkEdit(false);
        setUpdateDialog({ open: false, data: null });
      });
    } catch (error) {
      setUpdating(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleAddConsumables = (rows, records = []) => {
    setSubmitting(true);
    const data: any = [];
    const workOrderId: any = [];
    const asset = records?.filter((s) => s.type === MATERIAL_TYPE.serializedAsset);
    if (asset?.length > 0) {
      asset?.forEach((_asset) => {
        workOrderId.push(_asset?.workOrder?._id);
      });
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
      workOrderId.push(services[0]?.workOrder?._id);
      services?.forEach((s) => {
        rows?.forEach((e) => {
          data.push({
            product: e._id,
            qty: parseInt(e.qty) || 1,
            service: s?.serviceDetail?._id,
            subType: MATERIAL_SUB_TYPE.consumable,
            uniqueId: s?.uniqueId,
            stepId: null,
            parentId: s?._id
          });
        });
      });
    }
    axiosInstance()
      .post(`${workOrder.api}/id/consumable/add-multiple`, { products: data, workOrder: workOrderId })
      .then(({ data }) => {
        if (
          isPostWorkService &&
          repairOrderData?.status === REPAIR_ORDER_STATUS.quoteAccepted &&
          repairOrderData?.addQuotationStep &&
          repairOrderData?.addConsumablesQuotation
        ) {
          setReviseQuotation(true);
        }
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

  const checkUniqWorkOrder = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (uniq(map(selectedRecords, 'workOrder._id')).length === 1) {
      return true;
    } else {
      return false;
    }
  };

  const handleServiceSelect = (newValue) => {
    setSelectedServiceOption(newValue);
    if (newValue) {
      dispatch({ type: 'selection', selectedRecords: [] });
      setTimeout(() => {
        dispatch({
          type: 'selection',
          selectedRecords: flattenArray(dataRows)?.filter((_f) => [newValue?.optionValue].includes(_f?.serviceDetail?._id) && !_f?.hideSelection)
        });
      }, 100);
    } else {
      dispatch({ type: 'selection', selectedRecords: [] });
    }
  };

  const isDisabledCompleteService = () => {
    const records = selectedRecords?.filter(
      (e) =>
        e?.type === MATERIAL_TYPE.service &&
        ![WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(e?.workOrderStatus) &&
        [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress]?.includes(e?.status)
    );
    if (records?.length === 0) {
      return true;
    }
    if (records?.length !== selectedRecords?.filter((e) => e?.type === MATERIAL_TYPE.service)?.length) {
      return true;
    }
    const data = [];
    records?.forEach((record) => {
      let disabled = false;
      if (record?.assignedUsers?.length > 0 && !allowedToEdit) {
        if (!record?.assignedUsers?.map((a) => a?.optionValue).includes(user?.user?._id)) {
          disabled = true;
        }
      }
      if (!disabled) {
        if (
          dataRows
            ?.find((d) => d?._id === record?.parentId)
            ?.subRows?.filter((s) => s?.order < record?.order)
            ?.every((r) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(r?.status))
        ) {
          data.push(record);
        }
      }
    });
    return !(data?.length === records?.length);
  };

  const handleCompleteService = () => {
    setSubmitting(true);
    var records = selectedRecords?.filter((e) => e?.type === MATERIAL_TYPE.service);
    if (showServiceActionConfirmBox.action === 'revert') {
      records = selectedRecords?.filter((e) => e?.type === MATERIAL_TYPE.service && e.status !== WORKORDER_SERVICE_STATUS.pending);
    }
    const data = records?.map((e) => ({
      workOrder: e?.workOrder?._id,
      service: e?.serviceDetail?._id,
      uniqueId: e?.uniqueId,
      status: showServiceActionConfirmBox.action
    }));
    axiosInstance()
      .put(`${workOrder.api}/service/work-orders-services-status`, data)
      .then(({ data }) => {
        setSubmitting(false);
        setShowServiceActionConfirmBox({ open: false, action: '' });
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((err) => {
        setSubmitting(false);
        setShowServiceActionConfirmBox({ open: false, action: '' });
        toastConfig.setToastConfig(err);
      });
  };

  const closeWorkOrders = () => {
    setSubmitting(true);
    const ids = selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset && e?.canComplete)?.map((e) => e?.workOrder?._id);
    const data: any = { status: WORK_ORDER_STATUS.completed, ids: ids };
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
        setShowCloseReopenConfirmation({ open: false, type: '' });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const reOpenWorkOrders = () => {
    setSubmitting(true);
    const ids = selectedRecords
      ?.filter((d) => d.type === MATERIAL_TYPE.serializedAsset && d?.workOrderStatus === WORK_ORDER_STATUS.completed)
      ?.map((e) => e?.workOrder?._id);
    axiosInstance()
      .put(`${workOrder.api}/re-open`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setSubmitting(false);
        setShowCloseReopenConfirmation({ open: false, type: '' });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
        setShowCloseReopenConfirmation({ open: false, type: '' });
      });
  };

  const leftSideContents = () => {
    return (
      <>
        {allowedToEdit && (
          <Autocomplete
            className="min-w-[200px] max-w-[400px] flex-grow"
            options={serviceOptions}
            getOptionLabel={(option) => option?.optionLabel || ''}
            size="small"
            renderInput={(params) => <TextField {...params} margin="none" size={'small'} fullWidth label="Select Service" variant="outlined" />}
            value={selectedServiceOption}
            onChange={(event: any, newValue: any) => {
              handleServiceSelect(newValue);
            }}
          />
        )}
      </>
    );
  };

  const isWorkOrderCompleted = (data) => {
    return data?.some((e) => [WORK_ORDER_STATUS.completed, WORK_ORDER_STATUS.onHold]?.includes(e.workOrderStatus));
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {!resourcePolicy?.hideAddExistingServices && (
          <MenuItem
            disabled={selectedRecords?.every((d) => d?.workOrder) && !isWorkOrderCompleted(selectedRecords) ? false : true}
            onClick={() => {
              setAddServicesDialog({ open: true, new: false });
            }}
            id="add-existing-services"
          >
            Add Existing Services
          </MenuItem>
        )}
        {!resourcePolicy?.hideAddNewService && (
          <MenuItem
            disabled={selectedRecords?.every((d) => d?.workOrder) && !isWorkOrderCompleted(selectedRecords) ? false : true}
            onClick={() => {
              setAddServicesDialog({ open: true, new: true });
            }}
            id="add-new-services"
          >
            Add New Service
          </MenuItem>
        )}
        {!resourcePolicy?.hideAssignTechnician && (
          <MenuItem
            disabled={
              selectedRecords?.filter((d) => d.type === MATERIAL_TYPE.service)?.length > 0 && !isWorkOrderCompleted(selectedRecords) ? false : true
            }
            onClick={() => {
              setUserAssignDialog(true);
            }}
            id="assign-technician"
          >
            Assign Technician
          </MenuItem>
        )}
        {!resourcePolicy?.hideAssignWorkstation && allowedToEdit && permissions?.workStations?.isRead && (
          <MenuItem
            disabled={
              selectedRecords?.filter((d) => d.type === MATERIAL_TYPE.service)?.length > 0 && !isWorkOrderCompleted(selectedRecords) ? false : true
            }
            onClick={() => {
              setWorkStationAssignDialog(true);
            }}
            id="assign-workstation"
          >
            Assign Work Station
          </MenuItem>
        )}
        {!resourcePolicy?.hideAddConsumables && !user?.user?.brandPolicy?.workOrderConsumableHide && (
          <MenuItem
            disabled={
              selectedRecords?.filter((d) => d?.workOrder && [MATERIAL_TYPE.serializedAsset, MATERIAL_TYPE.service]?.includes(d.type))?.length > 0
                ? false
                : true
            }
            onClick={() => {
              var ids = [];
              if (selectedRecords?.find((e) => e.type === MATERIAL_TYPE.serializedAsset)) {
                const asset = selectedRecords?.find((e) => e.type === MATERIAL_TYPE.serializedAsset);
                ids = flattenArray(dataRows)
                  ?.filter((e) => e?.workOrder?._id === asset?.workOrder?._id)
                  ?.map((e) => e.materialId);
              } else {
                const serviceIds = selectedRecords?.filter((d) => d?.type === MATERIAL_TYPE.service)?.map((e) => e._id);
                ids = flattenArray(dataRows)
                  ?.filter((e) => serviceIds?.includes(e?.parentId))
                  ?.map((e) => e.materialId);
              }
              setConsumablesDialog({ open: true, ids: ids, data: null });
            }}
            id="add-consumables"
          >
            Add Products/Consumables
          </MenuItem>
        )}
        {!resourcePolicy?.hideArrangeServices && (
          <MenuItem
            onClick={() => {
              const ids = selectedRecords.filter((s) => s.type === MATERIAL_TYPE.service).map((s) => s.workOrder._id);
              const uniqueIds = [...new Set(ids)];
              setArrangeView({ open: true, workOrderIds: uniqueIds, currentIndex: 0 });
            }}
            disabled={
              selectedRecords.filter((e) => e.type === MATERIAL_TYPE.service)?.length && !isWorkOrderCompleted(selectedRecords) ? false : true
            }
            id="arrange-services"
          >
            Arrange Services
          </MenuItem>
        )}
        {!resourcePolicy?.hideAutoCompleteWorkOrder && (
          <MenuItem
            onClick={() => {
              setAutoCompleteData(selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset));
              setCompleteConfirmBox(true);
            }}
            disabled={
              selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length &&
                selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.every((e) => e?.canAutoCompleteWorkOrder)
                ? false
                : true
            }
            id="auto-complete-work-order"
          >
            Auto Complete Work Order(s)
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setShowDrawingDialog({ open: true, workOrder: selectedRecords[0]?.workOrder?._id });
          }}
          id="upload-drawing"
        >
          Upload Drawing
        </MenuItem>
        {!resourcePolicy?.hideCompleteSkipRevertService && (
          <MenuItem
            onClick={() => {
              setShowServiceActionConfirmBox({ open: true, action: WORKORDER_SERVICE_STATUS.completed });
            }}
            disabled={isDisabledCompleteService()}
            id="complete-service"
          >
            Complete Service
          </MenuItem>
        )}
        {!resourcePolicy?.hideCompleteSkipRevertService && (
          <MenuItem
            onClick={() => {
              setShowServiceActionConfirmBox({ open: true, action: WORKORDER_SERVICE_STATUS.skipped });
            }}
            disabled={isDisabledCompleteService()}
            id="skip-service"
          >
            Skip Service
          </MenuItem>
        )}
        {!resourcePolicy?.hideCompleteSkipRevertService && (
          <MenuItem
            disabled={
              selectedRecords?.length &&
                selectedRecords?.some((e) => e.type === MATERIAL_TYPE.service && e.status !== WORKORDER_SERVICE_STATUS.pending) &&
                !isWorkOrderCompleted(selectedRecords)
                ? false
                : true
            }
            onClick={() => {
              setShowServiceActionConfirmBox({ open: true, action: 'Revert' });
            }}
            id="revert-service"
          >
            Revert Service
          </MenuItem>
        )}
        {selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length > 0 &&
          selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.every((e) => e?.canComplete) && (
            <MenuItem
              onClick={() => {
                setShowCloseReopenConfirmation({ open: true, type: 'Close' });
              }}
              id="close-work-order"
            >
              Close Work Order(s)
            </MenuItem>
          )}
        {selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length > 0 &&
          selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.every((e) => e?.canReopen) && (
            <MenuItem
              onClick={() => {
                setShowCloseReopenConfirmation({ open: true, type: 'Re-Open' });
              }}
              id="reopen-work-order"
            >
              Re-Open Work Order(s)
            </MenuItem>
          )}
        <MenuItem
          onClick={() => {
            setIsBulkEdit(true);
            setUpdateDialog({
              open: true,
              data: selectedRecords.filter((e) => e.type === MATERIAL_TYPE.service)
            });
          }}
          disabled={
            selectedRecords.filter((e) => e.type === MATERIAL_TYPE.service).length > 0 && !isWorkOrderCompleted(selectedRecords) ? false : true
          }
          id="bulk-edit"
        >
          Bulk Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteData(selectedRecords?.filter((e) => e?.canDelete));
            setShowConfirmBox(true);
          }}
          disabled={selectedRecords?.some((e) => e?.canDelete) ? false : true}
          id="delete"
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={false}
        // addButtonMenuItems
        // addButtonProps
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        leftSideContents={leftSideContents()}
        actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
        hasXpadding
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 12, sm: 12 }}>
          {columns ? (
            <Box zIndex={5} width={'100%'}>
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchData}
                setWholeRowsCellColor={(rowData) => (rowData.type === 'service' ? 'isService' : '')}
                hideSelection={allowedToEdit ? false : isPostWorkService ? false : true}
                hideAction={allowedToEdit ? false : isPostWorkService ? false : true}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                expander={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
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
              extraStaticFilter={!isPostWorkService ? [] : [{ field: 'preWork', term: false }]}
              isSubmitting={isSubmitting}
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
          {userAssignDialog && (
            <AssignUserDialog
              warehouse={repairOrderData?.warehouse?.optionValue}
              workOrderData={selectedRecords
                .filter((e) => e.type === 'service')
                .map((d) => {
                  return {
                    uniqueId: d?.uniqueId,
                    workOrderId: d?.workOrder?._id
                  };
                })}
              reference="service"
              assignedUsers={allAssignedUsers}
              handleClose={() => {
                setUserAssignDialog(false);
              }}
              handleSucess={() => {
                fetchData();
                setUserAssignDialog(false);
              }}
              competencies={[]}
            />
          )}
          {workStationAssignDialog && (
            <AssignWorkStationDialog
              warehouse={repairOrderData?.warehouse?.optionValue}
              workOrderData={selectedRecords
                .filter((e) => e.type === 'service')
                .map((d) => {
                  return {
                    uniqueId: d?.uniqueId,
                    workOrderId: d?.workOrder?._id
                  };
                })}
              workStations={allAssignedWorkStations}
              handleClose={() => {
                setWorkStationAssignDialog(false);
              }}
              handleSucess={() => {
                fetchData();
                setWorkStationAssignDialog(false);
              }}
            />
          )}
          {showConfirmBox && (
            <ConfirmationDialog
              okBtnLoading={isDeleting}
              open={showConfirmBox}
              message={`Are you sure you want to delete this item(s)`}
              onClose={() => {
                setShowConfirmBox(false);
              }}
              onOk={handleDelete}
            />
          )}
          {showServiceActionConfirmBox.open && (
            <ConfirmationDialog
              okBtnLoading={isSubmitting}
              open={showServiceActionConfirmBox.open}
              message={`Are you sure you want to ${showServiceActionConfirmBox.action === WORKORDER_SERVICE_STATUS.completed
                ? 'complete'
                : showServiceActionConfirmBox.action === WORKORDER_SERVICE_STATUS.skipped
                  ? 'skip'
                  : 'revert'
                } this Service(s)`}
              onClose={() => {
                setShowServiceActionConfirmBox({ open: false, action: '' });
              }}
              onOk={handleCompleteService}
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
                const statusPolicy = checkAssetPolicy(ASSET_STATUS.available);
                if (statusPolicy) {
                  setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy?.statusPolicy, _ids: statusPolicy?.assetIds });
                } else {
                  handleAutoComplete();
                }
              }}
            />
          )}

          {openAssetDataDialog.open && (
            <AssetDetailsChangeDialog
              ids={openAssetDataDialog._ids}
              statusPolicy={openAssetDataDialog.statusPolicy}
              setAssetsData={null}
              onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null })}
              onSuccess={(data) => {
                handleAutoComplete(data);
              }}
            />
          )}

          {reviseQuotation && (
            <ConfirmationDialog
              open={reviseQuotation}
              message={`Do you want to revise the Quotation ?`}
              onClose={() => {
                setReviseQuotation(false);
              }}
              onOk={() => createNewVersionQuote(true)}
            />
          )}

          {arrangeView.open && (
            <ArrangeView
              data={
                selectedRecords
                  ?.filter((e) => e.type === MATERIAL_TYPE.service && e.workOrder._id === arrangeView.workOrderIds[arrangeView.currentIndex])
                  ?.map((d) => {
                    return { _id: d?.uniqueId, name: d?.serviceDetail?.serviceName, order: d?.order, preWork: d?.preWork, parentId: d.workOrder._id };
                  }) || []
              }
              title={`Arrange Services (${selectedRecords
                ?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset && e.workOrder._id === arrangeView.workOrderIds[arrangeView.currentIndex])
                ?.map((d) => {
                  return d.serializedAssetDetail.assetNumber;
                })[0]
                })`}
              handleClose={() => setArrangeView({ open: false, workOrderIds: [], currentIndex: 0 })}
              handleSubmit={(data) => handleArrangeUpdate(data, arrangeView.workOrderIds[arrangeView.currentIndex])}
              loading={isSubmitting}
              isLast={arrangeView.currentIndex === arrangeView.workOrderIds.length - 1 ? true : false}
            />
          )}
          {updateDialog.open && (
            <UpdateWorkOrderDialog
              onClose={() => {
                setUpdateDialog({ open: false, data: null });
                setIsBulkEdit(false);
              }}
              materialData={updateDialog.data}
              handleUpdate={handleSaveData}
              loadingEdit={isUpdating}
              repairOrderData={repairOrderData}
              isBulkEdit={isBulkEdit}
            />
          )}
          {consumablesDialog.open && (
            <AssignProductDialog
              handleCloseDialog={() => setConsumablesDialog({ open: false, ids: [], data: null })}
              ids={consumablesDialog.ids}
              onSuccess={(rows) => {
                handleAddConsumables(rows, consumablesDialog?.data ? consumablesDialog?.data : selectedRecords);
              }}
              serialized={false}
              isSubmitting={isSubmitting}
              extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
            />
          )}
          {showCloseReopenConfirmation.open && (
            <ConfirmationDialog
              open={showCloseReopenConfirmation.open}
              message={`Are you sure you want to ${showCloseReopenConfirmation.type} work order(s) ?`}
              onClose={() => {
                setShowCloseReopenConfirmation({ open: false, type: '' });
              }}
              onOk={() => {
                if (showCloseReopenConfirmation.type === 'Close') {
                  closeWorkOrders();
                } else {
                  reOpenWorkOrders();
                }
              }}
              okBtnLoading={isSubmitting}
            />
          )}
          {showDrawingDialog.open && (
            <DiagramDialog
              referenceId={showDrawingDialog.workOrder}
              handleClose={() => {
                setShowDrawingDialog({ open: false, workOrder: null });
              }}
            />
          )}
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default WorkOrder;

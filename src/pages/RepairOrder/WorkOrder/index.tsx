import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Menu, MenuItem, Chip, IconButton, TextField } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
  repairOrder,
  REPAIR_ORDER_TYPE,
  workOrder,
  WORKORDER_SERVICE_STATUS,
  WORK_ORDER_STATUS,
  CHILD_RESOURCE,
  MATERIAL_TYPE,
  asyncForEach,
  MATERIAL_SUB_TYPE,
  REPAIR_ORDER_STATUS,
  sidebarResource
} from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { Delete, ExpandMore } from '@material-ui/icons';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { capitalize, map, orderBy, uniq } from 'lodash';
import { PreWorkIcon, PostWorkIcon } from 'src/assets/svg/svgIcons';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import UpdateWorkOrderDialog from './UpdateWorkOrderDialog';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { flattenArray } from 'src/constants/columns';
import EditIcon from '@material-ui/icons/Edit';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import { AutoCompleteIcon } from 'src/assets/svg/svgIcons';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { Autocomplete } from '@material-ui/lab';
const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const WorkOrder = ({
  fetchRepairOrderData,
  repairOrderData,
  setNextStep,
  stepFullScreen,
  allowedToEdit,
  isPostWorkService,
  setCurrentStep,
  createNewVersionQuote
}) => {
  const renderedFrom = 'repair_order_workorder';
  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();

  const [columns, setColumns] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [autoCompleteData, setAutoCompleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isCompleting, setCompleting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [completeConfirmBox, setCompleteConfirmBox] = useState(false);
  const [addServicesDialog, setAddServicesDialog] = useState({ open: false, new: false });
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);
  const [arrangeView, setArrangeView] = useState(false);
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

  const { state, dispatch } = useTableReducer();
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

  useEffect(() => {
    fetchFields();
    fetchData();
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

  const fetchFields = async () => {
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.workOrderService}`);
    var data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, repairOrderData?.currency || 'USD');
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
            <Box ml={1}>
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
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
            {row.original?.subRows?.length ? (
              <Box ml={1} className="d-flex align-items-center">
                {`(${row.original?.subRows?.length})`}
              </Box>
            ) : null}
            {user?.brandPolicy?.servicePrePost && row.original.type === 'service' && (
              <Box ml={1}>
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
              </Box>
            )}
          </div>
        )
      },
      {
        accessor: 'workOrderNumber',
        Header: 'Work Order',
        width: 200,
        Cell: ({ row }) =>
          row.original['workOrder'] ? (
            <div className="d-flex gap-2 align-items-center">
              <p className="text-truncate">{row.original['workOrderNumber']}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.workOrderDetail.path}/${row.original['workOrder']._id}`);
                }}
              >
                <OpenInNewIcon fontSize="small" color={'primary'} />
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
            <div className="d-flex gap-2 align-items-center">
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
                  <AutoCompleteIcon size={18} className={`${row?.original?.canAutoCompleteWorkOrder ? 'text-[var(--primary-text)]' : ''}`} />
                </IconButton>
              </HtmlTooltip>
            )}
            {[MATERIAL_TYPE.service, MATERIAL_TYPE.serializedAsset]?.includes(row?.original?.type) && !user?.brandPolicy?.workOrderConsumableHide && (
              <HtmlTooltip title="Add Products/Consumables">
                <IconButton
                  size="small"
                  disabled={row?.original?.workOrder?.status !== WORK_ORDER_STATUS.completed ? false : true}
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
                    color={row?.original?.workOrder?.status !== WORK_ORDER_STATUS.completed ? 'primary' : 'disabled'}
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

  const handleAutoComplete = () => {
    let ids = [];
    if (autoCompleteData && autoCompleteData.length > 0) {
      autoCompleteData.forEach((d) => {
        if (d?.canAutoCompleteWorkOrder) ids.push(d?.workOrder?._id);
      });
    }
    setCompleting(true);
    if (ids.length) {
      axiosInstance()
        .put(`${repairOrder.api}/${repairOrderData._id}/work-order/auto-complete`, {
          workOrders: ids
        })
        .then(({ data }) => {
          setCompleting(false);
          setCompleteConfirmBox(false);
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
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        parent.hideSelection = true;
        parent.serviceStatus = parent?.workOrder?.status;
      }
      parent.subRows = generateNestedData(data.material, parent);
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.new) {
        parent.canAutoCompleteWorkOrder = true;
      }
      parent.canDelete = false;
      if (parent?.subRows?.length === 0 && parent?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
        parent.canDelete = true;
      }
    });

    if (isPostWorkService) {
      if (rows?.some((e) => e.serviceStatus === WORK_ORDER_STATUS.completed)) {
        setNextStep(true);
      } else {
        setNextStep(false);
      }
    } else {
      if (repairOrderData.addQuotationStep) {
        if (data?.material?.filter((e) => e?.type === MATERIAL_TYPE.service && e?.serviceDetail?.preWork
          && [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress]?.includes(e?.status))?.length
        ) {
          setNextStep(false);
        } else {
          setNextStep(true);
        }
      }
      else {
        if ((repairOrderData?.type === REPAIR_ORDER_TYPE.internal &&
          rows?.every((e) => e.type === MATERIAL_TYPE.serializedAsset && e.serviceStatus === WORK_ORDER_STATUS.completed) ||
          (repairOrderData?.type === REPAIR_ORDER_TYPE.external &&
            rows?.some((e) => e.type === MATERIAL_TYPE.serializedAsset && e.serviceStatus === WORK_ORDER_STATUS.completed)))) {
          setNextStep(true);
        } else {
          setNextStep(false);
        }
      }
    }
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
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === MATERIAL_TYPE.service ? serviceIndex++ : productIndex++;
      _subRow.isValid = true;

      _subRow.canDelete = false;
      if (_subRow?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
        if (_subRow.type === MATERIAL_TYPE.product) {
          _subRow.canDelete = _subRow?.consumedQty || _subRow?.requestedQty ? false : true;
        }
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
      // if (_subRow?.status === WORKORDER_SERVICE_STATUS.completed || !_subRow.canDelete) {
      //   _subRow.hideSelection = true;
      // }
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
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
        if (isPostWorkService && repairOrderData?.addQuotationStep && repairOrderData?.addConsumablesQuotation) {
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
      const tempInitialData = rowsForWorkorder.map((element) => {
        return {
          _id: element?._id,
          product: element?.serializedAssetDetail?.product?.optionValue,
          serializedAsset: element?.serializedAssetDetail?._id
        };
      });
      axiosInstance()
        .post(`${repairOrder.api}/${repairOrderData._id}/work-order/create-many`, tempInitialData)
        .then(({ data }) => {
          fetchData();
          fetchRepairOrderData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
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
          severity: 'success'
        });
      })
      .catch((err) => {
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
    const records = selectedRecords?.filter((e) => e?.type === MATERIAL_TYPE.service && [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress]?.includes(e?.status));
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

  const leftSideContents = () => {
    return (
      <>
        {allowedToEdit &&
          <Autocomplete
            className="max-w-[400px] flex-grow min-w-[200px]"
            options={serviceOptions}
            getOptionLabel={(option) => option?.optionLabel || ''}
            size="small"
            renderInput={(params) => <TextField {...params} margin="none" size={'small'} fullWidth label="Select Service" variant="outlined" />}
            value={selectedServiceOption}
            onChange={(event: any, newValue: any) => {
              handleServiceSelect(newValue);
            }}
          />
        }
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddServicesDialog({ open: true, new: false });
          }}
        >
          Add Existing Services
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddServicesDialog({ open: true, new: true });
          }}
        >
          Add New Service
        </MenuItem>
        <MenuItem
          disabled={selectedRecords?.filter((d) => d.type === MATERIAL_TYPE.service)?.length > 0 ? false : true}
          onClick={() => {
            setUserAssignDialog(true);
          }}
        >
          Assign Technician
        </MenuItem>
        {allowedToEdit && permissions?.workStations?.isRead && (
          <MenuItem
            disabled={selectedRecords?.filter((d) => d.type === MATERIAL_TYPE.service)?.length > 0 ? false : true}
            onClick={() => {
              setWorkStationAssignDialog(true);
            }}
          >
            Assign Work Station
          </MenuItem>
        )}
        {!user?.brandPolicy?.workOrderConsumableHide && (
          <MenuItem
            disabled={
              selectedRecords?.filter((d) => [MATERIAL_TYPE.serializedAsset, MATERIAL_TYPE.service]?.includes(d.type))?.length > 0
                ? // checkUniqWorkOrder()
                false
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
          >
            Add Products/Consumables
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setArrangeView(true);
          }}
          disabled={checkUniqWorkOrder() && selectedRecords.filter((e) => e.type === MATERIAL_TYPE.service)?.length ? false : true}
        >
          Arrange Services
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAutoCompleteData(selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset));
            setCompleteConfirmBox(true);
          }}
          disabled={
            selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length &&
              selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset && e?.canAutoCompleteWorkOrder)?.length ===
              selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length
              ? false
              : true
          }
        >
          Auto Complete Work Order(s)
        </MenuItem>
        <MenuItem
        onClick={() => {
          setShowServiceActionConfirmBox({ open: true, action: WORKORDER_SERVICE_STATUS.completed });
        }}
        disabled={isDisabledCompleteService()}
      >
        Complete Service
      </MenuItem>
      <MenuItem
        onClick={() => {
          setShowServiceActionConfirmBox({ open: true, action: WORKORDER_SERVICE_STATUS.skipped });
        }}
        disabled={isDisabledCompleteService()}
      >
        Skip Service
      </MenuItem>
      <MenuItem
        disabled={
          selectedRecords?.length && selectedRecords?.some((e) => e.type === MATERIAL_TYPE.service && e.status !== WORKORDER_SERVICE_STATUS.pending)
            ? false
            : true
        }
        onClick={() => {
          setShowServiceActionConfirmBox({ open: true, action: 'Revert' });
        }}
      >
        Revert Service
      </MenuItem>
        <MenuItem
          onClick={() => {
            setIsBulkEdit(true);
            setUpdateDialog({
              open: true,
              data: selectedRecords.filter((e) => e.type === MATERIAL_TYPE.service)
            });
          }}
          disabled={selectedRecords.filter((e) => e.type === MATERIAL_TYPE.service).length > 0 ? false : true}
        >
          Bulk Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteData(selectedRecords?.filter((e) => e?.canDelete));
            setShowConfirmBox(true);
          }}
          disabled={selectedRecords?.some((e) => e?.canDelete) ? false : true}
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
        <Grid item xs={12} md={12} sm={12}>
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
              onOk={handleAutoComplete}
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

          {arrangeView && (
            <ArrangeView
              data={
                selectedRecords
                  ?.filter((e) => e.type === MATERIAL_TYPE.service)
                  ?.map((d) => {
                    return { _id: d?.uniqueId, name: d?.serviceDetail?.serviceName, order: d?.order, preWork: d?.preWork };
                  }) || []
              }
              title={'Arrange Services'}
              handleClose={() => setArrangeView(false)}
              handleSubmit={(data) => handleArrangeUpdate(data, selectedRecords[0]?.workOrder?._id)}
              loading={false}
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
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default WorkOrder;

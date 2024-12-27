import { Box, IconButton, MenuItem, TextField, Typography, useMediaQuery } from '@mui/material';
import { CheckCircle, CloudUpload, Delete } from '@mui/icons-material';
import DescriptionIcon from '@mui/icons-material/Description';
import SyncIcon from '@mui/icons-material/Sync';
import Autocomplete from '@mui/material/Autocomplete';
import { flatMap, map, orderBy, startCase, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { AutoCompleteIcon } from 'src/assets/svg/svgIcons';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { flattenArray } from 'src/constants/columns';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import DiagramDialog from 'src/pages/WorkOrder/Diagram/DiagramDialog';
import AssignUserDialog from 'src/pages/WorkOrder/Service/AssignUserDialog';
import AssignWorkStationDialog from 'src/pages/WorkOrder/Service/AssignWorkStationDialog';
import AttachmentDialog from 'src/pages/WorkOrder/Service/AttachmentDialog';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import {
  CHILD_RESOURCE,
  MATERIAL_SUB_TYPE,
  MATERIAL_TYPE,
  WORKORDER_SERVICE_STATUS,
  WORK_ORDER_STATUS,
  productionOrder,
  sidebarResource,
  workOrder
} from '../../../constants/helpers';
import UploadDrawingDialog from './UploadDrawingDialog';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const WorkOrder = ({ productionOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit, setCurrentStep }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, page, limit, filters, sorting, selectedRecords, search } = state;

  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [addServicesDialog, setAddServicesDialog] = useState({ open: false, new: false });
  const [userAssignDialog, setUserAssignDialog] = useState({ open: false, assignedUsers: [] });
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState({ open: false, assignedWorkStations: [] });
  const [showServiceActionConfirmBox, setShowServiceActionConfirmBox] = useState({ open: false, action: '' });
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [arrangeView, setArrangeView] = useState(false);
  const [autoCompleteData, setAutoCompleteData] = useState(null);
  const [completeConfirmBox, setCompleteConfirmBox] = useState(false);
  const [isCompleting, setCompleting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, ids: [], data: null });
  const [attachmentsDialog, setAttachmentsDialog] = useState({ open: false, workOrderId: null, uniqueServiceId: null, serviceName: null });

  const [openUploadDrawingDialog, setOpenUploadDrawingDialog] = useState(false);

  const [showDrawingDialog, setShowDrawingDialog] = useState({ open: false, workOrder: null });

  const [isAutoCreating, setIsAutoCreating] = useState({ open: false, total: 0, done: 0 });

  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedServiceOption, setSelectedServiceOption] = useState(null);
  const { generateColumns } = useColumns();

  useEffect(() => {
    setNextStep(false);
    checkAllWorkOrderComplete();
  }, []);

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

  const autoCreateWorkOrder = async (totalCount) => {
    try {
      let tempCount = totalCount;
      let page = 0;
      const limit = 200;
      while (tempCount > 0) {
        setIsAutoCreating({ open: true, total: totalCount, done: tempCount });
        await axiosInstance().post(`${productionOrder.api}/${productionOrderData._id}/work-order?limit=${limit}&page=${0}`);
        tempCount = tempCount - limit;
        if (page === 0) {
          fetchData();
        }
        page++;
      }
      setIsAutoCreating({ open: false, total: 0, done: 0 });
      fetchData();
    } catch (error) {
      setIsAutoCreating({ open: false, total: 0, done: 0 });
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [productionOrderData]);

  const checkAllWorkOrderComplete = async () => {
    const response = await axiosInstance().get(`${productionOrder.api}/${productionOrderData._id}/work-order/check-all-work-order-complete`);
    if (!!response?.data?.data?.isCompletedAll) {
      setNextStep(true);
    }
    if (response?.data?.data?.materialCount) {
      autoCreateWorkOrder(response?.data?.data?.materialCount);
    }
  };

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.productionOrderDetail, productionOrderData?.currency, false);
    var data = response?.filter((e) => !['detail', 'description']?.includes(e?.fieldName));
    const newColumns = generateColumns(renderedFrom, data, null, false, productionOrderData?.currency || 'USD');
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
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${startCase(row.original?.type)} `}</h5> : <NoDataCell />)
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
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.package) {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['description'] ? <h5 className="text-truncate">{row.original.description}</h5> : <NoDataCell />;
        }
      }
    ];
    const workOrderCol = {
      accessor: 'workOrder',
      Header: 'Work Order',
      width: 200,
      Cell: ({ row }) =>
        row.original.workOrder ? (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original.workOrderNumber}</h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes?.workOrderDetail?.path}/${row.original?.workOrder?._id}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
    };
    if (!newColumns?.find((e) => e.accessor === 'workOrderNumber')) {
      coloum.push(workOrderCol);
    }
    newColumns?.forEach((e) => {
      if (e.accessor === 'workOrderNumber') {
        coloum.push(workOrderCol);
      } else {
        coloum.push(e);
      }
    });
    coloum.push({
      accessor: 'status',
      Header: 'Status',
      width: 200,
      Cell: ({ row }) => <div>{row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />}</div>
    });
    coloum.push({
      accessor: 'serviceStatus',
      Header: 'Result',
      width: 200,
      Cell: ({ row }) => <div>{row?.original['serviceStatus'] ? <h5> {row?.original?.serviceStatus}</h5> : <NoDataCell />}</div>
    });
    coloum.push({
      accessor: 'assignedUsers',
      Header: 'Assigned Technician',
      width: 200,
      Cell: ({ row }) => (
        <div>
          {row?.original['assignedUsers'] && row?.original['assignedUsers']?.length ? (
            row?.original['assignedUsers']?.map((e, i) => {
              return i === row?.original['assignedUsers'].length - 1 ? (
                <a
                  className="link text-truncate [flex-grow:0_!important]"
                  target="_blank"
                  href={`${routes.userDetail.path}/${e.optionValue}`}
                  rel="noreferrer"
                >
                  {e?.optionLabel}
                </a>
              ) : (
                <>
                  <a
                    className="link text-truncate [flex-grow:0_!important]"
                    target="_blank"
                    href={`${routes.userDetail.path}/${e.optionValue}`}
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
    });
    if (permissions?.workStations) {
      coloum.push({
        accessor: 'assignedWorkStations',
        Header: 'Assigned Work Station',
        width: 200,
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
      });
    }
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.type === MATERIAL_TYPE.product && !row?.original?.parentId && (
              <>
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
                    {row.original['workOrderStatus'] === 'Completed' ? (
                      <CheckCircle className="text-[var(--chip-color-completed)] [font-size:19px_!important] dark:text-green-400" />
                    ) : (
                      <AutoCompleteIcon size={18} />
                    )}
                  </IconButton>
                </HtmlTooltip>
                <HtmlTooltip title="Drawings">
                  <IconButton
                    size="small"
                    aria-label="Details"
                    onClick={() => {
                      setShowDrawingDialog({ open: true, workOrder: row.original?.workOrder?._id });
                    }}
                  >
                    <DescriptionIcon fontSize="small" color={'primary'} />
                  </IconButton>
                </HtmlTooltip>
              </>
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

  useEffect(() => {
    fetchData(false);
  }, [page, limit, filters, sorting, search]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchData = async (selectionReset = true) => {
    dispatch({ type: 'loading', loading: true });
    if (selectionReset) {
      dispatch({ type: 'selection', selectedRecords: [] });
      if (selectedServiceOption) {
        setSelectedServiceOption(null);
      }
    }

    const queryString = getQueryString();
    const {
      data: { data, count }
    } = await axiosInstance().get(`${productionOrder.api}/${productionOrderData._id}/work-order/service${queryString}`);
    let rows = data.material.filter((e) => e.type === MATERIAL_TYPE.product && e?.parentId === null);
    const totalPrev = page * limit;
    rows.forEach((parent, i) => {
      parent.index = i + 1 + totalPrev;
      parent.detail = parent.detail
        ? parent.detail
        : parent.type === MATERIAL_TYPE.service
          ? parent?.serviceDetail?.serviceName
          : parent.type === MATERIAL_TYPE.product
            ? parent.productDetail?.productName
            : parent.packageDetail?.packageName;
      parent.description = parent.description
        ? parent.description
        : parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent?.packageDetail?.packageDescription;
      parent.qty = parent.qty;
      parent.workOrderNumber = parent?.workOrder?.workOrderNumber;
      parent.hideSelection = false;
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        parent.hideSelection = true;
        parent.workOrderStatus = parent?.workOrder?.status;
      }
      parent.status = parent?.workOrder?.serviceProcessStatus;
      parent.subRows = generateNestedData(data.material, parent);
      if (parent?.workOrder?.status === WORK_ORDER_STATUS.new) {
        parent.canAutoCompleteWorkOrder = true;
      }
      parent.canDelete = false;
      if (parent?.subRows?.length === 0 && parent?.workOrder?.status !== WORK_ORDER_STATUS.completed) {
        parent.canDelete = true;
      }
    });
    dispatch({ type: 'initialize', data: rows, count: count });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    var subRows: any = material.filter((e) => e?.parentId === parent?._id);
    subRows = orderBy(subRows, ['type'], ['desc']);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === MATERIAL_TYPE.service ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail = _subRow.detail
        ? _subRow.detail
        : _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow.productDetail?.productName
            : _subRow.packageDetail?.packageName;
      _subRow.description = _subRow.description
        ? _subRow.description
        : _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription
            : _subRow?.packageDetail?.packageDescription;
      _subRow.qty = _subRow.qty;
      _subRow.workOrder = parent?.workOrder;
      _subRow.workOrderNumber = parent?.workOrder?.workOrderNumber;
      _subRow.hideSelection = false;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === MATERIAL_TYPE.service ? serviceIndex++ : productIndex++;
      if (_subRow?.workOrder?.status === WORK_ORDER_STATUS.completed) {
        _subRow.hideSelection = true;
      }
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
    });
    return subRows;
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
        fetchData();
        setSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setSubmitting(false);
      });
  };

  const handleDelete = async () => {
    if (
      deleteData?.some((e) => [MATERIAL_TYPE.service, MATERIAL_TYPE.package]?.includes(e.type) || (MATERIAL_TYPE.product === e.type && e.parentId))
    ) {
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
      await axiosInstance().put(`${workOrder.api}/${productionOrderData?._id}/material/remove`, records);
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
        .put(`${productionOrder.api}/${productionOrderData._id}/work-order/auto-complete`, {
          workOrders: ids
        })
        .then(({ data }) => {
          setCompleting(false);
          setCompleteConfirmBox(false);
          fetchData();
          checkAllWorkOrderComplete();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
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

  const handleAddConsumables = (rows, records = []) => {
    setSubmitting(true);
    const data: any = [];
    let workOrderId = '';
    const product = records?.find((s) => s.type === MATERIAL_TYPE.product);
    if (product) {
      workOrderId = product?.workOrder?._id;
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
      workOrderId = services[0]?.workOrder?._id;
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

  const checkUniqWorkOrder = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (uniq(map(selectedRecords, 'workOrder._id')).length === 1) {
      return true;
    } else {
      return false;
    }
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
      (e) => e?.type === MATERIAL_TYPE.service && [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress]?.includes(e?.status)
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

  const rightSideContents = () => {
    if (!allowedToEdit) return null;
    return (
      <>
        <AsynImportExportMenu
          resource={sidebarResource.productionOrder}
          subResource={`material`}
          referenceId={productionOrderData._id}
          permissions={permissions?.productionOrder}
          module={resources?.productionOrder?.titleSingular}
          api={`${productionOrder.api}/material/${productionOrderData._id}`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportCount={true}
          exportCount={selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.product && !e?.parentId).length}
          ids={selectedRecords?.length ? selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.product && !e?.parentId)?.map((obj) => obj._id) : []}
        />
        {user?.user?.brandPolicy?.workOrderStepDataImport && (
          <ImportExportMenu
            permissions={permissions?.workOrder}
            module={sidebarResource.workOrder}
            api={`work-order-technician`}
            afterImportCompleted={() => {
              fetchData();
            }}
            title={'Steps Data'}
            disabled={!(selectedRecords.length === 1 && selectedRecords[0].type === MATERIAL_TYPE.service)}
            additionalParams={`productionOrder=${productionOrderData._id}&serviceId=${selectedRecords[0]?.serviceDetail?._id}&uniqueId=${selectedRecords[0]?.uniqueId}`}
            small={true}
          />
        )}
        <ThemeButton
          onClick={() => {
            setOpenUploadDrawingDialog(true);
          }}
          iconForMobile={<CloudUpload />}
          mobileTooltip="Upload Drawings"
        >
          Upload Drawings
        </ThemeButton>
      </>
    );
  };

  return (
    <Fragment>
      {isAutoCreating.open && (
        <Box p={1} display="flex" alignItems="center">
          <SyncIcon className="rotate" />{' '}
          <Typography variant="subtitle2">
            Work order Auto Creation in Progress {`${isAutoCreating.total - isAutoCreating.done}/${isAutoCreating.total}`}
          </Typography>
        </Box>
      )}
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={
          <ActionButtonMenuItems
            {...{
              setAddServicesDialog,
              selectedRecords,
              setUserAssignDialog,
              allowedToEdit,
              permissions,
              setWorkStationAssignDialog,
              user,
              checkUniqWorkOrder,
              dataRows,
              setArrangeView,
              setConsumablesDialog,
              setAutoCompleteData,
              setCompleteConfirmBox,
              setAttachmentsDialog,
              setShowServiceActionConfirmBox,
              isDisabledCompleteService,
              setDeleteData,
              setShowConfirmBox
            }}
          />
        }
        actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
        leftSideContents={leftSideContents()}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              setWholeRowsCellColor={(rowData) => (rowData.type === 'service' ? 'isService' : '')}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              expander={true}
            />
          </Box>
        </>
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
        <AssignUserDialog
          warehouse={productionOrderData?.warehouse?.optionValue}
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
          warehouse={productionOrderData?.warehouse?.optionValue}
          workOrderData={selectedRecords
            .filter((e) => e.type === MATERIAL_TYPE.service)
            .map((d) => {
              return {
                uniqueId: d?.uniqueId,
                workOrderId: d?.workOrder?._id
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
      {arrangeView && (
        <ArrangeView
          data={
            flattenArray(dataRows)
              ?.filter((e) => e.type === MATERIAL_TYPE.service && e?.workOrder?._id === selectedRecords[0]?.workOrder?._id)
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
      {showServiceActionConfirmBox.open && (
        <ConfirmationDialog
          okBtnLoading={isSubmitting}
          open={showServiceActionConfirmBox.open}
          message={`Are you sure you want to ${
            showServiceActionConfirmBox.action === WORKORDER_SERVICE_STATUS.completed
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
      {consumablesDialog.open && (
        <AssignProductDialog
          handleCloseDialog={() => setConsumablesDialog({ open: false, ids: [], data: null })}
          ids={consumablesDialog.ids}
          onSuccess={(rows) => {
            handleAddConsumables(rows, consumablesDialog?.data ? consumablesDialog?.data : selectedRecords);
          }}
          serialized={false}
          isSubmitting={isSubmitting}
        />
      )}
      {attachmentsDialog.open && (
        <AttachmentDialog
          workOrderId={attachmentsDialog.workOrderId}
          uniqueServiceId={attachmentsDialog.uniqueServiceId}
          stepId={null}
          stepName={attachmentsDialog.serviceName}
          serviceName={attachmentsDialog.serviceName}
          handleClose={() => {
            setAttachmentsDialog({
              open: false,
              workOrderId: null,
              uniqueServiceId: null,
              serviceName: null
            });
          }}
          handleSuccess={() => {
            fetchData();
            setAttachmentsDialog({
              open: false,
              workOrderId: null,
              uniqueServiceId: null,
              serviceName: null
            });
          }}
        />
      )}
      {openUploadDrawingDialog && (
        <UploadDrawingDialog productionOrderData={productionOrderData} handleClose={() => setOpenUploadDrawingDialog(false)} />
      )}
      {showDrawingDialog.open && (
        <DiagramDialog
          referenceId={showDrawingDialog.workOrder}
          handleClose={() => {
            setShowDrawingDialog({ open: false, workOrder: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default WorkOrder;

const ActionButtonMenuItems = ({
  setAddServicesDialog,
  selectedRecords,
  setUserAssignDialog,
  allowedToEdit,
  permissions,
  setWorkStationAssignDialog,
  user,
  checkUniqWorkOrder,
  dataRows,
  setArrangeView,
  setConsumablesDialog,
  setAutoCompleteData,
  setCompleteConfirmBox,
  setAttachmentsDialog,
  setShowServiceActionConfirmBox,
  isDisabledCompleteService,
  setDeleteData,
  setShowConfirmBox
}) => {
  return (
    <>
      <MenuItem
        disabled={selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.product && !e.parentId)?.length ? false : true}
        onClick={() => {
          setAddServicesDialog({ open: true, new: false });
        }}
      >
        Add Existing Services
      </MenuItem>
      <MenuItem
        disabled={selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.product && !e.parentId)?.length ? false : true}
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
            selectedRecords?.filter((d) => [MATERIAL_TYPE.product, MATERIAL_TYPE.service]?.includes(d.type))?.length > 0 && checkUniqWorkOrder()
              ? false
              : true
          }
          onClick={() => {
            var ids = [];
            if (selectedRecords?.find((e) => e.type === MATERIAL_TYPE.product)) {
              const product = selectedRecords?.find((e) => e.type === MATERIAL_TYPE.product);
              ids = flattenArray(dataRows)
                ?.filter((e) => e?.workOrder?._id === product?.workOrder?._id)
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
          selectedRecords?.find((d) => d.type === MATERIAL_TYPE.service || (d.type === MATERIAL_TYPE.product && !d?.parentId)) &&
          selectedRecords?.every((d) => d.workOrder?._id === selectedRecords[0]?.workOrder?._id)
            ? false
            : true
        }
      >
        Arrange Services
      </MenuItem>
      <MenuItem
        onClick={() => {
          setAutoCompleteData(selectedRecords);
          setCompleteConfirmBox(true);
        }}
        disabled={selectedRecords.some((e) => e?.canAutoCompleteWorkOrder) ? false : true}
      >
        Auto Complete Work Order(s)
      </MenuItem>
      <MenuItem
        disabled={
          checkUniqWorkOrder() &&
          (selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.service)?.length === 1 ||
            selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.product && !e?.parentId)?.length === 1)
            ? false
            : true
        }
        onClick={() => {
          const parentProduct = selectedRecords?.find((e) => e.type === MATERIAL_TYPE.product && !e?.parentId);
          if (parentProduct) {
            setAttachmentsDialog({
              open: true,
              workOrderId: parentProduct?.workOrder?._id,
              uniqueServiceId: null,
              serviceName: parentProduct?.workOrder?.workOrderNumber
            });
          } else {
            const service = selectedRecords?.find((e) => e.type === MATERIAL_TYPE.service);
            setAttachmentsDialog({
              open: true,
              workOrderId: service?.workOrder?._id,
              uniqueServiceId: service?.uniqueId,
              serviceName: service?.serviceDetail?.serviceName
            });
          }
        }}
      >
        Upload Documents
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

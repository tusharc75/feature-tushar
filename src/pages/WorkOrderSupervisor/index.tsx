import { MoreVert } from '@mui/icons-material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import axios, { CancelToken } from 'axios';
import dayjs from 'dayjs';
import { camelCase, isEqual, map, uniq, uniqBy } from 'lodash';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import { FaRegCalendar } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import { MdViewWeek } from 'react-icons/md';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import ButtonMenu from 'src/components/ButtonMenu';
import { useCardColTimeline } from 'src/components/CardColTimeline1';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DateRangePicker, { DateRange } from 'src/components/DateRangePicker';
import Filter from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import {
  ASSET_STATUS,
  INVENTORY_OWNER_TYPE,
  MATERIAL_SUB_TYPE,
  REPAIR_ORDER_TYPE,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_SUPERVISOR_STATUS,
  dateFormatToSend,
  prepareDataForGrid,
  sidebarResource,
  workOrder,
  workOrderIconMap,
  workOrderSupervisor
} from 'src/constants/helpers';
import ManageRepairOrder from 'src/pages/RepairOrder/ManageRepairOrder';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';
import CardView from 'src/pages/WorkOrderSupervisor//CardView';
import CalendarView from 'src/pages/WorkOrderSupervisor/CalendarView';
import GridView, { GridViewRef } from 'src/pages/WorkOrderSupervisor/GridView';
import WorkOrderDetailDialog from 'src/pages/WorkOrderSupervisor/WorkOrderDetailDialog';
import WorkOrderSchedulerDialog from 'src/pages/WorkOrderSupervisor/WorkOrderSchedulerDialog';
import { handlePdfPreview, queryStringPlanned } from 'src/pages/WorkOrderSupervisor/helper';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import AssignTechniciansDialog from '../WorkOrder/Service/AssignTechniciansDialog';
import AssignWorkStationDialog from '../WorkOrder/Service/AssignWorkStationDialog';

type ViewType = 'card-view' | 'table-view' | 'calendar-view';

type TableViewStatus =
  | typeof WORKORDER_SERVICE_STATUS.planned
  | typeof WORKORDER_SERVICE_STATUS.pending
  | typeof WORKORDER_SERVICE_STATUS.inProgress
  | typeof WORKORDER_SERVICE_STATUS.completed
  | typeof WORKORDER_SERVICE_STATUS.skipped;

const renderedFrom = camelCase(sidebarResource?.workOrderSupervisor);

const keyGetter = (d: any) => d?.['_id'] as string;

const defaultVisibleRows = [
  'customerAccount',
  'workOrderNumber',
  'warehouse',
  'createDate',
  'estimateCompleteDate',
  'serializedAsset',
  'product',
  'package',
  'repairOrder',
  'assemblyOrder',
  'productionOrder',
  'assignedUsers',
  'assignedWorkStations'
];

const WorkOrderSupervisor = () => {
  const { state: tableState, dispatch: tableDispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords: tableSelectedRecords } = tableState;
  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      permissions,
      resources,
      user: { user }
    }
  }: any = useData();
  const workOrderListRef = useRef<GridViewRef>();
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState({ open: false, multiple: false });
  const [assignTechnicianDialog, setAssignTechnicianDialog] = useState({ open: false, multiple: false });
  const [tableViewStatus, setTableViewStatus] = useState<TableViewStatus>(WORKORDER_SERVICE_STATUS.pending);
  const { generateColumns } = useColumns();
  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [openWorkOrderScheduler, setOpenWorkOrderScheduler] = useState(false);
  const [viewType, setViewType] = useState<ViewType>(() => {
    return (localStorage.getItem(`${renderedFrom}_view`) as ViewType) || 'card-view';
  });

  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, multiple: false });
  const [repairOrderDialog, setRepairOrderDialog] = useState(false);
  const [onClickData, setOnClickData] = useState(null);
  const [selectedServiceStatus, setSelectedServiceStatus] = useState<any[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
  const [filterQuery, setFilterQuery] = useState('');
  const [columnsDef, setColumnsDef] = useState<any[]>([]);

  useEffect(() => {
    localStorage.setItem(`${renderedFrom}_view`, viewType);
  }, [viewType]);

  const resetSelectedRecords = () => {
    setTableViewStatus(WORKORDER_SERVICE_STATUS.pending);
    cardState.resetSelection();
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  const [globalFilters, setGlobalFilters] = useState<DateRange>({
    from: dayjs.tz().startOf('year').toDate(),
    to: dayjs.tz().endOf('year').toDate()
  });

  const [resourceType, setResourceType] = useState({
    label: resources?.workOrder?.titlePlural,
    selected: true,
    value: sidebarResource.workOrder
  });

  const getDefaultSelectedResource = () => {
    const _key = permissions?.repairOrder?.isRead
      ? 'repairOrder'
      : permissions?.productionOrder?.isRead
        ? 'productionOrder'
        : permissions?.assemblyOrder?.isRead
          ? 'assemblyOrder'
          : '';
    if (_key) {
      return {
        label: resources?.[_key]?.titlePlural,
        selected: true,
        value: sidebarResource[_key]
      };
    }
    return null;
  };

  const [selectedResource, setSelectedResource] = useState(getDefaultSelectedResource());

  const selectedStatusMemo = useMemo(() => {
    const initial: any[] = [];
    if (permissions?.workOrderPlanning?.isRead && selectedResource?.value === sidebarResource.repairOrder) {
      initial.push(WORKORDER_SERVICE_STATUS.planned);
    }
    return [
      ...initial,
      WORKORDER_SERVICE_STATUS.pending,
      WORKORDER_SERVICE_STATUS.inProgress,
      WORKORDER_SERVICE_STATUS.completed,
      WORKORDER_SERVICE_STATUS.skipped
    ];
  }, [permissions?.workOrderPlanning?.isRead, selectedResource]);

  useEffect(() => {
    setSelectedServiceStatus(selectedStatusMemo);
  }, [selectedStatusMemo]);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchGridColumns(cancelToken.token);
    return () => cancelToken.cancel();
  }, [selectedResource]);

  const fetchSingleColumnData = useCallback(
    async ({
      column,
      page = 0,
      filterQuery = '',
      limit
    }: {
      column: string;
      page?: number;
      filterQuery?: string;
      limit: number;
    }): Promise<{ data: any[]; count: number }> => {
      let api = `${workOrderSupervisor.api}/work-order-service?page=${page}&status=${column}&limit=${limit}&resource=${selectedResource?.value}${filterQuery}`;

      if (column === WORKORDER_SERVICE_STATUS.planned) {
        const filterByIds = queryStringPlanned(filterQuery);
        api = `${workOrder.api}/work-order-planning?page=${page}&limit=${limit}&deepFilter=${encodeURIComponent(
          JSON.stringify([{ field: 'status', term: WORKORDER_SERVICE_STATUS.pending }])
        )}`;
        if (filterByIds?.length) {
          api += `&filterById=${JSON.stringify(filterByIds)}&filterType=and`;
        }
      }
      try {
        const response = await axiosInstance().get(api);
        if (response.status !== 200) {
          throw new Error('Failed to fetch data');
        }
        let { data, count } = response.data;
        let rows = [];

        if (column === WORKORDER_SERVICE_STATUS.planned) {
          const { data: dataD, count: plannedCount } = data;
          count = plannedCount;
          rows = dataD.map((item) => ({
            ...item,
            serializedAsset: item?.asset?.assetNumber,
            serializedAssetId: item?.asset?._id,
            repairOrderNumber: item?.repairOrder?.optionLabel,
            warehouse: item?.asset?.warehouse || '',
            warehouseId: item?.asset?.warehouseId || '',
            assetStatus: item?.asset?.status,
            currentOwnerType: item?.asset?.currentOwnerType,
            ownerType: item?.asset?.ownerType,
            serviceName: item?.service?.optionLabel,
            serviceId: item?.service?.optionValue,
            status: WORKORDER_SERVICE_STATUS.planned
          }));
        } else {
          rows = data.map((u) => {
            let finalObject: any = prepareDataForGrid(u, user);
            let workOrderDetailData: any = prepareDataForGrid(u?.workOrderDetail, user);
            finalObject['serviceName'] = u?.service?.optionLabel;
            finalObject['serviceId'] = u?.service?.optionValue;
            finalObject['customServiceStatus'] = u?.status;
            finalObject['workOrderId'] = u?.workOrderDetail?._id;
            finalObject['uniqueId'] = u?._id;
            finalObject['customerAccountName'] = u?.[camelCase(u?.workOrderDetail?.type)]?.customerAccount?.optionLabel;
            finalObject['customerAccountId'] = u?.[camelCase(u?.workOrderDetail?.type)]?.customerAccount?.optionValue;
            finalObject['oriAssignedUsers'] = u?.assignedUsers;
            finalObject['oriAssignedWorkStations'] = u?.assignedWorkStations;
            delete workOrderDetailData?._id;
            delete workOrderDetailData?.id;
            return { ...finalObject, ...workOrderDetailData };
          });
        }
        return { data: rows, count };
      } catch (err) {
        if (axios.isCancel(err)) {
          console.warn('Request cancelled:', column, page);
        } else {
          toastConfig.setToastConfig(err);
        }
        return { data: [], count: 0 };
      }
    },
    [user, selectedResource]
  );

  const fetchGridColumns = async (cancelToken: CancelToken) => {
    try {
      let data;
      const response = await axiosInstance().get(`/field?resource=${sidebarResource.workOrder}&view=true`, { cancelToken });
      data = response?.data?.data;

      const newColumns = generateColumns(renderedFrom, data, routes?.workOrderDetail?.path);
      const columns = newColumns.filter((ele) => ele.accessor !== 'workOrderNumber');

      const extraColumns = [
        {
          accessor: 'serviceName',
          Header: 'Service',
          disabled: true,
          Cell: ({ row }) =>
            row?.original?.serviceName ? (
              <div className="flex flex-grow justify-between">
                <h5
                  className="link text-truncate"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOnClickData({ workOrderId: row?.original?.workOrderId });
                    setOpen(true);
                  }}
                >
                  {row?.original?.serviceName}
                </h5>
                {row?.original?.priority && (
                  <Box ml={1}>
                    <HtmlTooltip title={`${row?.original?.priority} Priority`}>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${row?.original?.priority === 'High' ? 'bg-red-600' : row?.original?.priority === 'Low' ? 'bg-green-600' : 'bg-yellow-500'
                          }`}
                      >
                        {row?.original?.priority}
                      </span>
                    </HtmlTooltip>
                  </Box>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {row?.original?.status !== WORKORDER_SERVICE_STATUS.planned &&
                    <HtmlTooltip title="Preview PDF">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePdfPreview(row?.original?.workOrder, user, toastConfig);
                        }}
                      >
                        <PictureAsPdfIcon fontSize="small" color="primary" />
                      </IconButton>
                    </HtmlTooltip>}
                  <RenderAssignOptions
                    openAssignHandler={openAssignHandler}
                    data={row?.original}
                    permissions={permissions}
                    resources={resources}
                    isCreateRepairOrderDisabled={isCreateRepairOrderDisabled}
                  />
                </div>
              </div>
            ) : (
              <NoDataCell />
            )
        },
        {
          accessor: 'workOrderNumber',
          Header: 'Work Order Number',
          defaultVisible: true,
          Cell: ({ row }) => (
            <div className="flex items-center gap-1">
              <p title={row?.original?.workOrderNumber}>{row?.original?.workOrderNumber}</p>
              {row.original['workOrderNumber'] ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`${routes.workOrderDetail.path}/${row?.original?.workOrderId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        },
        {
          accessor: 'customerAccountName',
          Header: resources?.customerAccount?.titleSingular || 'Customer',
          defaultVisible: true,
          Cell: ({ row }) => {
            const id = row?.original?.customerAccountId;
            return row?.original?.customerAccountName ? (
              <div className="flex items-center gap-1">
                <p title={row?.original?.customerAccountName}>{row?.original?.customerAccountName}</p>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`${routes.customerAccountDetail.path}/${row?.original?.customerAccountId}`, '_blank');
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </div>
            ) : (
              <NoDataCell />
            );
          }
        },
        {
          accessor: 'assignedUsers',
          Header: 'Technician',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) =>
            row.original['assignedUsers'] ? (
              <DropdownCell
                permissions={permissions}
                permissionForLinks={{}}
                field={{
                  fieldName: 'assignedUsers',
                  lookupResource: sidebarResource.user
                }}
                original={row?.original}
              />
            ) : (
              <NoDataCell />
            )
        },
        {
          accessor: 'assignedWorkStations',
          Header: 'Work Stations',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) =>
            row.original['assignedWorkStations'] ? (
              <DropdownCell
                permissions={permissions}
                permissionForLinks={{}}
                field={{
                  fieldName: 'assignedWorkStations',
                  lookupResource: sidebarResource.workStations
                }}
                original={row?.original}
              />
            ) : (
              <NoDataCell />
            )
        }
      ];

      const finalColumns = [...extraColumns.slice(0, 3), ...columns, ...extraColumns.slice(3)].map((c) => {
        const id = c.id || c.accessor;
        if (defaultVisibleRows.includes(id)) {
          return { ...c, defaultVisible: true };
        }
        return c;
      });
      setColumnsDef(finalColumns);
    } catch (error) {
      console.error(error);
    }
  };

  const cardState = useCardColTimeline({
    fetchSingleColumn: fetchSingleColumnData,
    columns: WORKORDER_SUPERVISOR_STATUS,
    initialVisibleColumns: selectedServiceStatus,
    columnDef: columnsDef,
    keyGetter
  });

  useEffect(() => {
    cardState.setColumnDef(columnsDef);
  }, [columnsDef]);

  useEffect(() => {
    cardState.setOrderAndVisibility({ order: tableState.columnOrder, visible: tableState.visibleColumns });
  }, [tableState.columnOrder, tableState.visibleColumns]);

  useEffect(() => {
    cardState.setVisibleColumns(selectedServiceStatus);
  }, [selectedServiceStatus]);

  const selectedRecords = useMemo(() => [...tableSelectedRecords, ...cardState.selectedRecords], [tableSelectedRecords, cardState.selectedRecords]);
  const selectedRecordsP = useMemo(() => [...selectedRecords?.filter((r) => r?.status === WORKORDER_SERVICE_STATUS.planned)], [selectedRecords]);
  const selectedRecordsS: any = useMemo(() => [...selectedRecords?.filter((r) => r?.status != WORKORDER_SERVICE_STATUS.planned)], [selectedRecords]);

  const ref: any = useRef();

  const FIELD_TO_FILTER = [
    {
      fieldData: {
        _id: '630dc2429ec41869052395b1',
        fieldName: 'user',
        fieldLabel: resources?.employeeMaster?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.user,
        type: 'dropDown'
      },
      isRead: permissions?.user?.isRead || false
    },
    {
      fieldData: {
        _id: '630dc2429ec41869052395b2',
        fieldName: 'service',
        fieldLabel: resources?.serviceMaster?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.serviceMaster,
        type: 'dropDown'
      },
      isRead: permissions?.serviceMaster?.isRead || false
    },
    {
      fieldData: {
        _id: '630dc2429ec41869052395b3',
        fieldName: 'workOrder',
        fieldLabel: resources?.workOrder?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.workOrder,
        type: 'dropDown'
      },
      isRead: permissions?.workOrder?.isRead || false
    },
    ...((viewType === 'calendar-view' ? resourceType?.value : selectedResource?.value) === sidebarResource.repairOrder
      ? [
        {
          fieldData: {
            _id: '630dc2429ec41869052395b4',
            fieldName: 'repairOrder',
            fieldLabel: resources?.repairOrder?.titlePlural,
            lookup: true,
            lookupResource: sidebarResource.repairOrder,
            type: 'dropDown'
          },
          isRead: permissions?.repairOrder?.isRead || false
        },
        {
          fieldData: {
            _id: '630dc2429gc81869052385b5',
            fieldName: 'serializedAsset',
            fieldLabel: resources?.serializedAsset?.titlePlural,
            lookup: true,
            lookupResource: sidebarResource.serializedAsset,
            type: 'dropDown'
          },
          isRead: permissions?.serializedAsset?.isRead || false
        }
      ]
      : []),
    ...((viewType === 'calendar-view' ? resourceType?.value : selectedResource?.value) === sidebarResource.productionOrder
      ? [
        {
          fieldData: {
            _id: '630dc2429ec41869052395b5',
            fieldName: 'productionOrder',
            fieldLabel: resources?.productionOrder?.titlePlural,
            lookup: true,
            lookupResource: sidebarResource.productionOrder,
            type: 'dropDown'
          },
          isRead: permissions?.productionOrder?.isRead || false
        }
      ]
      : []),
    ...(([sidebarResource.repairOrder, sidebarResource.productionOrder] as const).includes(
      (viewType === 'calendar-view' ? resourceType?.value : selectedResource?.value) as
      | typeof sidebarResource.repairOrder
      | typeof sidebarResource.productionOrder
    )
      ? [
        {
          fieldData: {
            _id: '670dc2429gc87266052385b9',
            fieldName: 'product',
            fieldLabel: resources?.product?.titlePlural,
            lookup: true,
            lookupResource: sidebarResource.product,
            type: 'dropDown'
          },
          isRead: permissions?.product?.isRead || false
        }
      ]
      : []),
    ...((viewType === 'calendar-view' ? resourceType?.value : selectedResource?.value) === sidebarResource.assemblyOrder
      ? [
        {
          fieldData: {
            _id: '630da2429ec41869052395b5',
            fieldName: 'assemblyOrder',
            fieldLabel: resources?.assemblyOrder?.titlePlural,
            lookup: true,
            lookupResource: sidebarResource.assemblyOrder,
            type: 'dropDown'
          },
          isRead: permissions?.assemblyOrder?.isRead || false
        },
        {
          fieldData: {
            _id: '630da2429ec47869056395b5',
            fieldName: 'package',
            fieldLabel: resources?.packages?.titlePlural,
            lookup: true,
            lookupResource: sidebarResource.packages,
            type: 'dropDown'
          },
          isRead: permissions?.packages?.isRead || false
        }
      ]
      : []),
    {
      fieldData: {
        _id: '670dc2429gc88866052385b9',
        fieldName: 'warehouse',
        fieldLabel: resources?.warehouse?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.warehouse,
        type: 'dropDown'
      },
      isRead: permissions?.warehouse?.isRead || false
    },
    {
      fieldData: {
        _id: '670dc2429gc81866052385b5',
        fieldName: 'customerAccount',
        fieldLabel: resources?.customerAccount?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.customerAccount,
        type: 'dropDown'
      },
      isRead: permissions?.customerAccount?.isRead || false
    }
  ];

  const openAssignHandler = (value: any, data: any) => {
    setSelectedServiceData(data);
    if (value === 'assignTechnician') {
      setAssignTechnicianDialog({ open: true, multiple: false });
    } else if (value === 'createRepairOrder') {
      setRepairOrderDialog(true);
    } else if (value === 'addProductConsumables') {
      setConsumablesDialog({ open: true, multiple: false });
    } else {
      setWorkStationAssignDialog({ open: true, multiple: false });
    }
  };

  const getQueryString = useCallback(
    (selectDateFilter = true, filterByIdsP = filterByIds) => {
      let deepFilter = '';
      const nIn: any = [];
      filterByIdsP?.forEach((ele) => {
        if (ele?.term?.length > 0) {
          if (filterTerm[ele?.field] === '$nin') {
            nIn.push(ele?.field);
          }
          deepFilter = `${deepFilter}&${ele?.field}=${ele?.term?.map((e) => e?.optionValue)}`;
        }
      });
      if (nIn?.length > 0) {
        deepFilter = `${deepFilter}&nIn=${JSON.stringify(nIn)}`;
      }

      if (globalFilters && selectDateFilter) {
        deepFilter = `${deepFilter}&from=${dateFormatToSend(globalFilters.from)}&to=${dateFormatToSend(globalFilters.to)}`;
      }
      return `${deepFilter}`;
    },
    [globalFilters, showFilter]
  );

  useEffect(() => {
    if (globalFilters) {
      const query = getQueryString();
      setFilterQuery(query);
    } else {
      setFilterQuery('');
    }
  }, [globalFilters.from, globalFilters.to, getQueryString, globalFilters, viewType]);

  const onClickRefreshIcon = () => {
    if (viewType === 'calendar-view') {
      if (ref?.current) {
        ref?.current?.childFunction();
      }
    } else if (viewType === 'table-view') {
      workOrderListRef?.current?.refreshGrid();
    } else {
      cardState.refreshAllColumns();
    }
  };

  const handleAddConsumables = (rows, records = []) => {
    const data: any = [];
    const workOrderId: any = uniqBy(records, 'workOrderId').map((e) => e?.workOrderId);
    records?.forEach((s) => {
      rows?.forEach((e) => {
        data.push({
          product: e._id,
          qty: parseInt(e.qty) || 1,
          service: s?.service?.optionValue,
          subType: MATERIAL_SUB_TYPE.consumable,
          uniqueId: s?.uniqueId,
          stepId: null,
          parentId: s?.uniqueId
        });
      });
    });
    axiosInstance()
      .post(`${workOrder.api}/id/consumable/add-multiple`, { products: data, workOrder: workOrderId })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        cardState.refreshAllColumns();
        setConsumablesDialog({ open: false, multiple: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddAssets = async (row, records) => {
    axiosInstance()
      .post(`${workOrder.api}/work-order-planning/material`, {
        repairOrderId: row?._id,
        _ids: records?.map((e) => e?._id)
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        cardState.refreshAllColumns();
        setRepairOrderDialog(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const assignTechnicianButton = {
    label: 'Assign Technicians',
    disabled:
      selectedRecordsS?.some((r) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(r?.status)) ||
      selectedRecordsS?.length === 0,
    onClick: () => {
      if (viewType === 'table-view') {
        workOrderListRef.current?.setAssignTechnicianDialog(true);
      } else {
        setAssignTechnicianDialog({ open: true, multiple: true });
      }
    }
  };

  const assignWorkStationButton = {
    label: `Assign ${resources?.workStations?.titlePlural}`,
    disabled:
      selectedRecordsS?.some((r) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(r?.status)) ||
      selectedRecordsS?.length === 0,
    onClick: () => {
      if (viewType === 'table-view') {
        workOrderListRef.current?.setWorkStationAssignDialog(true);
      } else {
        setWorkStationAssignDialog({ open: true, multiple: true });
      }
    }
  };

  const addProductConsumablesButton = {
    disabled: selectedRecordsS?.length === 0,
    label: 'Add Products/Consumables',
    onClick: () => setConsumablesDialog({ open: true, multiple: true })
  };

  const checkUniqWarehouse = (selectedRecords) => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      return true;
    } else {
      return false;
    }
  };

  const isCreateRepairOrderDisabled = (selectedRecords) => {
    return (
      selectedRecords?.length === 0 ||
      selectedRecords.some((r) => r?.repairOrderId) ||
      selectedRecords?.some(
        (r) =>
          ![
            ASSET_STATUS.new,
            ASSET_STATUS.available,
            ASSET_STATUS.scrap,
            ASSET_STATUS.underReview,
            ASSET_STATUS.needRepair,
            ASSET_STATUS.needRecert,
            ASSET_STATUS.customerPossession
          ].includes(r?.assetStatus)
      ) ||
      selectedRecords.some((r) => r?.currentOwnerType != INVENTORY_OWNER_TYPE.brand) ||
      !checkUniqWarehouse(selectedRecords)
    );
  };

  const createRepairOrderButton = {
    disabled: viewType === 'table-view' ? isCreateRepairOrderDisabled(selectedRecords) : isCreateRepairOrderDisabled(selectedRecordsP),
    label: `Create ${resources?.repairOrder?.titleSingular}`,
    onClick: () => {
      setRepairOrderDialog(true);
    }
  };

  const newActionButtonProps: NewActionButtonProps<string, any> = useMemo(() => {
    const canShowWorkStationButton = permissions?.workStations?.isRead;
    const data: NewActionButtonProps<string, any> = {
      disabled: selectedRecords?.length === 0,
      horizontal: 'right',
      items:
        viewType === 'table-view'
          ? tableViewStatus === WORKORDER_SERVICE_STATUS.planned
            ? [createRepairOrderButton]
            : [assignTechnicianButton, ...(canShowWorkStationButton ? [assignWorkStationButton] : []), addProductConsumablesButton]
          : selectedRecords?.every((r) => r?.status === WORKORDER_SERVICE_STATUS.planned)
            ? [...(viewType === 'card-view' ? [createRepairOrderButton] : [])]
            : selectedRecords?.every((r) => r?.status !== WORKORDER_SERVICE_STATUS.planned)
              ? [
                assignTechnicianButton,
                ...(canShowWorkStationButton ? [assignWorkStationButton] : []),
                ...(viewType === 'card-view' ? [addProductConsumablesButton] : [])
              ]
              : [
                assignTechnicianButton,
                ...(canShowWorkStationButton ? [assignWorkStationButton] : []),
                ...(viewType === 'card-view' ? [addProductConsumablesButton, createRepairOrderButton] : [])
              ]
    };
    return data;
  }, [resources?.workStations?.titlePlural, selectedRecords, selectedRecordsS, selectedRecordsP, viewType, tableViewStatus]);

  const statusMenuItems = useMemo(() => {
    return [
      ...(permissions?.workOrderPlanning?.isRead && selectedResource?.value === sidebarResource.repairOrder
        ? [
          {
            label: WORKORDER_SERVICE_STATUS.planned,
            selected: tableViewStatus === WORKORDER_SERVICE_STATUS.planned,
            value: WORKORDER_SERVICE_STATUS.planned,
            startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.planned]
          }
        ]
        : []),
      {
        label: WORKORDER_SERVICE_STATUS.pending,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.pending,
        value: WORKORDER_SERVICE_STATUS.pending,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.pending]
      },
      {
        label: WORKORDER_SERVICE_STATUS.inProgress,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgress,
        value: WORKORDER_SERVICE_STATUS.inProgress,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.inProgress]
      },
      {
        label: WORKORDER_SERVICE_STATUS.completed,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.completed,
        value: WORKORDER_SERVICE_STATUS.completed,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.completed]
      },
      {
        label: WORKORDER_SERVICE_STATUS.skipped,
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.skipped,
        value: WORKORDER_SERVICE_STATUS.skipped,
        startIcon: workOrderIconMap[WORKORDER_SERVICE_STATUS.skipped]
      }
    ] as NewActionButtonProps<string, any>['items'];
  }, [tableViewStatus, selectedResource]);

  const resourceItems = useMemo(() => {
    const value = viewType === 'calendar-view' ? resourceType?.value : selectedResource?.value;
    return [
      ...(viewType === 'calendar-view'
        ? [
          {
            label: resources?.workOrder?.titlePlural,
            selected: value === sidebarResource.workOrder,
            value: sidebarResource.workOrder
          }
        ]
        : []),
      ...(permissions?.repairOrder?.isRead
        ? [
          {
            label: resources?.repairOrder?.titlePlural,
            selected: value === sidebarResource.repairOrder,
            value: sidebarResource.repairOrder
          }
        ]
        : []),
      ...(permissions?.productionOrder?.isRead
        ? [
          {
            label: resources?.productionOrder?.titlePlural,
            selected: value === sidebarResource.productionOrder,
            value: sidebarResource.productionOrder
          }
        ]
        : []),
      ...(permissions?.assemblyOrder?.isRead
        ? [
          {
            label: resources?.assemblyOrder?.titlePlural,
            selected: value === sidebarResource.assemblyOrder,
            value: sidebarResource.assemblyOrder
          }
        ]
        : [])
    ];
  }, [selectedResource, resourceType, viewType]);

  const moreButtonMenuItems: NewActionButtonProps<string, any>['items'] = useMemo(() => {
    return [
      {
        visible: permissions?.repairOrder?.isCreate || false,
        label: `${resources?.repairOrder?.titlePlural}`,
        onClick: () => window.open(`${routes?.repairOrder?.path}`)
      },
      {
        visible: permissions?.productionOrder?.isCreate || false,
        label: `${resources?.productionOrder?.titlePlural}`,
        onClick: () => window.open(`${routes?.productionOrder?.path}`)
      },
      {
        visible: permissions?.assemblyOrder?.isCreate || false,
        label: `${resources?.assemblyOrder?.titlePlural}`,
        onClick: () => window.open(`${routes?.assemblyOrder?.path}`)
      }
    ] as NewActionButtonProps<string, any>['items'];
  }, []);

  const handleApplyFilter = (filterByIdsP = filterByIds) => {
    setShowFilter(false);
    const queryString = getQueryString(true, filterByIdsP);
    setFilterQuery(queryString);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.workOrderSupervisor, title: resources?.workOrderSupervisor?.titlePlural }]} />
        <div className="flex items-center gap-2">
          {permissions?.workOrderPlanning?.isRead && (
            <ThemeButton
              iconForMobile={false}
              onClick={() => {
                setOpenWorkOrderScheduler(true);
              }}
              mobileTooltip={`Scheduler`}
            >
              Scheduler
            </ThemeButton>
          )}
          {permissions?.workOrder?.isCreate && (
            <ThemeButton
              iconForMobile={false}
              onClick={() => {
                window.open(`${routes?.workOrder?.path}`);
              }}
              mobileTooltip={`${resources?.workOrder?.titlePlural}`}
            >
              {`${resources?.workOrder?.titlePlural}`}
            </ThemeButton>
          )}
          {moreButtonMenuItems?.find((e) => e.visible) && (
            <ButtonMenu
              showChevron={true}
              items={moreButtonMenuItems}
              horizontal="right"
              slot={
                ((props) => (
                  <HtmlTooltip title={'More'}>
                    <IconButton aria-haspopup="true" color="primary" size="small" title="More" {...props}>
                      <MoreVert />
                    </IconButton>
                  </HtmlTooltip>
                )) as any
              }
            />
          )}
        </div>
      </div>
      <div className="main-container">
        <div className="header-panel pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {['card-view', 'table-view'].includes(viewType) ? (
                <>
                  <DateRangePicker horizontal="left" date={globalFilters} setDate={setGlobalFilters} />
                  {viewType === 'table-view' && (
                    <ButtonMenu
                      showChevron={true}
                      items={statusMenuItems}
                      onItemClick={(e, item) => {
                        tableDispatch({ type: 'pageChange', page: 0 });
                        setTableViewStatus(item.value as TableViewStatus);
                        if (item?.value === WORKORDER_SERVICE_STATUS.planned) {
                          setSelectedResource({
                            label: resources?.repairOrder?.titlePlural,
                            selected: selectedResource?.value === sidebarResource.repairOrder,
                            value: sidebarResource.repairOrder
                          });
                        }
                      }}
                    >
                      <span className="flex items-center gap-2 [&_svg]:text-[18px]">
                        {workOrderIconMap[tableViewStatus]}
                        Status: {tableViewStatus}
                      </span>
                    </ButtonMenu>
                  )}
                  {tableViewStatus !== WORKORDER_SERVICE_STATUS.planned && (
                    <ButtonMenu
                      showChevron={true}
                      items={resourceItems}
                      onItemClick={(e, item: any) => {
                        setSelectedResource(item);
                      }}
                    >
                      <span className="flex items-center gap-2 [&_svg]:text-[18px]">{selectedResource?.label}</span>
                    </ButtonMenu>
                  )}
                </>
              ) : (
                <ButtonMenu
                  showChevron={true}
                  items={resourceItems}
                  onItemClick={(e, item: any) => {
                    setResourceType(item);
                  }}
                >
                  <span className="flex items-center gap-2 [&_svg]:text-[18px]">{resourceType?.label}</span>
                </ButtonMenu>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <IconButtonTabs
                onItemClick={resetSelectedRecords}
                items={
                  [
                    {
                      value: 'card-view',
                      icon: <MdViewWeek />,
                      tooltip: 'Card View'
                    },
                    {
                      value: 'table-view',
                      icon: <TfiLayoutListThumbAlt />,
                      tooltip: 'Table View'
                    },
                    {
                      value: 'calendar-view',
                      icon: <FaRegCalendar />,
                      tooltip: 'Calendar View'
                    }
                  ] as const
                }
                setValue={setViewType}
                value={viewType}
              />
              <HtmlTooltip title={'Refresh'}>
                <IconButton style={{ width: 32, height: 32 }} size="small" onClick={onClickRefreshIcon}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </div>
          </div>
        </div>
        {viewType === 'card-view' && (
          <div className="pt-2">
            <CardView
              renderedFrom={renderedFrom}
              headerSlot={
                <div className="min-h-[32px]">
                  <DetailsPageHeader
                    isAddButtonVisible={false}
                    isActionButtonVisible={false}
                    isNewActionButtonVisible={selectedRecords.length > 0}
                    newActionButtonProps={newActionButtonProps}
                    actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
                    leftSideContents={
                      <div className="flex items-center gap-2">
                        <ThemeButton
                          mobileTooltip="Apply Filters"
                          startIcon={<BiFilterAlt className="-ml-1 mr-1 mt-[1px]" />}
                          iconForMobile={<BiFilterAlt />}
                          onClick={() => {
                            setShowFilter(true);
                          }}
                        >
                          Show Filters
                        </ThemeButton>
                        <DisplayFilterChip
                          filterTerm={filterTerm}
                          resourceColumns={FIELD_TO_FILTER}
                          deepFilters={[]}
                          filterByIds={filterByIds}
                          fetchResourceData={(deepFilter, filterById) => {
                            handleApplyFilter(filterById);
                          }}
                          setDeepFilters={null}
                          setFilterByIds={setFilterByIds}
                        />
                      </div>
                    }
                    hasXpadding={false}
                    hasYpadding={false}
                    className="pt-4"
                  />
                </div>
              }
              state={cardState}
              setOnClickData={setOnClickData}
              setOpen={setOpen}
              filterQuery={filterQuery}
            />
          </div>
        )}
        {viewType === 'calendar-view' && (
          <div className="pt-2">
            <CalendarView filterQuery={filterQuery} reference={resourceType?.value} ref={ref} setOpen={setOpen} />
          </div>
        )}
        {viewType === 'table-view' && (
          <div className="pt-4">
            <GridView
              columns={columnsDef}
              renderedFrom={renderedFrom}
              state={tableState}
              dispatch={tableDispatch}
              filterQuery={filterQuery}
              ref={workOrderListRef}
              status={tableViewStatus}
              selectedResource={selectedResource?.value}
              consumablesDialog={consumablesDialog.open}
              setConsumablesDialog={setConsumablesDialog}
              repairOrderDialog={repairOrderDialog}
              setRepairOrderDialog={setRepairOrderDialog}
              tableHead={
                <DetailsPageHeader
                  isAddButtonVisible={false}
                  isActionButtonVisible={false}
                  isNewActionButtonVisible={selectedRecords.length > 0}
                  newActionButtonProps={newActionButtonProps}
                  actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
                  leftSideContents={
                    <div className="flex items-center gap-2">
                      <ThemeButton
                        mobileTooltip="Apply Filters"
                        startIcon={<BiFilterAlt className="-ml-1 mr-1 mt-[1px]" />}
                        iconForMobile={<BiFilterAlt />}
                        onClick={() => {
                          setShowFilter(true);
                        }}
                      >
                        Show Filters
                      </ThemeButton>
                      <DisplayFilterChip
                        filterTerm={filterTerm}
                        resourceColumns={FIELD_TO_FILTER}
                        deepFilters={[]}
                        filterByIds={filterByIds}
                        fetchResourceData={(deepFilter, filterById) => {
                          handleApplyFilter(filterById);
                        }}
                        setDeepFilters={null}
                        setFilterByIds={setFilterByIds}
                      />
                    </div>
                  }
                  hasXpadding={false}
                  hasYpadding={false}
                />
              }
            />
          </div>
        )}
      </div>
      {assignTechnicianDialog.open && (
        <AssignTechniciansDialog
          warehouse={assignTechnicianDialog.multiple ? selectedRecordsS[0]?.warehouseId : selectedServiceData?.warehouseId}
          workOrderData={
            assignTechnicianDialog.multiple
              ? selectedRecordsS?.map((r) => ({
                uniqueId: r?.uniqueId,
                workOrderId: r?.workOrderId
              }))
              : [
                {
                  uniqueId: selectedServiceData?.uniqueId,
                  workOrderId: selectedServiceData?.workOrderId
                }
              ]
          }
          assignedUsers={
            assignTechnicianDialog.multiple
              ? selectedRecordsS?.every((val) => isEqual(val?.oriAssignedUsers, selectedRecordsS[0]?.oriAssignedUsers))
                ? selectedRecordsS[0]?.oriAssignedUsers
                : []
              : selectedServiceData?.oriAssignedUsers
          }
          reference={'service'}
          handleClose={() => {
            setAssignTechnicianDialog({ open: false, multiple: false });
          }}
          handleSucess={() => {
            setAssignTechnicianDialog({ open: false, multiple: false });
            resetSelectedRecords();
            onClickRefreshIcon();
          }}
          competencies={assignTechnicianDialog.multiple ? selectedRecordsS[0]?.competencies : selectedServiceData?.competencies}
        />
      )}
      {workStationAssignDialog.open && (
        <AssignWorkStationDialog
          warehouse={workStationAssignDialog.multiple ? selectedRecordsS[0]?.warehouseId : selectedServiceData?.warehouseId}
          workOrderData={
            workStationAssignDialog.multiple
              ? selectedRecordsS?.map((r) => ({
                uniqueId: r?.uniqueId,
                workOrderId: r?.workOrderId
              }))
              : [
                {
                  uniqueId: selectedServiceData?.uniqueId,
                  workOrderId: selectedServiceData?.workOrderId
                }
              ]
          }
          workStations={
            workStationAssignDialog.multiple
              ? selectedRecordsS?.every((val) => isEqual(val?.oriAssignedWorkStations, selectedRecordsS[0]?.oriAssignedWorkStations))
                ? selectedRecordsS[0]?.oriAssignedWorkStations
                : []
              : selectedServiceData?.oriAssignedWorkStations
          }
          handleClose={() => {
            setWorkStationAssignDialog({ open: false, multiple: false });
          }}
          handleSucess={() => {
            setWorkStationAssignDialog({ open: false, multiple: false });
            resetSelectedRecords();
            onClickRefreshIcon();
          }}
        />
      )}
      {openWorkOrderScheduler && (
        <WorkOrderSchedulerDialog
          onClose={() => setOpenWorkOrderScheduler(false)}
          onSuccess={() => {
            onClickRefreshIcon();
            setOpenWorkOrderScheduler(false);
          }}
        />
      )}
      {isOpen && (
        <WorkOrderDetailDialog
          workOrderId={onClickData.workOrderId}
          handleClose={() => {
            setOpen(false);
            resetSelectedRecords();
          }}
        />
      )}
      {consumablesDialog.open && (
        <AssignProductDialog
          handleCloseDialog={() => setConsumablesDialog({ open: false, multiple: false })}
          ids={[]}
          onSuccess={(rows) => {
            if (viewType === 'card-view') {
              handleAddConsumables(rows, consumablesDialog?.multiple ? selectedRecordsS : [selectedServiceData]);
            } else {
              workOrderListRef.current?.handleAddConsumables(rows, selectedRecords);
            }
          }}
          serialized={false}
          isSubmitting={workOrderListRef.current?.submitting}
          extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
        />
      )}
      {repairOrderDialog && (
        <ManageRepairOrder
          onClose={() => {
            setRepairOrderDialog(false);
          }}
          onSuccess={(data) => {
            if (viewType === 'card-view') {
              handleAddAssets(data, selectedServiceData ? [selectedServiceData] : selectedRecordsP);
            } else {
              workOrderListRef.current?.handleAddAssets(data, selectedRecords);
            }
          }}
          referenceType={sidebarResource.workOrderPlanning}
          referenceData={{
            warehouse: selectedServiceData ? selectedServiceData?.warehouseId : selectedRecords[0]?.warehouseId,
            type: REPAIR_ORDER_TYPE.internal
          }}
        />
      )}
      {showFilter && (
        <Filter
          onClose={() => {
            setShowFilter(false);
            cardState.setFilterQuery('');
          }}
          loading={false}
          filterTitle={resources?.workOrderSupervisor?.titleSingular}
          resource={sidebarResource.workOrderSupervisor}
          columns={FIELD_TO_FILTER}
          onApplyFilter={handleApplyFilter}
          deepFilters={[]}
          setDeepFilters={null}
          filterByIds={filterByIds}
          setFilterByIds={setFilterByIds}
          filterTerm={filterTerm}
          setFilterTerm={setFilterTerm}
        />
      )}
    </section>
  );
};

export default WorkOrderSupervisor;


const RenderAssignOptions = ({ openAssignHandler, data, permissions, resources, isCreateRepairOrderDisabled }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <IconButton
        size="small"
        color="primary"
        aria-label="menu"
        disabled={[WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(data?.status)}
        onClick={(event) => {
          handleOpenMenu(event);
        }}
      >
        <MoreHorizIcon />
      </IconButton>
      {anchorEl && (
        <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
          {data?.status === WORKORDER_SERVICE_STATUS.planned ? (
            <MenuItem
              onClick={() => {
                openAssignHandler('createRepairOrder', data);
                setAnchorEl(null);
              }}
              disabled={isCreateRepairOrderDisabled([data])}
            >
              {`Create ${resources?.repairOrder?.titleSingular}`}
            </MenuItem>
          ) : (
            <>
              <MenuItem
                onClick={() => {
                  openAssignHandler('assignTechnician', data);
                  setAnchorEl(null);
                }}
              >
                {'Assign Technicians'}
              </MenuItem>
              {permissions?.workStations?.isRead && (
                <MenuItem
                  onClick={() => {
                    openAssignHandler('assignWorkStations', data);
                    setAnchorEl(null);
                  }}
                >
                  {`Assign ${resources?.workStations?.titlePlural}`}
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  openAssignHandler('addProductConsumables', data);
                  setAnchorEl(null);
                }}
              >
                {'Add Products/Consumables'}
              </MenuItem>
            </>
          )}
        </Menu>
      )}
    </>
  );
};

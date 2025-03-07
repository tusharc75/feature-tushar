import { IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FaRegCalendar } from 'react-icons/fa';
import { MdViewWeek } from 'react-icons/md';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ButtonMenu, { ButtonMenuProps } from 'src/components/ButtonMenu';
import CardColTimeline, { datarowInterface, useCardReducer } from 'src/components/CardColTimeline';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DateRangePicker, { DateRange } from 'src/components/DateRangePicker';
import IconButtonTabs from 'src/components/IconButtonTabs';
import {
  ASSET_STATUS,
  INVENTORY_OWNER_TYPE,
  MATERIAL_SUB_TYPE,
  REPAIR_ORDER_TYPE,
  WORKORDER_SERVICE_STATUS,
  cn,
  dateFormatToSend,
  sidebarResource,
  workOrder,
  workOrderColormap,
  workOrderIconMap,
  workOrderSupervisor
} from 'src/constants/helpers';
import WorkOrderCalendar from 'src/pages/WorkOrderSupervisor/WorkOrderCalendar';
import WorkOrderDetailDialog from 'src/pages/WorkOrderSupervisor/WorkOrderDetailDialog';
import WorkOrderList, { WorkOrderListRef } from 'src/pages/WorkOrderSupervisor/WorkOrderList';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import AssignTechniciansDialog from '../WorkOrder/Service/AssignTechniciansDialog';
import AssignWorkStationDialog from '../WorkOrder/Service/AssignWorkStationDialog';
import { camelCase, isEqual, map, uniq, uniqBy } from 'lodash';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import WorkOrderSchedulerDialog from 'src/pages/WorkOrderSupervisor/WorkOrderSchedulerDialog';
import Filter from 'src/components/Filter';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { BiFilterAlt } from 'react-icons/bi';
import dayjs from 'dayjs';
import ManageRepairOrder from 'src/pages/RepairOrder/ManageRepairOrder';
import { queryStringPlanned } from 'src/pages/WorkOrderSupervisor/helper';

const LIMIT = 25;

type ViewType = 'card-view' | 'table-view' | 'calendar-view';

type TableViewStatus =
  | typeof WORKORDER_SERVICE_STATUS.planned
  | typeof WORKORDER_SERVICE_STATUS.pending
  | typeof WORKORDER_SERVICE_STATUS.inProgress
  | typeof WORKORDER_SERVICE_STATUS.completed;

const renderedFrom = camelCase(sidebarResource?.workOrderSupervisor);

const WorkOrderSupervisor = () => {
  const { state, dispatch } = useCardReducer();
  const { limit, selectedRecords: cardSelectedRecords, visibleColumns, filterQuery } = state;
  const { state: tableState, dispatch: tableDispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords: tableSelectedRecords } = tableState;

  const selectedRecords = useMemo(() => [...cardSelectedRecords, ...tableSelectedRecords], [cardSelectedRecords, tableSelectedRecords]);

  const selectedRecordsP = useMemo(() => [...selectedRecords?.filter((r) => r?.status === WORKORDER_SERVICE_STATUS.planned)], [selectedRecords]);
  const selectedRecordsS: any = useMemo(() => [...selectedRecords?.filter((r) => r?.status != WORKORDER_SERVICE_STATUS.planned)], [selectedRecords]);

  const resetSelectedRecords = () => {
    dispatch({ type: 'selection', selectedRecords: [] });
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      permissions,
      resources,
      user: { user }
    }
  }: any = useData();
  const workOrderListRef = useRef<WorkOrderListRef>();
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState({ open: false, multiple: false });
  const [assignTechnicianDialog, setAssignTechnicianDialog] = useState({ open: false, multiple: false });
  const [tableViewStatus, setTableViewStatus] = useState<TableViewStatus>('Pending');

  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [openWorkOrderScheduler, setOpenWorkOrderScheduler] = useState(false);
  const [viewType, setViewType] = useState<ViewType>(() => {
    return (localStorage.getItem(`${renderedFrom}_view`) as ViewType) || 'card-view';
  });
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, multiple: false });
  const [repairOrderDialog, setRepairOrderDialog] = useState(false);

  const [globalFilters, setGlobalFilters] = useState<DateRange>({
    from: dayjs.tz().startOf('year').toDate(),
    to: dayjs.tz().endOf('year').toDate()
  });
  const [resourceType, setResourceType] = useState('workOrder');
  const [isOpen, setOpen] = useState({ open: false, id: null });
  const [showFilter, setShowFilter] = useState(false);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});

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

  useEffect(() => {
    resetSelectedRecords();
  }, [globalFilters]);

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
    ...(selectedResource?.value === sidebarResource.repairOrder
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
    ...(selectedResource?.value === sidebarResource.productionOrder
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
    ...([sidebarResource.repairOrder, sidebarResource.productionOrder]?.includes(selectedResource?.value)
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
    ...(selectedResource?.value === sidebarResource.assemblyOrder
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

  useEffect(() => {
    const cardDataRows: datarowInterface[] = [
      {
        accessor: 'serviceName',
        title: resources?.serviceMaster?.titleSingular,
        type: 'title',
        link: (data) => `${routes?.serviceMasterDetail?.path}/${data?.service?.optionValue}`,
        target: '_blank'
      },
      {
        accessor: 'workOrderNumber',
        title: resources?.workOrder?.titleSingular,
        type: 'link',
        link: (data) => `${routes?.workOrderDetail?.path}/${data?.workOrder}`,
        target: '_blank'
      },
      {
        accessor: 'repairOrderNumber',
        type: 'link',
        title: resources?.repairOrder?.titleSingular,
        link: (data) => `${routes?.repairOrderDetail?.path}/${data?.repairOrderId}`,
        target: '_blank'
      },
      {
        accessor: 'productionOrderNumber',
        type: 'link',
        title: resources?.productionOrder?.titleSingular,
        link: (data) => `${routes?.productionOrderDetail?.path}/${data?.productionOrderId}`,
        target: '_blank'
      },
      {
        accessor: 'assemblyOrderNumber',
        type: 'link',
        title: resources?.assemblyOrder?.titleSingular,
        link: (data) => `${routes?.assemblyOrderDetail?.path}/${data?.assemblyOrderId}`,
        target: '_blank'
      },
      {
        accessor: 'serializedAsset',
        title: resources?.serializedAsset?.titleSingular,
        type: 'link',
        link: (data) => `${routes.serializedAssetDetail.path}/${data?.serializedAssetId}`,
        target: '_blank'
      },
      { accessor: 'spoolNumber', title: 'Spool Number', type: 'text' },
      { accessor: 'assignedUser', title: 'Technician', type: 'text' },
      { accessor: 'workStation', title: resources?.workStations?.titleSingular, type: 'text' },
      { accessor: 'expectedCompletionDate', title: 'Due Date', type: 'date' },
      { accessor: 'dueDate', title: 'Due Date', type: 'date' },
      { accessor: 'createDate', title: 'Create Date', type: 'date' },
      {
        type: 'tooltip',
        accessor: 'tooltip',
        renderer: (data) => (
          <RenderAssignOptions
            openAssignHandler={openAssignHandler}
            data={data}
            permissions={permissions}
            resources={resources}
            isCreateRepairOrderDisabled={isCreateRepairOrderDisabled}
          />
        )
      }
    ];

    let tempvisibleColumns = [];
    if (permissions?.workOrderPlanning?.isRead) {
      tempvisibleColumns.push(WORKORDER_SERVICE_STATUS.planned);
    }
    tempvisibleColumns = [
      ...tempvisibleColumns,
      WORKORDER_SERVICE_STATUS.pending,
      WORKORDER_SERVICE_STATUS.inProgress,
      WORKORDER_SERVICE_STATUS.completed
    ];

    dispatch({
      type: 'initialize',
      columnOrder: Object.values(WORKORDER_SERVICE_STATUS),
      rowDef: cardDataRows,
      visibleColumns: tempvisibleColumns,
      limit: LIMIT
    });
    localStorage.setItem(`${renderedFrom}_view`, viewType);

    return () =>
      dispatch({
        type: 'reset'
      });
  }, [viewType]);

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

  const fetchSingleColumn = useCallback(
    (column: string, page = 0, appendData = true, filterQuery) => {
      let api = `${workOrderSupervisor.api}/work-order-service?page=${page}&status=${column}&limit=${limit}&resource=${selectedResource?.value}${filterQuery}`;
      if (column === WORKORDER_SERVICE_STATUS.planned) {
        const filterByIds = queryStringPlanned(filterQuery);
        api = `${workOrder.api}/work-order-planning?page=${page}&limit=${limit}&deepFilter=${encodeURIComponent(
          JSON.stringify([
            {
              field: 'status',
              term: WORKORDER_SERVICE_STATUS.pending
            }
          ])
        )}`;
        if (filterByIds?.length) {
          api = `${api}&filterById=${JSON.stringify(filterByIds)}&filterType=and`;
        }
      }
      dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: true }) });
      axiosInstance()
        .get(api)
        .then(({ data: { data, count } }) => {
          let countC = count;
          const setData = (prev: { [key: string]: any[] }, appendData: boolean) => {
            let rows: any = [];
            if (column === WORKORDER_SERVICE_STATUS.planned) {
              const { data: dataD, count } = data;
              countC = count;
              rows = dataD?.map((item) => {
                const newObj = { ...item };
                newObj['serializedAsset'] = newObj?.asset?.assetNumber;
                newObj['serializedAssetId'] = newObj?.asset?._id;
                newObj['repairOrderNumber'] = newObj?.repairOrder?.optionLabel;
                newObj['warehouse'] = newObj?.asset?.warehouse || '';
                newObj['warehouseId'] = newObj?.asset?.warehouseId || '';
                newObj['assetStatus'] = newObj?.asset?.status;
                newObj['currentOwnerType'] = newObj?.asset?.currentOwnerType;
                newObj['ownerType'] = newObj?.asset?.ownerType;
                newObj['serviceName'] = newObj?.service?.optionLabel;
                newObj['assignedUser'] = newObj?.assignedUsers?.map((e) => e?.optionLabel)?.toString();
                newObj['workStation'] = newObj?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString();
                newObj['status'] = WORKORDER_SERVICE_STATUS.planned;
                return newObj;
              });
            } else {
              rows = data.map((item) => {
                const newObj = { ...item };
                newObj['productionOrderId'] = newObj?.productionOrder?.productionOrderNumber;
                newObj['productionOrderNumber'] = newObj?.productionOrder?._id;
                newObj['repairOrderId'] = newObj?.repairOrder?._id;
                newObj['repairOrderNumber'] = newObj?.repairOrder?.repairOrderNumber;
                newObj['assemblyOrderId'] = newObj?.assemblyOrder?._id;
                newObj['assemblyOrderNumber'] = newObj?.assemblyOrder?.assemblyOrderNumber;
                newObj['workOrder'] = newObj?.workOrderDetail?._id;
                newObj['workOrderNumber'] = newObj?.workOrderDetail?.workOrderNumber;
                newObj['serviceName'] = newObj?.service?.optionLabel;
                newObj['assignedUser'] = newObj?.assignedUsers?.map((e) => e?.optionLabel)?.toString();
                newObj['workStation'] = newObj?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString();
                newObj['serializedAsset'] = item?.workOrderDetail?.serializedAsset?.optionLabel;
                newObj['serializedAssetId'] = item?.workOrderDetail?.serializedAsset?.optionValue;
                newObj['createDate'] = item?.workOrderDetail?.createDate;
                newObj['warehouse'] = item?.workOrderDetail?.warehouse;
                return newObj;
              });
            }
            const newData = prev;
            if (!appendData) {
              newData[column] = rows;
            } else {
              if (prev[column] && prev[column]?.length) {
                newData[column] = [...prev[column], ...rows];
              } else {
                newData[column] = rows;
              }
            }
            return newData;
          };
          dispatch({ type: 'setData', setData: (prev) => setData(prev, appendData), setCount: (prevCount) => ({ ...prevCount, [column]: countC }) });
          dispatch({ type: 'page', setPage: (prev) => ({ ...prev, [column]: page }) });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        })
        .finally(() => {
          dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: false }) });
        });
    },
    [dispatch, limit, toastConfig, selectedResource]
  );

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
      dispatch({ type: 'setFilterQuery', filterQuery: query });
    } else {
      dispatch({ type: 'setFilterQuery', filterQuery: '' });
    }
  }, [globalFilters.from, globalFilters.to, dispatch, getQueryString, globalFilters, viewType]);

  const onClickRefreshIcon = () => {
    if (viewType === 'calendar-view') {
      if (ref?.current) {
        ref?.current?.childFunction();
      }
    } else if (viewType === 'table-view') {
      workOrderListRef?.current?.refreshGrid();
    } else {
      dispatch({ type: 'refreshData' });
    }
  };

  useEffect(() => {
    const tempVisibleColumns = [];
    if (permissions?.workOrderPlanning?.isRead && selectedResource?.value === sidebarResource.repairOrder) {
      tempVisibleColumns.push(WORKORDER_SERVICE_STATUS.planned);
    }
    dispatch({
      type: 'visibleColumns',
      visibleColumns: [
        ...tempVisibleColumns,
        WORKORDER_SERVICE_STATUS.pending,
        WORKORDER_SERVICE_STATUS.inProgress,
        WORKORDER_SERVICE_STATUS.completed
      ]
    });
    onClickRefreshIcon();
  }, [selectedResource]);

  const handleAddConsumables = (rows, records = []) => {
    const data: any = [];
    const workOrderId: any = uniqBy(records, 'workOrder').map((record) => record?.workOrder);

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
        visibleColumns?.map((c) => {
          fetchSingleColumn(c, 0, false, filterQuery);
        });
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
        fetchSingleColumn(WORKORDER_SERVICE_STATUS.planned, 0, false, filterQuery);
        setRepairOrderDialog(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const assignTechnicianButton = {
    label: 'Assign Technicians',
    disabled: selectedRecordsS?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.completed) || selectedRecordsS?.length === 0,
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
    disabled: selectedRecordsS?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.completed) || selectedRecordsS?.length === 0,
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

  const newActionButtonProps: NewActionButtonProps<string> = useMemo(() => {
    const canShowWorkStationButton = permissions?.workStations?.isRead;

    const data: NewActionButtonProps<string> = {
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
      }
    ] as ButtonMenuProps<string>['items'];
  }, [tableViewStatus]);

  const resourceItems = useMemo(() => {
    return [
      ...(permissions?.repairOrder?.isRead
        ? [
            {
              label: resources?.repairOrder?.titlePlural,
              selected: selectedResource?.value === sidebarResource.repairOrder,
              value: sidebarResource.repairOrder
            }
          ]
        : []),
      ...(permissions?.productionOrder?.isRead
        ? [
            {
              label: resources?.productionOrder?.titlePlural,
              selected: selectedResource?.value === sidebarResource.productionOrder,
              value: sidebarResource.productionOrder
            }
          ]
        : []),
      ...(permissions?.assemblyOrder?.isRead
        ? [
            {
              label: resources?.assemblyOrder?.titlePlural,
              selected: selectedResource?.value === sidebarResource.assemblyOrder,
              value: sidebarResource.assemblyOrder
            }
          ]
        : [])
    ] as ButtonMenuProps<string>['items'];
  }, [selectedResource]);

  const moreButtonMenuItems: ButtonMenuProps<string>['items'] = useMemo(() => {
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
    ] as ButtonMenuProps<string>['items'];
  }, []);

  const handleApplyFilter = (filterByIdsP = filterByIds) => {
    setShowFilter(false);
    const queryString = getQueryString(true, filterByIdsP);
    dispatch({ type: 'setFilterQuery', filterQuery: queryString });
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
                      }}
                    >
                      <span className="flex items-center gap-2 [&_svg]:text-[18px]">
                        {workOrderIconMap[tableViewStatus]}
                        Status: {tableViewStatus}
                      </span>
                    </ButtonMenu>
                  )}
                  <ButtonMenu
                    showChevron={true}
                    items={resourceItems}
                    onItemClick={(e, item: any) => {
                      setSelectedResource(item);
                    }}
                  >
                    <span className="flex items-center gap-2 [&_svg]:text-[18px]">{selectedResource?.label}</span>
                  </ButtonMenu>
                </>
              ) : (
                <div className="flex">
                  <ToggleButtonGroup size="small" exclusive value={resourceType} onChange={(e, newVal) => {}}>
                    <ToggleButton value={'workOrder'} onClick={() => setResourceType('workOrder')}>
                      {resources?.workOrder?.titleSingular}
                    </ToggleButton>
                    <ToggleButton value={'repairOrder'} onClick={() => setResourceType('repairOrder')}>
                      {resources?.repairOrder?.titleSingular}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </div>
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
        {viewType !== 'table-view' && (
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
        )}
        {viewType === 'card-view' && (
          <div className="pt-2">
            <CardColTimeline
              height={'max(calc(100vh - 200px), 600px)'}
              getColColors={(colName) => workOrderColormap[colName]}
              fetchSingleColumn={fetchSingleColumn}
              state={state}
              dispatch={dispatch}
              passFailStatus={true}
              passFailAccessor="serviceStatus"
              cardOnClick={(e, data) => {
                if (data?.status != WORKORDER_SERVICE_STATUS.planned) {
                  setOpen({ open: true, id: data.workOrder });
                }
              }}
            />
          </div>
        )}
        {viewType === 'calendar-view' && (
          <div className="pt-2">
            <WorkOrderCalendar getFilterQuery={getQueryString} filterQuery={filterQuery} reference={resourceType} ref={ref} setOpen={setOpen} />
          </div>
        )}
        {viewType === 'table-view' && (
          <div className="pt-4">
            <WorkOrderList
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
          warehouse={assignTechnicianDialog.multiple ? selectedRecordsS[0]?.warehouse?.optionValue : selectedServiceData?.warehouse?.optionValue}
          workOrderData={
            assignTechnicianDialog.multiple
              ? selectedRecordsS?.map((r) => ({
                  uniqueId: r?.uniqueId,
                  workOrderId: r?.workOrder
                }))
              : [
                  {
                    uniqueId: selectedServiceData?.uniqueId,
                    workOrderId: selectedServiceData?.workOrder
                  }
                ]
          }
          assignedUsers={
            assignTechnicianDialog.multiple
              ? selectedRecordsS?.every((val) => isEqual(val?.assignedUsers, selectedRecordsS[0]?.assignedUsers))
                ? selectedRecordsS[0]?.assignedUsers
                : []
              : selectedServiceData?.assignedUsers
          }
          reference={'service'}
          handleClose={() => {
            setAssignTechnicianDialog({ open: false, multiple: false });
          }}
          handleSucess={() => {
            setAssignTechnicianDialog({ open: false, multiple: false });
            dispatch({ type: 'refreshData' });
          }}
          competencies={assignTechnicianDialog.multiple ? selectedRecordsS[0]?.competencies : selectedServiceData?.competencies}
        />
      )}
      {workStationAssignDialog.open && (
        <AssignWorkStationDialog
          warehouse={workStationAssignDialog.open ? selectedRecordsS[0]?.warehouse?.optionValue : selectedServiceData?.warehouse}
          workOrderData={
            workStationAssignDialog.multiple
              ? selectedRecordsS?.map((r) => ({
                  uniqueId: r?.uniqueId,
                  workOrderId: r?.workOrder
                }))
              : [
                  {
                    uniqueId: selectedServiceData?.uniqueId,
                    workOrderId: selectedServiceData?._id
                  }
                ]
          }
          workStations={
            workStationAssignDialog.multiple
              ? selectedRecordsS?.every((val) => isEqual(val?.assignedWorkStations, selectedRecordsS[0]?.assignedWorkStations))
                ? selectedRecordsS[0]?.assignedWorkStations
                : []
              : selectedServiceData?.assignedWorkStations
          }
          handleClose={() => {
            setWorkStationAssignDialog({ open: false, multiple: false });
          }}
          handleSucess={() => {
            setWorkStationAssignDialog({ open: false, multiple: false });
            dispatch({ type: 'refreshData' });
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
      {isOpen.open && (
        <WorkOrderDetailDialog
          workOrderId={isOpen?.id}
          handleClose={() => {
            setOpen({ open: false, id: null });
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
            dispatch({ type: 'setFilterQuery', filterQuery: '' });
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
        disabled={data?.status === WORKORDER_SERVICE_STATUS.completed}
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

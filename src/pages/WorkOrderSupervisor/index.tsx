import DateFnsUtils from '@date-io/date-fns';
import { Box, Button, IconButton, IconButtonProps, Menu, MenuItem } from '@material-ui/core';
import { ExpandMore, MoreVert } from '@material-ui/icons';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import RefreshIcon from '@material-ui/icons/Refresh';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment from 'moment';
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
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomFilter from 'src/components/Helpers/CustomFilter';
import IconButtonTabs from 'src/components/IconButtonTabs';
import WorkOrderCalendar from 'src/pages/WorkOrderSupervisor/WorkOrderCalendar';
import WorkOrderDetailDialog from 'src/pages/WorkOrderSupervisor/WorkOrderDetailDialog';
import WorkOrderList, { WorkOrderListRef } from 'src/pages/WorkOrderSupervisor/WorkOrderList';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import { MATERIAL_SUB_TYPE, WORKORDER_SERVICE_STATUS, cn, sidebarResource, workOrder, workOrderSupervisor } from '../../constants/helpers';
import AssignUserDialog from '../WorkOrder/Service/AssignUserDialog';
import AssignWorkStationDialog from '../WorkOrder/Service/AssignWorkStationDialog';

import WorkOrderSchedulerDialog from 'src/pages/WorkOrderSupervisor/WorkOrderSchedulerDialog';
import { camelCase, uniqBy } from 'lodash';
import { useTableReducer } from 'src/components/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { colormap } from 'src/pages/WorkOrderSupervisor/constants';

const LIMIT = 25;

type ViewType = 'card-view' | 'table-view' | 'calendar-view';

type TableViewStatus =
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

  const resetSelectedRecords = () => {
    dispatch({ type: 'selection', selectedRecords: [] });
    tableDispatch({ type: 'selection', selectedRecords: [] });
  };

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, resources }
  }: any = useData();
  const workOrderListRef = useRef<WorkOrderListRef>();
  const [selectedUser, setSelectedUser] = useState(null);
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState({ open: false, multiple: false });
  const [assignTechnicianDialog, setAssignTechnicianDialog] = useState({ open: false, multiple: false });
  const [tableViewStatus, setTableViewStatus] = useState<TableViewStatus>('Pending');

  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [fieldToFilterList, setFieldToFilterList] = useState([]);
  const [filterResourceQuery, setFilterResourceQuery] = useState({
    filterById: [],
    deepFilter: []
  });
  const [openWorkOrderScheduler, setOpenWorkOrderScheduler] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('card-view');
  const [consumablesDialog, setConsumablesDialog] = useState(false);

  const [globalFilters, setGlobalFilters] = useState<DateRange>({
    from: new Date(moment().startOf('month').format('YYYY/MM/DD')),
    to: new Date(moment().endOf('month').format('YYYY/MM/DD'))
  });
  const [resourceType, setResourceType] = useState('workOrder');
  const [isOpen, setOpen] = useState({ open: false, id: null });

  const ref: any = useRef();

  const FIELD_TO_FILTER = [
    {
      key: 'user',
      fieldName: 'user',
      fieldLabel: resources?.employeeMaster.titlePlural,
      resource: sidebarResource.employeeMaster,
      type: 'dropDown'
    },
    {
      key: 'serviceMaster',
      fieldName: 'service',
      fieldLabel: sidebarResource?.serviceMaster,
      resource: sidebarResource.serviceMaster,
      type: 'dropDown'
    },
    {
      key: 'workOrder',
      fieldName: 'workOrder',
      fieldLabel: sidebarResource?.workOrder,
      resource: sidebarResource.workOrder,
      type: 'dropDown'
    },
    {
      key: 'repairOrder',
      fieldName: 'repairOrder',
      fieldLabel: sidebarResource?.repairOrder,
      resource: sidebarResource?.repairOrder,
      type: 'dropDown'
    },
    {
      key: 'productionOrder',
      fieldName: 'productionOrder',
      fieldLabel: sidebarResource.productionOrder,
      resource: sidebarResource.productionOrder,
      type: 'dropDown'
    }
  ];

  useEffect(() => {
    const options: any = [];
    FIELD_TO_FILTER?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push(item);
      }
    });
    setFieldToFilterList(options);
  }, []);

  useEffect(() => {
    const cardDataRows: datarowInterface[] = [
      {
        accessor: 'workOrderNumber',
        title: 'Work Order',
        type: 'title',
        link: (data) => `${routes?.workOrderDetail?.path}/${data?.workOrder}`,
        target: '_blank'
      },
      {
        accessor: 'serviceName',
        title: resources?.quotation?.titleSingular,
        type: 'link',
        link: (data) => `${routes.serviceMasterDetail.path}/${data?.service?.optionValue}`,
        target: '_blank'
      },
      {
        accessor: 'productionOrderNumber',
        type: 'link',
        title: resources?.productionOrder?.titleSingular,
        link: (data) => `${routes?.productionOrderDetail?.path}/${data?.productionOrder?.optionValue}`,
        target: '_blank'
      },
      {
        accessor: 'repairOrderNumber',
        type: 'link',
        title: resources?.repairOrder?.titleSingular,
        link: (data) => `${routes?.repairOrderDetail?.path}/${data?.repairOrder?.optionValue}`,
        target: '_blank'
      },
      { accessor: 'spoolNumber', title: 'Spool Number', type: 'text' },
      { accessor: 'assignedUser', title: 'Technician', type: 'text' },
      { accessor: 'workStation', title: resources?.workStations?.titleSingular, type: 'text' },
      { accessor: 'expectedCompletionDate', title: 'Due Date', type: 'date' },
      {
        type: 'tooltip',
        accessor: 'tooltip',
        renderer: (data) => <RenderAssignOptions openAssignHandler={openAssignHandler} data={data} permissions={permissions} resources={resources} />
      }
    ];

    dispatch({
      type: 'initialize',
      columnOrder: Object.values(WORKORDER_SERVICE_STATUS),
      rowDef: cardDataRows,
      visibleColumns: [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress, WORKORDER_SERVICE_STATUS.completed],
      limit: LIMIT
    });

    return () =>
      dispatch({
        type: 'reset'
      });
  }, []);

  const openAssignHandler = (value: any, data: any) => {
    setSelectedServiceData(data);
    if (value === 'assignTechnician') {
      setAssignTechnicianDialog({ open: true, multiple: false });
    } else {
      setWorkStationAssignDialog({ open: true, multiple: false });
    }
  };

  const fetchSingleColumn = useCallback(
    (column: string, page = 0, appendData = true, filterQuery) => {
      let api = `${workOrderSupervisor.api}/work-order-service?page=${page}&status=${column}&limit=${limit}${filterQuery}`;
      dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: true }) });
      axiosInstance()
        .get(api)
        .then(({ data: { data, count } }) => {
          const setData = (prev: { [key: string]: any[] }, appendData: boolean) => {
            const rows = data.map((item) => {
              const newObj = { ...item };
              newObj['productionOrderNumber'] = newObj?.productionOrder?.optionLabel;
              newObj['repairOrderNumber'] = newObj?.repairOrder?.optionLabel;
              newObj['serviceName'] = newObj?.service?.optionLabel;
              newObj['assignedUser'] = newObj?.assignedUsers?.map((e) => e?.optionLabel)?.toString();
              newObj['workStation'] = newObj?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString();
              return newObj;
            });
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
          dispatch({ type: 'setData', setData: (prev) => setData(prev, appendData), setCount: (prevCount) => ({ ...prevCount, [column]: count }) });
          dispatch({ type: 'page', setPage: (prev) => ({ ...prev, [column]: page }) });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        })
        .finally(() => {
          dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: false }) });
        });
    },
    [dispatch, limit, toastConfig]
  );

  const getQueryString = useCallback(
    (selectDateFilter = true) => {
      let deepFilter = '';
      if (filterResourceQuery?.filterById?.length) {
        filterResourceQuery?.filterById?.forEach((f) => {
          deepFilter = `${deepFilter}&${f.field}=${f.term}`;
        });
      }

      if (globalFilters && selectDateFilter) {
        deepFilter = `${deepFilter}&from=${moment(globalFilters.from).format('YYYY/MM/DD')}&to=${moment(globalFilters.to).format('YYYY/MM/DD')}`;
      }
      return `${deepFilter}&filterType=and&filterByIdType=and`;
    },
    [globalFilters, selectedUser, filterResourceQuery]
  );

  useEffect(() => {
    if (selectedUser || globalFilters || filterResourceQuery?.filterById?.length) {
      const query = getQueryString();
      dispatch({ type: 'setFilterQuery', filterQuery: query });
    } else {
      dispatch({ type: 'setFilterQuery', filterQuery: '' });
    }
  }, [selectedUser, globalFilters.from, globalFilters.to, dispatch, getQueryString, globalFilters, viewType, filterResourceQuery]);

  const handleClearFilter = () => {
    setSelectedUser(null);
    setFilterResourceQuery({
      filterById: [],
      deepFilter: []
    });
  };

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
          parentId: null
        });
      });
    });
    console.log('visibleColumns', visibleColumns);
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
        setConsumablesDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const newActionButtonProps: NewActionButtonProps<string> = useMemo(() => {
    const data: NewActionButtonProps<string> = {
      disabled: selectedRecords?.length === 0,
      horizontal: 'right',
      items: [
        {
          label: 'Assign Technician',
          disabled: selectedRecords?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.completed) || selectedRecords?.length === 0,
          onClick: () => {
            if (viewType === 'table-view') {
              workOrderListRef.current?.setAssignTechnicianDialog(true);
            } else {
              setAssignTechnicianDialog({ open: true, multiple: true });
            }
          }
        },
        {
          label: `Assign ${resources?.workStations?.titlePlural}`,
          disabled: selectedRecords?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.completed) || selectedRecords?.length === 0,
          onClick: () => {
            if (viewType === 'table-view') {
              workOrderListRef.current?.setWorkStationAssignDialog(true);
            } else {
              setWorkStationAssignDialog({ open: true, multiple: true });
            }
          }
        },
        ...(['table-view', 'card-view']?.includes(viewType)
          ? [
              {
                disabled: selectedRecords?.length === 0,
                label: 'Add Products/Consumables',
                onClick: () => setConsumablesDialog(true)
              }
            ]
          : [])
      ]
    };
    return data;
  }, [resources?.workStations?.titlePlural, selectedRecords, viewType]);

  const statusMenuItems = useMemo(() => {
    return [
      {
        label: (
          <span className="flex items-center gap-2">
            <span className={cn('block h-2 w-2 rounded-full', colormap[WORKORDER_SERVICE_STATUS.pending].indicator)} />
            {WORKORDER_SERVICE_STATUS.pending}
          </span>
        ),
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.pending,
        value: WORKORDER_SERVICE_STATUS.pending
      },
      {
        label: (
          <span className="flex items-center gap-2">
            <span className={cn('block h-2 w-2 rounded-full', colormap[WORKORDER_SERVICE_STATUS.inProgress].indicator)} />
            {WORKORDER_SERVICE_STATUS.inProgress}
          </span>
        ),
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgress,
        value: WORKORDER_SERVICE_STATUS.inProgress
      },
      {
        label: (
          <span className="flex items-center gap-2">
            <span className={cn('block h-2 w-2 rounded-full', colormap[WORKORDER_SERVICE_STATUS.completed].indicator)} />
            {WORKORDER_SERVICE_STATUS.completed}
          </span>
        ),
        selected: tableViewStatus === WORKORDER_SERVICE_STATUS.completed,
        value: WORKORDER_SERVICE_STATUS.completed
      }
    ];
  }, [tableViewStatus]);

  const moreButtonMenuItems: ButtonMenuProps<string>['items'] = useMemo(() => {
    const items: ButtonMenuProps<string>['items'] = [];
    if (permissions?.repairOrder?.isCreate) {
      items.push({
        label: `${resources?.repairOrder?.titlePlural}`,
        onClick: () => {
          window.open(`${routes?.repairOrder?.path}`);
        }
      });
    }
    if (permissions?.productionOrder?.isCreate) {
      items.push({
        label: `${resources?.productionOrder?.titlePlural}`,
        onClick: () => {
          window.open(`${routes?.productionOrder?.path}`);
        }
      });
    }
    if (permissions?.assemblyOrder?.isCreate) {
      items.push({
        label: `${resources?.assemblyOrder?.titlePlural}`,
        onClick: () => {
          window.open(`${routes?.assemblyOrder?.path}`);
        }
      });
    }
    return items;
  }, [
    permissions?.assemblyOrder?.isCreate,
    permissions?.productionOrder?.isCreate,
    permissions?.repairOrder?.isCreate,
    resources?.assemblyOrder?.titlePlural,
    resources?.productionOrder?.titlePlural,
    resources?.repairOrder?.titlePlural
  ]);

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ ...routes.workOrderSupervisor, title: resources?.workOrderSupervisor?.titlePlural }]} />
          <div className="flex items-center gap-2">
            {permissions?.workOrder?.isCreate && (
              <Button
                variant="outlined"
                className={'btn-outline-v1'}
                onClick={() => {
                  setOpenWorkOrderScheduler(true);
                }}
              >
                Scheduler
              </Button>
            )}
            {permissions?.workOrder?.isCreate && (
              <Button
                variant="outlined"
                className={'btn-outline-v1'}
                onClick={() => {
                  window.open(`${routes?.workOrder?.path}`);
                }}
              >
                {`${resources?.workOrder?.titlePlural}`}
              </Button>
            )}
            <ButtonMenu
              showChevron={true}
              items={moreButtonMenuItems}
              horizontal="right"
              slot={
                ((props) => (
                  <IconButton aria-haspopup="true" color="primary" size="small" title="More" {...props}>
                    <MoreVert />
                  </IconButton>
                )) as any
              }
            />
          </div>
        </div>
        <div className="main-container">
          <div className="header-panel pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2">
                {['card-view', 'table-view'].includes(viewType) ? (
                  <>
                    <DateRangePicker horizontal="left" date={globalFilters} setDate={setGlobalFilters} />
                    {viewType === 'table-view' && (
                      <ButtonMenu
                        showChevron={true}
                        items={statusMenuItems}
                        onItemClick={(e, item) => {
                          setTableViewStatus(item.value);
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn('block h-2 w-2 rounded-full', colormap[tableViewStatus].indicator)} />
                          Status: {tableViewStatus}
                        </span>
                      </ButtonMenu>
                    )}
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
                  <IconButton size="small" onClick={onClickRefreshIcon} style={{ display: 'flex', marginLeft: 'auto' }}>
                    <RefreshIcon />
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
                  <div className="flex-grow">
                    <CustomFilter position="right" field={fieldToFilterList} setFilterQuery={setFilterResourceQuery} />
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
                fetchSingleColumn={fetchSingleColumn}
                state={state}
                dispatch={dispatch}
                passFailStatus={true}
                passFailAccessor="serviceStatus"
                cardOnClick={(e, data) => {
                  setOpen({ open: true, id: data.workOrder });
                }}
              />
            </div>
          )}
          {viewType === 'calendar-view' && (
            <div className="pt-2">
              <WorkOrderCalendar
                getFilterQuery={getQueryString}
                filterResourceQuery={filterResourceQuery}
                reference={resourceType}
                ref={ref}
                setOpen={setOpen}
              />
            </div>
          )}
          {viewType === 'table-view' && (
            <div className="pt-4">
              <WorkOrderList
                renderedFrom={renderedFrom}
                state={tableState}
                dispatch={tableDispatch}
                filterResourceQuery={filterResourceQuery}
                globalFilters={globalFilters}
                ref={workOrderListRef}
                status={tableViewStatus}
                consumablesDialog={consumablesDialog}
                setConsumablesDialog={setConsumablesDialog}
                tableHead={
                  <DetailsPageHeader
                    isAddButtonVisible={false}
                    isActionButtonVisible={false}
                    isNewActionButtonVisible={selectedRecords.length > 0}
                    newActionButtonProps={newActionButtonProps}
                    actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
                    leftSideContents={
                      <div className="flex-grow">
                        <CustomFilter position="right" field={fieldToFilterList} setFilterQuery={setFilterResourceQuery} />
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
          <AssignUserDialog
            warehouse={assignTechnicianDialog.multiple ? selectedRecords[0]?.warehouse?.optionValue : selectedServiceData?.warehouse}
            workOrderData={
              assignTechnicianDialog.multiple
                ? selectedRecords?.map((r) => ({
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
            assignedUsers={
              assignTechnicianDialog.multiple
                ? selectedRecords?.length === 1
                  ? selectedRecords[0]?.assignedUsers
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
            competencies={assignTechnicianDialog.multiple ? selectedRecords[0]?.competencies : selectedServiceData?.competencies}
          />
        )}
        {workStationAssignDialog.open && (
          <AssignWorkStationDialog
            warehouse={workStationAssignDialog.open ? selectedRecords[0]?.warehouse?.optionValue : selectedServiceData?.warehouse}
            workOrderData={
              workStationAssignDialog.multiple
                ? selectedRecords?.map((r) => ({
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
            workStations={workStationAssignDialog.multiple ? selectedRecords[0]?.assignedWorkStations : selectedServiceData?.assignedWorkStations}
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
        {consumablesDialog && (
          <AssignProductDialog
            handleCloseDialog={() => setConsumablesDialog(false)}
            ids={[]}
            onSuccess={(rows) => {
              if (viewType === 'card-view') {
                handleAddConsumables(rows, selectedRecords);
              } else {
                workOrderListRef.current?.handleAddConsumables(rows, selectedRecords);
              }
            }}
            serialized={false}
            isSubmitting={workOrderListRef.current?.submitting}
            extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
          />
        )}
      </section>
    </MuiPickersUtilsProvider>
  );
};

export default WorkOrderSupervisor;

const RenderAssignOptions = ({ openAssignHandler, data, permissions, resources }) => {
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
          <MenuItem
            onClick={() => {
              openAssignHandler('assignTechnician', data);
              setAnchorEl(null);
            }}
          >
            {'Assign Technician'}
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
        </Menu>
      )}
    </>
  );
};

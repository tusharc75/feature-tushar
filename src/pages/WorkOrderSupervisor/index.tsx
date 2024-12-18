import DateFnsUtils from '@date-io/date-fns';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { ExpandMore, MoreVert } from '@material-ui/icons';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import RefreshIcon from '@material-ui/icons/Refresh';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment from 'moment';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FaRegCalendar } from 'react-icons/fa';
import { MdViewWeek } from 'react-icons/md';
import { TfiLayoutListThumbAlt } from 'react-icons/tfi';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ButtonMenu from 'src/components/ButtonMenu';
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
import { WORKORDER_SERVICE_STATUS, sidebarResource, workOrderSupervisor } from '../../constants/helpers';
import AssignUserDialog from '../WorkOrder/Service/AssignUserDialog';
import AssignWorkStationDialog from '../WorkOrder/Service/AssignWorkStationDialog';

import WorkOrderSchedulerDialog from 'src/pages/WorkOrderSupervisor/WorkOrderSchedulerDialog';

const LIMIT = 25;

type ViewType = 'card-view' | 'table-view' | 'calendar-view';

type TableViewStatus =
  | typeof WORKORDER_SERVICE_STATUS.pending
  | typeof WORKORDER_SERVICE_STATUS.inProgress
  | typeof WORKORDER_SERVICE_STATUS.completed;

const WorkOrderSupervisor = () => {
  const { state, dispatch } = useCardReducer();
  const { limit, selectedRecords } = state;

  const resetSelectedRecords = () => {
    dispatch({ type: 'selection', selectedRecords: [] });
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

  const [globalFilters, setGlobalFilters] = useState<DateRange>({
    from: new Date(moment().startOf('month').format('YYYY/MM/DD')),
    to: new Date(moment().endOf('month').format('YYYY/MM/DD'))
  });
  const [resourceType, setResourceType] = useState('workOrder');
  const [isOpen, setOpen] = useState({ open: false, id: null });
  const [anchorEl, setAnchorEl] = useState(null);

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
  const [anchorActionEl, setAnchorActionEl] = useState(null);

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

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ ...routes.workOrderSupervisor, title: resources?.workOrderSupervisor?.titlePlural }]} />
          <div className="flex items-center gap-1">
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
            <Box>
              <IconButton aria-haspopup="true" color="primary" size="small" title="More" onClick={(event) => setAnchorEl(event.currentTarget)}>
                <MoreVert />
              </IconButton>
              <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                {permissions?.repairOrder?.isCreate && (
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      window.open(`${routes?.repairOrder?.path}`);
                    }}
                  >
                    {`${resources?.repairOrder?.titlePlural}`}
                  </MenuItem>
                )}
                {permissions?.productionOrder?.isCreate && (
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      window.open(`${routes?.productionOrder?.path}`);
                    }}
                  >
                    {`${resources?.productionOrder?.titlePlural}`}
                  </MenuItem>
                )}
                {permissions?.assemblyOrder?.isCreate && (
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      window.open(`${routes?.assemblyOrder?.path}`);
                    }}
                  >
                    {`${resources?.assemblyOrder?.titlePlural}`}
                  </MenuItem>
                )}
              </Menu>
            </Box>
          </div>
        </div>
        <div className="main-container">
          <div className="header-panel">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2">
                {['card-view', 'table-view'].includes(viewType) ? (
                  <>
                    <DateRangePicker date={globalFilters} setDate={setGlobalFilters} />
                    {viewType === 'table-view' && (
                      <ButtonMenu
                        showChevron={true}
                        items={[
                          { label: WORKORDER_SERVICE_STATUS.pending, selected: tableViewStatus === WORKORDER_SERVICE_STATUS.pending },
                          { label: WORKORDER_SERVICE_STATUS.inProgress, selected: tableViewStatus === WORKORDER_SERVICE_STATUS.inProgress },
                          { label: WORKORDER_SERVICE_STATUS.completed, selected: tableViewStatus === WORKORDER_SERVICE_STATUS.completed }
                        ]}
                        onItemClick={(e, item) => {
                          setTableViewStatus(item.label);
                        }}
                      >
                        Status: {tableViewStatus}
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

              <div className="flex flex-grow items-center gap-2 max-[600px]:flex-wrap">
                <div className="flex-grow">
                  <CustomFilter field={fieldToFilterList} setFilterQuery={setFilterResourceQuery} />
                </div>
                {viewType !== 'table-view' && (
                  <>
                    <ThemeButton
                      iconForMobile={false}
                      variant="outlined"
                      color="default"
                      size="small"
                      onClick={(e) => setAnchorActionEl(e.currentTarget)}
                      aria-controls="action-menu"
                      disabled={selectedRecords.length === 0}
                      endIcon={<ExpandMore />}
                      id={'work-order-superviser-page-action-button'}
                    >
                      Actions
                    </ThemeButton>
                    <Menu
                      anchorEl={anchorActionEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      id="action-menu"
                      open={Boolean(anchorActionEl)}
                      onClose={() => setAnchorActionEl(null)}
                    >
                      <MenuItem
                        disabled={selectedRecords?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.completed)}
                        onClick={() => {
                          setAssignTechnicianDialog({ open: true, multiple: true });
                          setAnchorActionEl(null);
                        }}
                      >
                        Assign Technician
                      </MenuItem>
                      <MenuItem
                        disabled={selectedRecords?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.completed)}
                        onClick={() => {
                          setWorkStationAssignDialog({ open: true, multiple: true });
                          setAnchorActionEl(null);
                        }}
                      >{`Assign ${resources?.workStations?.titlePlural}`}</MenuItem>
                      {viewType === 'table-view' && (
                        <MenuItem
                          onClick={() => {
                            setConsumablesDialog(true);
                          }}
                          id="add-consumables"
                        >
                          Add Products/Consumables
                        </MenuItem>
                      )}
                    </Menu>
                  </>
                )}
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
          {viewType === 'card-view' && (
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
          )}
          {viewType === 'calendar-view' && (
            <WorkOrderCalendar
              getFilterQuery={getQueryString}
              filterResourceQuery={filterResourceQuery}
              reference={resourceType}
              ref={ref}
              setOpen={setOpen}
            />
          )}
          {viewType === 'table-view' && (
            <WorkOrderList filterResourceQuery={filterResourceQuery} globalFilters={globalFilters} ref={workOrderListRef} status={tableViewStatus} />
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

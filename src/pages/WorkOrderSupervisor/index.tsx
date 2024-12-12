import DateFnsUtils from '@date-io/date-fns';
import { Box, Button, Checkbox, FormControl, IconButton, InputLabel, Menu, MenuItem, Popover, Select, useMediaQuery } from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import RefreshIcon from '@material-ui/icons/Refresh';
import moment from 'moment';
import React, { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CardColTimeline, { useCardReducer, datarowInterface } from 'src/components/CardColTimeline';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import { WORKORDER_SERVICE_STATUS, dateFormatForInputControl, sidebarResource, workOrderSupervisor } from '../../constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import AssignWorkStationDialog from '../WorkOrder/Service/AssignWorkStationDialog';
import AssignUserDialog from '../WorkOrder/Service/AssignUserDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { BiFilterAlt } from 'react-icons/bi';
import WorkOrderCalendar from 'src/pages/WorkOrderSupervisor/WorkOrderCalendar';
import CustomFilter from 'src/components/Helpers/CustomFilter';
import AppsIcon from '@material-ui/icons/Apps';
import DateRangeIcon from '@material-ui/icons/DateRange';
import ProductFrequencyDialog from './ProductFrequencyDialog';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import ViewListIcon from '@material-ui/icons/ViewList';
import WorkOrderList from 'src/pages/WorkOrderSupervisor/WorkOrderList';
import WorkOrderDetailDialog from 'src/pages/WorkOrderSupervisor/WorkOrderDetailDialog';
import { ExpandMore } from '@material-ui/icons';

const LIMIT = 25;

const FIELD_TO_FILTER = [
  {
    key: 'user',
    fieldName: 'user',
    fieldLabel: routes.employeeMaster.title,
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
    fieldLabel: routes.workOrder.title,
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

const WorkOrderSupervisor = () => {
  const { state, dispatch } = useCardReducer();
  const { limit, selectedRecords } = state;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, resources }
  }: any = useData();

  const [selectedUser, setSelectedUser] = useState(null);
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState({ open: false, multiple: false });
  const [assignTechnicianDialog, setAssignTechnicianDialog] = useState({ open: false, multiple: false });

  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [fieldToFilterList, setFieldToFilterList] = useState([]);
  const [filterResourceQuery, setFilterResourceQuery] = useState({
    filterById: [],
    deepFilter: []
  });
  const [viewType, setViewType] = useState(1);

  const [timeFrame, setTimeFrame] = React.useState<any>('custom');
  const [globalFilters, setGlobalFilters] = useState({
    from: new Date(moment().startOf('month').format('YYYY/MM/DD')),
    to: new Date(moment().endOf('month').format('YYYY/MM/DD'))
  });
  const [showProductFreqDialog, setShowProductFreqDialog] = useState(false);
  const [resourceType, setResourceType] = useState('workOrder');
  const [isOpen, setOpen] = useState({ open: false, id: null });

  const ref: any = useRef();

  useEffect(() => {
    const options: any = [];
    FIELD_TO_FILTER?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push(item);
      }
    });
    setFieldToFilterList(options);
  }, []);

  React.useEffect(() => {
    switch (timeFrame) {
      case '1-month':
        setGlobalFilters({
          from: new Date(moment().subtract('1', 'month').calendar()),
          to: new Date()
        });
        break;
      case '3-months':
        setGlobalFilters({
          from: new Date(moment().subtract('3', 'months').calendar()),
          to: new Date()
        });
        break;
      case '6-months':
        setGlobalFilters({
          from: new Date(moment().subtract('6', 'months').calendar()),
          to: new Date()
        });
        break;
      case '1-year':
        setGlobalFilters({
          from: new Date(moment().subtract('1', 'year').calendar()),
          to: new Date()
        });
        break;
      default:
        break;
    }
  }, [timeFrame]);

  useEffect(() => {
    const cardDataRows: datarowInterface[] = [
      {
        accessor: 'workOrderNumber',
        title: 'Work Order',
        type: 'title',
        link: (data) => `${routes.workOrderDetail.path}/${data?.workOrder}`,
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
      { accessor: 'workStation', title: routes.workStations.title, type: 'text' },
      { accessor: 'expectedCompletionDate', title: 'Due Date', type: 'date' },
      {
        type: 'tooltip',
        accessor: 'tooltip',
        renderer: (data) => <RenderAssignOptions openAssignHandler={openAssignHandler} data={data} permissions={permissions} />
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
    if (selectedUser || timeFrame || globalFilters || filterResourceQuery?.filterById?.length) {
      const query = getQueryString();
      dispatch({ type: 'setFilterQuery', filterQuery: query });
    } else {
      dispatch({ type: 'setFilterQuery', filterQuery: '' });
    }
  }, [selectedUser, timeFrame, globalFilters.from, globalFilters.to, dispatch, getQueryString, globalFilters, viewType, filterResourceQuery]);

  const isMobile = useMediaQuery('(max-width: 800px)');

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const reset = () => {
    setSelectedUser(null);
    setFilterResourceQuery({
      filterById: [],
      deepFilter: []
    });
  };

  const isFilterPresent = useMemo(() => {
    return selectedUser || filterResourceQuery?.filterById?.length;
  }, [selectedUser, filterResourceQuery]);

  const filters = (
    <>
      {viewType !== 2 && (
        <FormControl fullWidth size="small" margin="none" variant="outlined">
          <InputLabel id="duration">Select Duration</InputLabel>
          <Select
            labelId="duration"
            id="time-duration"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            label="Select Duration"
            SelectDisplayProps={{
              style: { minHeight: 22.5 }
            }}
            fullWidth
          >
            <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
            <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
            <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
            <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
            <MenuItem value={'custom'}>Custom</MenuItem>
          </Select>
        </FormControl>
      )}
      {viewType !== 2 && (
        <KeyboardDatePicker
          disabled={timeFrame !== 'custom'}
          inputVariant="outlined"
          variant="inline"
          size="small"
          InputProps={{
            style: { minHeight: '38px' }
          }}
          autoOk
          format={dateFormatForInputControl}
          maxDate={globalFilters.to}
          label="From"
          value={globalFilters.from}
          onChange={(date) => {
            setGlobalFilters({ ...globalFilters, from: date });
          }}
        />
      )}
      {viewType !== 2 && (
        <KeyboardDatePicker
          disabled={timeFrame !== 'custom'}
          inputVariant="outlined"
          variant="inline"
          autoOk
          size="small"
          InputProps={{
            style: { minHeight: '38px' }
          }}
          minDate={globalFilters.from}
          format={dateFormatForInputControl}
          label="To"
          value={globalFilters.to}
          onChange={(date) => {
            setGlobalFilters({ ...globalFilters, to: date });
          }}
        />
      )}
    </>
  );

  const onClickRefreshIcon = () => {
    if (viewType === 2) {
      if (ref?.current) {
        ref?.current?.childFunction();
      }
    } else {
      dispatch({ type: 'refreshData' });
    }
  };

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[routes.workOrderSupervisor]} />
          <div className="flex items-center gap-1">
            {permissions?.workOrder?.isCreate && (
              <Button
                variant="outlined"
                className={'btn-outline-v1'}
                onClick={() => {
                  window.open(`${routes.workOrder.path}`);
                }}
              >
                {' '}
                {`${routes?.workOrder.title}`}
              </Button>
            )}
            {permissions?.repairOrder?.isCreate && (
              <Button
                variant="outlined"
                className={'btn-outline-v1'}
                onClick={() => {
                  window.open(`${routes?.repairOrder?.path}`);
                }}
              >
                {' '}
                {`${resources?.repairOrder?.titleSingular}`}
              </Button>
            )}
            {permissions?.productionOrder?.isCreate && (
              <Button
                variant="outlined"
                className={'btn-outline-v1'}
                onClick={() => {
                  window.open(`${routes?.productionOrder?.path}`);
                }}
              >
                {' '}
                {`${resources?.productionOrder?.titleSingular}`}
              </Button>
            )}
            {permissions?.assemblyOrder?.isCreate && (
              <Button
                variant="outlined"
                className={'btn-outline-v1'}
                onClick={() => {
                  window.open(`${routes.assemblyOrder.path}`);
                }}
              >
                {' '}
                {`${routes?.assemblyOrder.title}`}
              </Button>
            )}
            {permissions?.product?.isCreate && (
              <Button
                variant="outlined"
                className={'btn-outline-v1'}
                onClick={() => {
                  setShowProductFreqDialog(true);
                }}
              >
                Scheduling
              </Button>
            )}
          </div>
        </div>
        <div className="main-container">
          <div className="header-panel">
            <div className="grid grid-cols-1 items-start gap-2 min-[600px]:grid-cols-[1fr_3fr] min-[800px]:grid-cols-[1.8fr_3fr]">
              {[1, 3].includes(viewType) ? (
                isMobile ? (
                  <>
                    <div className="relative mr-auto max-w-fit">
                      {isFilterPresent ? (
                        <>
                          <span
                            className={`${
                              isFilterPresent ? ' opacity-100' : 'opacity-0'
                            } absolute -right-[2px] -top-[2px] z-[9] h-[6px] w-[6px] animate-ping rounded-full bg-red-500`}
                          ></span>
                          <span
                            className={`${
                              isFilterPresent ? ' opacity-100' : 'opacity-0'
                            } absolute -right-[2px] -top-[2px] z-10 h-[6px] w-[6px] rounded-full bg-red-500`}
                          ></span>
                        </>
                      ) : null}
                      <ThemeButton startIcon={<BiFilterAlt />} iconForMobile={<BiFilterAlt />} tooltip="Apply Filters" onClick={handleClick}>
                        Filter
                      </ThemeButton>
                    </div>
                    <Popover
                      id={id}
                      open={open}
                      anchorEl={anchorEl}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      PaperProps={{
                        style: {
                          borderRadius: 5
                        }
                      }}
                    >
                      <div className="grid gap-3 p-5">
                        {filters}
                        <div className="flex justify-between gap-2">
                          {isFilterPresent ? (
                            <ThemeButton iconForMobile={false} onClick={reset}>
                              Clear Filters
                            </ThemeButton>
                          ) : (
                            <span />
                          )}
                          <ThemeButton iconForMobile={false} onClick={handleClose} className="ml-auto">
                            Close
                          </ThemeButton>
                        </div>
                      </div>
                    </Popover>
                  </>
                ) : (
                  <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-1  md:grid-cols-2 lg:grid-cols-3">{filters}</div>
                )
              ) : (
                <Box display="flex">
                  <ToggleButtonGroup size="small" exclusive value={resourceType} onChange={(e, newVal) => {}}>
                    <ToggleButton value={'workOrder'} onClick={() => setResourceType('workOrder')}>
                      {routes.workOrder.title}
                    </ToggleButton>
                    <ToggleButton value={'repairOrder'} onClick={() => setResourceType('repairOrder')}>
                      {resources?.repairOrder?.titleSingular}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              <div className="flex gap-2 max-[600px]:flex-wrap">
                <div className="flex-grow pt-[4px]">
                  <CustomFilter field={fieldToFilterList} setFilterQuery={setFilterResourceQuery} />
                </div>
                <div className="ml-[10px] pt-[4px]">
                  <Button
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
                  </Button>
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
                    >{`Assign ${routes.workStations.title}`}</MenuItem>
                  </Menu>
                </div>
                <div className="pt-[4px]">
                  <HtmlTooltip title={`Card View`} arrow placement="top" enterTouchDelay={0}>
                    <IconButton
                      size="small"
                      aria-label="Clone"
                      onClick={() => {
                        setViewType(1);
                      }}
                    >
                      <AppsIcon color={viewType === 1 ? 'primary' : 'disabled'} />
                    </IconButton>
                  </HtmlTooltip>
                </div>
                <div className="pt-[4px]">
                  <HtmlTooltip title={'Calendar View'} placement="top" arrow enterTouchDelay={0}>
                    <IconButton size="small" onClick={() => setViewType(2)}>
                      <DateRangeIcon color={viewType === 2 ? 'primary' : 'disabled'} />
                    </IconButton>
                  </HtmlTooltip>
                </div>
                <div className="pt-[4px]">
                  <HtmlTooltip title={'Table View'} placement="top" arrow enterTouchDelay={0}>
                    <IconButton size="small" onClick={() => setViewType(3)}>
                      <ViewListIcon color={viewType === 3 ? 'primary' : 'disabled'} />
                    </IconButton>
                  </HtmlTooltip>
                </div>
                <div className="pt-[4px]">
                  <HtmlTooltip title={'Refresh'}>
                    <IconButton size="small" onClick={onClickRefreshIcon} style={{ display: 'flex', marginLeft: 'auto' }}>
                      <RefreshIcon />
                    </IconButton>
                  </HtmlTooltip>
                </div>
              </div>
            </div>
          </div>
          {viewType === 1 && (
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
          {viewType === 2 && (
            <WorkOrderCalendar
              getFilterQuery={getQueryString}
              filterResourceQuery={filterResourceQuery}
              reference={resourceType}
              ref={ref}
              setOpen={setOpen}
            />
          )}
          {viewType === 3 && <WorkOrderList filterResourceQuery={filterResourceQuery} globalFilters={globalFilters} />}
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
        {showProductFreqDialog && (
          <ProductFrequencyDialog
            onClose={() => setShowProductFreqDialog(false)}
            onSuccess={() => {
              onClickRefreshIcon();
              setShowProductFreqDialog(false);
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

const RenderAssignOptions = ({ openAssignHandler, data, permissions }) => {
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
              {`Assign ${routes.workStations.title}`}
            </MenuItem>
          )}
        </Menu>
      )}
    </>
  );
};

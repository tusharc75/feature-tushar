import DateFnsUtils from '@date-io/date-fns';
import { FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment from 'moment';
import React, { Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { datarowInterface } from 'src/components/CardColTimeline';
import CardColTimeline, { useCardReducer } from 'src/components/CardColTimeline1';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import { WORKORDER_SERVICE_STATUS, dateFormatForInputControl, sidebarResource, workOrderSupervisor } from '../../constants/helpers';

const RESOURCE = [
  { key: 'workOrder', resource: sidebarResource.workOrder, title: routes.workOrder.title },
  { key: 'repairOrder', resource: sidebarResource.repairOrder, title: routes.repairOrder.title },
  { key: 'productionOrder', resource: sidebarResource.productionOrder, title: routes.productionOrder.title }
];

const LIMIT = 25;

const WorkOrderSupervisor = () => {
  const { state, dispatch } = useCardReducer();
  const { limit } = state;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  }: any = useData();

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [usersOption, setUsersOption] = useState([]);
  const [serviceMasterOption, setServiceMasterOption] = useState([]);

  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [selectedResourceOption, setSelectedResourceOption] = useState(null);

  const [timeFrame, setTimeFrame] = React.useState<any>('custom');
  const [globalFilters, setGlobalFilters] = useState({
    from: new Date(moment().startOf('month').format('YYYY/MM/DD')),
    to: new Date(moment().endOf('month').format('YYYY/MM/DD'))
  });

  const resourceFilter: any = RESOURCE.map((e) => {
    if (permissions[e.key]) return e;
  });

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
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=User,Service Master`)
      .then(({ data: { data } }) => {
        setUsersOption(data['User']);
        setServiceMasterOption(data['Service Master']);
      });
  }, []);

  useEffect(() => {
    if (selectedResource) {
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${selectedResource.resource}`)
        .then(({ data: { data } }) => {
          setResourceOptions(data[selectedResource.resource]);
        });
    }
  }, [selectedResource]);

  useEffect(() => {
    dispatch({
      type: 'initialize',
      columnOrder: Object.values(WORKORDER_SERVICE_STATUS),
      rowDef: cardDataRows,
      visibleColumns: [WORKORDER_SERVICE_STATUS.pending, WORKORDER_SERVICE_STATUS.inProgress, WORKORDER_SERVICE_STATUS.completed],
      limit: LIMIT
    });
  }, []);

  const fetchSingleColumn = useCallback((column: string, page = 0, appendData = true, filterQuery) => {
    let api = `${workOrderSupervisor.api}?page=${page}&status=${column}&limit=${limit}${filterQuery}`;
    dispatch({ type: 'loading', loading: (prev) => ({ ...prev, [column]: true }) });
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        const setData = (prev: { [key: string]: any[] }, appendData: boolean) => {
          const rows = data.map((item) => {
            const newObj = { ...item };
            newObj['serviceName'] = newObj?.service?.optionLabel;
            newObj['assignedUser'] = newObj?.assignedUsers?.map((e) => e?.optionLabel)?.toString();
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
  }, []);

  const getQueryString = useCallback(() => {
    let deepFilter = '';
    if (selectedUser) {
      deepFilter = `${deepFilter}&user=${selectedUser}`;
    }
    if (selectedService) {
      deepFilter = `${deepFilter}&service=${selectedService}`;
    }
    if (selectedResource && selectedResourceOption) {
      deepFilter = `${deepFilter}&${selectedResource.key}=${selectedResourceOption}`;
    }
    if (globalFilters) {
      deepFilter = `${deepFilter}&from=${moment(globalFilters.from).format('YYYY/MM/DD')}&to=${moment(globalFilters.to).format('YYYY/MM/DD')}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  }, [globalFilters, selectedResource, selectedResourceOption, selectedService, selectedUser]);

  useEffect(() => {
    if ((selectedUser && selectedResourceOption && selectedService && timeFrame) || globalFilters) {
      const query = getQueryString();
      dispatch({ type: 'setFilterQuery', filterQuery: query });
    } else {
      dispatch({ type: 'setFilterQuery', filterQuery: '' });
    }
  }, [
    selectedUser,
    selectedResourceOption,
    selectedService,
    timeFrame,
    globalFilters.from,
    globalFilters.to,
    dispatch,
    getQueryString,
    globalFilters
  ]);

  const cardDataRows: datarowInterface[] = [
    { accessor: 'workOrderNumber', type: 'linkTitle', link: (data) => `${routes.workOrderDetail.path}/${data?._id}` },
    { accessor: 'serviceName', title: 'Service Name', type: 'text' },
    { accessor: 'assignedUser', title: 'Technician', type: 'text' },
    { accessor: 'expectedCompletionDate', title: 'Due Date', type: 'date' }
  ];

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.workOrderSupervisor]} />
          </Grid>
        </Grid>
        <div className="main-container">
          <div className="header-panel">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_1fr] lg:grid-cols-[1fr_1fr_1fr_1fr_1fr] xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-x-2 gap-y-3 align-items-center">
              <Autocomplete
                fullWidth
                options={usersOption}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                getOptionSelected={(option: any, val) => {
                  return option.optionValue === val.optionValue;
                }}
                value={
                  usersOption.filter((data) => data.optionValue === selectedUser).length
                    ? usersOption.filter((data) => data.optionValue === selectedUser)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setSelectedUser(val && val.optionValue ? val.optionValue : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="none"
                    size="small"
                    name="user"
                    placeholder="Technician"
                    label="Technician"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
              <Autocomplete
                fullWidth
                options={serviceMasterOption}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                getOptionSelected={(option: any, val) => {
                  return option.optionValue === val.optionValue;
                }}
                value={
                  serviceMasterOption.filter((data) => data.optionValue === selectedService).length
                    ? serviceMasterOption.filter((data) => data.optionValue === selectedService)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setSelectedService(val && val.optionValue ? val.optionValue : '');
                }}
                renderInput={(params) => (
                  <TextField {...params} margin="none" size="small" name="user" placeholder="Service" label="Service" variant="outlined" fullWidth />
                )}
              />
              <Autocomplete
                fullWidth
                options={resourceFilter}
                getOptionLabel={(option: any) => (option ? option?.title : '')}
                value={selectedResource}
                onChange={(e, val) => {
                  setSelectedResourceOption(null);
                  setSelectedResource(val);
                }}
                renderInput={(params) => <TextField {...params} margin="none" size="small" label="Select Resource" variant="outlined" fullWidth />}
              />
              {selectedResource && (
                <Autocomplete
                  fullWidth
                  options={resourceOptions}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => {
                    return option.optionValue === val.optionValue;
                  }}
                  value={
                    resourceOptions.filter((data) => data.optionValue === selectedResourceOption).length
                      ? resourceOptions.filter((data) => data.optionValue === selectedResourceOption)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setSelectedResourceOption(val && val.optionValue ? val.optionValue : '');
                  }}
                  renderInput={(params) => (
                    <TextField {...params} margin="none" size="small" label={`Select ${selectedResource?.title}`} variant="outlined" fullWidth />
                  )}
                />
              )}
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
            </div>
          </div>
          <CardColTimeline
            fetchSingleColumn={fetchSingleColumn}
            state={state}
            dispatch={dispatch}
            passFailStatus={true}
            passFailAccessor="serviceStatus"
          />
        </div>
      </Fragment>
    </MuiPickersUtilsProvider>
  );
};

export default WorkOrderSupervisor;

import { Box, Grid, TextField } from '@material-ui/core';
import React, { Fragment, useEffect, useState, useContext } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import { Autocomplete } from '@material-ui/lab';
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { WORKORDER_SERVICE_STATUS, sidebarResource, workOrderSupervisor } from '../../constants/helpers';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import moment from 'moment';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { dateFormatForInputControl } from '../../constants/helpers';
import CardColTimeline, { datarowInterface } from 'src/components/CardColTimeline';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';

const WorkOrderSupervisor = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  }: any = useData();

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [usersOption, setUsersOption] = useState([]);
  const [serviceMasterOption, setServiceMasterOption] = useState([]);

  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [selectedResourceOption, setSelectedResourceOption] = useState(null);

  const [timeFrame, setTimeFrame] = React.useState<any>('custom');
  const [globalFilters, setGlobalFilters] = useState({
    from: new Date(moment().startOf('month').format('YYYY/MM/DD')),
    to: new Date(moment().endOf('month').format('YYYY/MM/DD'))
  });

  const resourceMap = [
    { key: 'workOrder', resource: sidebarResource.workOrder, title: routes.workOrder.title },
    { key: 'repairOrder', resource: sidebarResource.repairOrder, title: routes.repairOrder.title },
    { key: 'productionOrder', resource: sidebarResource.productionOrder, title: routes.productionOrder.title },
  ];
  
  const resourceList: any = resourceMap.map((e) => { if(permissions[e.key]) return e; })

  useEffect(() => {
    let timeout = setTimeout(fetchData, 600);
    return () => {
      clearTimeout(timeout);
    };
  }, [selectedUser, selectedResourceOption, selectedService, timeFrame, globalFilters.from, globalFilters.to]);

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
    if(selectedResource) {
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${selectedResource.resource}`)
        .then(({ data: { data } }) => {
          setResourceOptions(data[selectedResource.resource]);
        });
    }
  }, [selectedResource]);

  const fetchData = async () => {
    setLoading(true);
    const queryString = getQueryString();
    try {
      let data;
      let response = await axiosInstance().get(`${workOrderSupervisor.api}${queryString}`);
      data = response?.data?.data;
      data?.forEach((ele) => {
        ele['serviceName'] = ele?.service?.optionLabel;
        ele['assignedUser'] = ele?.assignedUsers?.map((e) => e?.optionLabel)?.toString();
      });
      setServiceData({
        Pending: { data: data?.filter((e) => e.status === WORKORDER_SERVICE_STATUS.pending), color: '#F8A300' },
        'In-Progress': { data: data?.filter((e) => e.status === WORKORDER_SERVICE_STATUS.inProgress), color: '#F16A9A' },
        Completed: { data: data?.filter((e) => e.status === WORKORDER_SERVICE_STATUS.completed), color: '#31AC1D' }
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = '?';
    if (selectedUser) {
      deepFilter = `${deepFilter}&user=${selectedUser}`;
    }
    if (selectedService) {
      deepFilter = `${deepFilter}&services=${selectedService}`;
    }
    if(selectedResource && selectedResourceOption) {
      deepFilter = `${deepFilter}&${selectedResource.key}s=${selectedResourceOption}`;
    }
    if (globalFilters) {
      deepFilter = `${deepFilter}&from=${moment(globalFilters.from).format('YYYY/MM/DD')}&to=${moment(globalFilters.to).format('YYYY/MM/DD')}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

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
                // disableClearable
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
                options={resourceList}
                getOptionLabel={(option: any) => (option ? option?.title : '')}
                value={selectedResource}
                onChange={(e, val) => {
                  if(!val) setSelectedResourceOption(null);
                  setSelectedResource(val);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="none"
                    size="small"
                    label="Select Resource"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
              <Autocomplete
                fullWidth
                options={resourceOptions}
                disabled = {!selectedResource}
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
                  <TextField
                    {...params}
                    margin="none"
                    size="small"
                    label="Filters"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
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
          {serviceData ? (
            <CardColTimeline
              cardHeight={150}
              data={serviceData}
              loading={loading}
              cardDataRows={cardDataRows}
              passFailStatus={true}
              passFailAccessor="serviceStatus"
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </div>
      </Fragment>
    </MuiPickersUtilsProvider>
  );
};

export default WorkOrderSupervisor;

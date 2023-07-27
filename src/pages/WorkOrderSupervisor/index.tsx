import { Box, Grid, TextField } from '@material-ui/core';
import React, { Fragment, useEffect, useState, useContext } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import { Autocomplete } from '@material-ui/lab';
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { WORKORDER_SERVICE_STATUS, workOrderSupervisor } from '../../constants/helpers';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import moment from 'moment';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { dateFormatForInputControl } from '../../constants/helpers';
import CardColTimeline, { datarowInterface } from 'src/components/CardColTimeline';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const WorkOrderSupervisor = () => {
  const toastConfig = useContext(CustomToastContext);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [usersOption, setUsersOption] = useState([]);
  const [workOrderOption, setWorkOrderOption] = useState([]);
  const [repairOrderOption, setRepairOrderOption] = useState([]);
  const [serviceMasterOption, setServiceMasterOption] = useState([]);

  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [timeFrame, setTimeFrame] = React.useState<any>('custom');
  const [globalFilters, setGlobalFilters] = useState({
    from: new Date(moment().startOf('month').format('YYYY/MM/DD')),
    to: new Date(moment().endOf('month').format('YYYY/MM/DD'))
  });

  useEffect(() => {
    // if (selectedUser) {
    let timeout = setTimeout(fetchData, 600);
    return () => {
      clearTimeout(timeout);
    };
    // }
  }, [selectedUser, selectedWorkOrder, selectedRepairOrder, selectedService, timeFrame, globalFilters.from, globalFilters.to]);

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
      .get(`/sa-formbuilder/lookup?lookupResource=User,Work Order,Repair Order,Service Master`)
      .then(({ data: { data } }) => {
        setUsersOption(data['User']);
        setWorkOrderOption(data['Work Order']);
        setRepairOrderOption(data['Repair Order']);
        setServiceMasterOption(data['Service Master']);
        if (data['User']?.length) {
          setSelectedUser(data['User'][0]?.optionValue)
        }
      });
  }, []);

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
      })
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
    if (selectedWorkOrder) {
      deepFilter = `${deepFilter}&workOrders=${selectedWorkOrder}`;
    }
    if (selectedRepairOrder) {
      deepFilter = `${deepFilter}&repairOrders=${selectedRepairOrder}`;
    }
    if (selectedService) {
      deepFilter = `${deepFilter}&services=${selectedService}`;
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
            <Box flexWrap={'wrap'} className="d-flex align-items-center gap-1">
              <Autocomplete
                style={{ width: '200px' }}
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
                  <TextField {...params} margin="dense" name="user" placeholder="Technician" label="Technician" variant="outlined" fullWidth />
                )}
              />
              <Autocomplete
                style={{ width: '200px' }}
                options={workOrderOption}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                getOptionSelected={(option: any, val) => {
                  return option.optionValue === val.optionValue;
                }}
                value={
                  workOrderOption.filter((data) => data.optionValue === selectedWorkOrder).length
                    ? workOrderOption.filter((data) => data.optionValue === selectedWorkOrder)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setSelectedWorkOrder(val && val.optionValue ? val.optionValue : '');
                }}
                renderInput={(params) => (
                  <TextField {...params} margin="dense" name="workOrder" placeholder="Work Order" label="Work Order" variant="outlined" fullWidth />
                )}
              />
              <Autocomplete
                style={{ width: '200px' }}
                options={repairOrderOption}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                getOptionSelected={(option: any, val) => {
                  return option.optionValue === val.optionValue;
                }}
                value={
                  repairOrderOption.filter((data) => data.optionValue === selectedRepairOrder).length
                    ? repairOrderOption.filter((data) => data.optionValue === selectedRepairOrder)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setSelectedRepairOrder(val && val.optionValue ? val.optionValue : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    name="repairOrder"
                    placeholder="Repair Order"
                    label="Repair Order"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
              <Autocomplete
                style={{ width: '200px' }}
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
                  <TextField {...params} margin="dense" name="user" placeholder="Service" label="Service" variant="outlined" fullWidth />
                )}
              />
              <FormControl style={{ width: '150px' }} size="medium" margin="dense" variant="outlined">
                <InputLabel id="duration">Select Duration</InputLabel>
                <Select
                  labelId="duration"
                  id="time-duration"
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                  label="Select Duration"
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
                style={{ width: '150px' }}
                size="small"
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
                style={{ width: '150px' }}
                size="small"
                minDate={globalFilters.from}
                format={dateFormatForInputControl}
                label="To"
                value={globalFilters.to}
                onChange={(date) => {
                  setGlobalFilters({ ...globalFilters, to: date });
                }}
              />
            </Box>
          </div>
          {serviceData ? (
            <CardColTimeline
              cardHeight={150}
              data={serviceData}
              loading={loading}
              cardDataRows={cardDataRows}
              passFailStatus={true}
              passFailAccessor="serviceStatus"
              px={2}
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

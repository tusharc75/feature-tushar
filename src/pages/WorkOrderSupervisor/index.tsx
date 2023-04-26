import { Box, Button, Grid, TextField, Typography } from '@material-ui/core';
import React, { Fragment, useEffect, useState, useReducer, useContext } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import { Autocomplete } from '@material-ui/lab';
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { workOrderSupervisor, isObjectEmpty, gridLoadingTimeout } from '../../constants/helpers';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { camelCase } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import moment from 'moment';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { dateFormatForInputControl } from '../../constants/helpers';
import CardColTimeline, { datarowInterface } from 'src/components/CardColTimeline';

const WorkOrderSupervisor = () => {

  const [gridApi, setGridApi] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [usersOption, setUsersOption] = useState([]);
  const [workOrderOption, setWorkOrderOption] = useState([]);
  const [repairOrderOption, setRepairOrderOption] = useState([]);
  const [serviceMasterOption, setServiceMasterOption] = useState([]);

  const [timeFrame, setTimeFrame] = React.useState<any>('1-year');
  const [globalFilters, setGlobalFilters] = useState({ from: new Date(moment().subtract(1, 'year').calendar()), to: new Date() });

  useEffect(() => {
    let timeout = setTimeout(fetchData, 600);
    return () => {
      clearTimeout(timeout);
    };
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
      });
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    try {
      let data, count;
      let response = await axiosInstance().get(`${workOrderSupervisor.api}${queryString}`);
      data = response?.data?.data;
      count = response?.data?.count;

      const completed = [];
      const pending = [];
      const inProgress = [];
      data = data?.forEach((u) => {
        let finalObject = prepareDataForGrid(u);
        finalObject['user'] = u?.assignedUsers[0]?.optionLabel;
        finalObject['workOrder'] = u?.workOrderDetail?.workOrderNumber;
        finalObject['serviceName'] = u?.service?.optionLabel;
        finalObject['assignedUser'] = u?.assignedUsers?.map((e) => e?.optionLabel)?.toString();
        finalObject['createDate'] = u?.workOrderDetail?.createDate;
        finalObject['workOrderId'] = u?.workOrderDetail?._id;

        if (u.status === 'Pending') {
          pending.push(finalObject);
        }
        if (u.status === 'Completed') {
          completed.push(finalObject);
        }
        if (u.status === 'In-Progress') {
          inProgress.push(finalObject);
        }
        return {
          ...finalObject
        };
      });

      dispatch({
        type: 'initialize',
        data: {
          Pending: { data: pending, color: '#F8A300' },
          'In-Progress': { data: inProgress, color: '#F16A9A' },
          Completed: { data: completed, color: '#31AC1D' }
        },
        count: count
      });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
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
    { accessor: 'workOrder', type: 'linkTitle', link: (data) => `${routes.workOrderDetail.path}/${data?.workOrderId}` },
    { accessor: 'serviceName', title: 'Service Name', type: 'text' },
    { accessor: 'assignedUser', title: 'Technician', type: 'text' },
    { accessor: 'createDate', title: 'Due Date', type: 'date' }
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
                <Select labelId="duration" id="time-duration" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
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
                disableFuture
                openTo="year"
                format={dateFormatForInputControl}
                maxDate={globalFilters.to}
                label="From"
                views={['year', 'month', 'date']}
                value={globalFilters.from}
                onChange={(date) => {
                  setGlobalFilters({ ...globalFilters, from: date });
                }}
              />
              <KeyboardDatePicker
                disabled={timeFrame !== 'custom'}
                inputVariant="outlined"
                variant="inline"
                style={{ width: '150px' }}
                size="small"
                minDate={globalFilters.from}
                disableFuture
                openTo="year"
                format={dateFormatForInputControl}
                label="To"
                views={['year', 'month', 'date']}
                value={globalFilters.to}
                onChange={(date) => {
                  setGlobalFilters({ ...globalFilters, to: date });
                }}
              />
            </Box>
          </div>
          <CardColTimeline
            data={dataRows}
            loading={loading}
            cardDataRows={cardDataRows}
            passFailStatus={true}
            passFailAccessor="serviceStatus"
            px={2}
          />
        </div>
      </Fragment>
    </MuiPickersUtilsProvider>
  );
};

export default WorkOrderSupervisor;

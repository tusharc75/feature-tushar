import { Box, Button, Grid, TextField } from '@material-ui/core';
import React, { Fragment, useEffect, useState, useReducer, useContext } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { useData } from '../../StateProvider/Provider';
import { MdOutlineSupervisorAccount } from 'react-icons/md';
import { Autocomplete } from '@material-ui/lab';
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { workOrderSupervisor, isObjectEmpty, gridLoadingTimeout, getLocalStorageArrayData, RESOURCE_LABEL } from '../../constants/helpers';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { camelCase } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import moment from 'moment';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { dateFormatForInputControl } from '../../constants/helpers';
import { CommonRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';

const WorkOrderSupervisor = () => {

  const renderedFrom = camelCase(routes?.workOrderSupervisor?.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const [gridApi, setGridApi] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState(null);
  const [workOrderData, setWorkOrderData] = useState([]);
  const [repairOrderData, setRepairOrderData] = useState([]);
  const [usersData, setUsersData] = useState([]);

  const [timeFrame, setTimeFrame] = React.useState<any>('1-year');
  const [globalFilters, setGlobalFilters] = useState({ from: new Date(moment().subtract(1, 'year').calendar()), to: new Date() });

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
      .get(`/sa-formbuilder/lookup?lookupResource=User,Work Order,Repair Order`)
      .then(({ data: { data } }) => {
        setUsersData(data['User']);
        setWorkOrderData(data['Work Order']);
        setRepairOrderData(data['Repair Order']);
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
      data = data?.map((u) => {
        let finalObject = prepareDataForGrid(u);
        finalObject['user'] = u?.assignedUsers[0]?.optionLabel;
        finalObject['workOrder'] = u?.workOrderDetail?.workOrderNumber;
        finalObject['serviceName'] = u?.service?.optionLabel;
        finalObject['assignedUser'] = u?.assignedUsers?.map((e) => e?.optionLabel)?.toString()
        return {
          ...finalObject
        };
      });
      dispatch({ type: 'initialize', data: data, count: count });
      setTimeout(() => { dispatch({ type: 'loading', loading: false }); }, gridLoadingTimeout);
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
    if (showFilteredRecordsOnly) {
      const savedRecords = [...getLocalStorageArrayData(localStorageSelectedRecords)];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    if (globalFilters) {
      deepFilter = `${deepFilter}&from=${moment(globalFilters.from).format("YYYY/MM/DD")}&to=${moment(globalFilters.to).format("YYYY/MM/DD")}`
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleShow = () => {
    fetchData();
  };

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
  };

  const columns = [
    { field: 'workOrder', headerName: 'Work Order', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'serviceName', headerName: 'Service Name', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'assignedUser', headerName: 'Technician', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'status', headerName: 'Status', show: true, disabled: true, cellRenderer: 'commonRenderer' }
  ];

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.workOrderSupervisor]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            {/* <ImportExportLinks
              permissions={permissions?.workOrderSupervisor}
              module="product inventory"
              api={'workordersupervisor'}
              afterImportCompleted={() => {
                fetchWorkOrderSuperVisorData();
              }}
              isExportAllOrSomeFeature={true}
              total={10}
              recordsToExport={[...getLocalStorageArrayData(localStorageSelectedRecords)].length}
              ids={
                [...getLocalStorageArrayData(localStorageSelectedRecords)].length
                  ? [...getLocalStorageArrayData(localStorageSelectedRecords)].map((obj) => obj._id)
                  : []
              }
              onExportToExcelSuccess={() => {
                if (gridApi) gridApi.deselectAll();
                else fetchWorkOrderSuperVisorData();
              }}
              additionalParams={getQueryString(true)}
            /> */}
          </Grid>
        </Grid>
        <div className="main-container">
          <div className="header-panel">
            <Grid container>
              <Grid item xs={12} sm={12} md={12} className="d-flex align-items-center gap-1">
                <Autocomplete
                  style={{ width: '200px' }}
                  options={usersData}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => { return option.optionValue === val.optionValue }}
                  value={usersData.filter((data) => data.optionValue === selectedUser).length ? usersData.filter((data) => data.optionValue === selectedUser)[0] : ''}
                  onChange={(e, val) => {
                    setSelectedUser(val && val.optionValue ? val.optionValue : '');
                  }}
                  renderInput={(params) =>
                    <TextField
                      {...params}
                      margin="dense"
                      name="user"
                      placeholder="Technician"
                      label="Technician"
                      variant="outlined"
                      fullWidth
                    />
                  }
                />
                <Autocomplete
                  style={{ width: '200px' }}
                  options={workOrderData}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => {
                    return option.optionValue === val.optionValue;
                  }}
                  value={workOrderData.filter((data) => data.optionValue === selectedWorkOrder).length ? workOrderData.filter((data) => data.optionValue === selectedWorkOrder)[0] : ''}
                  onChange={(e, val) => {
                    setSelectedWorkOrder(val && val.optionValue ? val.optionValue : '');
                  }}
                  renderInput={(params) =>
                    <TextField
                      {...params}
                      margin="dense"
                      name="workOrder"
                      placeholder="Work Order"
                      label="Work Order"
                      variant="outlined"
                      fullWidth
                    />
                  }
                />
                <Autocomplete
                  style={{ width: '200px' }}
                  options={repairOrderData}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => {
                    return option.optionValue === val.optionValue;
                  }}
                  value={repairOrderData.filter((data) => data.optionValue === selectedRepairOrder).length ? repairOrderData.filter((data) => data.optionValue === selectedRepairOrder)[0] : ''}
                  onChange={(e, val) => {
                    setSelectedRepairOrder(val && val.optionValue ? val.optionValue : '');
                  }}
                  renderInput={(params) =>
                    <TextField
                      {...params}
                      margin="dense"
                      name="repairOrder"
                      placeholder="Repair Order"
                      label="Repair Order"
                      variant="outlined"
                      fullWidth
                    />
                  }
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
                <Button
                  onClick={handleShow}
                  style={{
                    marginLeft: '1rem',
                  }}
                  variant={'contained'}
                  size="small"
                  color="primary"
                >
                  Show
                </Button>
              </Grid>
            </Grid>
          </div>
          {columns ? (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponents}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={150}
              allowAction={false}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={RESOURCE_LABEL.workOrderSupervisor}
            />)
            : (
              <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
        </div>
      </Fragment>
    </MuiPickersUtilsProvider>
  );
};

export default WorkOrderSupervisor;

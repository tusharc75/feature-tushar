import { Box, Button, Grid, TextField } from '@material-ui/core';
import React, { Fragment, useEffect, useState, useReducer, useContext } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { useData } from '../../StateProvider/Provider';
import styles from '../Leads/Header.module.scss';
import { MdOutlineSupervisorAccount } from 'react-icons/md';
import { Autocomplete } from '@material-ui/lab';
import { isMobile, isTablet } from 'react-device-detect';
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { workOrderSupervisor, isObjectEmpty, gridLoadingTimeout, getLocalStorageArrayData } from '../../constants/helpers';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { camelCase } from 'lodash';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import moment from 'moment';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { dateFormatForInputControl } from '../../constants/helpers';

const WorkOrderSupervisor = () => {
  const renderedFrom = camelCase(routes?.workOrderSupervisor.title);
  const [gridApi, setGridApi] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const { getColumnData } = useColumns();
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState(null);
  const [workOrderData, setWorkOrderData] = useState([]);
  const [repairOrderData, setRepairOrderData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [timeFrame, setTimeFrame] = React.useState<any>('1-year');
  const [globalFilters, setGlobalFilters] = useState({
    from: new Date(moment().subtract(1, 'year').calendar()),
    to: new Date()
  });
  const {
    state: { permissions }
  }: any = useData();
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  useEffect(() => {
    fetchGridColumns();
    fetchUsers();
    fetchWorkOrder();
    fetchRepairOrder();
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

  const fetchUsers = async () => {
    await axiosInstance()
      .get('/user')
      .then(({ data: { data } }) => {
        setUsersData(data);
      })
      .catch(() => {});
  };

  const fetchWorkOrder = async () => {
    await axiosInstance()
      .get('/work-order')
      .then(({ data: { data } }) => {
        setWorkOrderData(data);
      })
      .catch(() => {});
  };
  const fetchRepairOrder = async () => {
    await axiosInstance()
      .get('/repair-order')
      .then(({ data: { data } }) => {
        setRepairOrderData(data);
      })
      .catch(() => {});
  };
  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${workOrderSupervisor.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.workOrderSupervisor.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        setColumns([...columns]);
      });
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
  };

  const fetchWorkOrderSuperVisorData = async () => {
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
        finalObject['canDelete'] = permissions?.workOrderSupervisor?.isDelete;
        finalObject['isChecked'] = [...getLocalStorageArrayData(localStorageSelectedRecords)]?.some((s) => s._id === u._id);
        finalObject['allowedToEdit'] = permissions?.workOrderSupervisor?.isUpdate;
        finalObject['user'] = u?.assignedUsers[0]?.optionLabel;
        finalObject['date'] = moment(u?.workOrderDetail?.createDate).format('DD/MM/YYYY');
        finalObject['workOrder'] = u?.workOrderDetail?.workOrderNumber;
        finalObject['repairOrder'] = u?.workorderDetail?.repairOrder?.optionValue;
        return {
          ...finalObject
        };
      });
      setIsAllChecked(false);
      setClonedData(data);
      if (appendRows) {
        dispatch({
          type: 'initialize',
          data: [...dataRows, ...data],
          count: count,
          selectedRecords: [...dataRows, ...data].filter((f) => f.isChecked === true)
        });
      } else {
        dispatch({
          type: 'initialize',
          data: data,
          count: count
        });
      }
      dispatch({ type: 'initialize', data: data, count: count });
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
          field: replaceFieldName(field),
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
    if(globalFilters){
        deepFilter=`${deepFilter}&from=${moment(globalFilters.from).format("YYYY/MM/DD")}&to=${moment(globalFilters.to).format("YYYY/MM/DD")}`
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleShow = () => {
    fetchWorkOrderSuperVisorData();
  };

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.workOrderSupervisor]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <ImportExportLinks
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
            />
          </Grid>
        </Grid>
        <div className="main-container">
          <div className="header-panel">
            <Grid container>
              <Grid item xs={12} sm={12} md={12} className="d-flex align-items-center gap-1">
                <MdOutlineSupervisorAccount size={25} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.workOrderSupervisor.title}</span>
                <Autocomplete
                  style={{ width: '200px' }}
                  options={usersData}
                  getOptionLabel={(option: any) => (option ? option.firstName + ' ' + option.lastName : '')}
                  getOptionSelected={(option: any, val) => {
                    return option._id === val._id;
                  }}
                  value={usersData.filter((data) => data._id === selectedUser).length ? usersData.filter((data) => data._id === selectedUser)[0] : ''}
                  onChange={(e, val) => {
                    setSelectedUser(val && val._id ? val._id : '');
                  }}
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField
                        {...params}
                        margin="dense"
                        name=""
                        placeholder="User"
                        variant="standard"
                        fullWidth
                        className={isMobile ? 'serchBox' : ''}
                      />
                    ) : (
                      <TextField {...params} margin="dense" name="user" label="User" variant="outlined" fullWidth />
                    )
                  }
                />
                <Autocomplete
                  style={{ width: '200px' }}
                  options={workOrderData}
                  getOptionLabel={(option: any) => (option ? option.workOrderNumber : '')}
                  getOptionSelected={(option: any, val) => {
                    return option._id === val._id;
                  }}
                  value={
                    workOrderData.filter((data) => data._id === selectedWorkOrder).length
                      ? workOrderData.filter((data) => data._id === selectedWorkOrder)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setSelectedWorkOrder(val && val._id ? val._id : '');
                  }}
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField
                        {...params}
                        margin="dense"
                        name=""
                        placeholder="Work Order"
                        variant="standard"
                        fullWidth
                        className={isMobile ? 'serchBox' : ''}
                      />
                    ) : (
                      <TextField {...params} margin="dense" name="workOrder" label="Work Order" variant="outlined" fullWidth />
                    )
                  }
                />
                <Autocomplete
                  style={{ width: '200px' }}
                  options={repairOrderData}
                  getOptionLabel={(option: any) => (option ? option.repairOrderNumber : '')}
                  getOptionSelected={(option: any, val) => {
                    return option._id === val._id;
                  }}
                  value={
                    repairOrderData.filter((data) => data._id === selectedRepairOrder).length
                      ? repairOrderData.filter((data) => data._id === selectedRepairOrder)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setSelectedRepairOrder(val && val._id ? val._id : '');
                  }}
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField
                        {...params}
                        margin="dense"
                        name=""
                        placeholder="Repair Order"
                        variant="standard"
                        fullWidth
                        className={isMobile ? 'serchBox' : ''}
                      />
                    ) : (
                      <TextField {...params} margin="dense" name="repairOrder" label="Repair Order" variant="outlined" fullWidth />
                    )
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
                  onClick={ handleShow}
                  style={{
                    marginLeft: '1rem',
                    marginTop: '5px'
                  }}
                  disabled={!selectedUser || !selectedWorkOrder || !selectedRepairOrder}
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  size="medium"
                  color="primary"
                  className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                >
                  Show
                </Button>
              </Grid>
            </Grid>
          </div>
          {columns ? (
            isMobile && !isTablet ? (
              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions?.serializedAsset}
                primaryField={columns?.find((d) => d.field === 'assetNumber')}
                onClick={(d) => {}}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={(d) => {}}
                extraParamsToCheckDelete={false}
                onDelete={(d) => {}}
                rowCount={rowCount}
                page={page}
                loading={loading}
                additionalDetails={[]}
                chips={[
                  {
                    label: 'Serial Number : ',
                    field: 'serialNumber'
                  }
                ]}
                owerCollaboratorInitialsOrImages=""
                onCreate={false}
                showClone={true}
                onClone={(data) => {}}
                renderedFrom={renderedFrom}
              />
            ) : Object.keys(frameWorkComponent).length > 0 && columns ? (
              <CustomAgGrid
                columns={columns}
                dataRows={dataRows}
                frameworkComponents={frameWorkComponent}
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
                refreshGrid={fetchWorkOrderSuperVisorData}
                showOnlyShowFilteredRecordSwitch={true}
              />
            ) : null
          ) : (
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

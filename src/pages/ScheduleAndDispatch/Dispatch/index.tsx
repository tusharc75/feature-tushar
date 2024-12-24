import { useContext, useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { gridLoadingTimeout, prepareDataForGrid, RENTAL_STATUS, rentalManagement, sidebarResource } from 'src/constants/helpers';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import axios, { CancelTokenSource } from 'axios';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Assets from 'src/pages/ScheduleAndDispatch/Dispatch/Assets';
import Services from 'src/pages/ScheduleAndDispatch/Dispatch/Services';
import Technician from 'src/pages/ScheduleAndDispatch/Dispatch/Technician';
import React from 'react';

const Dispatch = ({ search }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(sidebarResource.rentalManagement);
  const {
    state: { resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();

  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [tabValue, setTabValue] = useState(1);

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.rentalManagement}`);
    data = response?.data?.data;
    const newColumns = [...generateColumns(renderedFrom, data, routes.rentalManagementDetail.path), ...getStaticFields()];
    setColumns(newColumns);
  };

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchData(cancelToken);
    return () => cancelToken.cancel();
  }, [page, limit, filters, sorting, showFilteredRecordsOnly, search]);

  const fetchData = async (cancelToken?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    try {
      let data, count;
      const queryString = getQueryString();
      const response = await axiosInstance().get(`${rentalManagement.api}${queryString}`, { cancelToken: cancelToken?.token });
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data?.map((u) => {
        let finalObject: any = prepareDataForGrid(u);
        finalObject.orignalData = u;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
    } catch (e) {
      toastConfig.setToastConfig(e);
    } finally {
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    deepFilters.push({
      field: 'status',
      term: [
        RENTAL_STATUS.new,
        RENTAL_STATUS.inProgress,
        RENTAL_STATUS.jobPartiallyStarted,
        RENTAL_STATUS.jobStarted,
        RENTAL_STATUS.jobPartiallyEnded
      ]
    });
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const onRowClick = async (row) => {
    if (!rentalManagementData || row._id !== rentalManagementData._id) {
      const {
        data: { data }
      } = await axiosInstance().get(`${rentalManagement.api}/${row._id}`);
      setRentalManagementData(data);
    } else {
      setRentalManagementData(null);
    }
  };

  return (
    <>
      {columns ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[400px_1fr]">
          <div className="container-with-border p-[20px] md:min-h-[calc(100vh-200px)]">
            <CustomReactTable
              showOnlyMobileView={true}
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              resource={sidebarResource.rentalManagement}
              showOnlyShowFilteredRecordSwitch={false}
              hideSelection={true}
              setWholeRowsCellColor={(row) =>
                row._id === rentalManagementData?._id
                  ? ' [box-shadow:inset_0px_0px_0px_3px_var(--new-theme-color)_!important]  transition-bg duration-300'
                  : ' transition-bg duration-300'
              }
              onRowClick={onRowClick}
              showFilters={true}
            />
          </div>
          <div className="container-with-border p-[20px]">
            {rentalManagementData ? (
              <Box>
                <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                  <CustomTab key={'asset'} label={resources?.serializedAsset?.titlePlural} value={1} />
                  <CustomTab key={'service'} label={resources?.serviceMaster?.titlePlural} value={2} />
                  <CustomTab key={'technician'} label={resources?.employeeMaster?.titlePlural} value={3} />
                </CustomTabs>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <TabPanel value={tabValue} index={1}>
                      {tabValue === 1 && <Assets rentalManagementData={rentalManagementData} onSuccess={() => fetchData()} />}
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                      {tabValue === 2 && <Services rentalManagementData={rentalManagementData} />}
                    </TabPanel>
                    <TabPanel value={tabValue} index={3}>
                      {tabValue === 3 && <Technician rentalManagementData={rentalManagementData} />}
                    </TabPanel>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <div className="flex h-full items-center justify-center">
                <h6 className="text-xl text-gray-400">Please select a record</h6>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default Dispatch;

import { Box } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource, EXPENSE_STATUS, expenseReport } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ExpenceReport from 'src/pages/ExpenseApproval/ExpenceReport';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

let expenseApprovalTimeout;

const ExpenseApproval = () => {
  const renderedFrom = camelCase(sidebarResource?.expenseApproval);

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources, permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, showFilteredRecordsOnly } = state;

  const [selectedExpenseReport, setSelectedExpenseReport] = useState(null);
  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.expenseReport, permissions?.expenseApproval?.isUpdate);
    const newColumns = generateColumns(renderedFrom, fieldsDataForRead, routes?.expenseReportDetail?.path);
    setColumns([...newColumns, ...getStaticFields()]);
  };

  useEffect(() => {
    dispatch({ type: 'filter', filters: { status: { filter: [EXPENSE_STATUS.awaitingApproval, EXPENSE_STATUS.approved] } } });
  }, []);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (expenseApprovalTimeout) {
      clearTimeout(expenseApprovalTimeout);
    }
    expenseApprovalTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, showFilteredRecordsOnly]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&expenseApproval=1`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

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

    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    setSelectedExpenseReport(null);
    dispatch({ type: 'loading', loading: true });
    try {
      let data: any = [];
      const queryString = getQueryString();
      const response: any = await axiosInstance().get(`${expenseReport.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      let rows = data?.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: response?.data?.count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const onRowClick = (row) => {
    if (!selectedExpenseReport || row._id !== selectedExpenseReport._id) {
      setSelectedExpenseReport(row);
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.expenseApproval, title: resources?.expenseApproval?.titlePlural }]} />
        </Box>
      </Box>
      <Box className="detail-container-v1">
        {columns ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[400px_1fr]">
            <div className="container-with-border p-[20px] ">
              <CustomReactTable
                showOnlyMobileView={true}
                height="calc(100vh - 200px)"
                columns={columns}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                refreshGrid={fetchData}
                resource={sidebarResource.expenseReport}
                showOnlyShowFilteredRecordSwitch={false}
                hideSelection={true}
                setWholeRowsCellColor={(row) =>
                  row._id === selectedExpenseReport?._id
                    ? ' [box-shadow:inset_0px_0px_0px_3px_var(--new-theme-color)_!important] transition-bg duration-300'
                    : ' transition-bg duration-300'
                }
                onRowClick={onRowClick}
                showFilters={true}
              />
            </div>
            <div className="container-with-border py-5">
              {selectedExpenseReport && <ExpenceReport expenceReportId={selectedExpenseReport?._id} fetchExpenceReportData={fetchData} />}
            </div>
          </div>
        ) : (
          <Box className="max-h-[600px]">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ExpenseApproval;

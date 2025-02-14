import { Box, IconButton, MenuItem, Typography } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, toUpper } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource, EXPENSE_STATUS, expenseReport } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Requests from 'src/pages/ExpenseApproval/Requests';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RefreshIcon from '@mui/icons-material/Refresh';

let expenseApprovalTimeout;

const ExpenseApproval = () => {
  const renderedFrom = camelCase(sidebarResource?.expenseApproval);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [reportData, setReportData] = useState(null);
  const [selectedExpenseReport, setSelectedExpenseReport] = useState(null);

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
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
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
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    setSelectedExpenseReport(null);
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${expenseReport.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      count = response?.data?.count;
      data = data.filter((item) => item.status === EXPENSE_STATUS.awaitingApproval || item.status === EXPENSE_STATUS.approved);
      if (data?.length) {
        setSelectedExpenseReport(data[0]);
      }
      setReportData(data);
      let rows = data?.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.expenseReport?.isDelete && u.canDelete;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.expenseApproval, title: resources?.expenseApproval?.titlePlural }]} />
        </Box>
      </Box>
      <div className=" flex items-center justify-between ">
        <Box width={'19rem'}>
          <ListingPageHeader
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={false}
            actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
            isAddButtonVisible={false}
          />
        </Box>
        <div className="flex">
          <HtmlTooltip title="Refresh">
            <IconButton size="small" onClick={() => fetchData()}>
              <RefreshIcon />
            </IconButton>
          </HtmlTooltip>
        </div>
      </div>
      <Box className={`detail-container-v1`}>
        {reportData ? (
          reportData?.length > 0 ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                <Box className="container-with-border" p={2}>
                  <Box style={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
                    {reportData?.map((report) => {
                      const reportTotal = report.expenses?.reduce((acc, expense) => acc + (Number(expense.totalAmount) || 0), 0) || 0;
                      return (
                        <Box
                          mb={2}
                          key={report._id}
                          onClick={() => {
                            setSelectedExpenseReport(report);
                          }}
                          style={
                            {
                              cursor: 'pointer',
                              backgroundColor: 'var(--dark-secondary, white)',
                              '--card-color-primary': 'var(--dark-primary-text, #2A3042)',
                              '--card-color-secondary': 'var(--dark-secondary-text, #5B5B5B)',
                              border:
                                selectedExpenseReport === report ? '2.5px solid var(--new_theme_color)' : '1px solid var(--common-border-color)',
                              borderRadius: '8px'
                            } as React.CSSProperties
                          }
                        >
                          <Box p={2}>
                            <Box display="flex">
                              <Typography
                                variant="subtitle2"
                                style={{ color: 'var(--card-color-primary)', fontSize: 15, marginBottom: 8, fontWeight: 600 }}
                              >
                                Report Title : <span style={{ color: 'var(--card-color-secondary)' }}>{report.reportTitle}</span>
                              </Typography>
                            </Box>
                            <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                              Total Amount : <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{reportTotal || 'N/A'}</span>
                            </Typography>
                            <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                              <Box
                                component="span"
                                sx={{
                                  display: 'inline-block',
                                  backgroundColor: report?.status === EXPENSE_STATUS.approved ? '#E6FFFA' : '#FFF9E6',
                                  color: report?.status === EXPENSE_STATUS.approved ? '#0097A7' : '#FF9800',
                                  fontWeight: 600,
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  fontSize: '0.875rem',
                                  border: report?.status === EXPENSE_STATUS.approved ? '1px solid #80DEEA' : '1px solid #ffad33'
                                }}
                              >
                                {toUpper(report?.status)}
                              </Box>
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                {selectedExpenseReport && <Requests referenceId={selectedExpenseReport?._id} fetchDataMaster={fetchData} />}
              </Grid>
            </Grid>
          ) : (
            <Box style={{ minHeight: 'calc(100vh - 349px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography>No Request !</Typography>
            </Box>
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ExpenseApproval;

import { Box, Button, Card, CardActions, CardContent, IconButton, MenuItem, Typography } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { gridLoadingTimeout, prepareDataForGrid, expenseApproval, sidebarResource, EXPENSE_STATUS, expenseReport, expenses } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@mui/icons-material/Delete';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';

let expenseApprovalTimeout;

const ExpenseApproval = () => {
  const renderedFrom = camelCase(sidebarResource?.expenseApproval);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [subtotal, setSubtotal] = useState(0);

  const { generateColumns, checkStaticField } = useColumns();

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
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${expenseReport.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      count = response?.data?.count;
      data=data.filter((item) => item.status === EXPENSE_STATUS.awaitingApproval)
      setReportData(data);
      calculateTotal();
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

    const handleStatusChange = async (status) => {
      for (let report of reportData) {
      await axiosInstance().patch(`${expenseReport.api}/status/${report._id}`, {
        status
      });
      if (report?.selectedExpenses?.length > 0) {
        for (let expense of report.selectedExpenses) {
            await axiosInstance().patch(`${expenses.api}/status/${expense._id}`, {
              status
            });
        }
      }
    }
      fetchData();
    };

    const calculateTotal = () => {
      let sum = 0;
      for (let report of reportData) {
        if (report?.selectedExpenses?.length > 0) {
          for (let expense of report.selectedExpenses) {
             sum = expense?.reduce((acc, row) => acc + (Number(row.totalAmount) || 0), 0); 
          }
        }
      };
      return setSubtotal(sum);
    };


  const ActionMenuItems = () => {
    return (
      <MenuItem
        disabled={selectedRecords.every((e) => e?.canDelete) ? false : true}
        onClick={() => {
          if (selectedRecords?.length === 1) {
            setDeleteRecord(selectedRecords[0]);
          } else {
            setDeleteRecord(null);
          }
          setShowDeleteConfirmBox(true);
        }}
      >
        {`Delete (${selectedRecords?.length})`}
      </MenuItem>
    );
  };

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.expenseApproval, title: resources?.expenseApproval?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          isAddButtonVisible={false}
        />
        <Grid container spacing={2} className="mt-3">
          {reportData?.map((report) => (
            <Grid size={{xs:12, sm:6, md:4}} key={report._id}>
              <Card sx={{ maxWidth: 345 }}>
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {report.reportTitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {`Total Expense: ${report.totalAmount || 'N/A'}`}
                  </Typography>
                </CardContent>
                <CardActions>
                  <ThemeButton buttonType="themeBorder" onClick={() => handleStatusChange(EXPENSE_STATUS.approved)}>Approve</ThemeButton>
                  <ThemeButton buttonType="red" onClick={() => handleStatusChange(EXPENSE_STATUS.rejected)}>Reject</ThemeButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CustomContainer>
    </div>
  );
};

export default ExpenseApproval;

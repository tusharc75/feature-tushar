import { Box, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import Grid from '@mui/material/Grid2';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { EXPENSE_STATUS, expenseReport, expenses, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import AddExpenses from 'src/pages/ExpensesReport/AddExpenses';
import ManageExpenses from 'src/pages/Expenses/ManageExpenses';
import { isMobile, isTablet } from 'react-device-detect';

const Expenses = ({ selectedExpenseData, showAddButton, reportData=null }) => {
  const renderedFrom = camelCase(sidebarResource?.expenses);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const { generateColumns, checkStaticField } = useColumns();
  const { selectedRecords } = state;
  const pathSegments = window.location.href.split('/');
  const pid = pathSegments[pathSegments.length - 1].split('?')[0];
  const [deleteData, setDeleteData] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const currentDataRef = useRef([]);
  const deletedIdsRef = useRef(new Set());
  const [selectedExpense, setSelectedExpense] = useState([]);
  const [showAddExistingExpenseModal, setShowAddExistingExpenseModal] = useState(false);
  const [showManageExpensesDialog, setShowManageExpensesDialog] = useState({ open: false, idToClone: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedEntity, selectedExpenseData, selectedExpense]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.expenses}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes?.expensesDetail?.path, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(renderedFrom, field));
    });
    const extracolumns: any = [
      ...newColumns,
      {
        accessor: 'totalAmount',
        Header: 'Total Amount',
        minWidth: 100,
        width: 150,
        disableFilters: true,
        disableSortBy: false,
        canDrag: true,
        Cell: ({ row }) => {
          return row?.original?.totalAmount ? (
            <div>
              <p className="text-truncate">{row?.original?.totalAmount}</p>
            </div>
          ) : (
            <NoDataCell />
          );
        }
      }
    ];
    setColumns([...extracolumns, ActionsRenderer]);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [selectedEntity]);

  const getQueryString = (expense) => {
    let queryString = `?`;

    if (selectedEntity) {
      queryString = `${queryString}&entity=${selectedEntity}`;
    }
    if (expense?._id) {
      const filterById = [{ field: '_id', term: expense._id }];
      queryString = `${queryString}&filterById=${encodeURIComponent(JSON.stringify(filterById))}&filterType=and`;
    }

    return queryString;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    try {
      const expensesList = [
        ...(selectedExpenseData || []),
        ...(selectedExpense || [])
      ];
      const mergedExpenses = Array.from(
        new Map(expensesList.map((expense) => [expense._id, expense])).values()
      );
  
      const promises = mergedExpenses.map((expense) => {
        const queryString = getQueryString(expense);
        return axiosInstance().get(`${expenses.api}${queryString}`, {
          cancelToken: cancelTokenSource?.token
        });
      });
  
      const results = await Promise.all(promises);
  
      let fetchedRows = [];
      results.forEach((response) => {
        const data = response?.data?.data || [];
        const rows = data.map((u) => {
          const finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['canDelete'] = permissions?.expenses?.isDelete;
          return finalObject;
        });
        fetchedRows = [...fetchedRows, ...rows];
      });
  
      const deduplicatedFetchedRows = Array.from(
        new Map(fetchedRows.map((item) => [item._id, item])).values()
      );
      const filteredRows = deduplicatedFetchedRows.filter(
        (row) => !deletedIdsRef.current.has(row._id)
      );
  
      const sum = filteredRows.reduce((acc, row) => acc + (Number(row.totalAmount) || 0), 0);
      setSubtotal(sum);
  
      currentDataRef.current = filteredRows;
      dispatch({ type: 'initialize', data: filteredRows, count: filteredRows.length });
  
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = async (rows) => {
    axiosInstance()
      .put(`${routes.expenseReport.path}/expenses/${pid}/remove`, { ids: rows })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setDeleteData(null);
      });
  };

  const handleSaveAndSubmit = async (newExpenses) => {
    setIsSubmitting(true);
  
    const updatedExpenses = [...newExpenses, ...selectedExpense];
    setSelectedExpense(updatedExpenses);
    const expense = [...reportData.expenses, ...updatedExpenses]
    const payload = {
      _id: reportData._id,
      reportTitle : reportData.reportTitle,
      status: reportData.status,
      expenses: expense,
    };
  
    try {
      const response = await axiosInstance().put(`${expenseReport.api}`, payload);
      const status = EXPENSE_STATUS.unSubmitted;
  
      await Promise.all(
        updatedExpenses.map((expense) =>
          axiosInstance().patch(`${expenses.api}/status/${expense._id}`, { status })
        )
      );
      fetchData();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: response.data.message,
      }); 
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  
    setIsSubmitting(false);
  };
  

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={'Delete'}>
          <span>
            <IconButton size="small" aria-label="Delete" disabled={!row?.original?.canDelete} onClick={() => setDeleteData([row?.original?._id])}>
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowAddExistingExpenseModal(true);
          }}
        >
          {`Add Existing ${resources?.expenses?.titlePlural}`}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setShowManageExpensesDialog({ open: true, idToClone: null });
          }}
        >
          {`Create New ${resources?.expenses?.titlePlural}`}
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          color="primary"
          disabled={selectedRecords.length === 0}
          onClick={() => {
            const dataToDelete = selectedRecords.map((record) => record._id);
            setDeleteData(dataToDelete);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <div className="main-container-v1">
      <>
        <DetailsPageHeader
          isAddButtonVisible={showAddButton}
          isActionButtonVisible={true}
          actionButtonMenuItems={actionButtonMenuItems()}
          addButtonMenuItems={addButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords.length === 0 }}
          hasXpadding
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 450px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            resource={sidebarResource.expenses}
            pagination={false}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(8).keys()]} />
          </Box>
        )}
        <Grid container justifyContent="flex-end" className="mt-2">
          <Grid>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 400 }} aria-label="spanning table">
                <TableBody>
                  <TableRow>
                    <TableCell rowSpan={3} />
                    <TableCell colSpan={2}>Subtotal</TableCell>
                    <TableCell align="right">{` ${subtotal}`}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
        {deleteData && (
          <ConfirmationDialog
            open={true}
            message={`Are you sure you want to delete the record(s)?`}
            onClose={() => setDeleteData(null)}
            onOk={() => handleDelete(deleteData)}
          />
        )}
        {showAddExistingExpenseModal && (
          <AddExpenses
            open={showAddExistingExpenseModal}
            onClose={() => setShowAddExistingExpenseModal(false)}
            fullScreen
            setFullScreen={setFullScreen}
            onSave={handleSaveAndSubmit}
            fetchReportData={fetchData}
            isSubmitting={isSubmitting}
          />
        )}
        {showManageExpensesDialog.open && (
          <ManageExpenses
            expenseId={showManageExpensesDialog.idToClone}
            onClose={() => setShowManageExpensesDialog({ open: false, idToClone: null })}
            onSuccess={(data) => {
              setShowManageExpensesDialog({ open: false, idToClone: null });
              setSelectedExpense((prevExpenses) => {
                const updatedExpenses = prevExpenses.filter((exp) => exp._id !== data._id);
                return [...updatedExpenses, data];
              });
            }}
            isRedirectToDetailPage={false}
          />
        )}
      </>
    </div>
  );
};

export default Expenses;

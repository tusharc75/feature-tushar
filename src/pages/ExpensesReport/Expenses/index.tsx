import { Box, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import Grid from '@mui/material/Grid2';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import {
  EXPENSE_STATUS,
  expenseReport,
  expenses,
  formatAmountWithCurrency,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource
} from 'src/constants/helpers';
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

const Expenses = ({ expenseIds, showAddButton, reportData = null, removeRow, allowedToEdit, fetchDataMaster = null }) => {
  const renderedFrom = camelCase(sidebarResource?.expenses);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const { generateColumns, checkStaticField } = useColumns();
  const { selectedRecords } = state;
  const [deleteData, setDeleteData] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState([]);
  const [showAddExistingExpenseModal, setShowAddExistingExpenseModal] = useState(false);
  const [showManageExpensesDialog, setShowManageExpensesDialog] = useState({ open: false, idToClone: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteconfirmBox, setDeleteConfirmBox] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, [allowedToEdit]);

  useEffect(() => {
    fetchData();
  }, [selectedEntity, expenseIds]);

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
              <p className="text-truncate">
                {formatAmountWithCurrency(row?.original?.currency, row?.original?.totalAmount)?.fullFormatAmountWithoutSpace}{' '}
              </p>
            </div>
          ) : (
            <NoDataCell />
          );
        }
      }
    ];
    setColumns([...extracolumns, ...(allowedToEdit ? [ActionsRenderer] : [])]);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [selectedEntity]);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    try {
      const response: any = await axiosInstance().get(`${expenses.api}`, { cancelToken: cancelTokenSource?.token });
      const filteredExpenses = response?.data?.data.filter((expense) => expenseIds?.includes(expense._id));

      let fetchedRows = [];
      filteredExpenses.map((expense) => {
        const finalObject = prepareDataForGrid(expense, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.expenses?.isDelete;
        fetchedRows.push(finalObject);
      });

      const duplicatedFetchedRows = Array.from(new Map(fetchedRows.map((item) => [item._id, item])).values());

      const sum = duplicatedFetchedRows.reduce((acc, row) => acc + (Number(row.totalAmount) || 0), 0).toFixed(2);
      setSubtotal(sum);

      dispatch({ type: 'initialize', data: duplicatedFetchedRows, count: duplicatedFetchedRows.length });

      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const updateExpensesStatus = () => {
    axiosInstance()
      .patch(`${expenseReport.api}/status/${reportData._id}`, { status: EXPENSE_STATUS.unSubmitted })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveAndSubmit = async (newExpenses) => {
    setIsSubmitting(true);

    const newExpensesArr = Array.isArray(newExpenses) ? newExpenses : [newExpenses];

    const updatedExpenses = [...newExpensesArr, ...selectedExpense];
    setSelectedExpense(updatedExpenses);

    const expense = [...reportData.expenses, ...updatedExpenses];
    const payload = {
      _id: reportData._id,
      reportTitle: reportData.reportTitle,
      status: reportData.status,
      expenses: expense,
      users: [...reportData.users.map((user) => user.optionValue)]
    };

    await axiosInstance()
      .put(`${expenseReport.api}`, payload)
      .then(({ data }) => {
        updateExpensesStatus();
        setIsSubmitting(false);
        fetchDataMaster();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
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
        <HtmlTooltip title={row?.original?.canDelete && allowedToEdit ? 'Delete' : 'Expense is Awaiting Approval'}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete && allowedToEdit ? false : true}
              onClick={() => {
                setDeleteConfirmBox(true);
                setDeleteData([row?.original?._id]);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete && allowedToEdit ? 'error' : 'disabled'} />
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
            setDeleteConfirmBox(true);
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
        {allowedToEdit && (
          <DetailsPageHeader
            isAddButtonVisible={showAddButton}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            addButtonMenuItems={addButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords.length === 0 }}
            hasXpadding
          />
        )}
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
            hideSelection={!allowedToEdit}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(8).keys()]} />
          </Box>
        )}
        <Grid container justifyContent="flex-end" className="pt-2">
          <Grid>
            <TableContainer className="border">
              <Table sx={{ minWidth: 400 }} aria-label="spanning table">
                <TableBody>
                  <TableRow>
                    <TableCell rowSpan={3} />
                    <TableCell colSpan={2} sx={{ fontSize: '1rem' }}>
                      <span className="font-medium">Total Amount :</span>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '1rem' }}>
                      <span className="font-small">{subtotal}</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
        {deleteData && deleteconfirmBox && (
          <ConfirmationDialog
            open={true}
            message={`Are you sure you want to delete the record(s)?`}
            onClose={() => setDeleteData(null)}
            onOk={() => {
              removeRow(deleteData);
              setDeleteConfirmBox(false);
            }}
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
            onSuccess={async (data) => {
              setShowManageExpensesDialog({ open: false, idToClone: null });
              handleSaveAndSubmit(data);
              fetchData();
            }}
            isRedirectToDetailPage={false}
          />
        )}
      </>
    </div>
  );
};

export default Expenses;

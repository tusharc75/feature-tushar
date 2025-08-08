import { Box, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import Grid from '@mui/material/Grid2';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { expenseReport, expenses, formatAmountWithCurrency, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import AddExistingExpenses from 'src/pages/ExpensesReport/AddExistingExpenses';
import ManageExpenses from 'src/pages/Expenses/ManageExpenses';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

const Expenses = ({
  expenseIds,
  allowedToEdit,
  expenseReportData = null,
  expenceReportId = null,
  setExpences = null,
  fetchexpenseReportData = null
}) => {
  const renderedFrom = camelCase(sidebarResource?.expenses);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();
  const { selectedRecords } = state;
  const [deleteData, setDeleteData] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [showAddExistingExpenseModal, setShowAddExistingExpenseModal] = useState(false);
  const [showManageExpensesDialog, setShowManageExpensesDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteconfirmBox, setDeleteConfirmBox] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, [allowedToEdit]);

  useEffect(() => {
    fetchData();
  }, [expenseIds]);

  const fetchGridColumns = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.expenses, false);
    const newColumns = generateColumns(renderedFrom, fieldsDataForRead, routes?.expensesDetail?.path);
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
    setColumns([...extracolumns, ...getStaticFields(), ActionsRenderer]);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, []);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    try {
      let rows = [];
      if (expenseIds?.length) {
        const response: any = await axiosInstance().get(`${expenses.api}?getById=${JSON.stringify(expenseIds)}&noUserFilter=true`, {
          cancelToken: cancelTokenSource?.token
        });
        rows = response?.data?.data;
      }
      rows = rows?.map((e) => {
        const finalObject = prepareDataForGrid(e, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.expenses?.isDelete;
        return finalObject;
      });
      const sum = rows?.reduce((acc, row) => acc + (Number(row.totalAmount) || 0), 0).toFixed(2);
      setSubtotal(sum);
      dispatch({ type: 'initialize', data: rows, count: rows.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleAdd = async (rows) => {
    if (expenceReportId) {
      setIsSubmitting(true);
      await axiosInstance()
        .post(`${expenseReport.api}/${expenceReportId}/expenses/add`, { expenseIds: rows?.map((e) => e._id) })
        .then(({ data }) => {
          setShowAddExistingExpenseModal(false);
          setIsSubmitting(false);
          fetchexpenseReportData();
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
    } else {
      setExpences([...expenseIds, ...rows?.map((e) => e._id)]);
      setShowAddExistingExpenseModal(false);
    }
  };

  const handleRemove = async () => {
    if (expenceReportId) {
      await axiosInstance()
        .put(`${expenseReport.api}/${expenceReportId}/expenses/remove`, { expenseIds: deleteData })
        .then(({ data }) => {
          fetchexpenseReportData();
          setDeleteConfirmBox(false);
          setDeleteData(null);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      setExpences(expenseIds?.filter((e) => !deleteData?.includes(e)));
      setDeleteConfirmBox(false);
      setDeleteData(null);
    }
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
        {/* <MenuItem
          onClick={() => {
            setShowManageExpensesDialog(true);
          }}
        >
          {`Create New ${resources?.expenses?.titlePlural}`}
        </MenuItem> */}
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
            setDeleteData(selectedRecords.map((record) => record._id));
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
            isAddButtonVisible={true}
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
            hideAction={!allowedToEdit}
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
                    <TableCell colSpan={2}>
                      <span className="font-semibold">Total Amount :</span>
                    </TableCell>
                    <TableCell align="right">
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
            message={`Are you sure you want to remove the record(s)?`}
            onClose={() => setDeleteData(null)}
            onOk={handleRemove}
          />
        )}
        {showAddExistingExpenseModal && (
          <AddExistingExpenses
            expenseReportData={expenseReportData}
            onClose={() => setShowAddExistingExpenseModal(false)}
            onSuccess={handleAdd}
            isSubmitting={isSubmitting}
            ids={expenseIds || []}
          />
        )}
        {showManageExpensesDialog && (
          <ManageExpenses
            expenseId={null}
            onClose={() => setShowManageExpensesDialog(false)}
            onSuccess={async (data) => {
              setShowManageExpensesDialog(false);
              handleAdd([data]);
            }}
            isRedirectToDetailPage={false}
          />
        )}
      </>
    </div>
  );
};

export default Expenses;

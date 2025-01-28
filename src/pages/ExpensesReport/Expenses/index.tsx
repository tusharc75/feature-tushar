import { Box, IconButton, MenuItem } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { EXPENSE_STATUS, expenses, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import AddExpenses from 'src/pages/ExpensesReport/AddExpenses';
import { isMobile, isTablet } from 'react-device-detect';
import ManageExpenses from 'src/pages/Expenses/ManageExpenses';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';

const Expenses = (selectedExpenseData) => {
  const renderedFrom = camelCase(sidebarResource?.expenses);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const { generateColumns, checkStaticField } = useColumns();
  const { selectedRecords } = state;
  const [showAddExistingExpenseModal, setShowAddExistingExpenseModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showManageExpensesDialog, setShowManageExpensesDialog] = useState({ open: false, isClone: false, idToClone: null });
  const history = useHistory();

  useEffect(() => {
    fetchGridColumns();
  }, []);

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

  const getQueryString = () => {
    let queryString = `?`;
    if (selectedEntity) {
      queryString = `${queryString}&entity=${selectedEntity}`;
    }
    console.log(selectedExpenseData);
    const filterByIds = selectedExpenseData?.selectedExpenseData?.map((expense) => ({ field: '_id', term: expense._id }));
    if (filterByIds?.length) {
      queryString = `${queryString}&filterById=${encodeURIComponent(JSON.stringify(filterByIds))}&filterType=and`;
    }

    return queryString;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [], count;
      const response: any = await axiosInstance().get(`${expenses.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.expenses?.isDelete;
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
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                console.log(row.original.id)
                removeExpenseField(row.original.id);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const handleSaveExpenses = async (newExpenses) => {
    const updatedExpenses = [...selectedExpense, ...newExpenses];
    setSelectedExpense(updatedExpenses);
  };

    const removeExpenseField = (id) => {
      const removedExpense = selectedExpense.find((field) => field._id === id);
      console.log(selectedExpense)
      setSelectedExpense(selectedExpense.filter((field) => field._id !== id));
      if (removedExpense) {
        axiosInstance()
          .patch(`${expenses.api}/status/${removedExpense._id}`, { status: EXPENSE_STATUS.unreported })
          .then(({ data }) => {})
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      }
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
            setShowManageExpensesDialog({ open: true, isClone: false, idToClone: null });
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
            removeExpenseField(selectedRecords.map((d) => d._id));
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <div className="main-container-v1">
      <>
        <DetailsPageHeader
          isAddButtonVisible={true}
          addButtonMenuItems={addButtonMenuItems()}
          isActionButtonVisible={true}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords.length === 0 }}
          hasXpadding
        />
        {columns && selectedExpense ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            resource={sidebarResource.expenses}
            pagination={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(8).keys()]} />
          </Box>
        )}
      </>
      {showAddExistingExpenseModal && (
        <AddExpenses
          open={showAddExistingExpenseModal}
          onClose={() => setShowAddExistingExpenseModal(false)}
          fullScreen
          selectedExpense={selectedExpense}
          setFullScreen={setFullScreen}
          isSubmitting={isSubmitting}
          onSave={handleSaveExpenses}
          fetchReportData={fetchData}
        />
      )}
      {showManageExpensesDialog.open && (
        <ManageExpenses
          isClone={showManageExpensesDialog.isClone}
          expenseId={showManageExpensesDialog.idToClone}
          onClose={() => setShowManageExpensesDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            setShowManageExpensesDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
          }}
          isRedirectToDetailPage ={false}
        />
      )}
    </div>
  );
};

export default Expenses;

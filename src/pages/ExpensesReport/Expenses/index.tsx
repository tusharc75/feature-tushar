import { Box, IconButton } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { deleteDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageExpenses from 'src/pages/Expenses/ManageExpenses';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { expenses, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';


const Expenses = (selectedExpenseData, removeExpense) => {
  const renderedFrom = camelCase(sidebarResource?.expenses);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showManageExpensesDialog, setShowManageExpensesDialog] = useState({ open: false, isClone: false, idToClone: null });
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const [columns, setColumns] = useState(null);

  const { generateColumns, checkStaticField } = useColumns();

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
  }, [ selectedEntity]);

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
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={removeExpense}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = () => {
    let queryString = `?`;
    if (selectedEntity) {
      queryString = `${queryString}&entity=${selectedEntity}`;
    }
  
    const filterByIds = selectedExpenseData?.selectedExpenses?.map((expense) => ({ field: '_id', term: expense._id }));
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

  const handleDeleteExpenses = async () => {
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      setDeleteLoading(true);
      axiosInstance()
        .put(`${expenses.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          dispatch({ type: 'selection', selectedRecords: [] });
          setShowDeleteConfirmBox(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowDeleteConfirmBox(false);
          setDeleteLoading(false);
        });
    }
  };


  return (
    <div className="main-container-v1">
      <>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            showArrangeView = {false}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            resource={sidebarResource.expenses}
            pagination={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {showDeleteConfirmBox ? (
          <ConfirmationDialogRaw
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${deleteRecord
              ? `${resources?.expenses?.titleSingular?.toLowerCase()} :
              ${deleteRecord?.expenseNumber}`
              : `selected ${resources?.expenses?.titlePlural?.toLowerCase()}`
              } ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDeleteExpenses}
            okBtnLoading={deleteLoading}
          />
        ) : null}
      </>
      {showManageExpensesDialog.open && (
        <ManageExpenses
          isClone={showManageExpensesDialog.isClone}
          expenseId={showManageExpensesDialog.idToClone}
          onClose={() => setShowManageExpensesDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            history.push(`${routes.expensesDetail.path}/${data._id}`);
            setShowManageExpensesDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </div>
  );
};

export default Expenses;

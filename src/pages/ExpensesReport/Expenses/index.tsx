import { Box, IconButton } from '@mui/material';
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
  const [selectedExpense, setSelectedExpense] = useState([]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedEntity, selectedExpenseData?.selectedExpenseData]);

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
      const promises = (selectedExpenseData?.selectedExpenseData || []).map((expense) => {
        const queryString = getQueryString(expense);
        return axiosInstance().get(`${expenses.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      });
  
      const results = await Promise.all(promises);
  
      let allRows: any[] = [];
      results.forEach((response) => { 
        const data = response?.data?.data || [];
        const rows = data.map((u) => {
          const finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['canDelete'] = permissions?.expenses?.isDelete;
          return finalObject;
        });
        allRows = [...allRows, ...rows];
      });
  
      dispatch({ type: 'initialize', data: allRows, count: allRows.length });
  
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

    const removeExpenseField = (id) => {
      const removedExpense = selectedExpense.find((field) => field._id === id);
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

  return (
    <div className="main-container-v1">
      <>
        {columns ? (
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
    </div>
  );
};

export default Expenses;

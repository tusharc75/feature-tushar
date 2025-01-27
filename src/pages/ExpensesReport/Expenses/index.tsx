import { Box, MenuItem } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { expenses, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';

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
    setColumns([...extracolumns, 
    ]);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [ selectedEntity]);

  const getQueryString = () => {
    let queryString = `?`;
    if (selectedEntity) {
      queryString = `${queryString}&entity=${selectedEntity}`;
    }
  
    const filterByIds = selectedExpenseData?.selectedExpenseData?.selectedExpenses?.map((expense) => ({ field: '_id', term: expense._id }));
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

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          // onClick={() => {
          //   history.push(routes?.expenses?.path);
          // }}
        >
          {`Add Existing ${resources?.expenses?.titlePlural}`}
        </MenuItem>
        <MenuItem
          // onClick={() => {
          //   history.push(routes?.expenses?.path);
          // }}
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
          disabled={selectedRecords.length === 0 }
          // onClick={() => {
          //   setShowDeleteConfirmBox(true);
          //   setDeleteBulkAssetCreationProduct(selectedRecords.map((d) => d._id));
          // }}
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

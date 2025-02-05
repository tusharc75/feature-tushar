import { Box, Dialog } from '@mui/material';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, EXPENSE_STATUS, sidebarResource } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import axios, { CancelTokenSource } from 'axios';
import { useData } from '../../StateProvider/Provider';
import {
  gridLoadingTimeout,
  prepareDataForGrid,
  expenses,
} from '../../constants/helpers';
import { ListingPageHeader } from 'src/components/PageHeaders';

function AddExpenses({
  open,
  onClose,
  fullScreen,
  setFullScreen,
  isSubmitting=null,
  onSave,
  fetchReportData
}) {
  const renderedFrom = camelCase(sidebarResource?.expenses);
  const [columns, setColumns] = useState(null);
  const { generateColumns, checkStaticField } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters,search, sorting, showFilteredRecordsOnly } = state;
  const { state: { user, permissions } } = useData();
  const [selectedRows, setSelectedRows] = useState([]);
  const { selectedRecords } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters,search, sorting, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.expenses}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes?.expensesDetail?.path, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(renderedFrom, field));
    });
    setColumns(newColumns);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

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
      let data: any = [], count;
      const response: any = await axiosInstance().get(`${expenses.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      count = response?.data?.count;
      data = data.filter((item) => item.status === EXPENSE_STATUS.unreported);
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
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
    }
  };

  const handleSave = (selectedRecords) => {
    setSelectedRows(selectedRecords);
    onSave(selectedRows); 
    onClose();
  };

  const handleRowSelection = (selectedRows) => {
    setSelectedRows(selectedRows); 
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      open={open}
    >
      <CustomDialogHeader
        title="Add Expense to Report"
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
      />
      <CustomDialogContent>
      <ListingPageHeader
            showSearchInMobile={true}
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={false}
            addButtonProps={{
              disabled: !selectedRecords?.length || isSubmitting,
              loading: isSubmitting,
              iconsEnabled: false,
              text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : '',
              textAddShow: true
            }}
            addButtonOnclick={()=>{handleSave(selectedRecords);
              fetchReportData();
            }}
            isAddButtonVisible={true}
            setQueryString={false}
          />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            resource={sidebarResource?.expenses}
            onSelect={handleRowSelection} 
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(8).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
}

export default AddExpenses;

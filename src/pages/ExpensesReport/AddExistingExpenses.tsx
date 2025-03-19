import { Box, Dialog } from '@mui/material';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { dateFormatToSend, EXPENSE_STATUS, sidebarResource } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import axios, { CancelTokenSource } from 'axios';
import { useData } from '../../StateProvider/Provider';
import { gridLoadingTimeout, prepareDataForGrid, expenses } from '../../constants/helpers';
import { ListingPageHeader } from 'src/components/PageHeaders';

function AddExistingExpenses({ onClose, ids, isSubmitting, onSuccess, expenseReportData = null }) {

  const renderedFrom = `${camelCase(sidebarResource?.expenses)}_Add`;

  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, search, sorting, showFilteredRecordsOnly } = state;
  const {
    state: { user, permissions, resources }
  } = useData();
  const { selectedRecords } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, search, sorting, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.expenses}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes?.expensesDetail?.path, true);
    setColumns([...newColumns, ...getStaticFields()]);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getQueryString = () => {
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    const updatedDeepFilters = [...deepFilters];
    updatedDeepFilters.push({
      field: 'expenseDate',
      term: { 'from': dateFormatToSend(expenseReportData?.fromDate), 'to': dateFormatToSend(expenseReportData?.toDate) }
    });
    updatedDeepFilters.push({
      field: 'status',
      term: EXPENSE_STATUS.unreported
    });

    if (updatedDeepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedDeepFilters))}`;
    }

    if (filterByIds?.length || updatedDeepFilters?.length) {
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
      let data: any = [];
      const response: any = await axiosInstance().get(`${expenses.api}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['canDelete'] = permissions?.expenses?.isDelete;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: response?.data?.count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      open={true}
    >
      <CustomDialogHeader title={`Add ${resources?.expenses?.titlePlural}`} onClose={onClose} showRequiredLabel={false} />
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
          addButtonOnclick={() => {
            onSuccess(selectedRecords);
          }}
          isAddButtonVisible={true}
          setQueryString={false}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            resource={sidebarResource?.expenses}
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

export default AddExistingExpenses;

import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog/Dialog';
import Grid from '@mui/material/Grid2';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import SearchBox from '../../../components/Helpers/SearchBox';
import { CustomDialogTransition, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';
import axios, { CancelTokenSource } from 'axios';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const WarhouseList = ({ api, isCustomer = false, addWarehouse, onClose, isAddingWarehouse, assignedWarehouse }) => {
  const renderedFrom = camelCase(sidebarResource?.warehouse);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { selectedEntity, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    dispatch({ type: 'selection', selectedRecords: [] });
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchMaterial(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchMaterial = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(isCustomer ? u?.warehouseDetail : u);
          finalObject['isChecked'] = false;
          return {
            ...u,
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = () => {
    const ignoreIds = assignedWarehouse && assignedWarehouse?.length > 0 ? assignedWarehouse : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    const { deepFilters } = gridFilterParser(filters);

    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.warehouse}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.warehouseDetail.path, true);
    setColumns([...newColumns, ...getStaticFields()]);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Add ${resources?.warehouse?.titleSingular}`} onClose={onClose}></CustomDialogHeader>
        <div className="listing-grid p-3">
          <Box mb={2}>
            <Grid container>
              <Grid size={{ xs: 6, sm: 12, md: 6, lg: 6 }} container justifyContent="flex-end">
              <SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
                <Box ml={1}>
                  <ThemeButton
                    onClick={() => {
                      addWarehouse(selectedRecords);
                    }}
                    disabled={!selectedRecords?.length || isAddingWarehouse}
                    isLoading={isAddingWarehouse}
                    buttonType='theme'
                  >
                    Assign {selectedRecords?.length ? ' (' + selectedRecords?.length + ')' : ''}
                  </ThemeButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 250px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchMaterial}
              showOnlyShowFilteredRecordSwitch={true}
              resource={sidebarResource.warehouse}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </div>
      </Dialog>
    </Fragment>
  );
};

export default WarhouseList;

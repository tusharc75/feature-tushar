import { Box, Dialog } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import { ListingPageHeader } from '../PageHeaders';
import axios, { CancelTokenSource } from 'axios';

const AssignDynamicDialog = ({ onSuccess, handleClose, resource, isSubmitting, ids = [], extraDeepFilter = [], extraFilterById = [] }) => {
  const renderedFrom = camelCase(`${routes[resource]?.title || resource}`);

  const {
    state: { selectedEntity }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${resource}&view=true`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, `${routes[`${camelCase(resource)}Detail`]?.path}`, false);
        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = (cancelTokenSource) => {
    if (ids?.length > 25) {
      fetchDataPost();
    } else {
      fetchDataGet(cancelTokenSource);
    }
  };

  const fetchDataGet = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`dynamic-form/${queryString}`, {
        headers: {
          Resource: resource,
          cancelToken: cancelTokenSource?.token
        }
      })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          return {
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
      });
  };

  const fetchDataPost = () => {
    dispatch({ type: 'loading', loading: true });
    const postData = getPostData();
    axiosInstance()
      .post(`dynamic-form/findAll`, postData, {
        headers: {
          Resource: resource
        }
      })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          return {
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
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (ids?.length > 0) {
      deepFilter = `${deepFilter}&ignoreIds=${JSON.stringify(ids)}`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (extraDeepFilter?.length > 0) {
      extraDeepFilter?.map((e) => {
        deepFilters.push(e);
      });
    }

    if (extraFilterById?.length > 0) {
      extraFilterById?.map((e) => {
        filterByIds.push(e);
      });
    }

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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const getPostData = () => {
    const data: any = {};
    data.page = page;
    data.limit = limit;
    if (ids?.length) {
      data.ignoreIds = ids;
    }
    if (selectedEntity) {
      data.selectedEntity = selectedEntity;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (extraDeepFilter?.length > 0) {
      extraDeepFilter?.map((e) => {
        deepFilters.push(e);
      });
    }
    if (extraFilterById?.length > 0) {
      extraFilterById?.map((e) => {
        filterByIds.push(e);
      });
    }
    if (filterByIds) {
      data.filterById = filterByIds;
    }
    if (deepFilters) {
      data.deepFilter = deepFilters;
    }
    if (filterByIds?.length || deepFilters?.length) {
      data.filterType = 'and';
    }
    if (sorting.length > 0) {
      data.sortBy = sorting[0].colId;
      data.orderBy = sorting[0].sort;
    }
    if (search) {
      data.search = search;
    }
    if (showFilteredRecordsOnly) {
      data.getById = selectedRecords?.map((m) => m._id);
    }
    return data;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullScreen={true}
      open={true}
      onClose={handleClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader
        title={`Assign ${routes[camelCase(resource)]?.title || resource}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <ListingPageHeader
          showSearchInMobile={true}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          addButtonProps={{
            disabled: isSubmitting || selectedRecords?.length === 0,
            loading: isSubmitting,
            iconsEnabled: false,
            text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
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
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={resource}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignDynamicDialog;

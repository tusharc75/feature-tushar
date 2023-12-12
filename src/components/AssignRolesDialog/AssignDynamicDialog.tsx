import { useState, useEffect, useContext } from 'react';
import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import SearchBox from '../Helpers/SearchBox';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import styles from 'src/pages/Leads/Header.module.scss';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { camelCase } from 'lodash';

let searchTimeout;

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
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${resource}&view=true`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, `${routes[`${camelCase(resource)}Detail`]?.path}`, false);
        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = () => {
    if (ids?.length > 25) {
      fetchDataPost();
    } else {
      fetchDataGet();
    }
  };

  const fetchDataGet = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`dynamic-form/${queryString}`, {
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
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader
        title={`Assign ${routes[camelCase(resource)]?.title || resource}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox onChange={handleSearch} className={styles.search_box_input} width="242px" size="small" value={search} />
                <Button
                  disabled={isSubmitting || selectedRecords?.length === 0}
                  onClick={() => {
                    onSuccess(selectedRecords);
                  }}
                  color="primary"
                  size="small"
                  variant="contained"
                  endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
                >
                  {`Add ${selectedRecords?.length > 0 ? '(' + selectedRecords?.length + ')' : ''}`}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </div>
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

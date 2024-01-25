import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { gridLoadingTimeout, prepareDataForGrid, serviceMaster, sidebarResource } from 'src/constants/helpers';
import styles from 'src/pages/Leads/Header.module.scss';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomTabs, { CustomTab } from '../CustomTabs';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import SearchBox from '../Helpers/SearchBox';

let searchTimeout;

const AssignServiceDialog = ({
  onSuccess,
  handleClose,
  ids = [],
  extraStaticFilter = [],
  isSubmitting = false,
  hideQty = false,
  extraFilterById = null,
  pricingCondition = null
}) => {
  const renderedFrom = `${camelCase(routes.serviceMaster?.title)}_Assign`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const defaultColumns = [
    {
      accessor: 'qty',
      Header: 'Qty',
      minWidth: 150,
      width: 150,
      editable: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty}</h5>
    }
  ];

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
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, tabValue]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Service Master&view=true')
      .then(({ data: { data } }) => {
        let columns = [];
        let newColumns = generateColumns(renderedFrom, data, routes.serviceMasterDetail.path);
        columns = [...newColumns, ...getStaticFields()];
        if (hideQty) {
          setColumns([...columns]);
        } else {
          setColumns([...defaultColumns, ...columns]);
        }
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });

    const queryString = getQueryString();
    axiosInstance()
      .get(`${serviceMaster.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['qty'] = 1;
          finalObject['unitMain'] = u?.unit;
          finalObject['pricingMethodMain'] = u?.pricingMethod;
          const qtyAdded = selectedRecords?.filter((e) => e._id === u._id);
          if (qtyAdded.length) {
            finalObject['qty'] = qtyAdded[0].qty;
          }
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = () => {
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;

    if (pricingCondition && tabValue === 0) {
      deepFilter = `${deepFilter}&pricingCondition=${pricingCondition}`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);
    const updatedFilters = [...deepFilters];
    if (extraStaticFilter?.length) {
      extraStaticFilter?.forEach((e) => {
        if (e?.field === 'preWork') {
          if (user?.user?.brandPolicy?.servicePrePost) {
            updatedFilters.push(e);
          }
        } else {
          updatedFilters.push(e);
        }
      });
    }
    if (extraFilterById && extraFilterById?.length) {
      extraFilterById?.forEach((e) => {
        filterByIds.push(e);
      });
    }
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (updatedFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty) return;
    const rows = [...dataRows];
    rows?.forEach((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
        d.isChecked = true;
      }
    });
    if (!selectedRecords?.find((e) => e._id === row?._id)) {
      const editRow = rows?.find((e) => e._id === row?._id);
      if (editRow) {
        dispatch({ type: 'selection', selectedRecords: [...selectedRecords, editRow] });
      }
    } else {
      const updatedSelectedRecords = selectedRecords?.map((e) => {
        if (e?._id === row?._id) {
          return { ...e, qty: parseInt(data?.qty), isChecked: true };
        }
        return e;
      });
      dispatch({ type: 'selection', selectedRecords: updatedSelectedRecords });
    }
    dispatch({ type: 'update', data: rows });
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
    dispatch({ type: 'selection', selectedRecords: [] });
    dispatch({ type: 'pageChange', page: 0 });
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader
        title={`Assign ${routes.serviceMaster.title}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox onChange={handleSearch} width="242px" size="small" value={search} />
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
                  Add {selectedRecords?.length > 0 ? '(' + selectedRecords?.length + ')' : ''}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </div>
        {pricingCondition && (
          <Box>
            <CustomTabs value={tabValue} onChange={handleMainTabChange}>
              <CustomTab value={0} index={0} label={`${routes.pricingCondition.title} Services`} {...a11yProps(0)} />
              <CustomTab className={'tabLayout'} value={1} index={1} label={'All Services'} {...a11yProps(1)} />
            </CustomTabs>
          </Box>
        )}
        {columns ? (
          <CustomReactTable
            height={pricingCondition ? 'calc(100vh - 310px)' : 'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            onSaveEdit={onSaveEdit}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.serviceMaster}
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

export default AssignServiceDialog;

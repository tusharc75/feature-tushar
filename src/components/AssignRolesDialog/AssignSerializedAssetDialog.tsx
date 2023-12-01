import { useState, useEffect, useContext } from 'react';
import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import SearchBox from '../Helpers/SearchBox';
import { gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, serializedAsset, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import routes from '../Helpers/Routes';
import styles from 'src/pages/Leads/Header.module.scss';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import CommonSkeleton from '../Helpers/CommonSkeleton';

let searchTimeout;

const AssignSerializedAssetDialog = ({
  reference,
  referenceData = null,
  handleClose,
  handleSucess,
  ids,
  isAssigning,
  extraStaticFilter = [],
  selectedProducts = []
}) => {
  const renderedFrom = `${routes.serializedAsset.title}_${reference}_selected`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [disableSaveButton, setDisableSaveButton] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [columns, setColumns] = useState(null);
  const [products, setProducts] = useState([]);

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
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedProduct]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data: { data } }) => {
        let columns = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
          }
        });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    let queryString = getQueryString();
    if (selectedProducts.length > 0) {
      var updatedFilters = [];
      if (selectedProduct) {
        updatedFilters.push({ field: 'product', term: selectedProduct });
      } else {
        updatedFilters = selectedProducts.map((m) => {
          return { field: 'product', term: m?.product ?? '' };
        });
      }
      queryString = `${queryString}&filterById=${JSON.stringify(updatedFilters)}&filterByIdType=or`;
    }
    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          finalObject['id'] = u._id;
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'selection',
          selectedRecords: selectedRecords || []
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

    if (reference === 'job') {
      deepFilter += '&job=1';
    }
    if (reference === 'repairOrder') {
      deepFilter = `${deepFilter}`;
      deepFilter += '&repairOrder=1';
      if (referenceData?.customerAccount) {
        deepFilter = `${deepFilter}&owner=${referenceData?.customerAccount}`;
      }
      if (referenceData?.warehouse) {
        deepFilter = `${deepFilter}&plant=${referenceData?.warehouse}`;
      }
    }
    if (reference === 'planning') {
      deepFilter = `${deepFilter}&planning=true`;
      const dateFilter = { from: referenceData?.fromDate, to: referenceData?.toDate };
      deepFilter = `${deepFilter}&date=${JSON.stringify(dateFilter)}`;
    }
    if (reference === 'quotation') {
      deepFilter = `${deepFilter}&quotation=true`;
      const dateFilter = { from: referenceData?.fromDate, to: referenceData?.toDate };
      deepFilter = `${deepFilter}&date=${JSON.stringify(dateFilter)}`;
    }
    if (reference === 'supplier') {
      deepFilter = `${deepFilter}&subleaseAsset=0`;
    }
    if (reference === 'sublease') {
      deepFilter = `${deepFilter}&masterSubleaseAsset=true&subleaseAsset=0`;
      if (referenceData?.warehouse) {
        deepFilter = `${deepFilter}&plant=${referenceData?.warehouse}`;
      }
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    const updatedFilters = [];
    if (extraStaticFilter?.length) {
      extraStaticFilter?.forEach((e) => {
        updatedFilters.push(e);
      });
    }
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    } else {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
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

  useEffect(() => {
    let tempProducts = [];
    selectedProducts?.map((d) => {
      const alreadyAdded = tempProducts.find((obj) => obj.id === d.product);
      if (alreadyAdded) {
        alreadyAdded.qty = d?.qty + alreadyAdded.qty;
      } else {
        tempProducts.push({ id: d.product, name: d.productName, qty: d?.qty });
      }
    });
    tempProducts?.forEach((e) => {
      e.qty = e?.qty - selectedRecords?.filter((obj) => obj.productId === e.id).length;
    });
    setProducts(tempProducts);
  }, [selectedRecords]);

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader
        title={`Add ${routes.serializedAsset.title}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} className="d-flex align-items-center gap-1">
              <Box style={{ display: 'inline' }}>
                {products.length > 0
                  ? products?.map((d) => (
                      <Box
                        m={0.5}
                        p={1}
                        border={1}
                        className={`cursor-pointer rounded-sm ${
                          selectedProduct === d.id ? 'bg-[var(--dark-secondary,_var(--primary))] text-white' : 'dark:text-gray-300'
                        }`}
                        borderColor="var(--common-border-color)"
                        onClick={() => {
                          if (selectedProduct === d.id) {
                            setSelectedProduct(null);
                          } else {
                            setSelectedProduct(d.id);
                          }
                        }}
                        style={{ display: 'inline-block' }}
                      >
                        {d?.qty < 0 ? (
                          <span key={d.name} className="text-error">{`${d.name} (${d?.qty})`}</span>
                        ) : d?.qty === 0 ? (
                          <span key={d.name} className="text-success">{`${d.name} (${d?.qty})`}</span>
                        ) : (
                          <span key={d.name}>{`${d.name} (${d?.qty})`}</span>
                        )}
                      </Box>
                    ))
                  : null}
              </Box>
            </Grid>
            <Grid item xs={12} md={6} className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox onChange={handleSearch} className={styles.search_box_input} width="242px" size="small" value={search} />
                <Button
                  disabled={isAssigning || disableSaveButton || selectedRecords?.length === 0 || products?.some((d) => d?.qty < 0)}
                  onClick={() => {
                    if (selectedProducts?.length) {
                      const data = [];
                      selectedProducts?.forEach((ele) => {
                        let qty = ele.qty;
                        while (qty) {
                          const result = selectedRecords?.filter((f) => f.productId === ele.product && !f.isCounted);
                          if (result.length) {
                            data.push({ ...ele, asset: result[0]._id });
                            result[0].isCounted = true;
                          }
                          qty--;
                        }
                      });
                      handleSucess(data);
                    } else {
                      handleSucess(selectedRecords);
                    }
                  }}
                  color="primary"
                  size="small"
                  variant="contained"
                  endIcon={isAssigning && <CircularProgress color="inherit" size={18} />}
                >
                  Add {selectedRecords?.length > 0 ? '(' + selectedRecords?.length + ')' : ''}
                </Button>
              </Box>
            </Grid>
            {products.length > 0 && products.some((s) => s.qty < 0) ? (
              <div className="text-error font-weight-bold">You have selected more assets than required</div>
            ) : (
              ''
            )}
          </Grid>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.serializedAsset}
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

export default AssignSerializedAssetDialog;

import { useState, useEffect, useContext } from 'react';
import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import SearchBox from '../Helpers/SearchBox';
import { gridLoadingTimeout, isObjectEmpty, product, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import routes from '../Helpers/Routes';
import styles from 'src/pages/Leads/Header.module.scss';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { camelCase } from 'lodash';

let searchTimeout;

const AssignProductDialog = ({
  onSuccess,
  handleCloseDialog,
  ids = [],
  reference = 'product',
  serialized = null,
  extraDeepFilter = [],
  extraFilterById = [],
  isSubmitting = false,
  hideQty = false
}) => {
  const renderedFrom = `${camelCase(routes.product?.title)}_Assign`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [isProductType, setIsProductType] = useState(false);

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
      fetchProduct();
    }, millisec);
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Product&view=true')
      .then(({ data: { data } }) => {
        const productTypes = data.find((e) => e.fieldData.fieldName === 'productType');
        if (productTypes) {
          setIsProductType(true);
        } else {
          setIsProductType(false);
        }
        let columns = [];
        let newColumns = generateColumns(renderedFrom, data, routes.productDetail.path);
        columns = [...newColumns, ...getStaticFields()];
        if (hideQty) {
          setColumns([...columns]);
        } else {
          setColumns([...defaultColumns, ...columns]);
        }
      });
  };

  const fetchProduct = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
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
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const deepFilters = [];

    if (extraDeepFilter?.length > 0) {
      extraDeepFilter?.map((e) => {
        deepFilters.push(e);
      });
    }
    if (isProductType) {
      deepFilters.push({
        field: 'productType',
        term: 'Part'
      });
    }

    if (reference === 'purchaseOrder') {
      if (!user?.user?.brandPolicy?.purchaseOrderShowSerializedProduct) {
        deepFilters.push({ field: 'serializedProduct', term: 'No' });
      }
    } else {
      if (serialized != null) {
        deepFilters.push({
          field: 'serializedProduct',
          term: `${serialized === true ? 'Yes' : 'No'}`
        });
      }
    }

    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        deepFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
    }

    if (extraFilterById?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(extraFilterById)}`;
    }

    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (extraFilterById?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
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
        d.qty = Number(data.qty);
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

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleCloseDialog} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader title={`Add ${routes.product.title}`} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleCloseDialog} />
      <CustomDialogContent>
        <>
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
                    Add {selectedRecords?.length > 0 ? '(' + selectedRecords?.length + ')' : ''}
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
              onSaveEdit={onSaveEdit}
              refreshGrid={fetchProduct}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.product}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </>
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignProductDialog;

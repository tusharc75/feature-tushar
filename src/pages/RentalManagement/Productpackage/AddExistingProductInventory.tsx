import { useState, useEffect, useContext, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, CircularProgress, TextField } from '@material-ui/core';
import SearchBox from '../../../components/Helpers/SearchBox';
import { gridLoadingTimeout, CustomDialogTransition, packages, isObjectEmpty, prepareDataForGrid } from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import Dialog from '@material-ui/core/Dialog/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { startCase } from 'lodash';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import NoDataCell from 'src/components/Helpers/NoDataCell';

let searchTimeout;
const AddExistingProductInventory = ({
  addProductInventory,
  handleProductInventoryClose,
  type,
  productInventory,
  isAddingProducts,
  rentalManagementData,
  renderedFrom,
  fromConsumable = false
}) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [packageDialog, setPackageDialog] = useState(false);
  const [productData, setProductData] = useState([]);
  const [packageProductData, setPackageProductData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState({ name: '', id: '', quantity: 0 });
  const [columns, setColumns] = useState(null);
  const [materialList, setMaterialList] = useState([]);

  const qtyColumn = [
    {
      accessor: 'qty',
      Header: 'Qty',
      minWidth: 180,
      width: 180,
      editable: true,
      disabled: true,
      Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
    }
  ];

  const defaultColumns =
    type === 'product'
      ? [
          ...qtyColumn,
          {
            accessor: 'availableAssetCount',
            Header: 'Available Asset',
            minWidth: 180,
            width: 180,
            disabled: true,
            Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.availableAssetCount || <NoDataCell />}</h5>
          }
        ]
      : qtyColumn;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchMaterial();
    }, millisec);
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchMaterial = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${type === 'product' ? `/rental-management/product-with-inventory` : packages.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        setMaterialList(JSON.parse(JSON.stringify(data)));
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = false;
          finalObject['id'] = u._id;
          finalObject['type'] = type;
          finalObject['qty'] = 0;
          const qtyAdded = selectedRecords?.filter((e) => e._id === u._id);
          if (qtyAdded.length) {
            finalObject['qty'] = qtyAdded[0].qty;
          }
          finalObject['productCategory'] = u.productCategory?.optionLabel;
          finalObject['priceTemplate'] = u.priceTemplate?.optionLabel;
          finalObject['unitMain'] = u.unit;
          finalObject['pricingMethodMain'] = u.pricingMethod;
          return {
            ...finalObject
          };
        });
        if (fromConsumable) {
          rows = rows.filter((d: any) => !d?.serializedProduct);
        }
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
    let deepFilter = `?warehouse=${rentalManagementData?.warehouse?.optionValue}&page=${page}&limit=${limit}`;
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    const updatedFilters = [];
    if (type === 'package') {
      updatedFilters.push({ field: 'packageType', term: 'product' });
    }
    // if (type === "product") {
    //     updatedFilters.push({ field: 'serializedProduct', term: 'yes' })
    // }
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
    }
    if (updatedFilters.length) {
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

  const fetchGridColumns = () => {
    axiosInstance()
      .get(type === 'product' ? '/field?resource=Product&view=true' : `/field?resource=Packages&entity=${selectedEntity}&view=true`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, type === 'product' ? routes.productDetail.path : routes.packagesDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
          }
        });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns, ...defaultColumns]);
      });
  };

  const fetchPackageProduct = (packageId) => {
    if (type === 'package') {
      axiosInstance()
        .get(`${packages.api}/get-products/${packageId}`)
        .then(({ data: { data } }) => {
          const newArr = data.length > 0 ? data.map((product: any) => ({ product: product.productName, qty: product.qty })) : [];
          setPackageProductData(newArr);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty) return;
    const selectedFromStorage = selectedRecords;
    if (!selectedFromStorage || selectedFromStorage.length === 0) return;
    const updatedRecords = selectedFromStorage.map((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
      }
      return d;
    });

    const rows = dataRows;

    rows?.forEach((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
      }
    });

    dispatch({ type: 'update', data: rows });
    dispatch({ type: 'selection', selectedRecords: updatedRecords });
  };

  const handleSubmit = () => {
    dispatch({ type: 'loading', loading: true });
    let tempProduct = productData;
    tempProduct.find((d) => d.id === selectedProduct.id).quantity = selectedProduct.quantity;
    setProductData(tempProduct);
    setPackageDialog(false);
    // dispatch({ type: 'update', data: productData });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Add ${startCase(type)}`} onClose={handleProductInventoryClose}></CustomDialogHeader>
        <div className="listing-grid p-3">
          <Box mb={2}>
            <Grid container>
              <Grid item xs={10} sm={10} md={11} container justify="flex-end">
                <SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
              </Grid>
              <Grid item xs={2} sm={2} md={1} container justify="flex-end">
                <Box ml={1}>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => {
                      addProductInventory(selectedRecords);
                    }}
                    variant="contained"
                    disabled={!selectedRecords?.length || isAddingProducts}
                    endIcon={isAddingProducts && <CircularProgress size={20} color="primary" />}
                  >
                    Add
                    {selectedRecords?.length ? ' (' + selectedRecords?.length + ')' : ''}
                  </Button>
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
              onSaveEdit={onSaveEdit}
              isClientSideGrid={false}
              refreshGrid={fetchMaterial}
              showOnlyShowFilteredRecordSwitch={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </div>
      </Dialog>
      {packageDialog && (
        <Dialog open fullWidth maxWidth="md" onClose={() => setPackageDialog(false)}>
          <CustomDialogHeader title={'Package Details'} onClose={() => setPackageDialog(false)} />
          <CustomDialogContent>
            <Box p={2}>
              <Grid container spacing={2}>
                {packageProductData?.length > 0 &&
                  packageProductData?.map((obj) => (
                    <Fragment key={obj.id}>
                      <Grid item xs={5} sm={5}>
                        <TextField size="small" fullWidth value={obj?.product} type="text" disabled variant="outlined" label="Product" />
                      </Grid>
                      <Grid item xs={5} sm={5}>
                        <TextField
                          size="small"
                          fullWidth
                          value={obj?.qty}
                          disabled
                          type="number"
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                          }}
                          variant="outlined"
                          required
                          label="Quantity"
                        />
                      </Grid>
                    </Fragment>
                  ))}
              </Grid>
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="outlined" color="primary" onClick={() => setPackageDialog(false)}>
              Cancel
            </Button>
            {/* <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                    >
                        Save
                    </Button> */}
          </CustomDialogFooter>
        </Dialog>
      )}
    </Fragment>
  );
};

export default AddExistingProductInventory;

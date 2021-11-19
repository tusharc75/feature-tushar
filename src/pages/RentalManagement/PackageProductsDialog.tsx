import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Dialog, Box, Button, Grid, CircularProgress } from '@material-ui/core';

import SearchBox from '../../components/Helpers/SearchBox';
import { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { gridLoadingTimeout, CustomDialogTransition, product, packages } from '../../constants/helpers';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomAgGridEditable from '../../components/AgGridComponents/CustomAgGridEditable';
import axiosInstance from '../../axios/axiosInstance';

const PackageProductsDialog = ({ packageId, onClose, products, onSuccess, rentalApi, rentalId }) => {
  const [productData, setProductData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const columns = [
    {
      field: 'productName',
      headerName: 'Product Description',
      show: true,
      disabled: true,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'productNumber',
      headerName: 'Product Number',
      show: true,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'productCategory',
      headerName: 'Product Category',
      show: true,
      disabled: true,
      cellRenderer: 'commonRenderer'
    },
    {
      field: 'qty',
      headerName: 'Qty.',
      show: true,
      disabled: true,
      cellRenderer: 'commonRenderer',
      cellEditor: 'numericCellEditor',
      editable: true
    }
  ];

  const frameworkComponents = {
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    commonRenderer: CommonRenderer
  };

  useEffect(() => {
    if (gridApi) {
      if (showFilteredRecordsOnly) {
        gridApi.setRowData(gridApi.getSelectedRows())
        dispatch({ type: "count", count: gridApi.getSelectedRows().length });
      } else {
        gridApi.setRowData(dataRows);
        dispatch({ type: "count", count: dataRows.length });
      }
    }
  }, [showFilteredRecordsOnly])

  useEffect(() => {
    if (packageId) {
      fetchPackageProduct();
    }
  }, [packageId]);

  const fetchPackageProduct = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }
    setLoadingProducts(true);
    axiosInstance()
      .get(product.api)
      .then(({ data: { data } }) => {
        const newArr =
          data.length > 0
            ? data
              .filter((p: any) => products.indexOf(p._id) === -1)
              .map((product: any) => ({
                ...product,
                productName: product.productName,
                productNumber: product.productNumber,
                productCategory: product?.productCategory.optionLabel,
                qty: product.qty,
                id: product._id
              }))
            : [];
        setProductData(newArr);
        setLoadingProducts(false);
        dispatch({ type: 'initialize', data: newArr, count: newArr.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        setLoadingProducts(false);
      });
  };

  const onCellValueChanged = (row) => {
    alert(JSON.stringify(row));
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleSubmit = () => {
    setAddingProducts(true)
    axiosInstance()
      .post(`${rentalApi}/${rentalId}/products-packages/add-product-in-package`, {
        packageId,
        products: selectedRecords.map((p) => ({ id: p.id }))
      })
      .then(() => {
        setAddingProducts(false)
        onSuccess()
      })
      .catch((err) => {
        setAddingProducts(false)
      });
  };

  return (
    <Dialog open fullScreen onClose={onClose}>
      <CustomDialogHeader title="Products" onClose={onClose} />
      <CustomDialogContent>
        <Box mb={2}>
          <Grid container>
            <Grid item xs={12} sm={6}></Grid>
            <Grid item xs={12} sm={6} container justify="flex-end">
              <SearchBox size="small" onSearch={handleSearch} searchbox="terms_header_search_bar" width="300px" value={search} />
              <Box ml={1} mt={1}>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!Boolean(selectedRecords.length) || isAddingProducts}
                  endIcon={isAddingProducts && <CircularProgress size={20} color='primary' />}
                >
                  {selectedRecords.length ? '(' + selectedRecords.length + ')  ' : ''}
                  Add
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
        <CustomAgGridEditable
          columns={columns}
          dataRows={dataRows}
          frameworkComponents={frameworkComponents}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          allowAction={false}
          loading={loading}
          isClientSideGrid={true}
          onCellValueChanged={onCellValueChanged}
          showOnlyShowFilteredRecordSwitch={true}
        />
      </CustomDialogContent>
      <CustomDialogFooter></CustomDialogFooter>
    </Dialog>
  );
};

export default PackageProductsDialog;

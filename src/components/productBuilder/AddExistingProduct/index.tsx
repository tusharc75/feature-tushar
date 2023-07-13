import { useState, useEffect, useContext, useReducer } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../../axios/axiosInstance';
import { getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, product } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { sortBy } from 'lodash';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import SearchBox from '../../Helpers/SearchBox';
import { CustomDialogTransition } from '../../../constants/helpers';
import { CommonRenderer } from '../../AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { Box, Chip, Menu, MenuItem } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import TextField from '@material-ui/core/TextField';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';
import { prepareDataForGrid } from '../../../constants/helpers';

var levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];

const ignoreField = ['qty', 'priceTemplate'];
const renderedFrom = 'productPage';
const localStorageSelectedRecords = `${renderedFrom}_selected`;

const AddExistingProduct = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const { handleClose, addProductInBuilder } = props;
  const [productList, setProductList] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [productColoums, setProductColoums] = useState([]);
  const [productRendererNames, setProductRendererNames] = useState([]);
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);

  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productTemplateList, setProductTemplateList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productTemplate, setProductTemplate] = useState(null);
  const [isProductTemplate, setIsProductTemplate] = useState(true);
  const { getColumnData } = useColumns();

  useEffect(() => {
    axiosInstance()
      .get('/product-category?sortBy=name&orderBy=asc')
      .then(({ data: { data } }) => {
        setProductCategoryList(data);
      });
  }, []);

  useEffect(() => {
    if (isProductTemplate) {
      if (productCategory && productCategory !== '') {
        axiosInstance()
          .post(`/product-template/template/` + productCategory, { entity: null })
          .then(({ data: { data } }) => {
            setProductTemplateList(data.data);
            if (data.data.length) {
              setProductTemplate(data.data[0]?.optionValue);
            } else {
              setProductTemplate(null);
            }
          });
      } else {
        setProductTemplateList([]);
        setProductTemplate(null);
      }
    }
  }, [productCategory]);

  useEffect(() => {
    if (productColoums && productColoums.length) {
      fetchProduct();
    }
  }, [page, limit, filters, sorting, search, productColoums, productCategory, productTemplate, showFilteredRecordsOnly]);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Product&view=true')
      .then(({ data: { data } }) => {
        if (data.filter((e) => e.fieldData.fieldName === 'productTemplate').length === 0) {
          setIsProductTemplate(false);
        }
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (!ignoreField.includes(o?.fieldData.fieldName)) {
            if (o?.fieldData?.fieldName === 'productName') {
              columns = [
                ...columns,
                {
                  pivotIndex: 0,
                  field: o?.fieldData?.fieldName,
                  headerName: o?.fieldData?.fieldLabel,
                  show: true,
                  disabled: true,
                  cellRenderer: 'productNameRenderer'
                }
              ];
            } else {
              let currentColumn = getColumnData(routes.product.title, o?.fieldData, routes.product.path);
              if (currentColumn !== null) {
                columns = [...columns, currentColumn?.columnData];
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                  rendererNames.push(currentColumn?.rendererName);
                }
              }
            }
          }
        });
        columns.forEach((ele) => {
          ele.leval = 'product';
        });
        setProductRendererNames(rendererNames);
        setProductColoums(columns);
      });
  }, []);

  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id))}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    const filterById = [];
    if (productCategory && productCategory !== '') {
      filterById.push({ field: 'productCategory', term: productCategory });
    }
    if (productTemplate && productTemplate !== '') {
      filterById.push({ field: 'productTemplate', term: productTemplate });
    }
    if (filterById.length) {
      deepFilter = deepFilter + '&filterById=' + JSON.stringify(filterById) + '&filterType=and';
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const fetchProduct = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}${queryString}`)
      .then(({ data }) => {
        setProductList(JSON.parse(JSON.stringify(data.data)));
        let rows = data.data.map((item) => {
          let res = {
            ...prepareDataForGrid(item)
          };
          return res;
        });
        let columns = [...productColoums];
        let rendererNames = [...productRendererNames];
        data.productTemplate?.forEach((ele) => {
          GenrateColoum(ele.fields, columns, rendererNames);
        });
        columns.push({
          field: 'inventoryCount',
          headerName: 'Inventory Count',
          show: true,
          cellRenderer: 'commonRenderer',
          leval: 'price-builder-custom'
        });
        columns.push({ field: 'warehouses', headerName: 'Plants', show: true, cellRenderer: 'commonRenderer', leval: 'price-builder-custom' });
        columns = sortBy(columns, function (item: any) {
          return levalOrderBy.indexOf(item.leval);
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          commonRenderer: CommonRenderer,
          productNameRenderer: ProductNameRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        columns.forEach((e) => {
          if (e.cellRenderer === 'linkRenderer') {
            e.cellRenderer = 'commonRenderer';
          }
        });
        setColumns([...columns]);
        dispatch({ type: 'initialize', data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const GenrateColoum = (fields, column, rendererNames) => {
    fields.forEach((ele) => {
      if (ignoreField.includes(ele.fieldName)) {
      } else if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
        if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
          ele.displayUnits.forEach((_unit) => {
            let fieldName = ele.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = ele.fieldLabel + ' ' + _unit;
            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
              let col: any = {};
              col.field = fieldName;
              col.headerName = fieldLabel;
              col.width = 180;
              col.show = true;
              col.cellRenderer = 'commonRenderer';
              col.leval = 'product-template';
              column.push(col);
            }
          });
        } else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
          ele.displayUnits.forEach((_unit) => {
            ele.displayCurrency.forEach((_currency) => {
              let fieldName = ele.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              let fieldLabel = ele.fieldLabel + ' ' + _unit + '/' + _currency;
              if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                let col: any = {};
                col.field = fieldName;
                col.headerName = fieldLabel;
                col.width = 180;
                col.show = true;
                col.cellRenderer = 'commonRenderer';
                col.leval = 'product-template';
                column.push(col);
              }
            });
          });
        } else if (ele.type === 'currencyAmount') {
          ele.displayCurrency.forEach((_currency) => {
            let fieldName = ele.fieldName + '_' + _currency.toLowerCase();
            let fieldLabel = ele.fieldLabel + ' ' + _currency;
            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
              let col: any = {};
              col.field = fieldName;
              col.headerName = fieldLabel;
              col.width = 180;
              col.show = true;
              col.cellRenderer = 'commonRenderer';
              col.leval = 'product-template';
              column.push(col);
            }
          });
        }
      } else {
        if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
          let currentColumn: any = getColumnData(routes.product.title, ele, routes.productDetail.path);
          column.push({ ...currentColumn.columnData, leval: 'product-template' });
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName);
          }
        }
      }
    });
  };

  const handleAdd = () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .get(`${product.api}?limit=0&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords).map((m) => m._id))}`)
      .then(({ data: { data } }) => {
        data.forEach((_d) => {
          _d.productId = _d._id;
          if (_d.fields) {
            const qtyField = _d.fields.filter((_f) => _f.fieldName === 'qty');
            if (qtyField.length) {
              if (!qtyField[0].isFormula) {
                _d.qty = 0;
              }
            }
          }
          delete _d.id;
          delete _d.brand;
          delete _d.createdBy;
          delete _d.updatedBy;
          delete _d.fields;
          for (const [key, value] of Object.entries(_d)) {
            if (typeof value === 'object' && value && value['optionValue']) {
              _d[key] = value['optionValue'];
            }
            if (Array.isArray(value) && value.length && value[0].optionValue) {
              const entity = [];
              value &&
                value.forEach((ele) => {
                  entity.push(ele.optionValue);
                });
              _d[key] = entity;
            }
          }
        });
        addProductInBuilder(data);
        handleClose();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title={'Add Existing Product'} onClose={handleClose}></CustomDialogHeader>
      <div className="listing-grid p-3">
        <Box mb={2}>
          <h6 className="form-label-style mt-0 mb-0" style={{ borderBottom: 'none' }}>
            * Select checkboxes and then click Add button to add the products
          </h6>
          <Grid container>
            <Grid className="d-flex align-items-center gap-1" item xs={12} sm={6}>
              <Autocomplete
                style={{ width: '250px' }}
                options={productCategoryList}
                getOptionLabel={(option: any) => (option ? option.name : '')}
                getOptionSelected={(option: any, val) => option._id === val}
                value={
                  productCategoryList.filter((data) => data._id === productCategory).length
                    ? productCategoryList.filter((data) => data._id === productCategory)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setProductCategory(val && val._id ? val._id : '');
                }}
                renderInput={(params) => (
                  <TextField {...params} margin="dense" name="productCategory" label="Product Category" variant="outlined" fullWidth />
                )}
              />
              {isProductTemplate && (
                <Autocomplete
                  style={{ width: '250px' }}
                  options={productTemplateList}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  value={
                    productTemplateList.filter((data) => data.optionValue === productTemplate).length
                      ? productTemplateList.filter((data) => data.optionValue === productTemplate)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setProductTemplate(val && val.optionValue ? val.optionValue : '');
                  }}
                  renderInput={(params) => (
                    <TextField {...params} margin="dense" name="productTemplate" label="Product Template" variant="outlined" fullWidth />
                  )}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6} container justify="flex-end">
              <SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
              <Box ml={1} mt={1}>
                <Button
                  size="small"
                  color="primary"
                  onClick={handleAdd}
                  variant="contained"
                  disabled={getLocalStorageArrayData(localStorageSelectedRecords).length > 0 ? false : true}
                >
                  {getLocalStorageArrayData(localStorageSelectedRecords).length
                    ? '(' + getLocalStorageArrayData(localStorageSelectedRecords).length + ')  '
                    : ''}
                  Add
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
        {columns && frameWorkComponent ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={false}
            loading={loading}
            refreshGrid={fetchProduct}
            renderedFrom={renderedFrom}
            showOnlyShowFilteredRecordSwitch={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
    </Dialog>
  );
};

export default AddExistingProduct;

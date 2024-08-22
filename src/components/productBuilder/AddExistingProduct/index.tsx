import { Box } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import { Autocomplete } from '@material-ui/lab';
import { sortBy } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import { CustomDialogTransition, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, product, sidebarResource } from '../../../constants/helpers';
import SearchBox from '../../Helpers/SearchBox';

var levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];

const ignoreField = ['qty', 'priceTemplate'];
const renderedFrom = 'productPage';
const AddExistingProduct = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const { handleClose, addProductInBuilder, referenceData = null } = props;
  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [productColoums, setProductColoums] = useState([]);
  const [columns, setColumns] = useState(null);

  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productTemplateList, setProductTemplateList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productTemplate, setProductTemplate] = useState(null);
  const [isProductTemplate, setIsProductTemplate] = useState(true);
  const { generateColumns } = useColumns();

  useEffect(() => {
    if (referenceData) {
      setProductCategory(referenceData?.productCategory);
      setProductTemplate(referenceData?.productTemplate);
    }
  }, [referenceData]);

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
        const newColumns = generateColumns(
          routes.product.title,
          data?.filter((d) => !ignoreField?.includes(d?.fieldData?.fieldName)),
          routes.productDetail.path
        );
        newColumns?.forEach((ele) => {
          ele.leval = 'product';
        });
        setProductColoums(newColumns);
      });
  }, []);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${selectedRecords?.map((m) => m._id)}`;
    }

    const { deepFilters } = gridFilterParser(filters);

    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
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
      deepFilter = deepFilter + '&filterById=' + JSON.stringify(filterById);
    }
    if (filterById?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const fetchProduct = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((item) => {
          let res = {
            ...prepareDataForGrid(item)
          };
          return res;
        });
        const fields: any = [];
        data.productTemplate?.forEach((ele) => {
          ele.fields.forEach((field) => {
            fields.push(field);
          });
        });
        const newColumns = generateColumns(renderedFrom, fields, `${routes.productDetail.path}`);
        newColumns?.forEach((ele) => {
          ele.leval = 'product-template';
        });
        let columns = [...productColoums, ...newColumns];
        columns = columns.filter((column, index, self) => self.findIndex((col) => col.accessor === column.accessor) === index);
        columns = sortBy(columns, function (item: any) {
          return levalOrderBy.indexOf(item.leval);
        });
        columns = [...columns, ...getStaticFields()];
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

  const handleAdd = () => {
    const orderIds = selectedRecords?.sort((a, b) => a?.sequenceOrder - b?.sequenceOrder)?.map((m) => m._id);

    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${product.api}?limit=0&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`)
      .then(({ data: { data } }) => {
        const sortedData = orderIds?.map((m) => data.find((f) => f._id === m));
        sortedData.forEach((_d) => {
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
        addProductInBuilder(sortedData);
        handleClose();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title={'Add Existing Products'} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
      <div className="listing-grid p-3">
        <Box mb={2}>
          <h6 className="mb-0 mt-0 text-[0.8rem] text-gray-400" style={{ borderBottom: 'none' }}>
            * Select checkboxes and then click Add button to add the products
          </h6>
          <div className="my-3 grid grid-cols-1 justify-between gap-2 md:grid-cols-2">
            <div className="flex flex-wrap items-center gap-2 ">
              <Autocomplete
                style={{ width: '250px' }}
                options={productCategoryList}
                getOptionLabel={(option: any) => (option ? option.name : '')}
                getOptionSelected={(option: any, val) => option._id === val}
                disabled={referenceData && referenceData?.productCategory ? true : false}
                value={
                  productCategoryList.filter((data) => data._id === productCategory).length
                    ? productCategoryList.filter((data) => data._id === productCategory)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setProductCategory(val && val._id ? val._id : '');
                }}
                renderInput={(params) => (
                  <TextField {...params} margin="none" size="small" name="productCategory" label="Product Category" variant="outlined" fullWidth />
                )}
              />
              {isProductTemplate && (
                <Autocomplete
                  style={{ width: '250px' }}
                  options={productTemplateList}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  disabled={referenceData && referenceData?.productTemplate ? true : false}
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
            </div>
            <div className="ml-auto flex flex-wrap items-start justify-end gap-2 ">
              <SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
              <Button
                size="small"
                color="primary"
                onClick={handleAdd}
                variant="contained"
                disabled={selectedRecords.length > 0 ? false : true}>
                {selectedRecords.length ? '(' + selectedRecords.length + ')  ' : ''}
                Add
              </Button>
            </div>
          </div>
        </Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchProduct}
            showOnlyShowFilteredRecordSwitch={true}
            hideAction={true}
            resource={sidebarResource.product}
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

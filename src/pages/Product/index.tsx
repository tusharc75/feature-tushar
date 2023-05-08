import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link, useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CreateProduct from '../../components/Product/CreateProduct';
import { RiShoppingBag3Fill } from 'react-icons/ri';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Box, Menu, MenuItem } from '@material-ui/core';
import SearchBox from '../../components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from '../../components/Helpers/Routes';
import ImportExportLinks from '../../components/Product/ImportExportLinks';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { product, isObjectEmpty, gridLoadingTimeout, getLocalStorageArrayData, removeLocalStorage, sidebarResource } from '../../constants/helpers';
import { CommonRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import { RiBillLine } from 'react-icons/ri';
import { Autocomplete } from '@material-ui/lab';
import TextField from '@material-ui/core/TextField';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import Tooltip from '@material-ui/core/Tooltip';
import { MdAdd, MdSort, MdFilterList } from 'react-icons/all';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { IoPricetagsSharp } from 'react-icons/io5';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import AddRepairType from './RepairType/AddRepairTypes';
import { camelCase } from 'lodash';

const ignoreField = ['qty', 'priceTemplate'];

const Product = () => {
  const renderedFrom = camelCase(routes?.product.title);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(null);
  const [isClone, setIsClone] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [productColoums, setProductColoums] = useState([]);
  const [productRendererNames, setProductRendererNames] = useState([]);
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productTemplateList, setProductTemplateList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productTemplate, setProductTemplate] = useState(null);
  const [isProductTemplate, setIsProductTemplate] = useState(true);

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));

  const [productType, setProductType] = useState(null);
  const [productTypeList, setProductTypeList] = useState([]);
  const [isProductType, setIsProductType] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();
  const [productPermissions, setProductPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false
  });

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
            setProductTemplate(null);
          });
      } else {
        setProductTemplateList([]);
        setProductTemplate(null);
      }
    }
  }, [productCategory]);

  useEffect(() => {
    if (permissions && permissions.product) {
      setProductPermissions(permissions.product);
    }
  }, [permissions]);

  useEffect(() => {
    if (productColoums && productColoums.length) {
      fetchProduct();
    }
  }, [page, limit, filters, sorting, search, selectedEntity, productColoums, productCategory, productTemplate, productType, showFilteredRecordsOnly]);

  useEffect(() => {
    axiosInstance()
      .get('/field?resource=Product&view=true')
      .then(({ data: { data } }) => {
        if (data.filter((e) => e.fieldData.fieldName === 'productTemplate').length === 0) {
          setIsProductTemplate(false);
        }
        const productTypes = data.find((e) => e.fieldData.fieldName === 'productType');
        if (productTypes) {
          setIsProductType(true);
          setProductTypeList([...productTypes.fieldData.option]);
          let defaultOptions = productTypes.fieldData?.option?.filter((item: any) => item.default === true);
          if (defaultOptions.length) {
            setProductType(defaultOptions[0].optionValue);
          }
        } else {
          setIsProductType(false);
        }
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (!ignoreField.includes(o?.fieldData.fieldName)) {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path);
            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData];
              if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                rendererNames.push(currentColumn?.rendererName);
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

  const fetchProduct = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions.product.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions.product.isUpdate;
          return {
            ...finalObject
          };
        });
        setIsAllChecked(false);
        setClonedData(data);
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: data.count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: data.count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data._id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
        }

        let columns = [...productColoums];
        let rendererNames = [...productRendererNames];
        data.productTemplate?.forEach((ele) => {
          GenrateColoum(ele.fields, columns, rendererNames);
        });
        //columns.push({ field: "inventoryCount", headerName: "Inventory Count", show: getColumnHiddenStatus(routes.product.title, "inventoryCount"), cellRenderer: "commonRenderer", leval: "price-builder-custom" })
        //columns.push({ field: "warehouses", headerName: "Plants", show: getColumnHiddenStatus(routes.product.title, "warehouses"), cellRenderer: "commonRenderer", leval: "price-builder-custom" })
        // columns = sortBy(columns, function (item: any) {
        //     return levalOrderBy.indexOf(item.leval)
        // });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          commonRenderer: CommonRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  if (columnState) {
    columns?.map((item) => {
      columnState?.map((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

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
          let currentColumn: any = getColumnData(renderedFrom, ele, routes.product.path, true);
          column.push({ ...currentColumn.columnData, leval: 'product-template' });
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName);
          }
        }
      }
    });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const updatedFilters = [];
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    const filterById = [];
    if (productCategory && productCategory !== '') {
      filterById.push({ field: 'productCategory', term: productCategory });
    }
    if (productTemplate && productTemplate !== '') {
      filterById.push({ field: 'productTemplate', term: productTemplate });
    }
    if (productType && productType !== '') {
      updatedFilters.push({ field: 'productType', term: productType });
    }
    if (filterById.length) {
      deepFilter = deepFilter + '&filterById=' + JSON.stringify(filterById) + '&filterType=and';
    }

    if (updatedFilters.length > 0) return `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;

    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`/product/remove`, { ids: ids })
      .then(() => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchProduct();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {productPermissions.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              OpenProduct(params.data._id);
              setIsClone(true);
            }}
          >
            <FileCopyIcon color="primary" fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to create an product">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {productPermissions.isDelete ? (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete an product">
          <IconButton aria-label="Delete" size="small">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}

      {productPermissions.isRead && permissions?.serializedAsset ? (
        <Tooltip title="Child Product">
          <IconButton
            size="small"
            aria-label="View Child Product"
            onClick={() => {
              history.push(`${routes.productDetail.path}/${params.data._id}/bom`, { productName: params.data.productName });
            }}
          >
            <RiBillLine color="primary" />
          </IconButton>
        </Tooltip>
      ) : null}
    </>
  );

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const OpenProduct = (_id) => {
    setProductId(_id);
    setOpen(true);
  };

  const handleClose = () => {
    setProductId(null);
    setOpen(false);
    fetchProduct();
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClickOpen = () => {
    setSortOpen(true);
  };

  const handleClickClose = () => {
    setSortOpen(false);
  };

  const handleFilterClose = () => {
    setisOpenDialog(false);
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
  };

  const handleSubmit = (ids: string[]) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${routes.product.path}/assign-repair-type`, {
        repairType: ids,
        ids: selectedRecords.map((d: { _id: string }) => d._id)
      })
      .then(() => {
        fetchProduct();
        setSubmitting(false);
        setOpenAddDialog(false);
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const searchInnner = (
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
        handleFilterClose();
      }}
      renderInput={(params) =>
        isMobile && !isTablet ? (
          <TextField
            {...params}
            margin="dense"
            name="productCategory"
            placeholder="Product Category"
            variant="standard"
            fullWidth
            className={isMobile ? 'serchBox' : ''}
          />
        ) : (
          <TextField {...params} margin="dense" name="productCategory" label="Product Category" variant="outlined" fullWidth />
        )
      }
    />
  );

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.product.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions.product}
            module="product(s)"
            api={'product'}
            refrenceId={null}
            onSuccessfulImport={(isImportedSuccessfully) => {
              if (isImportedSuccessfully) {
                fetchProduct();
              }
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`).length}
            ids={
              getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                ? getLocalStorageArrayData(`${localStorageSelectedRecords}`).map((obj) => obj._id)
                : []
            }
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchProduct();
            }}
            additionalParams={getQueryString(true)}
            extraImportExportLinks={[
              {
                title: 'Child Product Template',
                api: `${product.api}/unknown/bom/template`,
                type: 'download'
              },
              {
                title: 'Child Product Export',
                api: `${product.api}/unknown/bom/template?export=true${
                  getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                    ? `&ids=${JSON.stringify(getLocalStorageArrayData(`${localStorageSelectedRecords}`).map((obj) => obj._id))}`
                    : ''
                }`,
                type: 'export'
              },
              {
                title: 'Child Product Import',
                api: `${product.api}/unknown/bom/import`,
                type: 'import'
              },
              {
                title: 'Service Template',
                api: `${product.api}/unknown/service-master/template`,
                type: 'download'
              },
              {
                title: 'Service Export',
                api: `${product.api}/unknown/service-master/template?export=true${
                  getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                    ? `&ids=${JSON.stringify(getLocalStorageArrayData(`${localStorageSelectedRecords}`).map((obj) => obj._id))}`
                    : ''
                }`,
                type: 'export'
              },
              {
                title: 'Service Import',
                api: `${product.api}/unknown/service-master/import`,
                type: 'import'
              },
              {
                title: 'Service Package Template',
                api: `${product.api}/unknown/package/template`,
                type: 'download'
              },
              {
                title: 'Service Package Export',
                api: `${product.api}/unknown/package/template?export=true${
                  getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                    ? `&ids=${JSON.stringify(getLocalStorageArrayData(`${localStorageSelectedRecords}`).map((obj) => obj._id))}`
                    : ''
                }`,
                type: 'export'
              },
              {
                title: 'Service Package Import',
                api: `${product.api}/unknown/package/import`,
                type: 'import'
              }
            ]}
          />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} sm={12} md={6} className="d-flex align-items-center gap-1 layout-for-tablet">
              <Grid style={{ display: 'flex', justifyContent: 'center' }}>
                <RiShoppingBag3Fill size={22} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.product.title} </span>
              </Grid>
              {isMobile && (
                <>
                  <Grid style={{ display: 'inline-flex' }}>
                    <Button
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      color="secondary"
                      variant="text"
                      disableElevation
                      startIcon={<MdSort />}
                      className={'sort-filter-tablet'}
                      style={isTablet ? { marginLeft: '50px' } : {}}
                    >
                      Sort
                    </Button>
                    <MobileSortDialog
                      isOpen={sortOpen}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Purchase Order']}
                      columns={columns}
                      dispatch={dispatch}
                    />

                    <Button
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      variant="text"
                      color="secondary"
                      disableElevation
                      className={'sort-filter-tablet'}
                      startIcon={<MdFilterList />}
                      onClick={handleOpen}
                    >
                      Filter
                    </Button>

                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleFilterClose}
                      contentPart={searchInnner}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.product?.title}
                      filters={filters}
                    />
                  </Grid>
                </>
              )}
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
                renderInput={(params) =>
                  isMobile && !isTablet ? (
                    <TextField
                      {...params}
                      margin="dense"
                      name="productCategory"
                      placeholder="Product Category"
                      variant="standard"
                      fullWidth
                      className={isMobile ? 'serchBox' : ''}
                    />
                  ) : (
                    <TextField {...params} margin="dense" name="productCategory" label="Product Category" variant="outlined" fullWidth />
                  )
                }
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
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField
                        {...params}
                        margin="dense"
                        name="productTemplate"
                        placeholder="Product Template"
                        variant="standard"
                        fullWidth
                        className={isMobile ? 'serchBox' : ''}
                      />
                    ) : (
                      <TextField {...params} margin="dense" name="productTemplate" label="Product Template" variant="outlined" fullWidth />
                    )
                  }
                />
              )}
              {isProductType && (
                <Autocomplete
                  style={{ width: '250px' }}
                  options={productTypeList}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  value={
                    productTypeList.filter((data) => data.optionValue === productType).length
                      ? productTypeList.filter((data) => data.optionValue === productType)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setProductType(val && val.optionValue ? val.optionValue : '');
                  }}
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField
                        {...params}
                        margin="dense"
                        name="productType"
                        placeholder="Product Type"
                        variant="standard"
                        fullWidth
                        className={isMobile ? 'serchBox' : ''}
                      />
                    ) : (
                      <TextField {...params} margin="dense" name="productType" label="Product Type" variant="outlined" fullWidth />
                    )
                  }
                />
              )}
            </Grid>
            <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} style={{ width: '100%' }}>
                <Box style={{ flexGrow: 1, minWidth: 210 }}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width={isMobile ? '200px' : '210px'}
                    style={{ width: '100%' }}
                    size="small"
                    value={search}
                  />
                </Box>

                <Box style={{ display: 'flex', gap: '5px' }}>
                  {productPermissions.isCreate && (
                    <Button
                      onClick={() => OpenProduct(null)}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}

                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="default"
                    size="small"
                    onClick={openActions}
                    disabled={selectedRecords.length ? false : true}
                    aria-controls="action-menu"
                    className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                    endIcon={<ExpandMore />}
                  >
                    {isMobile && !isTablet ? '' : 'Actions'}
                  </Button>

                  <Menu
                    anchorEl={anchorEl}
                    keepMounted
                    getContentAnchorEl={null}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left'
                    }}
                    id="action-menu"
                    open={Boolean(anchorEl)}
                    onClose={closeActions}
                  >
                    <MenuItem
                      disabled={!productPermissions.isDelete}
                      onClick={() => {
                        setShowDeleteConfirmBox(true);
                        closeActions();
                      }}
                    >
                      Delete
                    </MenuItem>
                    {permissions?.repairType?.isRead && (
                      <MenuItem
                        disabled={!productPermissions.isUpdate && !permissions?.hasOwnProperty('repairType')}
                        onClick={() => {
                          setOpenAddDialog(true);
                          closeActions();
                        }}
                      >
                        {`Assign ${routes?.repairType?.title}`}
                      </MenuItem>
                    )}
                  </Menu>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns && frameWorkComponent ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.product}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.productDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.productDetail.path}/${data._id}?openEdit=true`);
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {
                setDeleteRecord(data);
                setShowDeleteConfirmBox(true);
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[
                {
                  icon: <IoPricetagsSharp size={18} />,
                  field: 'mrp'
                }
              ]}
              chips={[]}
              owerCollaboratorInitialsOrImages=""
              onCreate={() => {
                OpenProduct(null);
              }}
              showClone={true}
              onClone={(data) => {
                OpenProduct(data._id);
                setIsClone(true);
              }}
              renderedFrom={renderedFrom}
            />
          ) : (
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
              actionWidth={150}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchProduct}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.product}
            />
          )
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {open && (
        <CreateProduct isClone={isClone} productId={productId} handleClose={handleClose} isRedirectToDetailPage={true} openFrom="productMaster" />
      )}
      {openAddDialog && (
        <AddRepairType
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          renderedFrom={`${renderedFrom}_repair-type_grid-1`}
          close={() => setOpenAddDialog(false)}
          exisitingIds={[]}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the product ${deleteRecord?._id ? deleteRecord?.productName : ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default Product;

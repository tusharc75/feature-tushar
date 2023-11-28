import { Box, Menu, MenuItem } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { RiBillLine } from 'react-icons/ri';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import CreateProduct from '../../components/Product/CreateProduct';
import ImportExportLinks from '../../components/Product/ImportExportLinks';
import {
  gridLoadingTimeout,
  prepareDataForGrid,
  product,
  sidebarResource
} from '../../constants/helpers';
import styles from '../Leads/Header.module.scss';
import AddRepairType from './RepairType/AddRepairTypes';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { childDisable, cloneDisable, deleteDisable } from 'src/constants/messageHelpers';

const ignoreField = ['qty', 'priceTemplate'];

const Product = () => {
  const renderedFrom = camelCase(routes?.product.title);
  const { state, dispatch } = useTableReducer();
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
  const [columns, setColumns] = useState(null);

  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } =
    state;

  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productTemplateList, setProductTemplateList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productTemplate, setProductTemplate] = useState(null);
  const [isProductTemplate, setIsProductTemplate] = useState(true);

  const [productType, setProductType] = useState(null);
  const [productTypeList, setProductTypeList] = useState([]);
  const [isProductType, setIsProductType] = useState(false);
  const [productColumns, setProductColumns] = useState(null);
  const {
    state: { permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();
  useEffect(() => {
    if (permissions?.productCategory?.isRead) {
      axiosInstance()
        .get('/product-category?sortBy=name&orderBy=asc')
        .then(({ data: { data } }) => {
          setProductCategoryList(data);
        });
    }
  }, [selectedEntity]);

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
    fetchGridColumns()
  }, []);

  useEffect(() => {
    if (productColumns && productColumns.length) {
      fetchData();
    }
  }, [page, limit, filters, sorting, search, selectedEntity, productCategory, productTemplate, productType, showFilteredRecordsOnly, productColumns]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.product}&view=true`)
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
        data.forEach((o) => {
          if (!ignoreField.includes(o?.fieldData.fieldName)) {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path, true);
            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData];
            }
          }
        });
        columns = [...columns];
        setProductColumns(columns);
      });
  }

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions.product.isCreate ? "Clone" : cloneDisable}>
          <span>
            <IconButton
              disabled={permissions.product.isCreate ? false : true}
              size="small"
              aria-label="Clone"
              onClick={() => {
                setProductId(row?.original._id);
                setOpen(true);
                setIsClone(true);
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions.product.isCreate ? "primary" : "disabled"} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={permissions.product.isDelete ? "Delete" : deleteDisable}>
          <span>
            <IconButton
              disabled={permissions.product.isDelete ? false : true}
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color={permissions.product.isDelete ? "error" : "disabled"} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={permissions.product.isRead && permissions?.serializedAsset ? "Child Product" : childDisable}>
          <span>
            <IconButton
              disabled={permissions.product.isRead && permissions?.serializedAsset ? false : true}
              size="small"
              aria-label="View Child Product"
              onClick={() => {
                history.push(`${routes.productDetail.path}/${row?.original._id}/bom`, { productName: row?.original.productName });
              }}
            >
              <RiBillLine color={permissions.product.isRead && permissions?.serializedAsset ? "primary" : "disabled"} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  }

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}${queryString}`)
      .then(({ data }) => {
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions.product.isDelete;
          return finalObject;
        });
        let columns = [...productColumns];
        data.productTemplate?.forEach((ele) => {
          GenrateColoum(ele.fields, columns);
        });
        console.log(columns);
        // make columns unique
        columns = columns.filter(
          (item, index, self) => index === self.findIndex((t) => t.accessor === item.accessor)
        );
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns, ActionsRenderer]);
        dispatch({ type: 'initialize', data: rows, count: data?.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const GenrateColoum = (fields, column) => {
    fields.forEach((ele) => {
      if (ignoreField.includes(ele.fieldName)) {
      } else if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
        if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
          ele.displayUnits.forEach((_unit) => {
            let fieldName = ele.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = ele.fieldLabel + ' ' + _unit;
            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
              let col: any = {};
              col.accessor = fieldName;
              col.Header = fieldLabel;
              col.width = 180;
              col.show = true;
              col.filter = false;
              col.sortable = false;
              col.editable = false;
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
                col.accessor = fieldName;
                col.Header = fieldLabel;
                col.width = 180;
                col.show = true;
                col.filter = false;
                col.sortable = false;
                col.editable = false;
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
              col.accessor = fieldName;
              col.Header = fieldLabel;
              col.width = 180;
              col.editable = false;
              col.show = true;
              col.filter = false;
              col.sortable = false;
              col.leval = 'product-template';
              column.push(col);
            }
          });
        }
      } else {
        if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
          let currentColumn: any = getColumnData(renderedFrom, ele, routes.productDetail.path);
          column.push({ ...currentColumn.columnData, leval: 'product-template', filter: false, sortable: false });
        }
      }
    });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (productType && productType !== '') {
      deepFilters.push({ field: 'productType', term: productType });
    }
    if (productType && productType !== '') {
      deepFilters.push({ field: 'productType', term: productType });
    }
    if (productCategory && productCategory !== '') {
      filterByIds.push({ field: 'productCategory', term: productCategory });
    }
    if (productTemplate && productTemplate !== '') {
      filterByIds.push({ field: 'productTemplate', term: productTemplate });
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
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
      .put(`/product/remove`, { ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleSubmit = (ids: string[]) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${routes.product.path}/assign-repair-type`, {
        repairType: ids,
        ids: selectedRecords.map((d: { _id: string }) => d._id)
      })
      .then(() => {
        fetchData();
        setSubmitting(false);
        setOpenAddDialog(false);
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };


  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.product.title }]} />
        <ImportExportLinks
          permissions={permissions.product}
          module={routes.product.title}
          api={product.api}
          refrenceId={null}
          onSuccessfulImport={(isImportedSuccessfully) => {
            if (isImportedSuccessfully) {
              fetchData();
            }
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
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
              api: `${product.api}/unknown/bom/template?export=true${selectedRecords.length
                ? `&ids=${selectedRecords.map((obj) => obj._id)}`
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
              title: 'Service/Consumable Template',
              api: `${product.api}/unknown/service-master/template`,
              type: 'download'
            },
            {
              title: 'Service/Consumable Export',
              api: `${product.api}/unknown/service-master/template?export=true${selectedRecords.length
                ? `&ids=${selectedRecords.map((obj) => obj._id)}`
                : ''
                }`,
              type: 'export'
            },
            {
              title: 'Service/Consumable Import',
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
              api: `${product.api}/unknown/package/template?export=true${selectedRecords.length
                ? `&ids=${selectedRecords.map((obj) => obj._id)}`
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
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-2'}>
              {permissions?.productCategory?.isRead && (
                <div className="w-full md:w-auto">
                  <Autocomplete
                    className="md:min-w-[250px] flex-grow md:flex-grow-0 sm:max-w-[250px]"
                    options={productCategoryList}
                    getOptionLabel={(option: any) => (option ? option.name : '')}
                    size="small"
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
                      <TextField
                        {...params}
                        margin="none"
                        size="small"
                        name="productCategory"
                        label="Product Category"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                </div>
              )}

              {isProductTemplate && (
                <Autocomplete
                  className="md:min-w-[250px] flex-grow md:flex-grow-0 sm:max-w-[250px]"
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
                    <TextField {...params} margin="none" size="small" name="productTemplate" label="Product Template" variant="outlined" fullWidth />
                  )}
                />
              )}
              {isProductType && (
                <Autocomplete
                  className="md:min-w-[250px] flex-grow md:flex-grow-0 sm:max-w-[250px]"
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
                  renderInput={(params) => (
                    <TextField {...params} margin="none" size={'small'} name="productType" label="Product Type" variant="outlined" fullWidth />
                  )}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={handleSearch}
                className={isMobile ? styles.search_box_input : ''}
                width="242px"
                size="small"
                value={search}
                style={isMobile ? { flex: 1 } : {}}
              />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.purchaseOrder?.isCreate && (
                  <Button
                    onClick={() => {
                      setOpen(true);
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={`no-shadow`}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                <HtmlTooltip title="Please select some products">
                  <span>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={`new-dropdown-v1`}
                      endIcon={<ExpandMore />}
                    >
                      Actions
                    </Button>
                  </span>
                </HtmlTooltip>
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
                    disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
                    onClick={() => {
                      closeActions();
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    {`Delete (${selectedRecords.length})`}
                  </MenuItem>
                  {permissions?.repairType?.isRead && (
                    <MenuItem
                      disabled={!permissions.product.isUpdate && !permissions?.hasOwnProperty('repairType')}
                      onClick={() => {
                        setOpenAddDialog(true);
                        closeActions();
                      }}
                    >
                      {`Assign ${routes?.repairType?.title} (${selectedRecords.length})`}
                    </MenuItem>
                  )}
                </Menu>
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.bulkAssetCreation}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {open && (
        <CreateProduct
          isClone={isClone}
          productId={productId}
          handleClose={() => {
            setProductId(null);
            setOpen(false);
            fetchData();
          }}
          isRedirectToDetailPage={true} openFrom="productMaster" />
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
    </section>
  );
};

export default Product;

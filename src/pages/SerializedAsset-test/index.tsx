import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { GiStockpiles } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Box, Chip, Menu, MenuItem, TextField } from '@material-ui/core';
import SearchBox from '../../components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from '../../components/Helpers/Routes';
import {
  serializedAsset,
  isObjectEmpty,
  gridLoadingTimeout,
  product,
  warehouse as warehouseHelper,
  ASSET_STATUS,
  COLOUR_MASTER
} from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import ManageSerializedAsset from '../SerializedAsset/ManageSerializedAsset';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomReactTable, { useColumns, getStaticFields, useTableReducer, gridFilterParser } from 'src/components/CustomReactTableNew';
import { prepareDataForGrid } from '../../constants/helpers';
import { isMobile } from 'react-device-detect';
import { Autocomplete } from '@material-ui/lab';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';
import WarningIcon from '@material-ui/icons/Warning';
import moment from 'moment';
import { sidebarResource } from '../../constants/helpers';

const SerializedAssetTest = () => {
  const renderedFrom = camelCase(routes?.serializedAsset.title);
  const toastConfig = useContext(CustomToastContext);
  const [showManageProductInventoryDialog, setShowManageProductInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer();
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } =
    state;
  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productFilterList, setProductFilterList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productFilter, setProductFilter] = useState(null);

  const [plantOptions, setPlantOptions] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [subleaseAsset, setSubleaseAsset] = useState(false);

  const {
    state: { permissions }
  }: any = useData();
  const { getColumnData } = useColumns();
  const history = useHistory();

  const [warehouse, setWarehouse] = useState(history.location?.state?.warehouse);

  const [fromPurchaseOrder, setFromPurchaseOrder] = useState({
    productId: history.location?.state?.productId,
    productName: history.location?.state?.productName,
    pOId: history.location?.state?.pOId,
    pOName: history.location?.state?.pOName
  });

  const [redirectProduct, setRedirectProduct] = useState(history.location?.state?.product);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [
    page,
    limit,
    filters,
    sorting,
    search,
    warehouse,
    selectedPlant,
    redirectProduct,
    fromPurchaseOrder,
    productCategory,
    productFilter,
    subleaseAsset,
    showFilteredRecordsOnly
  ]);

  useEffect(() => {
    axiosInstance()
      .get(`/product-category?sortBy=name&orderBy=asc`)
      .then(({ data: { data } }) => {
        setProductCategoryList(data);
      });
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`${warehouseHelper.warehouseApi}?noEntityWise=1&sortBy=warehouseName&orderBy=asc`)
      .then(({ data: { data } }) => {
        setPlantOptions(data);
      });
  }, []);

  useEffect(() => {
    if (productCategory && productCategory !== '') {
      axiosInstance()
        .get(`${product.api}?filterById=[{"field":"productCategory","term":"${productCategory}"}]`)
        .then(({ data }) => {
          setProductFilterList(data?.data);
          setProductFilter(null);
        });
    } else {
      setProductFilterList([]);
      setProductFilter(null);
    }
  }, [productCategory]);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <div className="flex">
        {permissions?.serializedAsset?.isCreate && (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageProductInventoryDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon color="primary" />
            </IconButton>
          </HtmlTooltip>
        )}
        {permissions?.serializedAsset?.isDelete && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color="error" />
            </IconButton>
          </HtmlTooltip>
        )}
      </div>
    )
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        data?.some((o) => {
          if (o?.fieldData?.fieldName === 'status') {
            setAllowUpdateStatus(o?.isUpdate);
            return true;
          }
        });
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path, true);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
          }
        });
        columns?.forEach((e) => {
          if (e.field === 'assetNumber') {
            e.cellRenderer = 'assetNumberRenderer';
            e.cellStyle = (params) => {
              if ([ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(params?.data?.status)) {
                return { backgroundColor: COLOUR_MASTER.lostAssets.background };
              }
              if (params.data?.recertDate) {
                var a = moment(params.data?.recertDate);
                var b = moment();
                const days = a.diff(b, 'days');
                if (days < 60 && days > 30) {
                  return { backgroundColor: '#00FF00' };
                } else if (days < 30 && days > 15) {
                  return { backgroundColor: '#FFFF00' };
                } else if (days < 15 && days > 0) {
                  return { backgroundColor: '#FF0000' };
                } else if (days < 0) {
                  return { backgroundColor: COLOUR_MASTER.lostAssets.background };
                }
              }
              return null;
            };
          }
        });
        columns = [...columns, ...getStaticFields(), ActionsRenderer];
        setColumns([...columns]);
      });
  };

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data?.map((u, user) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.serializedAsset?.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['isEditing'] = false;
          finalObject['allowedToEdit'] = permissions?.serializedAsset.isUpdate;
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'initialize',
          data: rows,
          count: data.count,
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'error', error: true });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (warehouse?.optionValue) {
      filterByIds.push({ field: 'warehouse', term: warehouse?.optionValue });
    }
    if (selectedPlant && selectedPlant !== '') {
      filterByIds.push({ field: 'warehouse', term: selectedPlant });
    }
    if (redirectProduct?.id) {
      filterByIds.push({ field: 'product', term: redirectProduct?.id });
    }
    if (fromPurchaseOrder?.pOId) {
      filterByIds.push({ field: 'purchaseOrder', term: fromPurchaseOrder.pOId });
    }
    if (fromPurchaseOrder?.productId) {
      filterByIds.push({ field: 'product', term: fromPurchaseOrder.productId });
    }
    if (productCategory && productCategory !== '') {
      filterByIds.push({ field: 'productCategory', term: productCategory });
    }
    if (productFilter && productFilter !== '') {
      filterByIds.push({ field: 'product', term: productFilter });
    }
    if (filterByIds.length > 0) {
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
      deepFilter = `${deepFilter}&search=${search}`;
    }
    if (subleaseAsset) {
      deepFilter = `${deepFilter}&subleaseAsset=1`;
    } else {
      deepFilter = `${deepFilter}&subleaseAsset=0`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = selectedRecords;
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`${serializedAsset.api}/remove`, { ids: ids })
      .then(() => {
        fetchProductInventory();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleStatusUpdate = (status) => {
    const ids = selectedRecords.map((d) => ({
      _id: d._id,
      currentStatus: d.status
    }));
    axiosInstance()
      .put(`${serializedAsset.api}/update-status`, {
        assets: ids,
        status: status,
        comment: '',
        reference: { _id: '', type: 'Inventory' }
      })
      .then(() => {
        fetchProductInventory();
        setAnchorEl(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${status}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const AssetNumberRenderer = (params) => (
    <Fragment>
      <Link className="link text-truncate" title={params.value} to={`${routes.serializedAssetDetail.path}/${params.data?._id}`}>
        {params.value}
      </Link>
      {params.data?.recertDate && new Date(params.data?.recertDate)?.getTime() <= new Date()?.getTime() && (
        <Box ml={1} pt={1}>
          <HtmlTooltip title="Asset needs to be recert">
            <WarningIcon style={{ fontSize: '14px' }} fontSize="small" color="error" />
          </HtmlTooltip>
        </Box>
      )}
    </Fragment>
  );

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.serializedAsset]} />
        <ImportExportLinks
          permissions={permissions?.serializedAsset}
          module="product inventory"
          api={serializedAsset.api}
          afterImportCompleted={() => {
            fetchProductInventory();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords.length}
          ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
          onExportToExcelSuccess={() => {
            fetchProductInventory();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[4fr_3fr] gap-4 items-start">
            <div className={'flex flex-wrap align-items-center gap-[8px]'}>
              <GiStockpiles size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
              <span className="listingHeader">{routes.serializedAsset?.title} </span>
              {warehouse && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Plants : ${warehouse.optionLabel}`}
                  onDelete={() => {
                    setWarehouse(null);
                  }}
                />
              )}
              {redirectProduct && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Product : ${redirectProduct.name}`}
                  onDelete={() => {
                    setRedirectProduct(null);
                  }}
                />
              )}
              {fromPurchaseOrder?.pOId ? (
                <>
                  {fromPurchaseOrder?.productId && (
                    <Chip
                      className="ml-3"
                      color="primary"
                      label={`Product : ${fromPurchaseOrder.productName}`}
                      onDelete={() => {
                        setFromPurchaseOrder(null);
                      }}
                    />
                  )}
                  <Chip
                    className="ml-3"
                    color="primary"
                    label={`Purchase Order : ${fromPurchaseOrder.pOName}`}
                    onDelete={() => {
                      setFromPurchaseOrder(null);
                    }}
                  />
                </>
              ) : (
                <Fragment>
                  <Autocomplete
                    size="small"
                    className={`lg:w-[230px] w-full`}
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
                      <TextField
                        {...params}
                        size="small"
                        margin="none"
                        name="productCategory"
                        label="Product Category"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                  {productCategory && (
                    <Autocomplete
                      size="small"
                      className={`lg:w-[230px] w-full`}
                      options={productFilterList}
                      getOptionLabel={(option: any) => (option ? option.productName : '')}
                      getOptionSelected={(option: any, val) => option._id === val}
                      value={
                        productFilterList.filter((data) => data._id === productFilter).length
                          ? productFilterList.filter((data) => data._id === productFilter)[0]
                          : ''
                      }
                      onChange={(e, val) => {
                        setProductFilter(val && val._id ? val._id : '');
                      }}
                      renderInput={(params) => (
                        <TextField size="small" {...params} margin="none" name="product" label="Product" variant="outlined" fullWidth />
                      )}
                    />
                  )}
                  <Autocomplete
                    className={`lg:w-[230px] w-full`}
                    options={plantOptions}
                    size="small"
                    getOptionLabel={(option: any) => (option ? option?.warehouseName : '')}
                    getOptionSelected={(option: any, val) => option.optionValue === val}
                    value={
                      plantOptions.filter((data) => data._id === selectedPlant).length
                        ? plantOptions.filter((data) => data._id === selectedPlant)[0]
                        : ''
                    }
                    onChange={(e, val) => {
                      setSelectedPlant(val && val._id ? val._id : '');
                    }}
                    renderInput={(params) => (
                      <TextField {...params} margin="none" size="small" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
                    )}
                  />
                  {permissions?.sublease && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="subleaseAsset"
                          checked={subleaseAsset}
                          onChange={(e) => {
                            setSubleaseAsset(e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      style={{ color: 'var(--dark-primary-text, var(--primary))', marginLeft: '-11px' }}
                      label="Sublease Assets"
                    />
                  )}
                </Fragment>
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={handleSearch}
                className={styles.search_box_input}
                width={isMobile ? '200px' : '242px'}
                style={isMobile ? { flex: 1 } : {}}
                size="small"
                value={search}
              />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.serializedAsset?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowManageProductInventoryDialog({ open: true, isClone: false, idToClone: null });
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
                <Button
                  className={`new-dropdown-v1`}
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  disabled={selectedRecords.length ? false : true}
                  aria-controls="action-menu"
                  endIcon={<ExpandMore />}
                >
                  Actions
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
                    disabled={!permissions?.serializedAsset?.isDelete}
                    onClick={() => {
                      closeActions();
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    Delete
                  </MenuItem>
                  {permissions?.serializedAsset?.isUpdate &&
                    allowUpdateStatus &&
                    [ASSET_STATUS.available, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].map((status) => (
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          handleStatusUpdate(status);
                        }}
                        disabled={
                          selectedRecords?.filter((o) =>
                            [ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview, ASSET_STATUS.lost].includes(o.status)
                          ).length === selectedRecords.length
                            ? false
                            : true
                        }
                      >
                        {`Status Change - ${status}`}
                      </MenuItem>
                    ))}
                  {permissions?.serializedAsset?.isUpdate && allowUpdateStatus && selectedRecords?.length && (
                    <>
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          handleStatusUpdate(ASSET_STATUS.scrap);
                        }}
                        disabled={
                          selectedRecords?.filter((o) => ![ASSET_STATUS.scrap].includes(o.status)).length === selectedRecords.length ? false : true
                        }
                      >
                        {`Status Change - ${ASSET_STATUS.scrap}`}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          handleStatusUpdate(ASSET_STATUS.lost);
                        }}
                        disabled={
                          selectedRecords?.filter((o) => ![ASSET_STATUS.lost].includes(o.status)).length === selectedRecords.length ? false : true
                        }
                      >
                        {`Status Change - ${ASSET_STATUS.lost}`}
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <>
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              onSelect={(newSelectedRecords) => {
                // dispatch({ type: "selection", selectedRecords: newSelectedRecords })
              }}
              state={state}
              dispatch={dispatch}
              setWholeRowsCellColor={() => {}}
              renderedFrom={renderedFrom}
              isClientSideGrid={false}
              refreshGrid={fetchProductInventory}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.serializedAsset}
            />
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {showManageProductInventoryDialog.open && (
        <ManageSerializedAsset
          isClone={showManageProductInventoryDialog.isClone}
          productInventoryId={showManageProductInventoryDialog.idToClone}
          onClose={() => setShowManageProductInventoryDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManageProductInventoryDialog({ open: false, isClone: false, idToClone: null });
            fetchProductInventory();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes?.serializedAsset?.title?.toLowerCase()} ${
            deleteRecord?._id ? deleteRecord?.assetNumber : ''
          } ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </div>
  );
};

export default SerializedAssetTest;

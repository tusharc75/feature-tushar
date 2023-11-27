import { Box, Chip, Menu, MenuItem, TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import WarningIcon from '@material-ui/icons/Warning';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { GiStockpiles } from 'react-icons/gi';
import { Link, useHistory } from 'react-router-dom';
import AssignDynamicDialog from 'src/components/AssignRolesDialog/AssignDynamicDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import routes from '../../components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import {
  ASSET_STATUS,
  COLOUR_MASTER,
  INVENTORY_HISTORY_TYPE,
  gridLoadingTimeout,
  prepareDataForGrid,
  product,
  serializedAsset,
  sidebarResource
} from '../../constants/helpers';
import styles from '../Leads/Header.module.scss';
import ManageSerializedAsset from './ManageSerializedAsset';
import ReasonDialog from './ReasonDialog';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import CustomContainer from 'src/components/CustomContainer';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';

let searchTimeout;

const SerializedAsset = () => {
  const renderedFrom = camelCase(routes?.serializedAsset.title);
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [showManageProductInventoryDialog, setShowManageProductInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [columns, setColumns] = useState(null);
  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productFilterList, setProductFilterList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productFilter, setProductFilter] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [subleaseAsset, setSubleaseAsset] = useState(false);
  const [openSupplierAccountDialog, setOpenSupplierAccountDialog] = useState(false);
  const [warehouse, setWarehouse] = useState(history.location?.state?.warehouse);
  const [fromPurchaseOrder, setFromPurchaseOrder] = useState({
    productId: history.location?.state?.productId,
    productName: history.location?.state?.productName,
    pOId: history.location?.state?.pOId,
    pOName: history.location?.state?.pOName
  });
  const [redirectProduct, setRedirectProduct] = useState(history.location?.state?.product);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [status, setStatus] = useState('');
  const [renderCount, setRenderCount] = useState(0);

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
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [
    page,
    limit,
    filters,
    sorting,
    warehouse,
    selectedWarehouse,
    selectedEntity,
    redirectProduct,
    fromPurchaseOrder,
    productCategory,
    subleaseAsset,
    showFilteredRecordsOnly
  ]);

  useEffect(() => {
    if (permissions?.productCategory?.isRead) {
      axiosInstance()
        .get(`/product-category?sortBy=name&orderBy=asc`)
        .then(({ data: { data } }) => {
          setProductCategoryList(data);
        });
    }
  }, [selectedEntity]);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Warehouse`)
      .then(({ data: { data } }) => {
        setWarehouseOptions(data['Warehouse']);
      });
  }, [selectedEntity]);

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
        data.forEach((o) => {
          if (o?.fieldData?.fieldName === 'assetNumber') {
            columns = [
              ...columns,
              {
                accessor: o?.fieldData?.fieldName,
                Header: o?.fieldData?.fieldLabel,
                minWidth: 180,
                width: 180,
                Cell: ({ row }) => (
                  <div
                    style={{
                      backgroundColor: [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(
                        row?.original?.status
                      )
                        ? COLOUR_MASTER.lostAssets.background
                        : ''
                    }}
                  >
                    <Link
                      className="link text-truncate"
                      title={row?.original[o?.fieldData?.fieldName]}
                      to={`${routes.serializedAssetDetail.path}/${row?.original?._id}`}
                    >
                      {row?.original[o?.fieldData?.fieldName]}
                    </Link>
                    {(row?.original?.recertDate && new Date(row?.original?.recertDate)?.getTime() <= new Date()?.getTime()) ||
                      (row?.original?.certificateExpiryDate && new Date(row?.original?.certificateExpiryDate)?.getTime() <= new Date()?.getTime() && (
                        <Box ml={1}>
                          <HtmlTooltip title="Asset needs to be recert">
                            <WarningIcon style={{ fontSize: '14px' }} fontSize="small" color="error" />
                          </HtmlTooltip>
                        </Box>
                      ))}
                  </div>
                )
              }
            ];
          } else {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path, true);
            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData];
            }
          }
        });

        columns.push({
          accessor: 'ownerType',
          Header: 'Actual Owner Type',
          minWidth: 150,
          width: 150,
          Cell: ({ row }) => (
            <>
              {row?.original?.ownerType ? (
                <h5 className="text-truncate" title={row?.original?.ownerType}>
                  {row?.original?.ownerType}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </>
          )
        });

        columns.push({
          accessor: 'owner',
          Header: 'Actual Owner',
          minWidth: 150,
          width: 150,
          Cell: ({ row }) => (
            <>
              {row?.original?.owner ? (
                <h5 className="text-truncate" title={row?.original?.owner}>
                  {row?.original?.owner}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </>
          )
        });

        columns = [...columns, ...getStaticFields(), ActionsRenderer];
        setColumns(columns);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.serializedAsset?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={!permissions?.serializedAsset?.isCreate}
              onClick={() => {
                setShowManageProductInventoryDialog({ open: true, isClone: true, idToClone: row?.original?._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.serializedAsset?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isSelected'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['canDelete'] =
            permissions?.serializedAsset?.isDelete &&
            ![
              ASSET_STATUS.new,
              ASSET_STATUS.available,
              ASSET_STATUS.lost,
              ASSET_STATUS.customerPossession,
              ASSET_STATUS.onPO,
              ASSET_STATUS.scrap
            ]?.includes(u?.status)
              ? false
              : true;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
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
    if (selectedWarehouse && selectedWarehouse !== '') {
      filterByIds.push({ field: 'warehouse', term: selectedWarehouse });
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
    if (subleaseAsset) {
      deepFilter = `${deepFilter}&subleaseAsset=1`;
    } else {
      deepFilter = `${deepFilter}&subleaseAsset=0`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${serializedAsset.api}/remove`, { ids: ids })
      .then(() => {
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

  const handleStatusChange = (status) => {
    if (status === ASSET_STATUS.scrap || status === ASSET_STATUS.lost) {
      setStatus(status);
      setShowReasonDialog(true);
    } else {
      handleStatusUpdate({ status });
    }
  };

  const handleStatusUpdate = (obj) => {
    const ids = selectedRecords?.map((d) => ({
      _id: d._id,
      currentStatus: d.status
    }));
    axiosInstance()
      .put(`${serializedAsset.api}/update-status`, {
        assets: ids,
        status: obj?.status,
        comment: obj?.reason ? obj?.reason : '',
        reference: { _id: '', type: INVENTORY_HISTORY_TYPE.serializedAssets }
      })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleCertificationSupplier = async (data) => {
    const ids = selectedRecords?.map((item) => item?._id);
    const certificationSupplier = data?.map((item) => item?._id);
    const body = {
      _ids: ids,
      certificationSupplier: certificationSupplier
    };
    try {
      let response = await axiosInstance().put(`${routes?.serializedAsset?.path}/update-bulk-data`, body);
      dispatch({ type: 'selection', selectedRecords: [] });
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: response?.data?.message
      });
      setOpenSupplierAccountDialog(false);
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.serializedAsset]} />
        <ImportExportLinks
          permissions={permissions?.serializedAsset}
          module={routes?.serializedAsset.title}
          api={serializedAsset.api}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>

      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[4fr_3fr] gap-4 items-start">
            <div className={'flex flex-wrap align-items-center gap-[8px]'}>
              <GiStockpiles size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
              <span className="listingHeader">{routes.serializedAsset?.title} </span>
              {warehouse || warehouse || fromPurchaseOrder?.pOId ? (
                <Fragment>
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
                  {fromPurchaseOrder?.productId && (
                    <Fragment>
                      <Chip
                        className="ml-3"
                        color="primary"
                        label={`Product : ${fromPurchaseOrder.productName}`}
                        onDelete={() => {
                          setFromPurchaseOrder(null);
                        }}
                      />
                      <Chip
                        className="ml-3"
                        color="primary"
                        label={`Purchase Order : ${fromPurchaseOrder.pOName}`}
                        onDelete={() => {
                          setFromPurchaseOrder(null);
                        }}
                      />
                    </Fragment>
                  )}
                </Fragment>
              ) : (
                <Fragment>
                  {permissions?.productCategory?.isRead && (
                    <Autocomplete
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
                  )}
                  {productCategory && (
                    <Autocomplete
                      className={`lg:w-[230px] w-full`}
                      options={productFilterList}
                      size="small"
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
                    options={warehouseOptions}
                    getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                    getOptionSelected={(option: any, val) => option.optionValue === val}
                    value={
                      warehouseOptions.filter((data) => data.optionValue === selectedWarehouse).length
                        ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse)[0]
                        : ''
                    }
                    onChange={(e, val) => {
                      setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
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
            <div className="flex flex-wrap gap-[8px] justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
              <div className="flex gap-[8px] flex-wrap items-center">
                <Button
                  disabled={!permissions?.serializedAsset?.isCreate}
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  onClick={() => {
                    setShowManageProductInventoryDialog({ open: true, isClone: false, idToClone: null });
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  className={`new-dropdown-v1`}
                  aria-controls="action-menu"
                  endIcon={<ExpandMore />}
                  disabled={selectedRecords?.length ? false : true}
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
                    disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
                    onClick={() => {
                      closeActions();
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    {`Delete (${selectedRecords?.length})`}
                  </MenuItem>
                  {permissions?.serializedAsset?.isUpdate &&
                    allowUpdateStatus &&
                    [ASSET_STATUS.available].map((status) => (
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          handleStatusChange(status);
                        }}
                        disabled={
                          selectedRecords?.filter((o) => [ASSET_STATUS.available, ASSET_STATUS.underReview, ASSET_STATUS.lost].includes(o.status))
                            .length === selectedRecords?.length
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
                          handleStatusChange(ASSET_STATUS.needRepair);
                        }}
                        disabled={
                          selectedRecords?.filter((o) => ![ASSET_STATUS.needRepair].includes(o.status)).length === selectedRecords?.length
                            ? false
                            : true
                        }
                      >
                        {`Status Change - ${ASSET_STATUS.needRepair}`}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          handleStatusChange(ASSET_STATUS.needRecert);
                        }}
                        disabled={
                          selectedRecords?.filter((o) => ![ASSET_STATUS.needRecert].includes(o.status)).length === selectedRecords?.length
                            ? false
                            : true
                        }
                      >
                        {`Status Change - ${ASSET_STATUS.needRecert}`}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          handleStatusChange(ASSET_STATUS.scrap);
                        }}
                        disabled={
                          selectedRecords?.filter((o) => ![ASSET_STATUS.scrap].includes(o.status)).length === selectedRecords?.length ? false : true
                        }
                      >
                        {`Status Change - ${ASSET_STATUS.scrap}`}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          handleStatusChange(ASSET_STATUS.lost);
                        }}
                        disabled={
                          selectedRecords?.filter((o) => ![ASSET_STATUS.lost].includes(o.status)).length === selectedRecords?.length ? false : true
                        }
                      >
                        {`Status Change - ${ASSET_STATUS.lost}`}
                      </MenuItem>
                      {columns?.some((e) => e.field === 'certificationSupplier') && (
                        <MenuItem
                          disabled={!permissions?.serializedAsset?.isUpdate}
                          onClick={() => {
                            closeActions();
                            setOpenSupplierAccountDialog(true);
                          }}
                        >
                          {`Assign Certification Supplier`}
                        </MenuItem>
                      )}
                    </>
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
            resource={sidebarResource.serializedAsset}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>

      {showManageProductInventoryDialog.open && (
        <ManageSerializedAsset
          isClone={showManageProductInventoryDialog.isClone}
          productInventoryId={showManageProductInventoryDialog.idToClone}
          onClose={() => setShowManageProductInventoryDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManageProductInventoryDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
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

      {openSupplierAccountDialog && (
        <AssignDynamicDialog
          reference={routes.serializedAsset.title}
          onSuccess={(data) => {
            handleCertificationSupplier(data);
          }}
          handleClose={() => {
            setOpenSupplierAccountDialog(false);
          }}
          ids={[]}
          resource={sidebarResource?.supplierAccount}
          path={routes?.supplierAccount?.path}
        />
      )}

      {showReasonDialog && (
        <ReasonDialog
          onClose={() => setShowReasonDialog(false)}
          status={status}
          onAddReason={(reason) => {
            handleStatusUpdate({ status: status, reason: reason });
            setShowReasonDialog(false);
          }}
        />
      )}
    </section>
  );
};

export default SerializedAsset;

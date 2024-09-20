import { Box, Chip, MenuItem, TextField } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import WarningIcon from '@material-ui/icons/Warning';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { Autocomplete } from '@material-ui/lab';

import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import AssignDynamicDialog from 'src/components/AssignRolesDialog/AssignDynamicDialog';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import routes from '../../components/Helpers/Routes';
import {
  ASSET_STATUS,
  COLOUR_MASTER,
  INVENTORY_HISTORY_TYPE,
  INVENTORY_OWNER_TYPE,
  gridLoadingTimeout,
  prepareDataForGrid,
  product,
  serializedAsset,
  sidebarResource
} from '../../constants/helpers';
import ManageSerializedAsset from './ManageSerializedAsset';
import ReasonDialog from './ReasonDialog';
import axios, { CancelTokenSource } from 'axios';

const renderedFrom = camelCase(routes?.serializedAsset.title);

const SerializedAsset = () => {
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [showManageProductInventoryDialog, setShowManageProductInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productFilterList, setProductFilterList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productFilter, setProductFilter] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [subleaseAsset, setSubleaseAsset] = useState(false);
  const [showScrapAsset, setShowScrapAsset] = useState(false);

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

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    limit,
    filters,
    sorting,
    warehouse,
    selectedWarehouse,
    selectedEntity,
    redirectProduct,
    fromPurchaseOrder,
    productCategory,
    productFilter,
    subleaseAsset,
    showScrapAsset,
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
        let newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path, true);

        newColumns?.forEach((o) => {
          if (o?.accessor === 'assetNumber') {
            o.cell = ({ row }) => (
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
                  title={row?.original?.assetNumber}
                  to={`${routes.serializedAssetDetail.path}/${row?.original?._id}`}
                >
                  {row?.original?.assetNumber}
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
            );
          }
        });

        newColumns.push({
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

        newColumns.push({
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

        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
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
        {permissions?.iotChart?.isRead && row?.original?.iotUnit && (
          <HtmlTooltip title="View IOT Data">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  history.push(`${routes.iotChartDetail.path}/${row?.original?._id}`);
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
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

    if (showScrapAsset) {
      deepFilter = `${deepFilter}&showScrapAsset=true`;
    } else {
      deepFilter = `${deepFilter}&hideScrapAsset=true`;
    }

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
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${obj?.status}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
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
        <ListingPageHeader
          leftSideContents={
            <LeftSideContent
              {...{
                warehouse,
                fromPurchaseOrder,
                setWarehouse,
                redirectProduct,
                setRedirectProduct,
                setFromPurchaseOrder,
                permissions,
                productCategoryList,
                productCategory,
                setProductCategory,
                productFilterList,
                productFilter,
                setProductFilter,
                warehouseOptions,
                selectedWarehouse,
                setSelectedWarehouse,
                subleaseAsset,
                setSubleaseAsset,
                showScrapAsset,
                setShowScrapAsset
              }}
            />
          }
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={
            <ActionMenuItems
              {...{
                selectedRecords,
                setShowDeleteConfirmBox,
                permissions,
                allowUpdateStatus,
                handleStatusChange,
                columns,
                setOpenSupplierAccountDialog
              }}
            />
          }
          addButtonProps={{ disabled: !permissions?.serializedAsset?.isCreate }}
          addButtonOnclick={() => {
            setShowManageProductInventoryDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={true}
        />

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
          onSuccess={(data) => {
            handleCertificationSupplier(data);
          }}
          handleClose={() => {
            setOpenSupplierAccountDialog(false);
          }}
          ids={[]}
          resource={sidebarResource?.supplierAccount}
          isSubmitting={false}
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

const LeftSideContent = ({
  warehouse,
  fromPurchaseOrder,
  setWarehouse,
  redirectProduct,
  setRedirectProduct,
  setFromPurchaseOrder,
  permissions,
  productCategoryList,
  productCategory,
  setProductCategory,
  productFilterList,
  productFilter,
  setProductFilter,
  warehouseOptions,
  selectedWarehouse,
  setSelectedWarehouse,
  subleaseAsset,
  setSubleaseAsset,
  showScrapAsset,
  setShowScrapAsset
}) => {
  return (
    <>
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
              className={`w-full lg:w-[230px]`}
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
                <TextField {...params} size="small" margin="none" name="productCategory" label="Product Category" variant="outlined" fullWidth />
              )}
            />
          )}
          {productCategory && (
            <Autocomplete
              className={`w-full lg:w-[230px]`}
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
            className={`w-full lg:w-[230px]`}
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
          <FormControlLabel
            control={
              <Checkbox
                name="showScrapAsset"
                checked={showScrapAsset}
                onChange={(e) => {
                  setShowScrapAsset(e.target.checked);
                }}
                color="primary"
              />
            }
            style={{ color: 'var(--dark-primary-text, var(--primary))', marginLeft: '-11px' }}
            label={`Scrap ${routes.serializedAsset.title}`}
          />
        </Fragment>
      )}
    </>
  );
};

const ActionMenuItems = ({
  selectedRecords,
  setShowDeleteConfirmBox,
  permissions,
  allowUpdateStatus,
  handleStatusChange,
  columns,
  setOpenSupplierAccountDialog
}) => {
  return (
    <>
      <MenuItem
        disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
        onClick={() => {
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
              handleStatusChange(status);
            }}
            disabled={
              selectedRecords?.filter(
                (o) =>
                  [ASSET_STATUS.available, ASSET_STATUS.underReview, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(o.status) ||
                  (ASSET_STATUS.scrap === o.status && o?.currentOwnerType === INVENTORY_OWNER_TYPE.brand)
              ).length === selectedRecords?.length
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
              handleStatusChange(ASSET_STATUS.needRepair);
            }}
            disabled={
              selectedRecords?.filter(
                (o) =>
                  ![
                    ASSET_STATUS.delivered,
                    ASSET_STATUS.inTransit,
                    ASSET_STATUS.inUse,
                    ASSET_STATUS.inRepair,
                    ASSET_STATUS.repair,
                    ASSET_STATUS.standBy,
                    ASSET_STATUS.standByNotChargeable,
                    ASSET_STATUS.needRepair,
                    ASSET_STATUS.lost
                  ].includes(o.status)
              ).length === selectedRecords?.length
                ? false
                : true
            }
          >
            {`Status Change - ${ASSET_STATUS.needRepair}`}
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleStatusChange(ASSET_STATUS.needRecert);
            }}
            disabled={
              selectedRecords?.filter(
                (o) =>
                  ![
                    ASSET_STATUS.delivered,
                    ASSET_STATUS.inTransit,
                    ASSET_STATUS.inUse,
                    ASSET_STATUS.standBy,
                    ASSET_STATUS.standByNotChargeable,
                    ASSET_STATUS.inRepair,
                    ASSET_STATUS.repair,
                    ASSET_STATUS.needRecert,
                    ASSET_STATUS.lost
                  ].includes(o.status)
              ).length === selectedRecords?.length
                ? false
                : true
            }
          >
            {`Status Change - ${ASSET_STATUS.needRecert}`}
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleStatusChange(ASSET_STATUS.scrap);
            }}
            disabled={
              selectedRecords?.filter(
                (o) =>
                  ![
                    ASSET_STATUS.delivered,
                    ASSET_STATUS.inTransit,
                    ASSET_STATUS.inUse,
                    ASSET_STATUS.standBy,
                    ASSET_STATUS.standByNotChargeable,
                    ASSET_STATUS.inRepair,
                    ASSET_STATUS.repair,
                    ASSET_STATUS.scrap,
                    ASSET_STATUS.lost
                  ].includes(o.status)
              ).length === selectedRecords?.length
                ? false
                : true
            }
          >
            {`Status Change - ${ASSET_STATUS.scrap}`}
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleStatusChange(ASSET_STATUS.lost);
            }}
            disabled={
              selectedRecords?.filter(
                (o) =>
                  ![
                    ASSET_STATUS.delivered,
                    ASSET_STATUS.inTransit,
                    ASSET_STATUS.inUse,
                    ASSET_STATUS.inRepair,
                    ASSET_STATUS.repair,
                    ASSET_STATUS.standBy,
                    ASSET_STATUS.standByNotChargeable,
                    ASSET_STATUS.lost
                  ].includes(o.status)
              ).length === selectedRecords?.length
                ? false
                : true
            }
          >
            {`Status Change - ${ASSET_STATUS.lost}`}
          </MenuItem>
          {columns?.some((e) => e.field === 'certificationSupplier') && (
            <MenuItem
              disabled={!permissions?.serializedAsset?.isUpdate}
              onClick={() => {
                setOpenSupplierAccountDialog(true);
              }}
            >
              {`Assign Certification Supplier`}
            </MenuItem>
          )}
        </>
      )}
    </>
  );
};

import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import AddIcon from '@material-ui/icons/Add';
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
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import {
  serializedAsset,
  isObjectEmpty,
  gridLoadingTimeout,
  product,
  warehouse as warehouseHelper,
  ASSET_STATUS,
  COLOUR_MASTER,
  getLocalStorageArrayData
} from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import ManageSerializedAsset from '../SerializedAsset/ManageSerializedAsset';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import useColumns, { getStaticFields } from '../../components/CustomReactTableNew/useColumnsReactTable';
import { prepareDataForGrid } from '../../constants/helpers';
import { AiFillCrown, MdAdd } from 'react-icons/all';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { Autocomplete } from '@material-ui/lab';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';
import WarningIcon from '@material-ui/icons/Warning';
import moment from 'moment';
import CustomReactTable from 'src/components/CustomReactTableNew/CustomReactTable';

const SerializedAssetTest = () => {
  const renderedFrom = camelCase(routes?.serializedAsset.title);
  const toastConfig = useContext(CustomToastContext);
  const [showManageProductInventoryDialog, setShowManageProductInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
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

  const ActionsRenderer = [
    {
      accessor: 'action',
      Header: '',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
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
        </>
      )
    }
  ];

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
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
          }
        });
        columns?.forEach((e) => {
          if (e.field === 'assetNumber') {
            e.cellRenderer = 'assetNumberRenderer';
            e.cellStyle = (params) => {
              if (
                [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(
                  params?.data?.status
                )
              ) {
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
        // let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        // tempFrameworkComponent = {
        //   ...tempFrameworkComponent,
        //   assetNumberRenderer: AssetNumberRenderer,
        //   actionsRenderer: ActionsRenderer
        // };
        // setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields(), ...ActionsRenderer];
        setColumns([...columns]);
      });
  };

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
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
        setIsAllChecked(false);
        setClonedData(data.data);
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: data.data.count,
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
        // dispatch({ type: "initialize", data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    let filterById = [];
    if (warehouse?.optionValue) {
      filterById.push({ field: 'warehouse', term: warehouse?.optionValue });
    }
    if (selectedPlant && selectedPlant !== '') {
      filterById.push({ field: 'warehouse', term: selectedPlant });
    }
    if (redirectProduct?.id) {
      filterById.push({ field: 'product', term: redirectProduct?.id });
    }
    if (fromPurchaseOrder?.pOId) {
      filterById.push({ field: 'purchaseOrder', term: fromPurchaseOrder.pOId });
    }
    if (fromPurchaseOrder?.productId) {
      filterById.push({ field: 'product', term: fromPurchaseOrder.productId });
    }
    if (productCategory && productCategory !== '') {
      filterById.push({ field: 'productCategory', term: productCategory });
    }
    if (productFilter && productFilter !== '') {
      filterById.push({ field: 'product', term: productFilter });
    }
    if (filterById.length > 0) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;
    }
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}`;
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
        if (gridApi) {
          gridApi.deselectAll();
        }
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

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.serializedAsset]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
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
              if (gridApi) gridApi.deselectAll();
              else fetchProductInventory();
            }}
            additionalParams={getQueryString(true)}
          />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} sm={12} md={8} className="d-flex align-items-center gap-1">
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
                  {productCategory && (
                    <Autocomplete
                      style={{ width: '250px' }}
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
                      renderInput={(params) => <TextField {...params} margin="dense" name="product" label="Product" variant="outlined" fullWidth />}
                    />
                  )}
                  <Autocomplete
                    style={{ width: '250px' }}
                    options={plantOptions}
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
                    renderInput={(params) =>
                      isMobile && !isTablet ? (
                        <TextField
                          {...params}
                          margin="dense"
                          name="plant"
                          placeholder={routes.warehouse.title}
                          variant="standard"
                          fullWidth
                          className={isMobile ? 'serchBox' : ''}
                        />
                      ) : (
                        <TextField {...params} margin="dense" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
                      )
                    }
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
                      label="Sublease Assets"
                    />
                  )}
                </Fragment>
              )}
            </Grid>
            <Grid md={4} sm={12} xs={12} container className={`${styles.filter_side} align-items-center`}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', flex: 1 }}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                    size="small"
                    value={search}
                  />
                </Grid>
                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {permissions?.serializedAsset?.isCreate && (
                    <Button
                      onClick={() => {
                        setShowManageProductInventoryDialog({ open: true, isClone: false, idToClone: null });
                      }}
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
                    className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="default"
                    size="small"
                    onClick={openActions}
                    disabled={selectedRecords.length ? false : true}
                    aria-controls="action-menu"
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
                              [ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview, ASSET_STATUS.lost].includes(
                                o.status
                              )
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
                            selectedRecords?.filter((o) => ![ASSET_STATUS.scrap].includes(o.status)).length === selectedRecords.length
                              ? false
                              : true
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
                            selectedRecords?.filter((o) => ![ASSET_STATUS.lost].includes(o.status)).length === selectedRecords.length
                              ? false
                              : true
                          }
                        >
                          {`Status Change - ${ASSET_STATUS.lost}`}
                        </MenuItem>
                      </>
                    )}
                  </Menu>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions?.serializedAsset}
              primaryField={columns?.find((d) => d.field === 'assetNumber')}
              onClick={(d) => {
                history.push(`${routes.serializedAssetDetail.path}/${d._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(d) => {
                history.push(`${routes.serializedAssetDetail.path}/${d._id}`);
              }}
              extraParamsToCheckDelete={false}
              onDelete={(d) => {
                setDeleteRecord(d);
                setShowDeleteConfirmBox(true);
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[]}
              chips={[
                {
                  label: 'Serial Number : ',
                  field: 'serialNumber'
                }
              ]}
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setShowManageProductInventoryDialog({ open: true, isClone: true, idToClone: data._id });
              }}
              renderedFrom={renderedFrom}
            />
          ) : (
            // Object.keys(frameWorkComponent).length > 0 && columns ? (
            //   <CustomAgGrid
            //     columns={columns}
            //     dataRows={dataRows}
            //     frameworkComponents={frameWorkComponent}
            //     setGridApi={setGridApi}
            //     dispatch={dispatch}
            //     rowCount={rowCount}
            //     limit={limit}
            //     pageSizes={pageSizes}
            //     page={page}
            //     actionWidth={150}
            //     loading={loading}
            //     refreshGrid={fetchProductInventory}
            //     showOnlyShowFilteredRecordSwitch={true}
            //   />
            // ) : null
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              data={dataRows}
              currentPage={page}
              onSelect={(newSelectedRecords) => {
                // dispatch({ type: "selection", selectedRecords: newSelectedRecords })
              }}
              dispatch={dispatch}
              childrenProperty="subRows"
              uniqueKey="_id"
              setWholeRowsCellColor={() => {}}
              renderedFrom={renderedFrom}
              isClientSideGrid={false}
              rowCount={rowCount}
              limit={limit}
              customFilters={filters}
              sorting={sorting}
              loading={loading}
            />
          )
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
    </Fragment>
  );
};

export default SerializedAssetTest;

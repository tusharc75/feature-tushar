import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { GiStockpiles } from 'react-icons/gi';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Box, Chip, Menu, MenuItem } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { purchaseOrder, isObjectEmpty, gridLoadingTimeout, getLocalStorageArrayData, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from 'src/constants/useColumns';
import { prepareDataForGrid } from 'src/constants/helpers';
import ManagePurchaseOrder from './ManagePurchaseOrder';
import { AiFillCrown, MdAdd, MdSort, MdFilterList, MdAccountCircle } from 'react-icons/all';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { FaSuitcase } from 'react-icons/fa';
import MobileSortDialog from 'src/components/MobileSortDialog';
import MobileFilterDialog from 'src/components/MobileFilterDialog';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { Autocomplete } from '@material-ui/lab';
import { TextField } from '@material-ui/core';

const PurchaseOrder = () => {
  const PurchaseOrderType = [
    {
      key: `All ${routes.purchaseOrder.title}`,
      value: 1
    },
    {
      key: `My ${routes.purchaseOrder.title}`,
      value: 2
    }
  ];

  let renderedFrom = camelCase(routes.purchaseOrder?.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [filter, setFilter] = useState(`All ${routes.purchaseOrder.title}`);
  const [showManagePurchaseOrderDialog, setShowManagePurchaseOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [isOpenDialog, setisOpenDialog] = useState(false);

  const [fromRental, setFromRental] = useState(history.location?.state?.rental);
  const [fromSalesOrder, setFromSalesOrder] = useState(history.location?.state?.salesOrder);

  const [plantOptions, setPlantOptions] = useState([]);
  const [plantId, setPlantId] = useState(null);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
    getPlants();
  }, []);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [page, limit, filters, sorting, search, selectedEntity, fromRental, fromSalesOrder, selectedType, showFilteredRecordsOnly, plantId]);

  const getPlants = () => {
    axiosInstance()
      .get(`/warehouse`)
      .then(({ data: { data } }) => {
        setPlantOptions(data);
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Purchase Order')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.purchaseOrderDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchPurchaseOrder = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${purchaseOrder.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          const { owner, collaborator, ...restProperties } = u;
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue === user?.user?._id);
          let res = {
            ...finalObject
          };
          return res;
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 2) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters)

    if (plantId && plantId !== '') {
      filterByIds.push({ field: 'warehouse', term: plantId });
    }
    if (fromRental) {
      filterByIds.push({ field: 'rentalJob', term: fromRental?._id });
    }
    if (fromSalesOrder) {
      filterByIds.push({ field: 'salesOrder', term: fromSalesOrder?._id });
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
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
      .put(`${purchaseOrder.api}/remove`, { ids: ids })
      .then(() => {
        fetchPurchaseOrder();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handlePurchaseOrderTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`);
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      handlePurchaseOrderTypeSel(PurchaseOrderType.find((d) => d.key === newFilter).value);
    }
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.purchaseOrder?.isCreate && (
        <HtmlTooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManagePurchaseOrderDialog({ open: true, isClone: true, idToClone: params.data._id });
            }}
          >
            <FileCopyIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
      {permissions?.purchaseOrder?.isDelete && params?.data?.canDelete && !params?.data?.deleted && (
        <HtmlTooltip title="Delete">
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
        </HtmlTooltip>
      )}
    </>
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

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.purchaseOrder]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions?.purchaseOrder}
            module="purchase order"
            api={purchaseOrder.api}
            afterImportCompleted={() => {
              fetchPurchaseOrder();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
            ids={
              getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
                : []
            }
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchPurchaseOrder();
            }}
            additionalParams={getQueryString(true)}
          />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <GiStockpiles size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.purchaseOrder?.title} </span>
              </div>
              {isMobile ? (
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
                      contentPart={null}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.purchaseOrder?.title}
                      filters={filters}
                    />
                  </Grid>
                </>
              ) : (
                <HideWhenOffline>
                  <div className={`align-items-center gap-1 layout-for-mobile `}>
                    {PurchaseOrderType && (
                      <ToggleButtonGroup
                        size="small"
                        className="ml-2"
                        value={PurchaseOrderType[selectedType - 1].key}
                        exclusive
                        onChange={handleFilter}
                      >
                        {PurchaseOrderType.map((k, index) => {
                          return (
                            <ToggleButton value={k.key} key={index}>
                              {k.key}
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                    )}
                  </div>
                </HideWhenOffline>
              )}
              <Autocomplete
                style={{ width: '250px' }}
                options={plantOptions}
                getOptionLabel={(option: any) => option.warehouseName}
                getOptionSelected={(option: any, val) => option._id === val}
                value={plantOptions.filter((data) => data._id === plantId).length ? plantOptions.filter((data) => data._id === plantId)[0] : ''}
                onChange={(e, val) => {
                  setPlantId(val && val._id ? val._id : '');
                }}
                renderInput={(params) =>
                  isMobile && !isTablet ? (
                    <TextField
                      {...params}
                      margin="dense"
                      name="plant"
                      placeholder="Plant"
                      variant="standard"
                      fullWidth
                      className={isMobile ? 'serchBox' : ''}
                    />
                  ) : (
                    <TextField {...params} margin="dense" name="plant" label="Plant" variant="outlined" fullWidth />
                  )
                }
              />
              {fromRental && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Rental Job : ${fromRental?.rentalJobName}`}
                  onDelete={() => {
                    setFromRental(null);
                  }}
                />
              )}
              {fromSalesOrder && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Sales Order : ${fromSalesOrder?.salesOrderNo}`}
                  onDelete={() => {
                    setFromSalesOrder(null);
                  }}
                />
              )}
            </Grid>
            <Grid xs={12} sm={12} md={6} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', flex: 1, gap: '5px' }} className={styles.content_box}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={isMobile ? styles.search_box_input : ''}
                    width="242px"
                    size="small"
                    value={search}
                    style={isMobile ? { flex: 1 } : {}}
                  />
                </Grid>
                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {permissions?.purchaseOrder?.isCreate && (
                    <Button
                      onClick={() => {
                        setShowManagePurchaseOrderDialog({ open: true, isClone: false, idToClone: null });
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {' '}
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}
                  <HtmlTooltip title="Please select some purchase orders">
                    <span>
                      <Button
                        variant={isMobile ? 'text' : 'outlined'}
                        color="default"
                        size="small"
                        onClick={openActions}
                        disabled={selectedRecords.length ? false : true}
                        aria-controls="action-menu"
                        className={isMobile ? 'mobile_button' : styles.add_submit_btn}
                        endIcon={<ExpandMore />}
                      >
                        {isMobile ? '' : 'Actions'}
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
                      disabled={
                        permissions?.purchaseOrder?.isDelete &&
                          selectedRecords?.filter((e) => e.canDelete && !e.deleted)?.length === selectedRecords?.length
                          ? false
                          : true
                      }
                      onClick={() => {
                        closeActions();
                        setShowDeleteConfirmBox(true);
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns ? (
          Object.keys(frameWorkComponent).length > 0 ? (
            isMobile && !isTablet ? (
              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions.purchaseOrder}
                primaryField={columns?.find((d) => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.purchaseOrderDetail.path}/${data._id}`);
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.purchaseOrderDetail.path}/${data._id}?openEdit=true`);
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
                    icon: <MdAccountCircle size={18} />,
                    field: 'supplierAccount'
                  }
                ]}
                chips={[
                  {
                    label: 'Purchase Order Date:  ',
                    fieldType: 'date',
                    field: 'purchaseOrderDate'
                  },
                  {
                    label: 'Plant:  ',
                    field: 'warehouse'
                  },
                  {
                    label: 'Delivery Date: ',
                    field: 'deliveryDate',
                    fieldType: 'date',
                    setBackground: (data) => {
                      return data.status === '' && new Date() > new Date(data.deliveryDate) ? { backgroundColor: '#efcccc' } : null;
                    }
                  },
                  {
                    label: 'Status: ',
                    field: 'status'
                  }
                ]}
                onCreate={false}
                showClone={true}
                onClone={(data) => {
                  setShowManagePurchaseOrderDialog({ open: true, isClone: true, idToClone: data._id });
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
                rowClassRules={{
                  'red-data-row': function (params) {
                    return params.data.deleted;
                  }
                }}
                refreshGrid={fetchPurchaseOrder}
                showOnlyShowFilteredRecordSwitch={true}
                showFilters={true}
                resource={sidebarResource.purchaseOrder}
              />
            )
          ) : null
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {showManagePurchaseOrderDialog.open && (
        <ManagePurchaseOrder
          isClone={showManagePurchaseOrderDialog.isClone}
          purchaseOrderId={showManagePurchaseOrderDialog.idToClone}
          onClose={() => setShowManagePurchaseOrderDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManagePurchaseOrderDialog({ open: false, isClone: false, idToClone: null });
            fetchPurchaseOrder();
          }}
          currency={user?.entity?.find((d) => d._id === selectedEntity)?.currency}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes?.purchaseOrder.title?.toLowerCase()} ${deleteRecord?.purchaseOrderNumber || ''} ? `}
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

export default PurchaseOrder;

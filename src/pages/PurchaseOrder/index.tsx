import { Box, Chip, Menu, MenuItem, TextField } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Autocomplete, ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { gridLoadingTimeout, prepareDataForGrid, purchaseOrder, sidebarResource } from 'src/constants/helpers';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ManagePurchaseOrder from './ManagePurchaseOrder';

const PurchaseOrder = () => {
  const PurchaseOrderType = [
    {
      key: `My ${routes.purchaseOrder.title}`,
      value: 1
    },
    {
      key: `All ${routes.purchaseOrder.title}`,
      value: 2
    }
  ];

  let renderedFrom = camelCase(routes.purchaseOrder?.title);
  const { state, dispatch } = useTableReducer();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  let { type, referenceId, referenceType }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [showManagePurchaseOrderDialog, setShowManagePurchaseOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [columns, setColumns] = useState(null);
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [fromSalesOrder, setFromSalesOrder] = useState(history.location?.state?.salesOrder);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [warehouse, setWarehouse] = useState(null);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    getPlants();
  }, [selectedEntity]);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [page, limit, filters, sorting, search, selectedEntity, fromSalesOrder, selectedType, showFilteredRecordsOnly, warehouse]);

  const getPlants = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Warehouse`)
      .then(({ data: { data } }) => {
        setWarehouseOptions(data['Warehouse']);
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.purchaseOrder}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, routes.purchaseOrderDetail.path, true);
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
        <HtmlTooltip title={permissions?.purchaseOrder?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.purchaseOrder?.isCreate ? false : true}
              onClick={() => {
                setShowManagePurchaseOrderDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.purchaseOrder?.isCreate ? 'primary' : 'disabled'} />
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
                setDeleteRecord(row.original);
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

  const fetchPurchaseOrder = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${purchaseOrder.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] = permissions?.purchaseOrder?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete && !u?.deleted;
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
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (warehouse && warehouse !== '') {
      filterByIds.push({ field: 'warehouse', term: warehouse });
    }
    if (referenceId) {
      filterByIds.push({ field: 'rentalJob', term: referenceId });
    }
    if (fromSalesOrder) {
      filterByIds.push({ field: 'salesOrder', term: fromSalesOrder?._id });
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
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
        dispatch({ type: 'selection', selectedRecords: [] });
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
    dispatch({ type: 'pageChange', page: 0 });
    setSelectedType(filterValues);
    if (referenceId && referenceType) {
      history.push(`?type=${filterValues}&referenceType=${referenceType}&referenceId=${referenceId}`);
    } else {
      history.push(`?type=${filterValues}`);
    }
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      handlePurchaseOrderTypeSel(PurchaseOrderType.find((d) => d.key === newFilter).value);
    }
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

  const updateQueryParams = () => {
    const queryParams = new URLSearchParams(history.location.search);
    queryParams.delete('referenceId');
    queryParams.delete('referenceType');
    referenceId = queryParams.get('referenceId');
    referenceType = queryParams.get('referenceType');
    history.replace({
      search: queryParams.toString()
    });
    fetchPurchaseOrder();
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.purchaseOrder]} />
        <ImportExportLinks
          permissions={permissions?.purchaseOrder}
          module="purchase order"
          api={purchaseOrder.api}
          afterImportCompleted={() => {
            fetchPurchaseOrder();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchPurchaseOrder();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-2'}>
              <div className={`flex flex-wrap items-center gap-2 `}>
                {PurchaseOrderType && (
                  <ToggleButtonGroup size="small" className="ml-2" value={PurchaseOrderType[selectedType - 1].key} exclusive onChange={handleFilter}>
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
              <Autocomplete
                style={{ minWidth: '200px', flexGrow: 1 }}
                className="md:max-w-[250px]"
                options={warehouseOptions}
                getOptionLabel={(option: any) => option.optionLabel}
                getOptionSelected={(option: any, val) => option.optionValue === val}
                value={
                  warehouseOptions.filter((data) => data.optionValue === warehouse).length
                    ? warehouseOptions.filter((data) => data.optionValue === warehouse)[0]
                    : ''
                }
                onChange={(e, val) => {
                  dispatch({ type: 'selection', selectedRecords: [] });
                  setWarehouse(val && val.optionValue ? val.optionValue : '');
                }}
                renderInput={(params) => <TextField {...params} margin="none" size="small" name="plant" label="Plant" variant="outlined" fullWidth />}
              />
              {referenceType && <Chip className="ml-3" color="primary" label={`Rental Job : ${referenceType}`} onDelete={updateQueryParams} />}
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
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={handleSearch}
                width="242px"
                size="small"
                value={search}
                style={isMobile ? { flex: 1 } : {}}
              />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.purchaseOrder?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowManagePurchaseOrderDialog({ open: true, isClone: false, idToClone: null });
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
                <HtmlTooltip title="Please select some purchase orders">
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
            refreshGrid={fetchPurchaseOrder}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.purchaseOrder}
            setWholeRowsCellColor={(rowData) => (rowData.deleted ? 'error' : '')}
          />
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
    </section>
  );
};

export default PurchaseOrder;

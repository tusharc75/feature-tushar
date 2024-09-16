import { Box, Checkbox, Chip, FormControlLabel, IconButton, MenuItem, TextField } from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import HistoryIcon from '@material-ui/icons/History';
import InfoIcon from '@material-ui/icons/Info';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import SettingsIcon from '@material-ui/icons/Settings';
import VisibilityOutlinedIcon from '@material-ui/icons/VisibilityOutlined';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { TOOLTIP_MESSAGE, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, productInventory, sidebarResource } from 'src/constants/helpers';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import AddRemoveDialog from './AddRemove';
import HistoryDialog from './History/historyDialog';
import SerialNumberDialog from './SerialNumber/SerialNumberDialog';
import SettingsDialog from './SettingsDialog';
import SoftHoldDialog from './SoftHold';
import axios, { CancelTokenSource } from 'axios';

const InventoryProduct = () => {
  const renderedFrom = camelCase(routes?.productInventory.title);
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [plantId, setPlantId] = useState(null);
  const [plantOptions, setPlantOptions] = useState([]);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);
  const [storageLocationId, setStorageLocationId] = useState(null);
  const [columns, setColumns] = useState(null);
  const [softHold, setSoftHold] = useState({ open: false, data: {} });
  const [showHistory, setShowHistory] = useState({ open: false, product: '', productName: '' });
  const [showSerialNumber, setShowSerialNumber] = useState({ open: false, product: '', productName: '' });
  const [inventory, setInventory] = useState({ open: false, product: [], type: '' });
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [showExpenseItem, setShowExpenseItem] = useState(false);
  const [expenseItemValue, setExpenseItemValue] = useState(false);
  const [fromProductMaster, setFromProductMaster] = useState({
    product: history.location?.state?.product,
    productName: history.location?.state?.productName
  });

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    getPlants();
  }, [selectedEntity]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [
    search,
    plantId,
    storageLocationId,
    page,
    limit,
    filters,
    sorting,
    selectedEntity,
    showFilteredRecordsOnly,
    fromProductMaster,
    expenseItemValue,
    showExpenseItem
  ]);

  const getPlants = () => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse,Storage Location')
      .then(({ data: { data } }) => {
        setPlantOptions([{ optionLabel: 'All', optionValue: 'All' }, ...data.Warehouse]);
        setStorageLocationOptions(data['Storage Location']);
        if (plantId === null && data?.Warehouse.length) {
          setPlantId('All');
        }
      });
  };

  const fetchGridColumns = async () => {
    setColumns(null);

    const productFields = await axiosInstance().get('/field?resource=Product&view=true');
    const productInventoryFields = await axiosInstance().get('/field?resource=Product Inventory&view=true');

    let columns = [];
    productFields?.data?.data?.forEach((o) => {
      if (o.fieldData.fieldName === 'expenseItem') {
        setShowExpenseItem(true);
      }
    });

    let newColumns = generateColumns(renderedFrom, productFields?.data?.data, routes.productDetail.path);
    columns = [...columns, ...newColumns];
    if (!user?.user?.brandPolicy?.hideInventoryCount) {
      let newColumns = generateColumns(renderedFrom, productInventoryFields?.data?.data, routes.productInventory.path);
      newColumns?.forEach((o) => {
        if (!['plant', 'product'].includes(o?.accessor)) {
          if (
            ['minInventory', 'maxInventory'].includes(o.accessor) &&
            productInventoryFields?.data?.data?.find((d) => d?.fieldData?.fieldName === o?.accessor)?.type === 'number'
          ) {
            columns.push({
              ...o,
              disableFilters: true,
              editable: plantId === 'All' ? false : permissions?.productInventory?.isUpdate,
              cell: ({ row }) => <h5 className="text-truncate">{row?.original[o.accessor] || 0}</h5>
            });
          } else if (['inventory'].includes(o?.accessor)) {
            columns.push({
              ...o,
              disableFilters: true,
              cell: ({ row }) => <h5 className="text-truncate">{row?.original[o.accessor] || 0}</h5>
            });
          } else {
            columns.push(o);
          }
        }
      });
    }
    const defaultColumns = [
      ...(!user?.user?.brandPolicy?.hideInventoryCount
        ? [
          {
            accessor: 'availableInventory',
            Header: 'Available Inventory',
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.availableInventory || 0}</h5>
          },
          {
            accessor: 'softHold',
            Header: 'Soft Hold',
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) =>
              row?.original?.softHold ? (
                <div className="flex items-center gap-2">
                  <h5 className="text-truncate">{row?.original?.softHold}</h5>
                  <HtmlTooltip title={`Soft Hold History`}>
                    <InfoIcon className="ml-1 cursor-pointer" fontSize="small" color="primary" onClick={() => infoHandler(row?.original)} />
                  </HtmlTooltip>
                </div>
              ) : (
                <h5 className="text-truncate">0</h5>
              )
          },
          {
            accessor: 'purchaseOrderQty',
            Header: 'On PO',
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.purchaseOrderQty || 0}</h5>
          }
        ]
        : [])
    ];
    setColumns([...columns, ...defaultColumns, ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 150,
    maxWidth: 180,
    width: 150,
    sticky: 'right',
    Cell: ({ row }) => (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <HtmlTooltip
          title={!permissions?.productInventory?.isCreate ? TOOLTIP_MESSAGE.add : row?.original?.plantId === 'All' ? `Select ${routes.warehouse.title}` : 'Add'}
        >
          <span>
            <IconButton
              size="small"
              aria-label="Add"
              disabled={permissions?.productInventory?.isCreate && row?.original?.plantId !== 'All' ? false : true}
              onClick={() => {
                setInventory({ open: true, product: [row?.original], type: 'add' });
              }}
            >
              <AddCircleOutlineIcon
                fontSize="small"
                color={permissions?.productInventory?.isCreate && row?.original?.plantId !== 'All' ? 'primary' : 'disabled'}
              />
            </IconButton>
          </span>
        </HtmlTooltip>
        <Box pl={1}>
          <HtmlTooltip
            title={
              !permissions?.productInventory?.isUpdate
                ? TOOLTIP_MESSAGE.remove
                : row?.original?.plantId === 'All'
                  ? `Select ${routes.warehouse.title}`
                  : user?.user?.brandPolicy?.allowNegativeInventory
                    ? 'Remove'
                    : !row?.original?.availableInventory
                      ? 'Inventory not available'
                      : 'Remove'
            }
          >
            <span>
              <IconButton
                size="small"
                aria-label="Clone"
                disabled={
                  permissions?.productInventory?.isUpdate && row?.original?.plantId !== 'All'
                    ? user?.user?.brandPolicy?.allowNegativeInventory
                      ? false
                      : row?.original?.availableInventory
                        ? false
                        : true
                    : true
                }
                onClick={() => {
                  setInventory({ open: true, product: [row?.original], type: 'remove' });
                }}
              >
                <RemoveCircleOutlineIcon
                  fontSize="small"
                  color={
                    permissions?.productInventory?.isUpdate && row?.original?.plantId !== 'All'
                      ? user?.user?.brandPolicy?.allowNegativeInventory
                        ? 'error'
                        : row?.original?.availableInventory
                          ? 'error'
                          : 'disabled'
                      : 'disabled'
                  }
                />
              </IconButton>
            </span>
          </HtmlTooltip>
        </Box>
        <Box pl={1}>
          <HtmlTooltip title="History">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowHistory({ open: true, product: row?.original?.productId, productName: row?.original?.productName });
              }}
            >
              <HistoryIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        </Box>
        {row?.original?.serializedProduct && (
          <Box pl={1}>
            <HtmlTooltip title="View Serial Number">
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setShowSerialNumber({ open: true, product: row?.original?.productId, productName: row?.original?.productName });
                }}
              >
                <VisibilityOutlinedIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          </Box>
        )}
      </div>
    )
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    if (plantId) {
      const queryString = getQueryString();
      axiosInstance()
        .get(`${productInventory.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data }) => {
          let rows = data.data?.map((u) => {
            let finalObject: any = prepareDataForGrid(u);
            finalObject['productId'] = u._id;
            finalObject['plantId'] = plantId;
            finalObject['availableInventory'] = (u?.inventory || 0) - (u?.softHold || 0);
            if (finalObject['availableInventory'] < 0 && u?.inventory) {
              finalObject['availableInventory'] = 0;
            }
            return {
              ...finalObject
            };
          });
          dispatch({ type: 'initialize', data: rows, count: data.count });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        })
        .finally(() => {
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getQueryString = (isExport = false) => {
    let tempPlantId =
      plantId === 'All'
        ? plantOptions
          .filter((d) => d.optionValue !== 'All')
          .map((d) => d.optionValue)
          .toString()
        : plantId;

    let deepFilter = `?warehouse=${tempPlantId}&page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?warehouse=${tempPlantId}`;
    }

    if (storageLocationId) {
      deepFilter = `${deepFilter}&storageLocation=${storageLocationId}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (fromProductMaster?.product) {
      filterByIds.push({ field: '_id', term: fromProductMaster.product });
    }

    if (!user?.user?.brandPolicy?.showSerializedProduct) {
      deepFilters.push({ field: 'serializedProduct', term: 'No' });
    }

    if (showExpenseItem) {
      deepFilters.push({ field: 'expenseItem', term: expenseItemValue ? 'Yes' : 'No' });
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

  const onSaveEdit = (data, row) => {
    let inputData = {
      plant: plantId,
      product: row?.productId,
      inventory: row?.inventory,
      minInventory: data?.minInventory && parseInt(data?.minInventory),
      maxInventory: data?.maxInventory && parseInt(data?.maxInventory)
    };
    axiosInstance()
      .put(`${productInventory.api}`, inputData)
      .then((res) => {
        fetchData();
      });
  };

  const infoHandler = (data) => {
    setSoftHold({ open: true, data: data });
  };

  const checkReport = () => {
    const products = selectedRecords?.map((e) => e._id);
    let api = `${productInventory.api}/automation`;
    if (products?.length) {
      api = api + `?products=${products?.toString()}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data }) => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleRemap = () => {
    const products = selectedRecords?.map((e) => e._id);
    if (products?.length) {
      axiosInstance()
        .put(`${productInventory.api}/re-map/ledger-remap`, { products, warehouse: plantId })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleRemapPurchaseOrder = () => {
    const products = selectedRecords?.map((e) => e._id);
    if (products?.length) {
      axiosInstance()
        .put(`${productInventory.api}/re-map/purchase-order-remap`, { products, warehouse: plantId })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const RightSideContents = () => {
    return (
      <>
        {user?.role?.selectedEntity?.policy?.isProductInventorySettings ? (
          <HtmlTooltip title={plantId === 'All' ? `Select ${routes.warehouse.title}` : 'Setting'}>
            <span>
              <IconButton
                size="small"
                disabled={plantId !== 'All' ? false : true}
                onClick={() => {
                  setSettingDialogOpen(true);
                }}
              >
                <SettingsIcon color={plantId === 'All' ? 'disabled' : 'primary'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : null}
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.productInventory]} />
        <ImportExportLinks
          additionalParams={getQueryString(true)}
          permissions={{ isCreate: permissions?.productInventory?.isCreate && plantId !== 'All' }}
          module="product inventory"
          api={productInventory.api}
          afterImportCompleted={() => {
            fetchData();
          }}
          isDownloadExcel={true}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          leftSideContents={
            <LeftSideContents
              {...{
                plantOptions,
                plantId,
                setPlantId,
                setStorageLocationId,
                user,
                storageLocationOptions,
                storageLocationId,
                showExpenseItem,
                expenseItemValue,
                setExpenseItemValue,
                fromProductMaster,
                setFromProductMaster
              }}
            />
          }
          searchValue={search}
          onSearch={handleSearch}
          rightSideContents={<RightSideContents />}
          isActionButtonVisible
          actionButtonProps={{ disabled: selectedRecords?.length && plantId !== 'All' ? false : true }}
          actionMenuItems={
            <ActionMenuItems {...{ permissions, setInventory, selectedRecords, plantId, checkReport, handleRemap, handleRemapPurchaseOrder }} />
          }
          isAddButtonVisible={false}
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
            onSaveEdit={onSaveEdit}
            resource={sidebarResource.product}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {softHold.open && (
        <SoftHoldDialog
          close={() => setSoftHold({ open: false, data: {} })}
          data={softHold.data}
          warehouse={
            plantId === 'All'
              ? plantOptions
                .filter((d) => d.optionValue !== 'All')
                .map((d) => d.optionValue)
                .toString()
              : plantId
          }
        />
      )}

      {showHistory.open && (
        <HistoryDialog
          close={() => {
            setShowHistory({ open: false, product: '', productName: '' });
            fetchData();
          }}
          product={showHistory.product}
          warehouse={
            plantId === 'All'
              ? plantOptions
                .filter((d) => d.optionValue !== 'All')
                .map((d) => d.optionValue)
                .toString()
              : plantId
          }
          storageLocation={storageLocationId}
          productName={showHistory.productName}
        />
      )}

      {showSerialNumber.open && (
        <SerialNumberDialog
          close={() => setShowSerialNumber({ open: false, product: '', productName: '' })}
          product={showSerialNumber.product}
          productName={showSerialNumber.productName}
          warehouse={
            plantId === 'All'
              ? plantOptions
                .filter((d) => d.optionValue !== 'All')
                .map((d) => d.optionValue)
                .toString()
              : plantId
          }
        />
      )}

      {inventory.open && (
        <AddRemoveDialog
          handleClose={() => setInventory({ open: false, product: [], type: '' })}
          handleSuccess={() => {
            dispatch({ type: 'selection', selectedRecords: [] });
            fetchData();
            setInventory({ open: false, product: [], type: '' });
          }}
          product={inventory.product}
          type={inventory.type}
          warehouse={plantId}
          storageLocation={storageLocationId}
        />
      )}

      {settingDialogOpen && <SettingsDialog warehouse={plantId} onClose={() => setSettingDialogOpen(false)} />}
    </section>
  );
};

export default InventoryProduct;

const LeftSideContents = ({
  plantOptions,
  plantId,
  setPlantId,
  setStorageLocationId,
  user,
  storageLocationOptions,
  storageLocationId,
  showExpenseItem,
  expenseItemValue,
  setExpenseItemValue,
  fromProductMaster,
  setFromProductMaster
}) => {
  return (
    <>
      <Autocomplete
        style={{ minWidth: '200px', flexGrow: 1 }}
        className="md:max-w-[250px]"
        options={plantOptions}
        getOptionLabel={(option: any) => option.optionLabel}
        disableClearable
        getOptionSelected={(option: any, val) => option.optionValue === val}
        value={
          plantOptions.filter((data) => data.optionValue === plantId).length ? plantOptions.filter((data) => data.optionValue === plantId)[0] : ''
        }
        onChange={(e, val) => {
          if (val !== null) {
            setPlantId(val && val.optionValue ? val.optionValue : '');
            setStorageLocationId(null);
          }
        }}
        size="small"
        renderInput={(params) => (
          <TextField {...params} margin="none" size="small" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
        )}
      />
      {user?.user?.brandPolicy?.storageLocation && (
        <Autocomplete
          style={{ minWidth: '200px', flexGrow: 1 }}
          className="md:max-w-[250px]"
          options={storageLocationOptions.filter((item) => item.warehouse === plantId)}
          getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
          getOptionSelected={(option: any, val) => option.optionValue === val}
          value={
            storageLocationOptions.filter((data) => data.optionValue === storageLocationId).length
              ? storageLocationOptions.filter((data) => data.optionValue === storageLocationId)[0]
              : ''
          }
          onChange={(e, val) => {
            setStorageLocationId(val?.optionValue);
          }}
          size="small"
          renderInput={(params) => (
            <TextField {...params} margin="none" size="small" name="storageLocation" label="Storage Location" variant="outlined" fullWidth />
          )}
        />
      )}
      {showExpenseItem && (
        <FormControlLabel
          style={{ margin: 0 }}
          control={
            <Checkbox
              checked={expenseItemValue}
              onChange={(e) => {
                setExpenseItemValue(e.target.checked);
              }}
              name="expenseItem"
              color="primary"
            />
          }
          label="Expense Item"
        />
      )}
      {fromProductMaster?.product && (
        <Chip
          className="ml-3"
          color="primary"
          label={`Product : ${fromProductMaster?.productName}`}
          onDelete={() => {
            setFromProductMaster(null);
          }}
        />
      )}
    </>
  );
};

const ActionMenuItems = ({ permissions, setInventory, selectedRecords, plantId, checkReport, handleRemap, handleRemapPurchaseOrder }) => {
  return (
    <>
      <MenuItem
        disabled={permissions?.productInventory?.isCreate ? false : true}
        onClick={() => {
          setInventory({ open: true, product: selectedRecords, type: 'add' });
        }}
      >
        Add
      </MenuItem>
      <MenuItem
        disabled={permissions?.productInventory?.isUpdate ? false : true}
        onClick={() => {
          setInventory({ open: true, product: selectedRecords, type: 'remove' });
        }}
      >
        Remove
      </MenuItem>
      <MenuItem
        disabled={permissions?.productInventory?.isUpdate && plantId !== 'All' ? false : true}
        style={{ display: 'none' }}
        onClick={() => {
          checkReport();
        }}
      >
        Check Report
      </MenuItem>
      <MenuItem
        disabled={permissions?.productInventory?.isUpdate && plantId !== 'All' ? false : true}
        style={{ display: 'none' }}
        onClick={() => {
          handleRemap();
        }}
      >
        Remap
      </MenuItem>
      <MenuItem
        disabled={permissions?.productInventory?.isUpdate && plantId !== 'All' ? false : true}
        style={{ display: 'none' }}
        onClick={() => {
          handleRemapPurchaseOrder();
        }}
      >
        Remap Purchase Order
      </MenuItem>
    </>
  );
};

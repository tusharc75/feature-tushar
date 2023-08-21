import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Grid, IconButton, Tooltip, Button, Menu, MenuItem } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, TextField } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import {
  isObjectEmpty,
  gridLoadingTimeout,
  getLocalStorageArrayData,
  removeLocalStorage,
  convertInventory,
  sidebarResource
} from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { prepareDataForGrid } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import InventoryToAsset from './InventoryToAsset';
import { ExpandMore } from '@material-ui/icons';
import { SiConvertio } from 'react-icons/si';
import CachedIcon from '@material-ui/icons/Cached';

const ConvertInventory = () => {
  const renderedFrom = camelCase(routes?.inventoryToAsset.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const [warehouseId, setWarehouseId] = useState(null);
  const [storageLocationId, setStorageLocationId] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);

  const [frameworkComponents, setFrameworkComponents] = useState({});
  const [columns, setColumns] = useState([]);
  const [inventory, setInventory] = useState({ open: false, product: [] });

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const { getColumnData } = useColumns();

  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    getWarehouse();
  }, [selectedEntity]);

  const getWarehouse = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.warehouse},${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.warehouse]) {
          setWarehouseOptions(data[sidebarResource.warehouse]);
          if (warehouseId === null && data[sidebarResource.warehouse].length) {
            setWarehouseId(data[sidebarResource.warehouse][0].optionValue);
          }
        }
        if (data[sidebarResource.storageLocation]) {
          setStorageLocationOptions(data[sidebarResource.storageLocation]);
        }
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (warehouseId) {
      fetchProductInventory();
    }
  }, [warehouseId, page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, storageLocationId]);

  const fetchGridColumns = async () => {
    setColumns(null);
    const productFields = await axiosInstance().get('/field?resource=Product&view=true');
    let columns = [];
    let rendererNames = [];
    productFields?.data?.data?.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
      }
    });
    columns?.forEach((e) => {
      if (!['productName', 'serializedProduct'].includes(e.field)) {
        e.show = false;
      }
    });
    columns.push({ field: 'availableInventory', headerName: 'Available Inventory', show: true, cellRenderer: 'commonRenderer' });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    setFrameworkComponents({
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer
    });
    setColumns(columns);
  };

  const fetchProductInventory = () => {
    if (!warehouseId) {
      dispatch({ type: 'initialize', data: [], count: 0 });
      return;
    }
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    if (warehouseId) {
      const queryString = getQueryString();
      axiosInstance()
        .get(`${convertInventory.api}${queryString}`)
        .then(({ data }) => {
          let rows = data.data?.map((u) => {
            let finalObject = prepareDataForGrid(u);
            finalObject['productId'] = u._id;
            finalObject['warehouseId'] = warehouseId;
            finalObject['availableInventory'] = (u?.inventory || 0) - (u?.softHold || 0);
            return {
              ...finalObject
            };
          });
          dispatch({ type: 'initialize', data: rows, count: data.count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          dispatch({ type: 'loading', loading: false });
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const getQueryString = () => {
    let deepFilter = '';
    deepFilter = `?warehouse=${warehouseId}`;
    deepFilter = deepFilter + `&page=${page}&limit=${limit}`;
    if (storageLocationId) {
      deepFilter = `${deepFilter}&storageLocation=${storageLocationId}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}`;
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
    return `${deepFilter}&filterType=and`;
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.inventoryToAsset?.isUpdate && (
        <Fragment>
          <Box pl={1}>
            <Tooltip title="Convert Inventory">
              <IconButton
                size="small"
                aria-label="Clone"
                disabled={params?.data?.availableInventory ? false : true}
                onClick={() => {
                  setInventory({ open: true, product: [params?.data] });
                }}
              >
                <CachedIcon fontSize="small" color="secondary" />
              </IconButton>
            </Tooltip>
          </Box>
        </Fragment>
      )}
    </>
  );

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.inventoryToAsset]} />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className={'d-flex flex-wrap align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                {/* <SiConvertio size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.inventoryToAsset?.title} </span> */}
              </div>
              <Autocomplete
                style={{ minWidth: '200px', flexGrow: 1 }}
                className="md:max-w-[250px]"
                options={warehouseOptions}
                getOptionLabel={(option: any) => option.optionLabel}
                disableClearable
                getOptionSelected={(option: any, val) => option.optionValue === val}
                value={
                  warehouseOptions.filter((data) => data.optionValue === warehouseId).length
                    ? warehouseOptions.filter((data) => data.optionValue === warehouseId)[0]
                    : ''
                }
                onChange={(e, val) => {
                  if (val !== null) {
                    setWarehouseId(val && val.optionValue ? val.optionValue : '');
                    setStorageLocationId(null);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} margin="none" size="small" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
                )}
              />
              {user?.user?.brandPolicy?.storageLocation && (
                <Autocomplete
                  style={{ minWidth: '200px', flexGrow: 1 }}
                  className="md:max-w-[250px]"
                  options={storageLocationOptions.filter((item) => item.warehouse === warehouseId)}
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
                  renderInput={(params) => (
                    <TextField {...params} margin="none" size="small" name="storageLocation" label="Storage Location" variant="outlined" fullWidth />
                  )}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.inventoryToAsset?.isUpdate ? (
                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length ? false : true}
                      className={`${isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn} new-dropdown-v1`}
                      onClick={openActions}
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
                        onClick={() => {
                          closeActions();
                          setInventory({
                            open: true,
                            product: getLocalStorageArrayData(`${localStorageSelectedRecords}`)
                          });
                        }}
                      >
                        Convert
                      </MenuItem>
                    </Menu>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {columns && warehouseId ? (
          Object.keys(frameworkComponents).length > 0 ? (
            <CustomAgGrid
              allowSelection={true}
              allowAction={true}
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponents}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={150}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchProductInventory}
              showOnlyShowFilteredRecordSwitch={true}
            />
          ) : null
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {inventory.open && (
          <InventoryToAsset
            handleClose={() => setInventory({ open: false, product: [] })}
            handleSuccess={() => {
              removeLocalStorage(localStorageSelectedRecords);
              fetchProductInventory();
              setInventory({ open: false, product: [] });
            }}
            product={inventory.product}
            warehouse={warehouseId}
            storageLocation={storageLocationId}
          />
        )}
      </div>
    </Fragment>
  );
};

export default ConvertInventory;

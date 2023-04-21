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
import { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { isObjectEmpty, gridLoadingTimeout, getLocalStorageArrayData, removeLocalStorage, convertInventory } from 'src/constants/helpers';
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
  const [plantId, setPlantId] = useState(null);
  const [plantOptions, setPlantOptions] = useState([]);
  const [frameworkComponents, setFrameworkComponents] = useState({});
  const [columns, setColumns] = useState([]);
  const [inventory, setInventory] = useState({ open: false, product: [] });
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);
  const [storageLocationId, setStorageLocationId] = useState(null);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const { getColumnData } = useColumns();

  const [anchorEl, setAnchorEl] = useState(null);

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
    getPlants();
  }, [selectedEntity]);

  useEffect(() => {
    plantId && storageLocationId && fetchProductInventory();
  }, [plantId, page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, storageLocationId]);

  const getPlants = () => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse,Storage Location')
      .then(({ data: { data } }) => {
        setPlantOptions([...data.Warehouse]);
        setStorageLocationOptions(data['Storage Location']);
        if (plantId === null && data?.Warehouse.length) {
          setPlantId([...data.Warehouse][0].optionValue);
        }
      });
  };

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
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    if (plantId) {
      const queryString = getQueryString();
      axiosInstance()
        .get(`${convertInventory.api}${queryString}`)
        .then(({ data }) => {
          let rows = data.data?.map((u) => {
            let finalObject = prepareDataForGrid(u);
            finalObject['productId'] = u._id;
            finalObject['plantId'] = plantId;
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

  const getQueryString = (isExport = false) => {
    let tempPlantId = plantId;

    let deepFilter = '';
    if (!isExport) {
      deepFilter = `?wareHouse=${tempPlantId}`;
      deepFilter = deepFilter + `&page=${page}&limit=${limit}`;
    } else {
      deepFilter = `&wareHouse=${tempPlantId}`;
    }

    if (storageLocationId) {
      deepFilter = `${deepFilter}&storageLocation=${storageLocationId}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
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

  const onCellValueChanged = (row) => {
    let inputData = {
      plant: plantId,
      product: row?.data?.productId
    };
    axiosInstance().put(`${convertInventory.api}`, inputData);
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

  const replaceFieldName = (field) => {
    switch (field) {
      case 'productName':
        return 'productName';
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
          <CustomBreadCrumbs routes={[routes.inventoryToAsset]} />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} sm={12} md={6} className="d-flex align-items-center gap-1">
              <div className="d-flex align-items-center">
                <SiConvertio size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.inventoryToAsset?.title} </span>
              </div>
              <Autocomplete
                style={{ width: '250px' }}
                options={plantOptions}
                getOptionLabel={(option: any) => option.optionLabel}
                disableClearable
                getOptionSelected={(option: any, val) => option.optionValue === val}
                value={
                  plantOptions.filter((data) => data.optionValue === plantId).length
                    ? plantOptions.filter((data) => data.optionValue === plantId)[0]
                    : ''
                }
                onChange={(e, val) => {
                  if (val !== null) {
                    setPlantId(val && val.optionValue ? val.optionValue : '');
                  }
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
              {user?.user?.brandPolicy?.storageLocation && (
                <Autocomplete
                  style={{ width: '250px' }}
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
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField
                        {...params}
                        margin="dense"
                        name="storageLocation"
                        placeholder="Storage Location"
                        variant="standard"
                        fullWidth
                        className={isMobile ? 'serchBox' : ''}
                      />
                    ) : (
                      <TextField {...params} margin="dense" name="storageLocation" label="Storage Location" variant="outlined" fullWidth />
                    )
                  }
                />
              )}
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={`${styles.filter_side} align-items-center`}>
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
              </Box>
              {permissions?.inventoryToAsset?.isUpdate ? (
                <Box ml={1}>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="default"
                    size="small"
                    disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length ? false : true}
                    className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                    onClick={openActions}
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
                </Box>
              ) : null}
            </Grid>
          </Grid>
        </div>
        {columns && plantId ? (
          Object.keys(frameworkComponents).length > 0 ? (
            <CustomAgGridEditable
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
              onCellValueChanged={onCellValueChanged}
              actionWidth={150}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchProductInventory}
              showOnlyShowFilteredRecordSwitch={true}
            />
          ) : null
        ) : (
          <Box p={2} height={500} bgcolor="white">
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
            warehouse={plantId}
            storageLocationId={storageLocationId}
          />
        )}
      </div>
    </Fragment>
  );
};

export default ConvertInventory;

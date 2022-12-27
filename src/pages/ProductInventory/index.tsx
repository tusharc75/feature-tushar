import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Grid, IconButton, Tooltip, Button, Menu, MenuItem, Chip } from "@material-ui/core";
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { GiStockpiles } from 'react-icons/gi';
import { Box, TextField } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { isObjectEmpty, gridLoadingTimeout, productInventory, getLocalStorageArrayData, removeLocalStorage } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { prepareDataForGrid } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { Autocomplete } from '@material-ui/lab';
import InfoIcon from '@material-ui/icons/Info';
import SoftHoldDialog from './SoftHold';
import HistoryDialog from './History/historyDialog';
import SerialNumberDialog from './SerialNumber/SerialNumberDialog';
import { camelCase } from 'lodash';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import HtmlTooltip from "../../components/CustomTooltipTitle";
import NoDataCell from "../../components/Helpers/NoDataCell";
import HistoryIcon from '@material-ui/icons/History';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import AddRemoveDialog from './AddRemove';
import { ExpandMore } from '@material-ui/icons';
import VisibilityOutlinedIcon from '@material-ui/icons/VisibilityOutlined';
import { useHistory } from 'react-router-dom';
import { NumberRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';

let searchTimeout;

const InventoryProduct = () => {

  const renderedFrom = camelCase(routes?.productInventory.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, showFilteredRecordsOnly } =
    state;
  const [plantId, setPlantId] = useState(null);
  const [plantOptions, setPlantOptions] = useState([]);
  const [frameworkComponents, setFrameworkComponents] = useState({});
  const [columns, setColumns] = useState(null);

  const [softHold, setSoftHold] = useState({ open: false, data: {} });
  const [showHistory, setShowHistory] = useState({ open: false, product: "", productName: "" });
  const [showSerialNumber, setShowSerialNumber] = useState({ open: false, product: "", productName: "" });

  const [inventory, setInventory] = useState({ open: false, product: [], type: "" });

  const { state: { user, permissions, selectedEntity } }: any = useData();

  const history = useHistory();

  const [fromProductMaster, setFromProductMaster] = useState({
    product: history.location?.state?.product,
    productName: history.location?.state?.productName,
  });

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
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchProductInventory();
    }, millisec);
  }, [plantId, page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, fromProductMaster]);

  const getPlants = () => {
    axiosInstance()
      .get(`/warehouse`)
      .then(({ data: { data } }) => {
        setPlantOptions([{ "warehouseName": "All", "_id": "All" }, ...data]);
        if (plantId === null && data?.length) {
          setPlantId("All");
        }
      });
  };

  const fetchGridColumns = async () => {
    setColumns(null)

    const productFields = await axiosInstance().get("/field?resource=Product&view=true");
    const productInventoryFields = await axiosInstance().get("/field?resource=Product Inventory&view=true");

    let columns = []
    let rendererNames = []

    productFields?.data?.data?.forEach(o => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path)
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData]
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName)
        }
      }
    })

    columns?.forEach((e) => {
      if (!["productName", "serializedProduct"].includes(e.field)) {
        e.show = false
      }
    })

    productInventoryFields?.data?.data?.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productInventory.path);
      if (currentColumn !== null) {
        if (!['plant', 'product'].includes(currentColumn?.columnData.field)) {
          if (o.fieldData.type === 'number' && ['minInventory', 'maxInventory'].includes(o.fieldData.fieldName)) {
            columns.push({
              ...currentColumn?.columnData,
              cellEditor: 'numericCellEditor',
              cellRenderer: 'numberRenderer',
              filter: false,
              editable: plantId === "All" ? false : permissions?.productInventory?.isUpdate
            });
          }
          else if (['inventory'].includes(currentColumn?.columnData.field)) {
            columns.push({
              ...currentColumn?.columnData,
              cellRenderer: 'numberRenderer',
              filter: false,
            });
          }
          else {
            columns.push(currentColumn?.columnData);
          }
        }
      }
    });

    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
    setFrameworkComponents({ ...tempFrameworkComponent, softHoldRenderer: SoftHoldRenderer, numberRenderer: NumberRenderer, actionsRenderer: ActionsRenderer })

    const defaultColumns = [
      { field: 'softHold', headerName: 'Soft Hold', filter: false, sortable: false, show: true, cellRenderer: 'softHoldRenderer' },
      { field: 'availableInventory', headerName: 'Available Inventory', filter: false, sortable: false, show: true, cellRenderer: 'numberRenderer' },
      { field: 'purchaseOrderQty', headerName: 'On PO', filter: false, sortable: false, show: true, cellRenderer: 'numberRenderer' }
    ];

    setColumns([...columns, ...defaultColumns])
  }

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    if (plantId) {
      const queryString = getQueryString();
      axiosInstance()
        .get(`${productInventory.api}${queryString}`)
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
    let tempPlantId = plantId === "All" ? plantOptions.filter(d => d._id !== "All").map(d => d._id).toString() : plantId

    let deepFilter = "";
    if (!isExport) {
      deepFilter = `?wareHouse=${tempPlantId}`
      deepFilter = deepFilter + `&page=${page}&limit=${limit}`;
    }
    else {
      deepFilter = `&wareHouse=${tempPlantId}`
    }

    let filterById = [];
    if (fromProductMaster?.product) {
      filterById.push({ field: '_id', term: fromProductMaster.product });
    }
    if (filterById.length > 0) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;
    }

    //const updatedFilters = [{ field: "serializedProduct", term: "No" }];
    const updatedFilters = [];
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
    }
    if (updatedFilters?.length) {
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
      product: row?.data?.productId,
      inventory: row?.data?.inventory,
      minInventory: row?.data?.minInventory,
      maxInventory: row?.data?.maxInventory
    };
    axiosInstance().put(`${productInventory.api}`, inputData);
  };

  const infoHandler = (params) => {
    setSoftHold({ open: true, data: params.data });
  };

  const SoftHoldRenderer = (params) => (
    <> {params.value ? (
      <Fragment>
        {params.value}
        <HtmlTooltip title={`Soft Hold History`}>
          <InfoIcon className="ml-1 cursor-pointer" fontSize="small" color="primary" onClick={() => infoHandler(params)} />
        </HtmlTooltip>
      </Fragment>
    ) : 0}
    </>
  );

  const ActionsRenderer = (params) => (
    <>
      {(params?.data?.plantId !== "All") &&
        <Fragment>
          {permissions?.productInventory?.isCreate ?
            <Box>
              <Tooltip title="Add">
                <IconButton
                  size="small"
                  aria-label="Clone"
                  onClick={() => {
                    setInventory({ open: true, product: [params?.data], type: 'add' })
                  }}
                >
                  <AddCircleOutlineIcon fontSize="small" color="secondary" />
                </IconButton>
              </Tooltip>
            </Box> : null}
          {permissions?.productInventory?.isUpdate ?
            <Box pl={1}>
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  aria-label="Clone"
                  disabled={params?.data?.availableInventory ? false : true}
                  onClick={() => {
                    setInventory({ open: true, product: [params?.data], type: 'remove' })
                  }}
                >
                  <RemoveCircleOutlineIcon fontSize="small" color={params?.data?.availableInventory ? "error" : "disabled"} />
                </IconButton>
              </Tooltip>
            </Box> : null}
        </Fragment>
      }
      <Box pl={1}>
        <Tooltip title="History">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowHistory({ open: true, product: params?.data?.productId, productName: params?.data?.productName })
            }}
          >
            <HistoryIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      </Box>
      {params?.data?.serializedProduct &&
        <Box pl={1}>
          <Tooltip title="View Serial Number">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowSerialNumber({ open: true, product: params?.data?.productId, productName: params?.data?.productName })
              }}
            >
              <VisibilityOutlinedIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      }
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

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState && columns) {
    columns?.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.productInventory]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            additionalParams={getQueryString(true)}
            permissions={{ isCreate: permissions?.productInventory?.isCreate && plantId !== "All" }}
            module="product inventory"
            api={productInventory.api}
            afterImportCompleted={() => {
              fetchProductInventory();
            }}
            isDownloadExcel={true}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
            ids={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchProductInventory();
            }}
          />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} sm={12} md={6} className="d-flex align-items-center gap-1">
              <div className="d-flex align-items-center">
                <GiStockpiles size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.productInventory?.title} </span>
              </div>
              <Autocomplete
                style={{ width: '250px' }}
                options={plantOptions}
                getOptionLabel={(option: any) => option.warehouseName}
                disableClearable
                getOptionSelected={(option: any, val) => option._id === val}
                value={plantOptions.filter((data) => data._id === plantId).length ? plantOptions.filter((data) => data._id === plantId)[0] : ''}
                onChange={(e, val) => {
                  if (val !== null) {
                    setPlantId(val && val._id ? val._id : '');
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
              {permissions?.productInventory?.isUpdate ?
                <Box ml={1}>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="default"
                    size="small"
                    disabled={(getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length && plantId !== "All") ? false : true}
                    className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                    onClick={openActions}
                    aria-controls="action-menu"
                  >
                    {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
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
                      disabled={permissions?.productInventory?.isCreate ? false : true}
                      onClick={() => {
                        closeActions()
                        setInventory({ open: true, product: getLocalStorageArrayData(`${localStorageSelectedRecords}`), type: "add" })
                      }}
                    >
                      Add
                    </MenuItem>
                    <MenuItem
                      disabled={permissions?.productInventory?.isUpdate ? false : true}
                      onClick={() => {
                        closeActions()
                        setInventory({ open: true, product: getLocalStorageArrayData(`${localStorageSelectedRecords}`), type: "remove" })
                      }}
                    >
                      Remove
                    </MenuItem>
                  </Menu>
                </Box>
                : null}
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
              loading={loading}
              actionWidth={180}
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
        {softHold.open &&
          <SoftHoldDialog
            close={() => setSoftHold({ open: false, data: {} })}
            data={softHold.data}
            warehouse={plantId === "All" ? plantOptions.filter(d => d._id !== "All").map(d => d._id).toString() : plantId}
          />}

        {showHistory.open &&
          <HistoryDialog
            close={() => setShowHistory({ open: false, product: "", productName: "" })}
            product={showHistory.product}
            warehouse={plantId === "All" ? plantOptions.filter(d => d._id !== "All").map(d => d._id).toString() : plantId}
            productName={showHistory.productName}
          />}

        {showSerialNumber.open &&
          <SerialNumberDialog
            close={() => setShowSerialNumber({ open: false, product: "", productName: "" })}
            product={showSerialNumber.product}
            productName={showSerialNumber.productName}
            warehouse={plantId === "All" ? plantOptions.filter(d => d._id !== "All").map(d => d._id).toString() : plantId}
          />}
        {inventory.open &&
          <AddRemoveDialog
            handleClose={() =>
              setInventory({ open: false, product: [], type: "" })
            }
            handleSuccess={() => {
              removeLocalStorage(localStorageSelectedRecords)
              fetchProductInventory()
              setInventory({ open: false, product: [], type: "" })
            }}
            product={inventory.product}
            type={inventory.type}
            warehouse={plantId}
          />}
      </div>
    </Fragment>
  );
};

export default InventoryProduct;

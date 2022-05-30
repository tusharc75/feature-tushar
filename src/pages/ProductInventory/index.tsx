import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Grid, IconButton, Tooltip } from "@material-ui/core";
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
import { isObjectEmpty, gridLoadingTimeout, productInventory } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { prepareDataForGrid } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { Autocomplete } from '@material-ui/lab';
import InfoIcon from '@material-ui/icons/Info';
import SoftHoldDialog from './SoftHold';
import HistoryDialog from './History/historyDialog';
import { camelCase } from 'lodash';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import HtmlTooltip from "../../components/CustomTooltipTitle";
import NoDataCell from "../../components/Helpers/NoDataCell";
import HistoryIcon from '@material-ui/icons/History';
import { CheckboxRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import AddRemoveDialog from './AddRemove';


const InventoryProduct = () => {

  const renderedFrom = camelCase(routes?.productInventory.title);
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

  const [softHold, setSoftHold] = useState({ open: false, data: {} });
  const [showHistory, setShowHistory] = useState({ open: false, product: "" });
  const [inventory, setInventory] = useState({ open: false, product: [], type: "" });

  const { state: { user, permissions, selectedEntity } }: any = useData();

  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, [plantId]);


  useEffect(() => {
    getPlants();
    fetchProductInventory();
  }, [plantId, page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const getPlants = () => {
    axiosInstance()
      .get(`/warehouse`)
      .then(({ data: { data } }) => {
        setPlantOptions([{ "warehouseName": "All", "_id": "All" }, ...data]);
        if (plantId === null && data?.length) {
          setPlantId(data[0]._id);
        }
      });
  };

  const extraColumn = [
    { field: 'serializedProduct', headerName: 'Serialized Product', show: true, cellRenderer: 'checkboxRenderer' },
    { field: 'softHold', headerName: 'Soft Hold', show: true, cellRenderer: 'softHoldRenderer' },
    { field: 'availableInventory', headerName: 'Available Inventory', show: true, cellRenderer: 'commonRenderer' }
  ];

  const fetchGridColumns = () => {
    setColumns(null)
    axiosInstance()
      .get('/field?resource=Product Inventory')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productInventory.path);
          if (currentColumn !== null) {
            if (currentColumn?.columnData.field !== 'plant') {
              if (o.fieldData.type === 'number' && ['minInventory', 'maxInventory'].includes(o.fieldData.fieldName)) {
                columns.push({
                  ...currentColumn?.columnData,
                  cellEditor: 'numericCellEditor',
                  editable: plantId === "All" ? false : permissions?.productInventory?.isUpdate
                });
              } else if (o.fieldData.fieldName === 'product') {
                columns.push({
                  ...currentColumn?.columnData,
                  field: 'productName',
                  headerName: o.fieldData.fieldLabel,
                  cellRenderer: 'productNameRenderer',
                  primaryField: true
                });
              } else {
                columns.push(currentColumn?.columnData);
              }
            }
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              if (currentColumn?.columnData.field === 'product') {
                rendererNames.push('productNameRenderer');
              } else {
                rendererNames.push(currentColumn?.rendererName);
              }
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        setFrameworkComponents({
          ...tempFrameworkComponent,
          productNameRenderer: ProductNameRenderer,
          softHoldRenderer: SoftHoldRenderer,
          checkboxRenderer: CheckboxRenderer,
          actionsRenderer: ActionsRenderer
        });
        setColumns([...columns, ...extraColumn]);
      });
  };

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

  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`/product/detail/${params.data._id}`}>
      {params.value}
    </Link>
  );

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
    ) : <NoDataCell />}
    </>
  );

  const ActionsRenderer = (params) => (
    <>
      {(permissions?.productInventory?.isUpdate && plantId !== "All") &&
        <Fragment>
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
          </Box>
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
          </Box>
        </Fragment>
      }
      <Box pl={1}>
        <Tooltip title="History">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowHistory({ open: true, product: params?.data?.productId })
            }}
          >
            <HistoryIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      </Box>
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
            isDownloadExcel={false}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
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
              <>
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
              </>
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
        {softHold.open &&
          <SoftHoldDialog
            close={() => setSoftHold({ open: false, data: {} })}
            data={softHold.data}
            warehouse={plantId === "All" ? plantOptions.filter(d => d._id !== "All").map(d => d._id).toString() : plantId}
          />}

        {showHistory.open &&
          <HistoryDialog
            close={() => setShowHistory({ open: false, product: "" })}
            product={showHistory.product}
            warehouse={plantId === "All" ? plantOptions.filter(d => d._id !== "All").map(d => d._id).toString() : plantId}
          />}
        {inventory.open &&
          <AddRemoveDialog
            handleClose={() =>
              setInventory({ open: false, product: [], type: "" })
            }
            handleSuccess={() => {
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

import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { GiStockpiles } from 'react-icons/gi';
import { Box, TextField, IconButton } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import { serializedAsset, isObjectEmpty, gridLoadingTimeout, productInventory } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { prepareDataForGrid } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { Autocomplete } from '@material-ui/lab';
import InfoIcon from '@material-ui/icons/Info';
import Tooltip from '@material-ui/core/Tooltip';
import SoftHoldDialog from './SoftHold/SoftHoldDialog';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { camelCase } from 'lodash';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';


const InventoryProduct = () => {
  const renderedFrom = camelCase(routes?.productInventory.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [plantId, setPlantId] = useState(null);
  const [softHold, setSoftHold] = useState(false);
  const [plantOptions, setPlantOptions] = useState([]);
  const [frameworkComponents, setFrameworkComponents] = useState({});
  const [columns, setColumns] = useState([]);
  const [softHoldData, setSoftHoldData] = useState(null);
  const {
    state: { permissions }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    getPlants();
    fetchProductInventory();
  }, [plantId, page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const getPlants = () => {
    axiosInstance()
      .get(`/warehouse?noEntityWise=1`)
      .then(({ data: { data } }) => {
        setPlantOptions(data);
        if (plantId === null && data?.length) {
          setPlantId(data[0]._id);
        }
      });
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const extraColumn = [
    { field: 'softHold', headerName: 'Soft Hold', show: true, cellRenderer: 'softHoldRenderer' },
    { field: 'availableInventory', headerName: 'Available Inventory', show: true, cellRenderer: 'commonRenderer' }
  ];

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Product Inventory')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productInventory.path);
          if (currentColumn !== null) {
            if (currentColumn?.columnData.field !== 'plant') {
              if (o.fieldData.type === 'number' && ['inventory', 'minInventory', 'maxInventory'].includes(o.fieldData.fieldName)) {
                columns.push({
                  ...currentColumn?.columnData,
                  cellEditor: 'numericCellEditor',
                  editable: permissions?.productInventory?.isUpdate
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
        setFrameworkComponents({ ...tempFrameworkComponent, productNameRenderer: ProductNameRenderer, softHoldRenderer: SoftHoldRenderer });
        setColumns([...columns, ...extraColumn]);
      });
  };

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    if (plantId) {
      axiosInstance()
        .get(`/product-inventory?wareHouse=${plantId}&${queryString}`)
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

  const getQueryString = () => {
    let deepFilter = `page=${page}&limit=${limit}`;
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
    axiosInstance().put(`/product-inventory`, inputData);
  };

  const ProductNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`/product/detail/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const infoHandler = (params) => {
    setSoftHoldData(params);
    setSoftHold(true);
  };

  const SoftHoldRenderer = (params) => (
    <>
      {params.value ? (
        <>
          <Fragment>
            {params.value}
            <Tooltip className="cursor-info" title={`info`}>
              <IconButton onClick={() => infoHandler(params)}>
                <InfoIcon color="primary" />
              </IconButton>
            </Tooltip>
          </Fragment>
        </>
      ) : null}
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
            additionalParams={`wareHouse=${plantId}`}
            permissions={permissions?.productInventory}
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
              allowAction={false}
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
        {softHold && <SoftHoldDialog open={softHold} close={() => setSoftHold(false)} params={softHoldData} />}
      </div>
    </Fragment>
  );
};

export default InventoryProduct;

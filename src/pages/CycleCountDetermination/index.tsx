import { useState, useContext, Fragment, useEffect, useReducer } from 'react';
import { Grid, Box, Button, TextField } from '@material-ui/core';
import { BiNetworkChart } from 'react-icons/all';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { Autocomplete } from '@material-ui/lab';
import CustomContainer from '../../components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { camelCase } from 'lodash';
import { prepareDataForGrid } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { gridLoadingTimeout, getLocalStorageArrayData } from '../../constants/helpers';
import useColumns, { getFrameworkComponents } from '../../constants/useColumns';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageCycleCountDetermination from './ManageCycleCountDetermination';
import { Link } from 'react-router-dom';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';

const CycleCountDetermination = () => {

  const renderedFrom = camelCase(`${routes.cycleCountDetermination.title}`);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const [warehouseOption, setWarehouseOption] = useState([]);
  const [warehouse, setWarehouse] = useState(null);

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [open, setOpen] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [columns, setColumns] = useState(null);
  const [frameworkComponent, setFrameWorkComponent] = useState({});
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState(null);
  const { dataRows, rowCount, page, limit, pageSizes, appendRows } = state;

  useEffect(() => {
    fetchGridColumns();
    getWarehouse();
  }, [selectedEntity]);

  useEffect(() => {
    if (warehouse) {
      fetchCycleCountDetermination();
    }
  }, [warehouse]);

  const getWarehouse = () => {
    axiosInstance()
      .get(`/warehouse`)
      .then(({ data: { data } }) => {
        setWarehouseOption([...data]);
        setWarehouse(data[0]._id);
      });
  };

  const fetchGridColumns = () => {
    let columns = [];
    let rendererNames = [];
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      nameRenderer: NameRenderer
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    setColumns([
      {
        field: 'name',
        headerName: 'Product Category',
        show: true,
        cellRenderer: 'nameRenderer',
        pivotIndex: 0,
        primaryField: true
      },
      {
        field: 'inventoryCycle',
        headerName: 'Cycle Code',
        show: true,
        cellRenderer: 'commonRenderer'
      },
      {
        field: 'user',
        headerName: 'User',
        show: true,
        cellRenderer: 'commonRenderer'
      }
    ]);
  };

  const fetchCycleCountDetermination = () => {
    setLoading(true);
    axiosInstance().get(`/cycle-count-determination?wareHouse=${warehouse}`).then(({ data: { data, count } }) => {
      setLoading(false);
      setEditData(data);
      let rows = data?.map((u) => {
        let finalObject = prepareDataForGrid(u);
        return {
          ...finalObject
        };
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
      dispatch({ type: 'initialize', data: rows, count: data.count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    })

      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
        setLoading(false);
      });
  };

  const NameRenderer = (params) => {
    return (<Link className="link text-truncate" to={`${routes.productCategoryDetail.path}/${params.data._id}`}>{params.value}</Link>);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.cycleCountDetermination]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions?.cycleCountDetermination}
                  module="cycleCountDetermination"
                  api={'/cycle-count-determination'}
                  afterImportCompleted={() => {
                    fetchCycleCountDetermination();
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
                    else fetchCycleCountDetermination();
                  }}
                  isDownloadExcel={false}
                  additionalParams={'wareHouse='+warehouse}
                  onlyExport={false}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <BiNetworkChart size={20} style={{ paddingBottom: '3px' }} />
                <span className="listingHeader">{routes.cycleCountDetermination.title}</span>
              </div>
              <Autocomplete
                style={{ width: '250px' }}
                options={warehouseOption}
                getOptionLabel={(option: any) => option?.warehouseName}
                disableClearable
                value={warehouseOption.filter((data) => data._id === warehouse).length ? warehouseOption.filter((data) => data._id === warehouse)[0] : ''}
                onChange={(e, val) => {
                  if (val !== null) {
                    setWarehouse(val && val._id ? val._id : '');
                  }
                  fetchCycleCountDetermination();
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
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', gap: '5px' }}>
                  <Button
                    className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                    onClick={() => {
                      setOpen(true);
                    }}
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    color="primary"
                  >
                    Edit
                  </Button>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns ? (
          Object.keys(frameworkComponent).length > 0 ? (
            isMobile && !isTablet ? (
              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions.cycleCountDetermination}
                primaryField={columns?.find((d) => d.primaryField)}
                onClick={(data) => { }}
                dataRows={dataRows}
                selectedRecords={getLocalStorageArrayData(`${localStorageSelectedRecords}`)}
                dispatch={dispatch}
                onEdit={(data) => { }}
                extraParamsToCheckDelete={true}
                onDelete={(data) => { }}
                rowCount={rowCount}
                page={page}
                loading={loading}
                additionalDetails={[]}
                chips={[]}
                onCreate={false}
                showClone={true}
                onClone={(data) => { }}
                renderedFrom={renderedFrom}
              />
            ) : (
              <CustomAgGrid
                columns={columns}
                dataRows={dataRows}
                frameworkComponents={frameworkComponent}
                setGridApi={setGridApi}
                dispatch={dispatch}
                rowCount={rowCount}
                limit={limit}
                pageSizes={pageSizes}
                page={page}
                actionWidth={150}
                allowAction={false}
                allowPagination={true}
                allowSelection={false}
                loading={loading}
                renderedFrom={renderedFrom}
                refreshGrid={fetchCycleCountDetermination}
                isClientSideGrid={true}
                showOnlyShowFilteredRecordSwitch={false}
              />
            )
          ) : null
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {open && (
          <ManageCycleCountDetermination
            onSuccess={() => {
              setOpen(false);
              fetchCycleCountDetermination();
            }}
            onClose={() => {
              setOpen(false);
            }}
            data={editData}
            warehouse={warehouse}
            warehouseName={warehouseOption?.find((e) => e._id === warehouse)?.warehouseName}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default CycleCountDetermination;

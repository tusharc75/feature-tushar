import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, useTheme, useMediaQuery, Button, Box } from '@material-ui/core';
import { camelCase } from 'lodash';
import axios from 'axios';
import { MdDescription, MdFilterList } from 'react-icons/md';
import styles from '../../Leads/Header.module.scss';
import routes from '../../../components/Helpers/Routes';
import axiosInstance from '../../../axios/axiosInstance';
import CustomContainer from '../../../components/CustomContainer';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { useData } from '../../../StateProvider/Provider';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';
import { prepareDataForGrid, gridLoadingTimeout, downloadExcel } from '../../../constants/helpers';
import Loader from '../../../components/Loader';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { IOT_REPORT_LIST } from '../../../constants/helpers';
import CustomFilter from './CustomFilter'

let cancelTokenSource = null;

const IotReport = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity }
  } = useData();
  let { resource } = useParams();
  let resourceCamelCase = camelCase(resource);
  const renderedFrom = `${resource}_report`;

  const [showGrid, setShowGrid] = React.useState(false);

  const [loadingData, setLoadingData] = React.useState(false);
  const [isExporting, setExporting] = React.useState(false);
  const [reportList, setReportList] = React.useState([]);
  const [selectedReportView, setSelectedReportView] = React.useState(null);

  //filter handling new...
  const [filterQuery, setFilterQuery] = useState({
    filterById: [],
    deepFilter: [],
  })

  // Grid Configs
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const [columns, setColumns] = React.useState(null);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, sorting, search, limit, filters, pageSizes } = state;

  //setup columns and filter options

  const fetchReportObj = () => {
    for (const key in routes) {
      if (routes.hasOwnProperty(key)) {
        const item = routes[key];
        if (item.path === "/" + resource) {
          return key;
        }
      }
    }
    return null; // Return null if no match is found
  }

  const refObj = IOT_REPORT_LIST?.find(m => m?.key === fetchReportObj());

  React.useEffect(() => {
    axiosInstance()
      .get(`/report-colum-setting?resource=${resource}`)
      .then(({ data: { data } }) => {
        setReportList(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [showGrid]);

  React.useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, selectedEntity]);


  //this function sets columns for the ag grid using the columns returned from the api
  const handleColumns = (cols) => {
    let columns = [];
    let rendererNames = ['commonRenderer', 'dateTimeRenderer'];

    cols?.forEach((e) => {
      columns.push({
        field: e.fieldName,
        headerName: e.fieldLabel,
        show: true,
        disabled: false,
        cellRenderer: e.fieldName != 'date' ? 'commonRenderer' : 'dateTimeRenderer',
        filter: true,
        sortable: false,
      })
    });

    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent
    };

    setFrameWorkComponent({ ...tempFrameworkComponent });

    columns = [...columns, ...getStaticFields()];
    setColumns([...columns]);
  }

  React.useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [filterQuery])

  const fetchResourceData = () => {
    // setShowGrid(true);
    setLoadingData(true)
    let filterQuery = getFilter();
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let api = refObj?.api + '?column=true&'+filterQuery;;
    axiosInstance()
      .get(api, {
        cancelToken: cancelTokenSource.token
      })
      .then(({ data: responseData }) => {
        const { data, count, columns } = responseData?.data;
        handleColumns(columns);
        const processedData = data.map((item) => {
          const finalObject = prepareDataForGrid(item);
          return finalObject;
        });


        dispatch({ type: 'initialize', data: processedData, count: count });
        setLoadingData(false);
        setShowGrid(true);
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
          toastConfig.setToastConfig(err);
        }
      });
  };

  // Create and return query for filters
  const getFilter = (isExport = false) => {
    let returnQuery = `page=${page}&`;
    
    const { filterById, deepFilter } = { ...filterQuery };
    
    if (!isExport) {
      returnQuery = `${returnQuery}limit=${limit}&`;
    }
    if (sorting.length > 0) {
      returnQuery = `${returnQuery}sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}&`;
    }
    if (search) {
      returnQuery = `${returnQuery}search=${encodeURIComponent(search)}&`;
    }

    if (filterById?.length > 0 || deepFilter?.length > 0) {
      returnQuery = `${returnQuery}?filterType=and`;
    }
    if (filterById?.length > 0) {
      returnQuery = `${returnQuery}&filterById=${JSON.stringify(filterById)}`;
    }
    if (deepFilter?.length > 0) {
      returnQuery = `${returnQuery}&deepFilter=${JSON.stringify(deepFilter)}`;
    }


    return `?${returnQuery}`;
  };

  const exportData = () => {
    if (isExporting) return;
    toastConfig.setToastConfig({
      open: true,
      message: 'Please wait exporting data',
      type: 'info'
    });
    let columns = [];
    if (gridApi) {
      columns = gridApi.columnController.displayedColumns;
      columns = columns.map((col) => col.colId);
    }
    setExporting(true);
    let filterQuery = getFilter(true);
    let api = null;

    axiosInstance()
      .get(api, {
        responseType: 'arraybuffer'
      })
      .then((res) => {
        const fileName = res.headers['content-disposition'].split('filename=')[1];
        downloadExcel(res.data, fileName);
        setExporting(false);
        toastConfig.setToastConfig({
          open: true,
          message: 'Successfully Exported',
          type: 'success'
        });
      })
      .catch((err) => {
        setExporting(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <Grid container>
            <Grid item xs={10}>
              <CustomBreadCrumbs
                routes={[
                  { title: 'Iot Reports', path: '/iot-report' },
                  { title: routes[resourceCamelCase]?.title, path: '' }
                ]}
              />
            </Grid>
            <Grid item xs={2}>
              <Grid container direction="row">
                <Grid item xs={12} sm={12}>
                  <Grid container justifyContent="flex-end">
                    {showGrid && (
                      <Button
                        size="small"
                        className="btn-outline-v1"
                        variant="outlined"
                        id="importExportLinks"
                        style={{ minWidth: 80 }}
                        disabled={isExporting}
                        onClick={exportData}
                      >
                        Export All
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </div>
        <CustomContainer>
          <>
            <div className="header-panel">
              <Grid container className={styles.filter_side_container}>
                <Grid item xs={12} className="d-flex align-items-center gap-1 layout-for-tablet">
                  <Box display="flex" justifyContent="center" alignItems="center">
                    {showGrid && (
                      <Box mr={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          disableElevation
                          onClick={() => {
                            setShowGrid(false);
                            dispatch({ type: 'onlyFilter', filters: {} });
                          }}
                          startIcon={<MdFilterList />}
                        >
                          Show Filters
                        </Button>
                      </Box>
                    )}
                    <MdDescription size={22} className="headerLogo" />
                    <span className="listingHeader">{`${showGrid ? selectedReportView?.name ?? 'Reports' : 'Reports'}`}</span>
                  </Box>
                </Grid>
              </Grid>
            </div>
           
              <CustomFilter
                field={[{ fieldLabel: 'All', fieldName: 'all', _id: '0' }, ...refObj?.filters].map((e: any) => ({ ...e, options: null }))}
                setFilterQuery={setFilterQuery}
                showGrid={showGrid}
                loadingData = {loadingData}
                setShowGrid = {setShowGrid}
              />
             
              <div>
                {Object.keys(frameWorkComponent).length > 0 && columns ? (
                  isSmall ? (
                    <CustomSwipableList
                      allowSelection={false}
                      allowSwipe={false}
                      permissions={permissions[resourceCamelCase]}
                      primaryField={columns?.find((d) => d.primaryField)}
                      onClick={(data) => {
                        // history.push(`${routes[resourceCamelCase].path}/detail/${data._id}`);
                      }}
                      selectedRecords={[]}
                      dataRows={dataRows}
                      dispatch={dispatch}
                      onEdit={() => { }}
                      extraParamsToCheckDelete={false}
                      rowCount={rowCount}
                      page={page}
                      loading={loading}
                      chips={columns
                        .filter((col) => col.hasOwnProperty('cellRendererParams'))
                        .map((col) => ({
                          field: col.field,
                          label: col.headerName
                        }))}
                      additionalDetails={[]}
                      owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                      onCreate={false}
                      showClone={false}
                      onDelete={(data) => { }}
                      onClone={(data) => { }}
                      renderedFrom={routes.transferAsset?.title}
                    />
                  ) : (
                    <CustomAgGrid
                      setSelectedReportView={setSelectedReportView}
                      selectedReportView={selectedReportView}
                      reportSave={true}
                      columns={columns}
                      dataRows={dataRows}
                      frameworkComponents={frameWorkComponent}
                      setGridApi={setGridApi}
                      dispatch={dispatch}
                      rowCount={rowCount}
                      limit={limit}
                      pageSizes={pageSizes}
                      page={page}
                      actionWidth={100}
                      loading={loading}
                      renderedFrom={renderedFrom}
                      allowSelection={false}
                      allowAction={false}
                      refreshGrid={fetchResourceData}
                      showOnlyShowFilteredRecordSwitch={false}
                    />
                  )
                ) : (
                 showGrid && (<Loader text={'Loading Data...'} style={{ marginTop: '15vh' }} />)
                )}
              </div>
            

          </>
        </CustomContainer>
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default IotReport;

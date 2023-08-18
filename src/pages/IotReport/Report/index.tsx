import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Grid, useTheme, useMediaQuery, Button, Box } from '@material-ui/core';
import { camelCase, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdChevronLeft, MdFilterList } from 'react-icons/md';
import styles from '../../Leads/Header.module.scss';
import routes from '../../../components/Helpers/Routes';
import axiosInstance from '../../../axios/axiosInstance';
import CustomContainer from '../../../components/CustomContainer';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { useData } from '../../../StateProvider/Provider';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';
import { prepareDataForGrid, gridLoadingTimeout, downloadExcel, primaryFields, sidebarResource, isObjectEmpty } from '../../../constants/helpers';
import Loader from '../../../components/Loader';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from './ReportFilter';

import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import { IOT_REPORT_LIST } from '../../../constants/helpers';

let cancelTokenSource = null;

const IotReport = () => {
  const history = useHistory();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const initialRender = React.useRef(true);
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity }
  } = useData();
  let { resource } = useParams();
  let resourceCamelCase = camelCase(resource);
  let resourceStartCase = startCase(resource);
  const renderedFrom = `${resource}_report`;

  const [showGrid, setShowGrid] = React.useState(false);
  const [selectedData, setSelectedData] = React.useState(null);
  const [betweenDate, setBetweenDate] = React.useState(null);
  const [statusPeriodDate, setStatusPeriodDate] = React.useState(null);
  const [filterOptions, setFilterOptions] = React.useState([]);
  const [selectedResources, setSelectedResources] = React.useState([]);
  const [resourceOptions, setResourceOptions] = React.useState(null);
  const [formValues, setFormValues] = React.useState({});
  const [resourceColumns, setResourceColumns] = React.useState([]);
  const [isExporting, setExporting] = React.useState(false);
  const [loadingColumns, setLoadingColumns] = React.useState(false);
  const [statusPeriod, setStatusPeriod] = React.useState(false);
  const [reportList, setReportList] = React.useState([]);
  const [selectedReportView, setSelectedReportView] = React.useState(null);
  const [statusTimeFrame, setStatusTimeFrame] = React.useState<any>('custom');

  // Grid Configs
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const { getColumnData } = useColumns();
  const [columns, setColumns] = React.useState(null);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, sorting, search, limit, filters, pageSizes } = state;

  //setup columns and filter options

  const fetchReportObj = () =>{
    for (const key in routes) {
      if (routes.hasOwnProperty(key)) {
        const item = routes[key];
        if (item.path ===  "/"+resource) {
          return key;
        }
      }
    }
    return null; // Return null if no match is found
  }
  
  const refObj = IOT_REPORT_LIST?.find(m => m?.key === fetchReportObj());
  
  const fetchGridColumns = async () => {

    setLoadingColumns(true);

    let resourceFieldData = [];
    const {
      data: { data }
    }: any = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Iot Data Points`);
    resourceFieldData.push({
        isCreate: true,
        isRead: true,
        isUpdate: true,
        fieldData: {
          _id: '1',
          fieldLabel: 'Data Points',
          fieldName: 'dataPoints',
          type: 'dropDown',
          lookup: true,
          option: data["Iot Data Points"],
          filter: false,
          sortable: false,
        }
    })
    resourceFieldData.push({
      isCreate: true,
      isRead: true,
      isUpdate: true,
      fieldData: {
        _id: '2',
        fieldLabel: 'Date',
        fieldName: 'date',
        type: 'date',
        lookup: true,
        filter: false,
        sortable: false,
      }
  })
    setResourceColumns(resourceFieldData);

    setLoadingColumns(false);
  };

  React.useEffect(() => {
    if (initialRender.current) {
      fetchGridColumns();
      initialRender.current = false;
    }
  }, []);

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

  //selectedResources represents the main filter array
  //selectedData is an object with keys as the filter and value as the sub filter values

  React.useEffect(() => {
    if (!selectedData) return;
    setSelectedData((prevState: any) => {
      const dataKeys = Object.keys(prevState);
      const selectedKeys = Object.keys(selectedResources);

      if (selectedResources.length > 0 && dataKeys.length > 0) {
        dataKeys.forEach((key) => {
          if (selectedKeys.includes(key) && prevState?.hasOwnProperty(key)) {
            delete prevState[key];
          }
        });
      }
      return prevState;
    });
  }, [selectedData, selectedResources]);

  //this function sets columns for the ag grid using the columns returned from the api
  const handleColumns = (cols) =>{
    let columns = [];
    let rendererNames = ['commonRenderer', 'dateTimeRenderer'];

    cols?.forEach((e) => {
      columns.push({
        field: e.fieldName,
        headerName: e.fieldLabel,
        show: true,
        disabled: false,
        cellRenderer: e.fieldName!='date'?'commonRenderer':'dateTimeRenderer',
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


  const fetchResourceData = () => {
    setShowGrid(true);

    let filterQuery = getFilter();
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let api = null;
    const endpoint = refObj?.api + '?column=true&' + filterQuery;
    
    api = endpoint;
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
    let filterQuery = `page=${page}&`;
    let deepFilter = [];

    if (!isExport) {
      filterQuery = `${filterQuery}limit=${limit}&`;
    }
    if (sorting.length > 0) {
      filterQuery = `${filterQuery}sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}&`;
    }
    if (search) {
      filterQuery = `${filterQuery}search=${encodeURIComponent(search)}&`;
    }

    if (selectedResources.length > 0) {
      if (selectedData) {
        const keys = selectedData ? Object.keys(selectedData) : [];
        const idFilter = keys.filter((key) => selectedData[key] && selectedData[key].lookup);
        const forDeepFilter = keys.filter((key) => selectedData[key] && !selectedData[key].lookup);

        let filterById = idFilter.map((key) => {
          const options = selectedData[key]?.value;
          return {
            field: key,
            term: {
              $in: options.map((d: any) => d.optionValue)
            }
          };
        });

        forDeepFilter.forEach((key) => {
          if (selectedData[key].type === 'checkBox') {
            deepFilter.push({
              field: key,
              term: selectedData[key].value ? 'Yes' : 'No'
            });
          } else {
            deepFilter.push({
              field: key,
              term: selectedData[key].value?.map((d: any) => d.optionValue)
            });
          }
        });

        if (filterById.length > 0) {
          filterQuery = `${filterQuery}filterById=${JSON.stringify(filterById)}&`;
        }
      }

      if (betweenDate) {
        const fields = Object.keys(betweenDate);
        fields.forEach((field) => {
          if (betweenDate[field]) {
            deepFilter.push({
              field,
              term: moment(betweenDate[field]).format('MM/DD/YYYY')
            });
          }
        });
      }
    }
    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        deepFilter.push({
          field: field,
          term: filters[field].filter
        });
      });
    }

    if (deepFilter && deepFilter.length > 0) {
      filterQuery = `${filterQuery}deepFilter=${encodeURIComponent(JSON.stringify(deepFilter))}&`;
    }

    if (statusPeriod && statusPeriodDate) {
      const fields = Object.keys(statusPeriodDate);
      fields.forEach((field) => {
        if (statusPeriodDate[field]) {
          filterQuery = `${filterQuery}${field}=${moment(statusPeriodDate[field]).format('MM/DD/YYYY')}&`;
        }
      });
    }

    return `?${filterQuery}`;
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
    if (resourceCamelCase === 'workOrder') {
      api = `${routes[resourceCamelCase].path}/template/${filterQuery}export=true&report=1`;
    } else if (resourceCamelCase === 'quotes') {
      api = `quote-builder/report/export?exportColumn=${JSON.stringify(columns)}&export=1&${filterQuery}`;
    } else {
      api = `${routes[resourceCamelCase].path}/report/export?exportColumn=${JSON.stringify(columns)}&export=1&${filterQuery}`;
    }

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
            {!showGrid && (
              <Dialog
                open={true}
                maxWidth="md"
                fullWidth
                onClose={(e, reason) => {
                  if (reason !== 'backdropClick') {
                    history.push(routes.iotReport.path);
                    setShowGrid(true);
                    dispatch({ type: 'onlyFilter', filters: {} });
                  }
                }}
              >
                <CustomDialogHeader
                  title={`Set Filters`}
                  onClose={() => {
                    history.push(routes.iotReport.path);
                    setShowGrid(true);
                    dispatch({ type: 'onlyFilter', filters: {} });
                  }}
                />
                <DialogContent>
                  <div className="p-4 pt-5 min-h-[350px]">
                    <ReportFilters
                      resourceColumns={resourceColumns}
                      betweenDate={betweenDate}
                      setBetweenDate={setBetweenDate}
                      resource={sidebarResource[resourceCamelCase]}
                      setSelectedData={setSelectedData}
                      loading={loading}
                      fetchReportData={fetchResourceData}
                      filterOptions={filterOptions}
                      setFilterOptions={setFilterOptions}
                      selectedResources={selectedResources}
                      setSelectedResources={setSelectedResources}
                      resourceOptions={resourceOptions}
                      setResourceOptions={setResourceOptions}
                      formValues={formValues}
                      setFormValues={setFormValues}
                      loadingColumns={loadingColumns}
                      setSelectedReportView={setSelectedReportView}
                      selectedReportView={selectedReportView}
                      reportList={reportList}
                      setReportList={setReportList}
                      statusPeriod={statusPeriod}
                      setStatusPeriod={setStatusPeriod}
                      statusPeriodDate={statusPeriodDate}
                      setStatusPeriodDate={setStatusPeriodDate}
                      statusTimeFrame={statusTimeFrame}
                      setStatusTimeFrame={setStatusTimeFrame}
                      selectedData={selectedData}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}

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
                <Loader text={'Loading Data...'} style={{ marginTop: '15vh' }} />
              )}
            </div>
          </>
        </CustomContainer>
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default IotReport;

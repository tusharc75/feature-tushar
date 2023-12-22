import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, useTheme, Button, Box } from '@material-ui/core';
import { camelCase } from 'lodash';
import axios from 'axios';
import { MdDescription, MdFilterList } from 'react-icons/md';
import styles from '../../Leads/Header.module.scss';
import routes from '../../../components/Helpers/Routes';
import axiosInstance from '../../../axios/axiosInstance';
import CustomContainer from '../../../components/CustomContainer';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { useData } from '../../../StateProvider/Provider';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { prepareDataForGrid, gridLoadingTimeout, downloadExcel, dateFormat } from '../../../constants/helpers';
import Loader from '../../../components/Loader';
import { IOT_REPORT_LIST } from '../../../constants/helpers';
import CustomFilter from './CustomFilter';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';

let cancelTokenSource = null;

const IotReport = () => {
  const theme = useTheme();
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
  const [selectedReportView, setSelectedReportView] = React.useState(null);
  const [filterQuery, setFilterQuery] = useState({});
  const [columns, setColumns] = React.useState(null);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, sorting, search, limit, filters, pageSizes } = state;

  const fetchReportObj = () => {
    for (const key in routes) {
      if (routes.hasOwnProperty(key)) {
        const item = routes[key];
        if (item.path === '/' + resource) {
          return key;
        }
      }
    }
    return null; // Return null if no match is found
  };

  const seletedReport = IOT_REPORT_LIST?.find((m) => m?.key === fetchReportObj());

  React.useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, selectedEntity]);

  // const handleColumns = (cols) => {
  //   let columns = [];
  //   let rendererNames = ['commonRenderer', 'dateTimeRenderer'];
  //   cols?.forEach((e) => {
  //     columns.push({
  //       field: e.fieldName,
  //       headerName: e.fieldLabel,
  //       show: true,
  //       disabled: false,
  //       cellRenderer: e.fieldName === 'time' ? 'dateTimeRenderer' : 'commonRenderer',
  //       filter: true,
  //       sortable: false
  //     });
  //   });
  //   let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
  //   tempFrameworkComponent = {
  //     ...tempFrameworkComponent
  //   };
  //   setFrameWorkComponent({ ...tempFrameworkComponent });
  //   setColumns([...columns]);
  // };

  const handleColumns = (cols) => {
    let columns = [];
    cols?.forEach((e) => {
      columns.push({
        accessor: e.fieldName,
        Header: e.fieldLabel,
        show: true,
        disableSortBy: true,
        Cell: ({ row }) =>
          e.fieldName === 'time' ? (
            row?.original[e.fieldName] ? (
              <div>
                {row?.original[e.fieldName] ? (
                  <h5 className="createBy" title={`${moment(row?.original[e.fieldName]).format(dateFormat)}`}>
                    {moment(row?.original[e.fieldName])?.format(dateFormat)}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </div>
            ) : (
              <NoDataCell />
            )
          ) : row?.original[e.fieldName] ? (
            <div>
              <h5 className="text-truncate" title={row?.original[e.fieldName]}>
                {row?.original[e.fieldName]}
              </h5>
            </div>
          ) : (
            <NoDataCell />
          )
      });
    });
    setColumns([...columns]);
  };

  React.useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [filterQuery]);

  const fetchResourceData = () => {
    setLoadingData(true);
    setColumns(null);
    let filterQuery = getFilter();

    const query = getFilter(true);
    const prevQ = prevQuery.current;

    if (query === prevQ && memoData.current.data.length) {
      dispatch({ type: 'loading', loading: true });
      const { data, count } = memoData.current;
      const processedData = frontendPagination(data);
      dispatch({ type: 'initialize', data: processedData, count: count });
      dispatch({ type: 'loading', loading: false });
      setShowGrid(true);
      return;
    }

    prevQuery.current = query;

    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });

    let api = seletedReport?.api + filterQuery;
    axiosInstance()
      .get(api, {
        cancelToken: cancelTokenSource.token
      })
      .then(({ data: responseData }) => {
        const { data, count, columns } = responseData?.data;
        handleColumns(columns);
        const processedData = data.map((item, index) => {
          const finalObject: any = prepareDataForGrid(item);
          if (!finalObject?._id) {
            finalObject._id = index?.toString();
          }
          return finalObject;
        });
        dispatch({ type: 'initialize', data: processedData, count: count });
        setShowGrid(true);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          toastConfig.setToastConfig(err);
        }
      })
      .finally(() => {
        setLoadingData(false);
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getFilter = (isExport = false) => {
    let returnQuery = `?page=${page}&limit=${limit}&column=true`;
    if (isExport) {
      returnQuery = `?column=true`;
    }
    if (sorting.length > 0) {
      returnQuery = `${returnQuery}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      returnQuery = `${returnQuery}&search=${encodeURIComponent(search)}`;
    }

    if (Object.keys(filterQuery)?.length > 0) {
      Object.keys(filterQuery).forEach((_k) => {
        returnQuery = `${returnQuery}&${_k}=${filterQuery[_k]}`;
      });
    }

    returnQuery = `${returnQuery}&timezone=${Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone}`;

    return `${returnQuery}`;
  };

  const exportData = () => {
    if (isExporting) return;
    toastConfig.setToastConfig({
      open: true,
      message: 'Please wait exporting data',
      type: 'info'
    });
    setExporting(true);
    let filterQuery = getFilter(true);
    let api = seletedReport?.api + '/export' + filterQuery;
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
          field={[{ fieldLabel: 'All', fieldName: 'all', _id: '0' }, ...seletedReport?.filters]}
          setFilterQuery={setFilterQuery}
          showGrid={showGrid}
          loadingData={loadingData}
          setShowGrid={setShowGrid}
        />
        <div>
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 300px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchResourceData}
              hideSelection={true}
              hideAction={true}
              setSelectedReportView={setSelectedReportView}
              selectedReportView={selectedReportView}
              reportSave={true}
              virtualization={true}
            />
          ) : (
            showGrid && <Loader text={'Loading Data...'} style={{ marginTop: '15vh' }} />
          )}
        </div>
      </CustomContainer>
    </div>
  );
};

export default IotReport;

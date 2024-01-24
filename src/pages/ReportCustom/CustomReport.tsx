import React from 'react';
import { useParams } from 'react-router-dom';
import { Grid, useTheme, Button, Box } from '@material-ui/core';
import { camelCase, startCase } from 'lodash';
import axios from 'axios';
import { MdChevronLeft } from 'react-icons/md';
import styles from '../Leads/Header.module.scss';
import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { prepareDataForGrid, gridLoadingTimeout, downloadExcel, primaryFields, sidebarResource, isObjectEmpty } from './../../constants/helpers';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from '../Report/ReportFilters';
import { useHistory } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

let cancelTokenSource = null;

const CustomReport = () => {
  const theme = useTheme();
  const history = useHistory();
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity }
  } = useData();
  let { id } = useParams();
  const [resource, setResource] = React.useState('');
  const [showGrid, setShowGrid] = React.useState(true);
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
  const [statusTimeFrame, setStatusTimeFrame] = React.useState<any>('custom');
  const [customReportData, setCustomReportData] = React.useState(null);
  const { generateColumns } = useColumns();
  const [columns, setColumns] = React.useState(null);
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, loading } = state;

  const renderedFrom = `custom-report_${id}`;
  let resourceCamelCase = camelCase(resource);

  const fetchGridColumns = async (res) => {
    setLoadingColumns(true);
    const {
      data: { data }
    }: any = await axiosInstance().get(`/field?resource=${startCase(res)}`);
    if (startCase(res) === 'Serialized Asset') {
      const {
        data: { data: lookupResource }
      } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Customer Account,Supplier Account`);
      if (lookupResource) {
        data?.forEach((e) => {
          if (e?.fieldData?.fieldName === 'currentOwner') {
            e.fieldData.lookup = true;
            e.fieldData.option = [...lookupResource?.[`Customer Account`], ...lookupResource?.[`Supplier Account`]];
          }
        });
      }
    }
    setResourceColumns(data);
    setLoadingColumns(false);
    let columns = [];

    data.forEach((o) => {
      if (o?.fieldData?.fieldName === primaryFields[camelCase(res) === 'quotes' ? 'quoteBuilder' : camelCase(res)]) {
        o.fieldData.primaryField = true;
      }
    });
    let newColumns = generateColumns(renderedFrom, data, routes[`${camelCase(res) === 'quotes' ? 'quoteBuilder' : camelCase(res)}Detail`].path, true);
    columns = [...newColumns, ...getStaticFields()];

    if (startCase(res) === 'Purchase Order') {
      columns.splice(1, 0, {
        accessor: 'poAmount',
        Header: 'Purchase Order Amount',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.poAmount ? <p className="text-truncate">{row.original.poAmount}</p> : <NoDataCell />;
        }
      });
    }
    setColumns([...columns]);
    setLoadingColumns(false);
  };

  React.useEffect(() => {
    if (id) {
      (async () => {
        let {
          data: { data }
        } = await axiosInstance().get(`custom-report/${id}`);
        setCustomReportData(data);
        setResource(data.resource);
        fetchGridColumns(data.resource);
      })();
    }
  }, [id]);

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
    if (showGrid && resource) {
      fetchResourceData();
    }
  }, [resource, page, sorting, search, limit, filters, selectedEntity, customReportData]);

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

  const fetchResourceData = () => {
    setShowGrid(true);
    let queryString = getQueryString();
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });
    let api = `/report${routes[resourceCamelCase].path}${queryString}`;;
    if (resourceCamelCase === 'quotes') {
      api = `/report/quote-builder/${queryString}`;
    } else {
      api = `/report${routes[resourceCamelCase].path}${queryString}`;
    }
    axiosInstance().get(api, { cancelToken: cancelTokenSource.token })
      .then(({ data: { data, count } }) => {
        data = data.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: data, count: count });
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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    let customDeepFilter = [];
    customReportData?.filters?.forEach((filter: any) => {
      if (filter?.type === 'checkBox') {
        customDeepFilter.push({
          field: filter.term,
          term: filter.value ? 'Yes' : 'No'
        });
      }
      else {
        customDeepFilter.push({
          field: filter.term,
          term: filter.value
        });
      }
    });
    if (customDeepFilter && customDeepFilter?.length > 0) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(customDeepFilter))}`;
    }
    if (customDeepFilter?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const exportData = () => {
    if (isExporting) return;
    toastConfig.setToastConfig({
      open: true,
      message: 'Please wait exporting data',
      type: 'info'
    });
    let exportColumns = [];
    exportColumns =
      customReportData?.column && customReportData?.column.length > 0
        ? columns.filter((col) => customReportData?.column.includes(col.accessor)).map((col) => col.accessor)
        : columns.map((col) => col.accessor);
    setExporting(true);
    let queryString = getQueryString(true);
    axiosInstance()
      .get(
        `${camelCase(resource) !== 'quotes' ? routes[camelCase(resource)].path : 'quote-builder'}/report/export?exportColumn=${JSON.stringify(
          exportColumns
        )}&export=1&${queryString}`,
        {
          responseType: 'arraybuffer'
        }
      )
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
      <div>
        <Grid container className="headerbox">
          <Grid item xs={10}>
            <CustomBreadCrumbs routes={[{ title: 'Reports', path: '/reports' }, { title: customReportData?.customReportName }]} />
          </Grid>
          <Grid item xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justifyContent="flex-end">
                  {showGrid && (
                    <div id="importExportLinks" style={{ minWidth: 80 }}>
                      <span
                        aria-disabled={isExporting}
                        onClick={exportData}
                        className={`${isExporting ? 'cursor-stop' : 'cursor-pointer'} mr-2 setLink`}
                        style={{ color: theme.palette.info.light }}
                      >
                        Export All
                      </span>
                    </div>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
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
                          history.goBack();
                          // setShowGrid(false);
                          // dispatch({ type: 'onlyFilter', filters: {} });
                        }}
                        startIcon={<MdChevronLeft />}
                      >
                        Go Back
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </div>
          {!showGrid ? (
            <ReportFilters
              customReportData={customReportData}
              isCustomReport={true}
              resourceColumns={resourceColumns}
              betweenDate={betweenDate}
              setBetweenDate={setBetweenDate}
              resource={sidebarResource[camelCase(resource)]}
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
              setSelectedReportView={null}
              selectedReportView={null}
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
          ) : (
            <div>
              {columns ? (
                <CustomReactTable
                  height={'calc(100vh - 200px)'}
                  columns={
                    customReportData?.column && customReportData?.column.length > 0
                      ? columns.filter((col) => customReportData?.column.includes(col.accessor))
                      : columns
                  }
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchResourceData}
                  hideAction={true}
                  hideSelection={true}
                />
              ) : (
                <Box p={2} height={500}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </div>
          )}
        </CustomContainer>
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default CustomReport;

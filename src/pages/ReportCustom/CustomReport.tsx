import MomentUtils from '@date-io/moment';
import { Box, Button, Grid } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import axios from 'axios';
import { camelCase, kebabCase, startCase } from 'lodash';
import React from 'react';
import { MdChevronLeft } from 'react-icons/md';
import { useHistory, useParams } from 'react-router-dom';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import styles from '../Leads/Header.module.scss';
import ReportFilters from '../Report/ReportFilters';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { downloadExcel, gridLoadingTimeout, prepareDataForGrid, primaryFields, REPORT_LIST, sidebarResource } from './../../constants/helpers';

let cancelTokenSource = null;

const CustomReport = () => {
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
  const [statusTimeFrame, setStatusTimeFrame] = React.useState<any>('custom');
  const [customReportData, setCustomReportData] = React.useState(null);
  const { generateColumns } = useColumns();
  const [columns, setColumns] = React.useState(null);

  const renderedFrom = `custom-report_${id}`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, loading } = state;

  const fetchGridColumns = async (res) => {
    let result = [];
    setLoadingColumns(true);
    if (REPORT_LIST?.find((r) => r?.title === startCase(res))?.key === 'standardReport') {
      let {
        data: {
          data: { columnFields }
        }
      } = await axiosInstance().get(`/report/${kebabCase(REPORT_LIST?.find((r) => r?.title === startCase(res))?.type)}/column`);

      result = columnFields;
    } else {
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
      result = data;
    }

    setResourceColumns(result);
    setLoadingColumns(false);
    let columns = [];

    result.forEach((o) => {
      if (o?.fieldData?.fieldName === primaryFields[camelCase(res) === 'quotes' ? 'quoteBuilder' : camelCase(res)]) {
        o.fieldData.primaryField = true;
      }
    });
    let newColumns = generateColumns(
      renderedFrom,
      result,
      camelCase(res) === 'quotes' ? routes['quoteBuilder']?.path : routes[`${camelCase(res)}Detail`] ? routes[`${camelCase(res)}Detail`]?.path : null,
      true
    );
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
    const api = `/report${camelCase(resource) === 'quotes'
      ? '/quote-builder'
      : routes[camelCase(resource)]
        ? routes[camelCase(resource)]?.path
        : `/${kebabCase(REPORT_LIST?.find((r) => r?.title === resource)?.type)}`
      }${queryString}`;

    axiosInstance()
      .get(api, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count, columns } }) => {
        if (camelCase(resource) === 'numberOfAssetsByStatus') {
          setLoadingColumns(true);
          setResourceColumns(columns);
          let col = [];
          let newColumns = generateColumns(renderedFrom, columns, null, true);
          col = [...newColumns, ...getStaticFields()];
          setColumns([...col]);
          setLoadingColumns(false);
        }
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

    const { deepFilters } = gridFilterParser(filters);

    let customDeepFilter = [...deepFilters];
    customReportData?.filters?.forEach((filter: any) => {
      if (filter?.type === 'checkBox') {
        customDeepFilter.push({
          field: filter.term,
          term: filter.value ? 'Yes' : 'No'
        });
      } else {
        customDeepFilter.push({
          field: filter.term,
          term: filter.value
        });
      }
    });

    if (customDeepFilter?.length) {
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
        `/report/${camelCase(resource) === 'quotes'
          ? 'quote-builder'
          : routes[camelCase(resource)]
            ? routes[camelCase(resource)]?.path
            : `${kebabCase(REPORT_LIST?.find((r) => r?.title === resource)?.type)}`
        }/export?exportColumn=${JSON.stringify(exportColumns)}&export=1&${queryString}`,
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

  const getApi = () => {
    let exportColumns = [];
    exportColumns =
      customReportData?.column && customReportData?.column.length > 0
        ? columns?.filter((col) => customReportData?.column.includes(col.accessor))?.map((col) => col.accessor)
        : columns?.map((col) => col.accessor);
    let queryString = getQueryString(true);
    let resourceCamelCase = camelCase(resource);
    let resourcePath = resourceCamelCase === 'quotes' ? 'quote-builder' : routes[resourceCamelCase] ? routes[resourceCamelCase]?.path : ``;
    return `/report${resourcePath}/export?exportColumn=${JSON.stringify(exportColumns)}&${queryString}`;
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
                  {showGrid &&
                    (['dynamic', 'inUsedSerializedAsset']?.includes(REPORT_LIST?.find((r) => r?.title === resource)?.type) ? (
                      <AsynImportExportMenu
                        resource={resource}
                        subResource={'report'}
                        permissions={
                          resource === 'In Used Serialized Asset'
                            ? permissions?.report
                            : permissions[camelCase(resource) === 'quotes' ? 'quoteBuilder' : camelCase(resource)]
                        }
                        module={''}
                        api={resource === 'In Used Serialized Asset' ? `/report/${kebabCase(resource)}` : getApi()}
                        afterImportCompleted={() => { }}
                        onlyExport={true}
                      />
                    ) : (
                      <Button variant="outlined" size="small" disabled={isExporting} onClick={exportData} className={`btn-outline-v-1`}>
                        Export All
                      </Button>
                    ))}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={12} className="d-flex align-items-center layout-for-tablet gap-1">
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

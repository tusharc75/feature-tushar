import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Grid, useTheme, useMediaQuery, Button, Box } from '@material-ui/core';
import { camelCase, filter, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdChevronLeft } from 'react-icons/md';
import styles from '../Leads/Header.module.scss';

import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { prepareDataForGrid, gridLoadingTimeout, downloadExcel, primaryFields, sidebarResource } from './../../constants/helpers';
import Loader from '../../components/Loader';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from './ReportFilters';

let cancelTokenSource = null;

const Report = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const initialRender = React.useRef(true);
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { permissions }
  } = useData();
  let { resource } = useParams();
  let history = useHistory();

  let resourceCamelCase = camelCase(resource);
  let resourceStartCase = startCase(resource);
  const renderedFrom = `${resource}_report`;

  const [showGrid, setShowGrid] = React.useState(false);
  const [selectedData, setSelectedData] = React.useState(null);
  const [betweenDate, setBetweenDate] = React.useState(null);
  const [filterOptions, setFilterOptions] = React.useState([]);
  const [selectedResources, setSelectedResources] = React.useState([]);
  const [resourceOptions, setResourceOptions] = React.useState(null);
  const [formValues, setFormValues] = React.useState({});
  const [resourceColumns, setResourceColumns] = React.useState([]);
  const [isExporting, setExporting] = React.useState(false);
  const [loadingColumns, setLoadingColumns] = React.useState(false);
  const [reportList, setReportList] = React.useState([]);
  const [selectedReportView, setSelectedReportView] = React.useState(null);
  // Grid Configs
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const { getColumnData } = useColumns();
  const [columns, setColumns] = React.useState(null);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, sorting, search, limit, pageSizes } = state;

  const fetchGridColumns = () => {
    setLoadingColumns(true);
    axiosInstance()
      .get(`/field?resource=${resourceStartCase}`)
      .then(({ data: { data } }) => {
        setResourceColumns(data);
        setLoadingColumns(false);
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (o?.fieldData?.fieldName === primaryFields[resourceCamelCase]) {
            o.fieldData.primaryField = true;
          }
          let currentColumn = getColumnData(routes[resourceCamelCase]?.title, o?.fieldData, routes[`${resourceCamelCase}Detail`].path);

          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });

        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      })
      .catch((error) => {
        setLoadingColumns(false);
        toastConfig.setToastConfig(error);
      });
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
  }, [showGrid, page, sorting, limit]);

  /**
   * Fetch resource data for selected filters,
   * @returns none if no data selected
   */
  const fetchResourceData = () => {
    let filterQuery = getFilter();

    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    setShowGrid(true);

    axiosInstance()
      .get(`${resourceCamelCase !== 'quotes' ? routes[resourceCamelCase].path : 'quote-builder'}/report${filterQuery}`, {
        cancelToken: cancelTokenSource.token
      })
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

  // Create and return query for filters
  const getFilter = () => {
    let filterQuery = `page=${page}&limit=${limit}&`;
    if (sorting.length > 0) {
      filterQuery = `${filterQuery}sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}&`;
    }
    if (search) {
      filterQuery = `${filterQuery}search=${search}&`;
    }
    if (selectedResources.length > 0) {
      let deepFilter = [];
      if (selectedData) {
        const keys = selectedData ? Object.keys(selectedData) : [];
        const idFilter = keys.filter((key) => selectedData[key] && selectedData[key].lookup);
        const forDeepFilter = keys.filter((key) => selectedData[key] && !selectedData[key].lookup);

        let filterById = idFilter.map((key) => {
          const options = selectedData[key].value;
          return {
            field: key,
            term: {
              $in: options.map((d: any) => d.optionValue)
            }
          };
        });

        forDeepFilter.forEach((key) => {
          const options = selectedData[key].value;
          options.forEach((o: any) => {
            deepFilter.push({
              field: key,
              term: o.optionValue
            });
          });
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
              term: moment(betweenDate[field]).format('mm/dd/yyyy')
            });
          }
        });
      }

      if (deepFilter && deepFilter.length > 0) {
        filterQuery = `${filterQuery}deepFilter=${JSON.stringify(deepFilter)}&`;
      }
    }

    return `?${filterQuery}`;
  };

  const exportData = () => {
    if ((selectedData && Object.keys(selectedData).length === 0) || !selectedData || isExporting) return;
    toastConfig.setToastConfig({
      open: true,
      message: 'Please wait exporting data',
      type: 'info'
    });
    setExporting(true);
    let filterQuery = getFilter();
    axiosInstance()
      .get(`${routes[resourceCamelCase].path}/report/export?export=1&${filterQuery}`)
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
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs
              routes={[
                { title: 'Reports', path: '/reports' },
                { title: routes[resourceCamelCase]?.title, path: '' }
              ]}
            />
          </Grid>

          <Grid item md={8} sm={1} xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justifyContent="flex-end">
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
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
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
                          }}
                          startIcon={<MdChevronLeft />}
                        >
                          Go Back
                        </Button>
                      </Box>
                    )}
                    <MdDescription size={22} className="headerLogo" />
                    <span className="listingHeader">{` ${selectedReportView?.name ?? 'Reports'}`}</span>
                  </Box>
                </Grid>
              </Grid>
            </div>
            <hr />
            {/* <div className="header-panel">
              <Grid container className={styles.rental_header_layout} spacing={1}>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={['All', ...resourceOptions]}
                    limitTags={2}
                    disableListWrap
                    ListboxComponent={VirtualizedList as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
                    disableCloseOnSelect={false}
                    multiple
                    value={selectedResource ?? []}
                    onChange={(_, val) => {
                      if (val.includes('All')) {
                        setSelectedResource(resourceOptions);
                      } else {
                        setSelectedResource(val);
                      }
                      if (selectedData) {
                        setSelectedData((prevState) => {
                          const data = Object.keys(prevState);
                          const unselected = data.filter((d) => !val.includes(d));
                          const unselectedData = { ...prevState };
                          unselected.forEach((_d) => {
                            if (unselectedData[_d]) {
                              delete unselectedData[_d];
                            }
                          });
                          return unselectedData;
                        });
                      }
                    }}
                    fullWidth
                    getOptionSelected={(option, val) => option === val}
                    getOptionLabel={(option) => option}
                    renderInput={(params) => <TextField {...params} variant="outlined" label="Select Filter" size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={7}>
                  <Grid container spacing={1}>
                    {selectedResource &&
                      selectedResource.length > 0 &&
                      selectedResource.map((data: string) => {
                        data = data === 'Plant' ? 'Warehouse' : data;
                        const options = data === 'Status' ? status[resourceCamelCase] : dropdownList && dropdownList[data] ? dropdownList[data] : [];
                        if (data === 'Date') {
                          return (
                            <MuiPickersUtilsProvider utils={MomentUtils}>
                              <KeyboardDatePicker
                                autoOk
                                size="medium"
                                variant="inline"
                                inputVariant="outlined"
                                name="startDate"
                                label="Start Date"
                                value={betweenDate.startDate}
                                onChange={(date: any) => {
                                  setBetweenDate({
                                    ...betweenDate,
                                    startDate: date
                                  });
                                }}
                                format={dateFormat}
                                InputLabelProps={{
                                  shrink: true
                                }}
                                margin="dense"
                              />
                              <Box mx={1} />
                              <KeyboardDatePicker
                                autoOk
                                size="medium"
                                variant="inline"
                                inputVariant="outlined"
                                name="endDate"
                                label="End Date"
                                value={betweenDate.endDate}
                                onChange={(date: any) => {
                                  setBetweenDate({
                                    ...betweenDate,
                                    endDate: date
                                  });
                                }}
                                format={dateFormat}
                                InputLabelProps={{
                                  shrink: true
                                }}
                                margin="dense"
                              />
                            </MuiPickersUtilsProvider>
                          );
                        } else {
                          return (
                            <Grid item xs={12} sm={4} key={data}>
                              <Autocomplete
                                options={options}
                                limitTags={2}
                                disableCloseOnSelect={false}
                                disableListWrap
                                ListboxComponent={VirtualizedList as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
                                multiple
                                value={selectedData && selectedData[data] ? selectedData[data] : []}
                                onChange={(_, val) => setSelectedData({ ...selectedData, [data]: val })}
                                fullWidth
                                getOptionSelected={(option, val) => (data === 'Status' ? option === val : option.optionValue === val.optionValue)}
                                getOptionLabel={(option) => (data === 'Status' ? option : option.optionLabel)}
                                renderInput={(params) => (
                                  <TextField {...params} variant="outlined" label={data === 'Warehouse' ? 'Plant' : data} size="small" />
                                )}
                              />
                            </Grid>
                          );
                        }
                      })}
                  </Grid>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box display="flex" justifyContent="flex-end" alignItems="center">
                    <Button
                      onClick={fetchResourceData}
                      startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <List />}
                      color="primary"
                      variant="contained"
                      size="small"
                      disableElevation
                      disabled={loading}
                    >
                      Show
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </div> */}
            {!showGrid ? (
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
              />
            ) : (
              <div>
                {Object.keys(frameWorkComponent).length > 0 && columns ? (
                  isSmall ? (
                    <CustomSwipableList
                      allowSelection={false}
                      allowSwipe={false}
                      permissions={permissions[resourceCamelCase]}
                      primaryField={columns?.find((d) => d.primaryField)}
                      onClick={(data) => {
                        history.push(`${routes[resourceCamelCase].path}/detail/${data._id}`);
                      }}
                      selectedRecords={[]}
                      dataRows={dataRows}
                      dispatch={dispatch}
                      onEdit={() => {}}
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
                      onDelete={(data) => {}}
                      onClone={(data) => {}}
                      renderedFrom={routes.transferAsset?.title}
                    />
                  ) : (
                    <CustomAgGrid
                      setSelectedReportView={setSelectedReportView}
                      selectedReportView={selectedReportView}
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
            )}
          </>
        </CustomContainer>
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default Report;

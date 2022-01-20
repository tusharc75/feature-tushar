import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Grid, Button, TextField, Box, CircularProgress, useTheme, useMediaQuery } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { List } from '@material-ui/icons';
import { camelCase, startCase } from 'lodash';
import axios from 'axios';
import styles from '../Leads/Header.module.scss';

import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import HideWhenOffline from '../../components/HideWhenOffline';
import CustomContainer from '../../components/CustomContainer';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import VirtualizedList from '../../components/VirtualizedList';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import {
  resourceNames,
  RENTAL_STATUS,
  INVENTORY_STATUS,
  prepareDataForGrid,
  gridLoadingTimeout,
  downloadExcel,
  primaryFields
} from './../../constants/helpers';
import Loader from '../../components/Loader';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';

const resourcesSelect = {
  rentalManagement: ['customerAccount', 'customerContact', 'warehouse', 'status'],
  productInventory: ['productCategory', 'product', 'warehouse', 'status']
};

let cancelTokenSource = null;

const simplifyStatus = (statusType: any) => Object.values(statusType).map((status: string) => status);

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

  const status = {
    rentalManagement: simplifyStatus(RENTAL_STATUS),
    productInventory: simplifyStatus(INVENTORY_STATUS)
  };
  let resourceCamelCase = camelCase(resource);
  let resourceStartCase = startCase(resource);
  const renderedFrom = `${resource}-report`;

  const [dropdownList, setDropdownList] = React.useState(null);
  const [selectedData, setSelectedData] = React.useState(null);
  const [selectedResource, setSelectedResource] = React.useState(null);
  const [isExporting, setExporting] = React.useState(false);

  // Grid Configs
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const { getColumnData } = useColumns();
  const [columns, setColumns] = React.useState(null);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${resourceStartCase}`)
      .then(({ data: { data } }) => {
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
      .catch((error) => toastConfig.setToastConfig(error));
  };

  React.useEffect(() => {
    if (initialRender.current) {
      fetchGridColumns();
      initialRender.current = false;
    }

    let timeout = setTimeout(fetchDropdownData, 400);
    if (!selectedResource) setSelectedData(null);
    return () => clearTimeout(timeout);
  }, [selectedResource]);

  const fetchDropdownData = () => {
    if (!selectedResource) return;
    const lookup = selectedResource
      .filter((s: string) => s !== 'Status')
      .map((r: string) => (r === 'Plant' ? 'Warehouse' : r))
      .join();
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${lookup}`)
      .then(({ data: { data } }) => {
        setDropdownList(data);
      })
      .catch((error) => toastConfig.setToastConfig(error));
  };

  /**
   * Fetch resource data for selected filters,
   * @returns none if no data selected
   */
  const fetchResourceData = () => {
    if ((selectedData && Object.keys(selectedData).length === 0) || !selectedData) return;
    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let filterQuery = getFilter();
    axiosInstance()
      .get(`${routes[resourceCamelCase].path}/report?${filterQuery}`, {
        cancelToken: cancelTokenSource.token
      })
      .then(({ data: { data } }) => {
        data = data.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          return finalObject;
        });

        dispatch({ type: 'initialize', data: data, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          toastConfig.setToastConfig(err);
        }
      });
  };

  // Create and return query for filters
  const getFilter = () => {
    let filterQuery = '';

    let filterById = Object.keys(selectedData)
      .filter((d) => d !== 'Status')
      .map((_d) => {
        const field = camelCase(_d);
        return {
          field,
          term: {
            $in: selectedData[_d === 'Plant' ? 'Warehouse' : _d].map((d: any) => d.optionValue)
          }
        };
      });

    let deepFilter = selectedData['Status']
      ? selectedData['Status'].map((_d) => ({
        field: 'status',
        term: _d
      }))
      : [];

    if (filterById.length > 0) {
      filterQuery = `${filterQuery}filterById=${JSON.stringify(filterById)}&`;
    }

    if (deepFilter && deepFilter.length > 0) {
      filterQuery = `${filterQuery}deepFilter=${JSON.stringify(deepFilter)}&`;
    }

    return filterQuery;
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

  const workingPage = ['productInventory', 'rentalManagement'];

  if (!workingPage.includes(resourceCamelCase)) {
    history.goBack();
  }

  return (
    <div>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: 'Reports', path: '/reports' }, { title: routes[resourceCamelCase]?.title, path: '' }]} />
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
                    style={{ color: theme.palette.info.light, }}
                  >
                    Export All
                  </span>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <CustomContainer styles={{ paddingTop: 10 }}>
        {workingPage.includes(resourceCamelCase) && (
          <>
            <div className="header-panel">
              <Grid container className={styles.rental_header_layout} spacing={1}>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={resourcesSelect[resourceCamelCase].map((_r: string) => (_r === 'status' ? 'Status' : resourceNames[_r]))}
                    limitTags={2}
                    disableListWrap
                    ListboxComponent={VirtualizedList as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
                    disableCloseOnSelect={false}
                    multiple
                    value={selectedResource ?? []}
                    onChange={(_, val) => {
                      setSelectedResource(val);

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
            </div>
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
                    onEdit={() => { }}
                    extraParamsToCheckDelete={false}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    chips={columns.filter(
                      (col) => col.hasOwnProperty('cellRendererParams')
                    ).map(col => ({
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
                    isClientSideGrid={true}
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
        )}
      </CustomContainer>
    </div>
  );
};

export default Report;

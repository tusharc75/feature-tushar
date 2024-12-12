import React from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Button, Box } from '@material-ui/core';
import { camelCase, isArray, isEmpty, isObject, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdFilterList } from 'react-icons/md';
import styles from '../Leads/Header.module.scss';
import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import {
  prepareDataForGrid,
  gridLoadingTimeout,
  primaryFields,
  sidebarResource,
  isObjectEmpty,
  CustomDialogTransition
} from './../../constants/helpers';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from './ReportFilters';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import CustomReactTable, { useTableReducer, useColumns, getStaticFields } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AsynImportExportMenu from 'src/components/AsynImportExportMenu';
import Filter from 'src/components/Filter';

let cancelTokenSource = null;

const Report = () => {
  const initialRender = React.useRef(true);
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity }
  } = useData();
  let { resource } = useParams();

  let resourceCamelCase = camelCase(resource);
  let resourceStartCase = startCase(resource);
  const renderedFrom = `${resource}_report_new`;

  const [showGrid, setShowGrid] = React.useState(false);
  const [selectedData, setSelectedData] = React.useState(null);
  const [betweenDate, setBetweenDate] = React.useState(null);
  const [statusPeriodDate, setStatusPeriodDate] = React.useState(null);
  const [filterOptions, setFilterOptions] = React.useState([]);
  const [selectedResources, setSelectedResources] = React.useState([]);
  const [resourceOptions, setResourceOptions] = React.useState(null);
  const [formValues, setFormValues] = React.useState({});
  const [resourceColumns, setResourceColumns] = React.useState([]);
  const [loadingColumns, setLoadingColumns] = React.useState(false);
  const [statusPeriod, setStatusPeriod] = React.useState(false);
  const [selectedReportView, setSelectedReportView] = React.useState(null);
  const [statusTimeFrame, setStatusTimeFrame] = React.useState<any>('custom');
  const [deepFilters, setDeepFilters] = React.useState([]);
  const [filterByIds, setFilterByIds] = React.useState([]);
  const [filterTerm, setFilterTerm] = React.useState({});

  const { generateColumns } = useColumns();
  const [columns, setColumns] = React.useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { loading, page, sorting, search, limit, filters, pageSizes, visibleColumns } = state;

  const fetchGridColumns = async () => {
    setLoadingColumns(true);
    const {
      data: { data }
    }: any = await axiosInstance().get(`/field?resource=${resourceStartCase}&view=true`);

    if (resourceStartCase === sidebarResource.serializedAsset) {
      const {
        data: { data: lookupResource }
      } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.customerAccount},${sidebarResource.supplierAccount}`);
      if (lookupResource) {
        data?.forEach((e) => {
          if (e?.fieldData?.fieldName === 'currentOwner') {
            e.fieldData.lookup = false;
            e.fieldData.option = [...lookupResource?.[sidebarResource.customerAccount], ...lookupResource?.[sidebarResource.supplierAccount]];
          }
        });
      }
    }

    const resourceColumns = [...data];
    if (resourceStartCase === sidebarResource.purchaseOrder) {
      resourceColumns.push({
        fieldData: {
          _id: '630dc2429ec41861052355a9',
          fieldLabel: 'Received Date',
          type: 'date',
          option: [],
          required: false,
          isTooltip: false,
          tooltipMessage: '',
          editAble: true,
          deletAble: true,
          order: 6,
          fieldName: 'receivedDate',
          sectionName: 'PO Information',
          resource: 'Purchase Order',
          brand: data[0]?.fieldData?.brand,
          timeFrame: 'custom'
        },
        isCreate: true,
        isRead: true,
        isUpdate: true
      });
    }
    if (resourceStartCase === sidebarResource.serializedAsset && resourceColumns?.some((r) => r?.fieldData?.fieldName === 'status')) {
      const index = resourceColumns?.findIndex((r) => r?.fieldData?.fieldName === 'status');
      if (index != -1) {
        resourceColumns?.splice(index + 1, 0, {
          fieldData: {
            _id: '630dc2429ec41869052355b1',
            fieldLabel: 'Status Period',
            type: 'date',
            option: [],
            required: false,
            isTooltip: false,
            tooltipMessage: '',
            editAble: true,
            deletAble: true,
            order: 71,
            fieldName: 'statusPeriod',
            sectionName: 'Product Inventory',
            resource: 'Serialized Asset',
            brand: data[0]?.fieldData?.brand,
            timeFrame: 'custom'
          },
          isCreate: true,
          isRead: true,
          isUpdate: true
        });
      }
    }
    setResourceColumns(resourceColumns);
    setLoadingColumns(false);
    let columns = [];
    data.forEach((o) => {
      if (o?.fieldData?.fieldName === primaryFields[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]) {
        o.fieldData.primaryField = true;
      }
    });

    let newColumns = generateColumns(
      routes[resourceCamelCase]?.title,
      data,
      routes[`${resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase}Detail`].path
    );
    if (resourceStartCase === sidebarResource.quotation) {
      newColumns.push({
        accessor: 'versionComment',
        Header: 'Version Comment',
        show: true,
        disabled: false,
        Cell: ({ row }) => (
          <>
            <h5 className="text-truncate">{row.original['versionComment'] ? row.original['versionComment'] : <NoDataCell />}</h5>
          </>
        )
      });
    }
    columns = [...newColumns, ...getStaticFields()];
    if (resourceStartCase === sidebarResource.purchaseOrder) {
      columns.splice(1, 0, {
        accessor: 'poAmount',
        Header: 'Purchase Order Amount',
        disabled: false,
        Cell: ({ row }) => (
          <>
            <h5 className="text-truncate">{row.original['poAmount'] ? row.original['poAmount'] : <NoDataCell />}</h5>
          </>
        )
      });
    }
    if ([sidebarResource.invoice, sidebarResource.fieldTicket].includes(resourceStartCase)) {
      const extraColumns = [
        {
          accessor: 'amount',
          Header: 'Amount',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <>
              <h5 className="text-truncate">{row.original['amount'] ? row.original['amount'] : <NoDataCell />}</h5>
            </>
          )
        },
        {
          accessor: 'tax',
          Header: 'Tax',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <>
              <h5 className="text-truncate">{row.original['tax'] ? row.original['tax'] : <NoDataCell />}</h5>
            </>
          )
        },
        {
          accessor: 'discount',
          Header: 'Discount',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <>
              <h5 className="text-truncate">{row.original['discount'] ? row.original['discount'] : <NoDataCell />}</h5>
            </>
          )
        },
        {
          accessor: 'totalAmount',
          Header: 'Total Amount',
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (
            <>
              <h5 className="text-truncate">{row.original['totalAmount'] ? row.original['totalAmount'] : <NoDataCell />}</h5>
            </>
          )
        }
      ];
      columns = [...columns, ...extraColumns];
    }
    if (resourceStartCase === sidebarResource.workOrder) {
      columns.push({
        accessor: 'totalConsumablesCost',
        Header: 'Total Consumables Cost',
        show: true,
        disabled: false,
        Cell: ({ row }) => (
          <>
            <h5 className="text-truncate">{row.original['totalConsumablesCost'] ? row.original['totalConsumablesCost'] : <NoDataCell />}</h5>
          </>
        )
      });
    }
    columns?.forEach((e) => {
      e.editable = false;
    });
    setColumns([...columns]);
    setLoadingColumns(false);
  };

  React.useEffect(() => {
    if (initialRender.current) {
      fetchGridColumns();
      initialRender.current = false;
    }
  }, []);

  React.useEffect(() => {
    if (showGrid) {
      fetchResourceData();
    }
  }, [page, sorting, search, limit, filters, pageSizes, selectedEntity]);

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

    let filterQuery = getFilter();

    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();
    dispatch({ type: 'loading', loading: true });

    let api = `/report${routes[resourceCamelCase].path}${filterQuery}`;
    if (resourceCamelCase === 'quotes') {
      api = `/report/quote-builder/${filterQuery}`;
    } else {
      api = `/report${routes[resourceCamelCase].path}${filterQuery}`;
    }

    axiosInstance()
      .get(api, {
        cancelToken: cancelTokenSource?.token
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
            if (Array.isArray(selectedData[key].value)) {
              deepFilter.push({
                field: key,
                term: selectedData[key].value?.map((d: any) => d.optionValue || d)
              });
            } else {
              deepFilter.push({
                field: key,
                term: selectedData[key].value
              });
            }
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

    if (filterByIds?.length > 0) {
      const filterById = filterByIds
        ?.filter((f) => f?.term?.length > 0)
        ?.map((f) => {
          const term = filterTerm[f?.field] === '$nin' ? '$nin' : '$in';
          return {
            field: f?.field,
            term: {
              [term]: f?.term.map((d: any) => d.optionValue)
            }
          };
        });
      if (filterById?.length > 0) {
        filterQuery = `${filterQuery}filterById=${JSON.stringify(filterById)}&`;
      }
    }

    const isStatusPeriod =
      resourceStartCase === sidebarResource.serializedAsset && resourceColumns?.some((r) => r?.fieldData?.fieldName === 'status');

    if (deepFilters?.length > 0) {
      deepFilter = [
        ...deepFilter,
        ...deepFilters
          ?.filter((d) => {
            const hasTermLength = d?.term?.length ? true : false;
            if (isStatusPeriod) {
              return hasTermLength && !['from_statusPeriod', 'to_statusPeriod']?.includes(d?.field);
            }
            return hasTermLength;
          })
          ?.map((d) => {
            if (filterTerm[d?.field] === '$nin' && isArray(d?.term)) {
              return {
                ...d,
                term: { $nin: d?.term }
              };
            }
            return d;
          })
      ];
    }

    if (isStatusPeriod && deepFilters?.filter((d) => d?.term && ['from_statusPeriod', 'to_statusPeriod']?.includes(d?.field))?.length) {
      deepFilters
        ?.filter((d) => d?.term && ['from_statusPeriod', 'to_statusPeriod']?.includes(d?.field))
        ?.forEach((ele) => {
          filterQuery = `${filterQuery}${ele?.field}=${ele?.term}&`;
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

  const getApi = () => {
    let newColumns = columns.map((col) => col.accessor);
    if (!isEmpty(visibleColumns) && isObject(visibleColumns)) {
      newColumns = [];
      for (const [key, value] of Object.entries(visibleColumns)) {
        if (value) {
          newColumns.push(key);
        }
      }
    }
    let filterQuery = getFilter(true);
    let api = null;
    if (resourceCamelCase === 'quotes') {
      api = `/report/quote-builder/export?exportColumn=${JSON.stringify(newColumns)}&${filterQuery}`;
    } else {
      api = `/report${routes[resourceCamelCase].path}/export?exportColumn=${JSON.stringify(newColumns)}&${filterQuery}`;
    }
    return api;
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <Grid container>
            <Grid item xs={10}>
              <CustomBreadCrumbs
                routes={[
                  { title: 'Reports', path: '/reports' },
                  { title: routes[resourceCamelCase]?.title, path: '' }
                ]}
              />
            </Grid>
            <Grid item xs={2}>
              <Grid container direction="row">
                <Grid item xs={12} sm={12}>
                  <Grid container justifyContent="flex-end">
                    {showGrid && (
                      <AsynImportExportMenu
                        resource={sidebarResource[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
                        subResource={'report'}
                        permissions={permissions[resourceCamelCase === 'quotes' ? 'quoteBuilder' : resourceCamelCase]}
                        module={''}
                        api={getApi()}
                        afterImportCompleted={() => {}}
                        onlyExport={true}
                      />
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
                    <span className="listingHeader">{`${showGrid ? (selectedReportView?.name ?? 'Reports') : 'Reports'}`}</span>
                  </Box>
                </Grid>
              </Grid>
            </div>
            {/* {!showGrid && (
              <Dialog
                open={true}
                maxWidth="md"
                fullWidth
                TransitionComponent={CustomDialogTransition}
                onClose={(e, reason) => {
                  if (reason !== 'backdropClick') {
                    setShowGrid(true);
                    dispatch({ type: 'onlyFilter', filters: {} });
                  }
                }}
              >
                <CustomDialogHeader
                  title={`Set Filters`}
                  onClose={() => {
                    setShowGrid(true);
                    dispatch({ type: 'onlyFilter', filters: {} });
                  }}
                />
                <DialogContent>
                  <div className="min-h-[350px] p-4 pt-5">
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
            )} */}
            {!showGrid && (
              <Filter
                onClose={() => {
                  setShowGrid(true);
                  dispatch({ type: 'onlyFilter', filters: {} });
                }}
                resource={sidebarResource[resourceCamelCase]}
                columns={resourceColumns}
                onApplyFilter={fetchResourceData}
                deepFilters={deepFilters}
                setDeepFilters={setDeepFilters}
                filterByIds={filterByIds}
                setFilterByIds={setFilterByIds}
                filterTerm={filterTerm}
                setFilterTerm={setFilterTerm}
              />
            )}
            <div>
              {columns ? (
                <CustomReactTable
                  height={'calc(100vh - 200px)'}
                  columns={columns}
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchResourceData}
                  hideSelection={true}
                  setSelectedReportView={setSelectedReportView}
                  selectedReportView={selectedReportView}
                />
              ) : (
                <Box p={2} height={500}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </div>
          </>
        </CustomContainer>
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default Report;

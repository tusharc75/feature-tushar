import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { Grid, useTheme, useMediaQuery, Button, Box, Tooltip, IconButton } from '@material-ui/core';
import { camelCase, capitalize, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdFilterList } from 'react-icons/md';
import styles from 'src/pages/Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import {
    prepareDataForGrid,
    gridLoadingTimeout,
    downloadExcel,
    primaryFields,
    productInventory,
    isObjectEmpty,
    sidebarResource
} from 'src/constants/helpers';
import Loader from 'src/components/Loader';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from '../ReportFilters';
import { DateRenderer, NumberRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import HistoryIcon from '@material-ui/icons/History';
import AverageCostHistory from '../AverageCostHistory';
import { CommonRenderer, DateTimeRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { useAppTheme } from 'src/constants/AppConfig';

import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';

let cancelTokenSource = null;

const Report = () => {
    const [themeColor] = useAppTheme();
    const isDarkTheme = themeColor === 'dark';
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const initialRender = React.useRef(true);
    const toastConfig = React.useContext(CustomToastContext);
    const {
        state: { user, permissions, selectedEntity }
    } = useData();
    const { type } = useParams();
    const history = useHistory();

    const resourceCamelCase = camelCase(type);
    const resourceStartCase = startCase(type);
    const renderedFrom = `${type}_report`;

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

    const [showPriceHistory, setShowPriceHistory] = React.useState({ open: false, product: '', productName: '' });
    const [showPricefilter, setShowPricefilter] = React.useState({ warehouse: null, fromDate: null, toDate: null });




    const fetchGridColumns = async () => {
        try {
            setLoadingColumns(true);
            let columnData = [];
            let rendererNames = [];
            let resourceFieldData = [];

            let {
                data: { data, columns }
            } = await axiosInstance().get(`/serialized-asset/report/assets-number-by-status`);


            columns.forEach((o: any) => {
                let currentColumn = getColumnData('Product', o, routes['productDetail'].path);
                if (currentColumn !== null) {
                    if (currentColumn?.columnData?.field === 'productNumber') {
                        columnData.push({
                            ...currentColumn?.columnData,
                            cellRenderer: 'productRenderer'
                        })
                    } else {
                        columnData = [...columnData, currentColumn?.columnData];
                    }
                    if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                        if (currentColumn?.columnData?.field === 'productNumber') {
                            rendererNames.push('productRenderer');
                        } else {
                            rendererNames.push(currentColumn?.rendererName);
                        }
                    }
                }
            });

            let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
            tempFrameworkComponent = {
                ...tempFrameworkComponent,
                productRenderer: 'productRenderer',
                productCategoryRenderer: 'productCategoryRenderer'

            };
            setFrameWorkComponent({ ...tempFrameworkComponent, ...customFrameworkComponents });
            setResourceColumns(resourceFieldData);
            setColumns(columnData);
            setLoadingColumns(false);
        } catch (error) {
            setLoadingColumns(false);
            toastConfig.setToastConfig(error);
        }
    };

    const ProductRenderer = (params: any) => (
        <Link className="link" title={params.value} to={`${routes.productDetail.path}/${params.data._id}`} target="_blank" >
            {params.value}
        </Link>
    );


    React.useEffect(() => {
        if (initialRender.current) {
            fetchGridColumns();
            initialRender.current = false;
        }
    }, []);

    React.useEffect(() => {
        setReportList([]);

        // axiosInstance()
        //     .get(`/report-colum-setting?resource=${type}`)
        //     .then(({ data: { data } }) => {
        //         setReportList(data);
        //     })
        //     .catch((error) => {
        //         toastConfig.setToastConfig(error);
        //     });
    }, [showGrid]);

    React.useEffect(() => {
        if (showGrid) {
            fetchResourceData();
        }
    }, [page, sorting, search, limit, filters, pageSizes, selectedEntity]);

    React.useEffect(() => {
        // const selectedResourceNames = selectedResources?.map((field) => field.fieldName);
        // const selectedDataNames = Object.keys(selectedData);
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


    const customFrameworkComponents = {
        productRenderer: ProductRenderer,
        numberRenderer: NumberRenderer,
        dateRenderer: DateRenderer,
        dateTimeRenderer: DateTimeRenderer
    };


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
        axiosInstance()
            .get(
                `/serialized-asset/report/assets-number-by-status${filterQuery}`,
                {
                    cancelToken: cancelTokenSource.token
                }
            )
            .then(({ data: { data, count } }) => {
                data = data.map((u: any) => {
                    let finalObject: any = prepareDataForGrid(u);
                    if (finalObject?.listPrice) {
                        finalObject.margin = ((finalObject?.listPrice + (finalObject?.averagePrice || 0)) / finalObject?.listPrice)?.toFixed(2);
                    }
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
        setShowPricefilter({ warehouse: null, fromDate: null, toDate: null });
        let filterQuery = ``;
        let deepFilter = [];

        if (!isExport) {
            filterQuery = `page=${page}&limit=${limit}&`;
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
                    if (key === 'warehouse') {
                        setShowPricefilter((prevState) => ({ ...prevState, warehouse: options.map((d: any) => d.optionValue) }));
                    }
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
                        if (field === 'from_date') {
                            setShowPricefilter((prevState) => ({ ...prevState, fromDate: moment(betweenDate[field]).format('MM/DD/YYYY') }));
                        }
                        if (field === 'to_date') {
                            setShowPricefilter((prevState) => ({ ...prevState, toDate: moment(betweenDate[field]).format('MM/DD/YYYY') }));
                        }
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
                    filterQuery = `${filterQuery}${field}=${moment(statusPeriodDate[field]).format('MM/DD/YYYY')}& `;
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
        axiosInstance()
            .get(
                `/serialized-asset/report/assets-number-by-status/export${filterQuery}${columns?.length ? `&exportColumn=${JSON.stringify(columns)}` : ""} `,
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
                        <CustomBreadCrumbs
                            routes={[
                                { title: 'Reports', path: '/reports' },
                                { title: resourceStartCase, path: '' }
                            ]}
                        />
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
                                                className={`${isExporting ? 'cursor-stop' : 'cursor-pointer'} mr - 2 setLink`}
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
                                        <span className="listingHeader">{` ${selectedReportView?.name ?? 'Reports'} `}</span>
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
                                        history.push(routes.reports.path);
                                        setShowGrid(true);
                                        dispatch({ type: 'onlyFilter', filters: {} });
                                    }
                                }}
                            >
                                <CustomDialogHeader
                                    title={`Set Filters`}
                                    onClose={() => {
                                        history.push(routes.reports.path);
                                        setShowGrid(true);
                                        dispatch({ type: 'onlyFilter', filters: {} });
                                    }}
                                />
                                <div className="p-4 min-h-[600px]">
                                    <DialogContent>
                                        <ReportFilters
                                            resourceColumns={resourceColumns}
                                            betweenDate={betweenDate}
                                            setBetweenDate={setBetweenDate}
                                            resource={'Purchase Order Type'}
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
                                    </DialogContent>
                                </div>
                            </Dialog>
                        )}

                        <div>
                            {Object.keys(frameWorkComponent).length > 0 && columns ? (
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
                                    allowAction={resourceCamelCase === 'inventoryEvaluation'}
                                    refreshGrid={fetchResourceData}
                                    showOnlyShowFilteredRecordSwitch={false}
                                />
                            ) : (
                                <Loader text={'Loading Data...'} style={{ marginTop: '15vh' }} />
                            )}
                        </div>
                    </>
                </CustomContainer>
            </div>
            {showPriceHistory.open && (
                <AverageCostHistory
                    product={showPriceHistory.product}
                    productName={showPriceHistory.productName}
                    handleClose={() => {
                        setShowPriceHistory({ open: false, product: '', productName: '' });
                    }}
                    showPricefilter={showPricefilter}
                />
            )}
        </MuiPickersUtilsProvider>
    );
};

export default Report;

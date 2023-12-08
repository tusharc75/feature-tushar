import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { Grid, Button, Box, IconButton } from '@material-ui/core';
import { camelCase, capitalize, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdFilterList } from 'react-icons/md';
import styles from 'src/pages/Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import {
    prepareDataForGrid,
    gridLoadingTimeout,
    downloadExcel,
    isObjectEmpty,
} from 'src/constants/helpers';
import Loader from 'src/components/Loader';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import ReportFilters from '../ReportFilters';
import AverageCostHistory from '../AverageCostHistory';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { useAppTheme } from 'src/constants/AppConfig';

import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import CustomReactTable, { useTableReducer, useColumns, getStaticFields } from 'src/components/CustomReactTableNew';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import HistoryIcon from '@material-ui/icons/History';


let cancelTokenSource = null;

const Report = () => {
    const [themeColor] = useAppTheme();
    const isDarkTheme = themeColor === 'dark';
    const initialRender = React.useRef(true);
    const toastConfig = React.useContext(CustomToastContext);
    const {
        state: { selectedEntity }
    } = useData();
    const { type } = useParams();
    const history = useHistory();

    const resourceCamelCase = camelCase(type);
    const resourceStartCase = startCase(type);
    const renderedFrom = `${type}_report_new`;

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
    const { getColumnData } = useColumns();
    const [columns, setColumns] = React.useState(null);
    const { state, dispatch } = useTableReducer();
    const { loading, page, sorting, search, limit, filters, pageSizes, colState } = state;

    const [showPriceHistory, setShowPriceHistory] = React.useState({ open: false, product: '', productName: '' });
    const [showPricefilter, setShowPricefilter] = React.useState({ warehouse: null, fromDate: null, toDate: null });

    const fetchGridColumns = async () => {
        try {
            setLoadingColumns(true);
            let columns = [];

            let {
                data: { data: { columnFields, filterFields } }
            } = await axiosInstance().get(`/report/${type}/column`);
            const customRendererTypes = ['refer', 'creditDebit', 'date', 'creditDebitType'];
            
            columnFields.forEach((o) => {

                const currentColumn: any = getColumnData(type, o?.fieldData, '');
               
                if (customRendererTypes?.includes(o?.fieldData?.type)) {
                    switch (o?.fieldData?.type) {
                        case 'refer':
                            currentColumn.columnData.Cell = ({ row }) => ReferenceRenderer(row);
                            currentColumn.columnData.canFilter = false;
                            currentColumn.columnData.disableSortBy = true;
                            break;
                        case 'creditDebit':
                            currentColumn.columnData.Cell = ({ row }) => CreditDebitRenderer(row)
                            currentColumn.columnData.canFilter = false;
                            currentColumn.columnData.disableSortBy = true;

                            break;
                        case 'creditDebitType':
                            currentColumn.columnData.Cell = ({ row }) => CreditDebitTypeRenderer(row);
                            break;
                    }
                }
                
                if(o?.fieldData?.fieldName === 'serialNumber'){
                    currentColumn.columnData.Cell = ({row}) => SerialNumberRenderer(row)
                    currentColumn.columnData.canFilter = false;
                    currentColumn.columnData.disableSortBy = true;
                }

                if(type === "number-of-assets-by-status" && o?.fieldData?.fieldName === "product"){
                    currentColumn.columnData.Cell = ({row}) => ProductRenderer(row)
                }
               

                if (currentColumn !== null && !o?.fieldData?.hideColumn) {
                    columns = [...columns, { ...currentColumn?.columnData }];
                }

            });
            
            if(type === 'inventory-evaluation'){
                columns = [...columns, ActionsRenderer]
            }
            if(type === "in-used-serialized-asset"){
                columns = [...columns, ...getStaticFields()]
            }

            setResourceColumns(filterFields);
            setColumns(columns);
            setLoadingColumns(false);
        } catch (error) {
            setLoadingColumns(false);
            toastConfig.setToastConfig(error);
        }
    };

    React.useEffect(() => {
        if (initialRender.current) {
            fetchGridColumns();
            initialRender.current = false;
        }
    }, []);

    React.useEffect(() => {
        axiosInstance()
            .get(`/report-colum-setting?resource=${type}`)
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

    const CreditDebitRenderer = (row) => {
        return (
            <div
                style={{
                    backgroundColor:
                        row?.original?.type === 'credit'
                            ? isDarkTheme
                                ? 'hsl(120 73% 40% / 1)'
                                : '#90ee90'
                            : row?.original?.type === 'debit'
                                ? isDarkTheme
                                    ? 'hsl(1 100% 65% / 1)'
                                    : '#FFCCCB'
                                : ''
                }}
            >
                {row?.original?.qty ? (
                    <h5 className="text-truncate" title={row?.original?.qty}>
                        {row?.original?.type === 'debit' ? `-${row?.original?.qty}` : row?.original?.qty}
                    </h5>
                ) : (
                    <NoDataCell />
                )}
            </div>
        )
    }

    const ProductRenderer = (row) =>{

        return (
            row?.original?.productName ? (
                <Link className="link" title={row?.original?.productName} to={`${routes.productDetail.path}/${row?.original?.productId}`} target="_blank">
                    {row?.original?.productName}
                    </Link>
            ) : <NoDataCell/>
        )
    }

    const ReferenceRenderer = (row) => {
        return (
            row?.original?.reference ? (
                row?.original?.referenceType === 'Purchase Order' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.purchaseOrderDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : row?.original?.referenceType === 'Transfer Inventory' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.transferInventoryDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : row?.original?.referenceType === 'Transfer Asset' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.transferAssetDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : row?.original?.referenceType === 'Sales Order' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.salesOrderDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : row?.original?.referenceType === 'Bulk Asset Creation' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.bulkAssetCreationDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : row?.original?.referenceType === 'Serialized Asset' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.serializedAssetDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : row?.original?.referenceType === 'Rental Job' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.rentalManagementDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : row?.original?.referenceType === 'Work Order' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.workOrderDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : row?.original?.referenceType === 'Field Ticket' ? (
                    <Link
                        className="link"
                        target="_blank"
                        title={row?.original?.reference}
                        to={`${routes.fieldTicketDetail.path}/${row?.original?.referenceId}`}
                    >
                        {row?.original?.reference}
                    </Link>
                ) : (
                    row?.original?.reference
                )
            ) : row?.original?.referenceType === 'Product Inventory' ? (
                <h5 className="text-truncate">Manual Entry</h5>
            ) : (
                <NoDataCell />
            )
        )
    }

    const CreditDebitTypeRenderer = (row) => {
        return (
            <div
            >
                {row?.original?.type ? (
                    <span>
                        {capitalize(row?.original?.type)}
                    </span>
                ) : (
                    <NoDataCell />
                )}
            </div>
        )
    }

    const SerialNumberRenderer = (row) =>{
        return (
            <>
                <span>{row.original.serialNumber?.length ? row.original.serialNumber?.map((e) => e?.serialNumber)?.toString() : <NoDataCell />}</span>
            </>
        )
    }

    const ActionsRenderer = {
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => (
          <>
            <HtmlTooltip title={'View History'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    setShowPriceHistory({ open: true, product: row?.original?._id, productName: row?.original?.productName });
                  }}
                >
                  <HistoryIcon fontSize="small" color="primary" />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        )
      };


    const fetchResourceData = () => {
        setShowGrid(true);
        let filterQuery = getFilter();
        if (cancelTokenSource) {
            cancelTokenSource.cancel();
        }
        cancelTokenSource = axios.CancelToken.source();
        dispatch({ type: 'loading', loading: true })

        var api = `/report/${type}`;
        axiosInstance()
            .get(`${api}${filterQuery}`, {
                cancelToken: cancelTokenSource.token
            })
            .then(({ data: { data, count, columns } }) => {
                if (resourceCamelCase === 'userSession') {
                    setLoadingColumns(true);
                    columns = columns?.map((e) => {
                        return {
                            accessor: e.fieldName,
                            Header: e.fieldLabel,
                            disableSortBy: true,
                            canFilter: false,
                            Cell: ({ row }) => {
                                return (
                                    <>
                                        {row?.original?.[e?.fieldName] ? (
                                            e.fieldName === "user" ? (
                                                <Link className="link" title={row?.original?.[e?.fieldName]} to={`${routes.userDetail.path}/${row?.original?.userId}`} target="_blank">
                                                    {row?.original?.[e?.fieldName]}
                                                </Link>
                                            ) : (
                                                <h5 className="text-truncate" title={row?.original?.[e?.fieldName]}>
                                                    {row?.original?.[e?.fieldName]}
                                                </h5>
                                            )
                                        ) : (
                                            <NoDataCell />
                                        )}
                                    </>
                                );
                            }
                            
                        }
                        
                    });
                    setColumns(columns);
                    setLoadingColumns(false);
                }
                data = data.map((u: any) => {
                    if (resourceCamelCase === 'purchaseOrderDetails') {
                        if (u?.productLedger?.type === 'credit') {
                            u.actualReceived = u?.productLedger?.qty;
                            u.rejectQuantity = 0;
                        } else {
                            u.rejectQuantity = u?.productLedger?.qty;
                            u.actualReceived = 0;
                        }
                        u.date = u?.productLedger?.date;
                    }
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
        if (resourceCamelCase === 'userSession') {
            return `?column=true&${filterQuery}`;
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
        let newColumns = columns.map((col)=>col.accessor);

        if(colState.length){
            newColumns = colState?.filter((col)=>col.isVisible).map((col)=>col.accessor)
        }        
        setExporting(true);
        let filterQuery = getFilter(true);

        var api = '';
        api = `/report/${type}/export`;

        axiosInstance()
            .get(`${api}${filterQuery}&exportColumn=${JSON.stringify(newColumns)} `, {
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
                    <CustomBreadCrumbs
                        routes={[
                            { title: 'Reports', path: '/reports' },
                            { title: resourceStartCase, path: '' }
                        ]}
                    />
                    {showGrid && (
                        <div id="importExportLinks" style={{ minWidth: 80 }}>
                            <Button variant="outlined" size="small" disabled={isExporting} onClick={exportData} className={`btn-outline-v-1`}>
                                Export All
                            </Button>
                        </div>
                    )}
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
                            {columns ? (
                                <CustomReactTable
                                    height={'calc(100vh - 200px)'}
                                    columns={columns}
                                    state={state}
                                    dispatch={dispatch}
                                    renderedFrom={renderedFrom}
                                    refreshGrid={fetchResourceData}
                                    hideSelection={true}
                                    reportSave={true}
                                    setSelectedReportView={setSelectedReportView}
                                    selectedReportView={selectedReportView}
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

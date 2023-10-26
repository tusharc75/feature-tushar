import { Box, Grid, IconButton, TextField } from '@material-ui/core';
import { Fragment, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { camelCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import { SUBLEASE_STATUS, gridLoadingTimeout, prepareDataForGrid, removeLocalStorage, sidebarResource, INVOICE_STATUS } from 'src/constants/helpers';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { isMobile } from 'react-device-detect';
import CustomContainer from 'src/components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import SearchBox from 'src/components/Helpers/SearchBox';
import { Autocomplete } from '@material-ui/lab';
import CreateInvoiceDialog from './CreateInvoice';
import InvoiceDialog from './InvoiceDialog';

const GenerateInvoice = () => {

    const renderedFrom = `${camelCase(routes?.generateInvoice.title)}`;
    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const {
        state: { selectedEntity }
    }: any = useData(); 
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
        state;
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [columns, setColumns] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const { getColumnData } = useColumns();

    const [createInvoiceDialog, setCreateInvoiceDialog] = useState({ open: false, data: null });
    const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, data: null });
    const [selectedResource, setSelectedResource] = useState('sublease');


    const resourceMapping = {
        sublease : {
            category : 'progressiveType',
            detailPath : routes.subleaseDetail.path,
            name : 'subleaseName'
        },
        repairOrder : {
            category : 'Other',
            detailPath : routes.repairOrderDetail.path,
            name : 'repairOrderNumber'
        }
    }

    const fetchGridColumns = async () => {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource[selectedResource]}`);
        let data = response?.data?.data;
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, resourceMapping[selectedResource].detailPath);
            if (currentColumn !== null) {
                columns = [...columns, currentColumn?.columnData];
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                    rendererNames.push(currentColumn?.rendererName);
                }
            }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
            ...tempFrameworkComponent,
            actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
    };

    const fetchData = async () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance()
            .get(`${routes?.generateInvoice.path}${queryString}`)
            .then(({ data: { data, count } }) => {
                let rows = data?.map((u: any) => {
                    let finalObject: any = prepareDataForGrid(u);
                    finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
                    return {
                        ...finalObject
                    };
                });
                if (appendRows) {
                    dispatch({
                        type: 'initialize',
                        data: [...dataRows, ...rows],
                        count: count,
                        selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
                    });
                } else {
                    dispatch({
                        type: 'initialize',
                        data: rows,
                        count: count,
                        selectedRecords: rows.filter((f) => f.isChecked === true)
                    });
                }
                dispatch({ type: 'initialize', data: rows, count: count });
                setTimeout(() => {
                    dispatch({ type: 'loading', loading: false });
                }, gridLoadingTimeout);
            });
    };

    const getQueryString = (isExport = false) => {
        let deepFilter = !isExport ? `?page=${page}&limit=${limit}&resource=${selectedResource}` : '?';

        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }

        const { filterByIds, deepFilters } = gridFilterParser(filters);

        if (filterByIds?.length) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
        }
        if (deepFilters?.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
        }
        if (filterByIds?.length || deepFilters?.length) {
            deepFilter = `${deepFilter}&filterType=and`;
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
        }
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
        }
        return deepFilter;
    };

    const ActionsRenderer = (params) => (
        <Fragment>
            
            {params.data?.subleaseName && params.data.status === SUBLEASE_STATUS.issued ? (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <HtmlTooltip title="Create Invoice">
                        <IconButton
                            size="small"
                            onClick={() => {
                                setCreateInvoiceDialog({ open: true, data: [params.data] });
                            }}
                        >
                            <NoteAddIcon fontSize="small" color="primary" />
                        </IconButton>
                    </HtmlTooltip>
                    <Box ml={1}>
                        <HtmlTooltip title="View Invoices">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setViewInvoiceDialog({ open: true, data: params.data });
                                }}
                            >
                                <VisibilityIcon fontSize="small" color="primary" />
                            </IconButton>
                        </HtmlTooltip>
                    </Box>
                </div>
            ) : (
                params.data?.repairOrderNumber &&
                (
                    params.data?.status === INVOICE_STATUS.readyToInvoice ? (
                        <HtmlTooltip title="Create Invoice">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setCreateInvoiceDialog({ open: true, data: [params.data] });
                                }}
                            >
                                <NoteAddIcon fontSize="small" color="primary" />
                            </IconButton>
                        </HtmlTooltip>
                    ) : (
                        <HtmlTooltip title="View Invoice">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setViewInvoiceDialog({ open: true, data: params.data });
                                }}
                            >
                                <VisibilityIcon fontSize="small" color="primary" />
                            </IconButton>
                        </HtmlTooltip>
                    )
                )

            )}

        </Fragment>
    );

    useEffect(() => {
        fetchGridColumns();
    }, [selectedResource]);

    useEffect(() => {
        fetchData();
    }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedResource]);


    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[{ title: routes.generateInvoice.title }]} />
                </Grid>
                <Grid item md={8} sm={1} xs={2} />
            </Grid>
            <CustomContainer>
                <div className="header-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Autocomplete
                            id="generate-invoice"
                            style={{ width: '300px' }}
                            options={Object.keys(sidebarResource)
                                .filter((key) => Object.keys(resourceMapping).includes(key))
                                .map((key) => sidebarResource[key])}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Resource"
                                    margin="dense"
                                    required={true}
                                />
                            )}
                            getOptionLabel={(option) => option}
                            onChange={(e, val) => {
                                if (val) {
                                    const selectedResource = Object.keys(resourceMapping).find((resource) =>
                                        sidebarResource[resource] === val
                                    );
                                    setSelectedResource(selectedResource);
                                } else {
                                    setSelectedResource(null);
                                }
                            }}
                        />
                    </div>

                    <Grid container className={styles.filter_side_container}>
                        <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
                        </Grid>
                        <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
                            <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                                <SearchBox
                                    onChange={handleSearch}
                                    className={isMobile ? styles.search_box_input : ''}
                                    size="small"
                                    value={search}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </div>

                {Object.keys(frameWorkComponent).length > 0 ? (
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
                        allowAction={true}
                        loading={loading}
                        renderedFrom={renderedFrom}
                        refreshGrid={fetchData}
                        showFilters={true}
                        actionWidth={120}
                        resource={sidebarResource.sublease}
                        allowSelection={false}
                    />
                )
                    : null}
                {createInvoiceDialog.open && (
                    <CreateInvoiceDialog
                        resourceData={createInvoiceDialog?.data[0]}
                        onClose={() => setCreateInvoiceDialog({ open: false, data: null })}
                        resourceName={selectedResource}
                        category={resourceMapping[selectedResource].category}
                        onSuccess={() => {
                            setCreateInvoiceDialog({ open: false, data: null });
                            removeLocalStorage(localStorageSelectedRecords);
                            fetchData();
                        }}
                    />
                )}
                {viewInvoiceDialog.open && (
                    <InvoiceDialog
                        resourceId={viewInvoiceDialog?.data?._id}
                        resourceName={selectedResource}
                        headerName = {viewInvoiceDialog?.data[resourceMapping[selectedResource].name]}
                        handleClose={() => {
                            setViewInvoiceDialog({ open: false, data: null });
                        }}
                    />
                )}
            </CustomContainer>
        </Fragment>
    );
};

export default GenerateInvoice;

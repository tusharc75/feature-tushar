import { Box, Grid, IconButton, Tooltip, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { camelCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import axiosInstance from 'src/axios/axiosInstance';
import {
    dateFormat,
    gridLoadingTimeout,
    prepareDataForGrid,
    sidebarResource
} from 'src/constants/helpers';
import EventNoteIcon from '@material-ui/icons/EventNote';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import VisibilityIcon from '@material-ui/icons/Visibility';
import CreateInvoiceDialog from './ManageInvoice/CreateInvoiceDialog';
import ViewInvoice from '../Invoice/ViewInvoice';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import moment from 'moment';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const style = {
    date: {
        fontSize: 13,
        fontWeight: 400,
        display: 'flex',
        gap: 5,
        alignItems: 'center'
    },
    title: {
        '& p': {
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '20px',
            '& span': {
                fontSize: 13
            }
        }
    },
    titleText: {
        fontSize: 14,
        fontWeight: 600,
        lineHeight: '20px',
        marginBottom: 7
    },
    subTitleText: {
        fontSize: 13,
        fontWeight: 400
    },
    borderBottom: {
        borderBottom: '1px solid var(--common-border-color)'
    },
    serviceItem: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: '5px',
        '&:last-of-type': {
            paddingBottom: 0
        },
        gap: '10px',
        '& p ': {
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        }
    }
};

const FieldTicketInvoice = () => {

    const toastConfig = useContext(CustomToastContext);

    const renderedFrom = camelCase(routes?.fieldTicket.title);
    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const {
        state: { permissions, selectedEntity, user }
    }: any = useData();
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
        state;
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [columns, setColumns] = useState([]);
    const [fieldServiceOrder, setFieldServiceOrder] = useState(null);
    const [selectedFieldServiceOrder, setSelectedFieldServiceOrder] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const { getColumnData } = useColumns();
    const [createInvoiceDialog, setCreateInvoiceDialog] = useState({ open: false, data: null })
    const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, data: null })

    const fetchFieldServiceOrderData = async () => {
        setFieldServiceOrder(null);
        axiosInstance()
            .get(`${routes?.fieldTicketInvoice.path}/field-service-order`)
            .then(({ data: { data } }) => {
                setFieldServiceOrder(data?.data);
                const isAvailable = data?.data.find((d) => d._id === selectedFieldServiceOrder?._id);
                const index = data?.data.findIndex((d) => d._id === selectedFieldServiceOrder?._id);
                if (data?.data?.length) {
                    isAvailable ? setSelectedFieldServiceOrder(data?.data[index]) : setSelectedFieldServiceOrder(data?.data[0]);
                }
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const fetchGridColumns = async () => {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldTicket}`);
        let data = response?.data?.data;
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldTicketDetail.path);
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

    const fetchFieldTicketData = async () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance()
            .get(`${routes?.fieldTicketInvoice.path}${queryString}`)
            .then(({ data: { data, count } }) => {
                let rows = data?.map((u: any) => {
                    let finalObject: any = prepareDataForGrid(u);
                    finalObject['canDelete'] = permissions?.fieldTicket?.isDelete;
                    finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
                    finalObject['allowedToEdit'] = permissions?.fieldTicket?.isUpdate;
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
        let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

        if (selectedFieldServiceOrder) {
            deepFilter = deepFilter + `&fieldServiceOrderId=${selectedFieldServiceOrder?._id}`;
        }

        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }

        const { filterByIds, deepFilters } = gridFilterParser(filters);

        if (filterByIds?.length) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
        }
        if (deepFilters?.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
        }
        if (filterByIds?.length || deepFilters?.length) {
            deepFilter = `${deepFilter}&filterType=and`;
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
        }
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
        }
        return deepFilter;
    };

    // const handleSearch = (e) => {
    //     dispatch({ type: 'search', search: e.target.value });
    // };

    const ActionsRenderer = (params) => (
        <Fragment>
            {!params.data.invoice ? (
                <HtmlTooltip title="Create Invoice">
                    <IconButton
                        size="small"
                        onClick={() => {
                            setCreateInvoiceDialog({ open: true, data: params.data })
                        }}
                    >
                        <NoteAddIcon fontSize="small" color="primary" />
                    </IconButton>
                </HtmlTooltip>
            ) : (
                <HtmlTooltip title="View Invoice">
                    <IconButton size="small"
                        onClick={() => {
                            setViewInvoiceDialog({ open: true, data: params.data })
                        }}
                    >
                        <VisibilityIcon fontSize="small" color="primary" />
                    </IconButton>
                </HtmlTooltip>
            )
            }
        </Fragment >
    );

    useEffect(() => {
        fetchFieldServiceOrderData();
        fetchGridColumns();
    }, []);

    useEffect(() => {
        fetchFieldTicketData();
    }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedFieldServiceOrder]);

    return (
        <Box className="main-container-v1">
            <Box className="headerbox-v1">
                <Box className="nav-v1">
                    <CustomBreadCrumbs routes={[{ title: routes.fieldTicketInvoice.title }]} />
                </Box>
            </Box>
            <Box className={`detail-container-v1`}>
                {
                    fieldServiceOrder ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12} md={4} xl={3}>
                                <Box p={2} className='container-with-border'>
                                    <Box className="hide-scrollbar" style={{ height: 'calc(100vh - 100px)', overflowY: "auto" }}>
                                        {fieldServiceOrder?.map((data, index) => {
                                            return (
                                                <Box
                                                    mb={2}
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedFieldServiceOrder(data);
                                                    }}
                                                    style={{
                                                        cursor: 'pointer',
                                                        border: selectedFieldServiceOrder === data ? '2px solid var(--new_theme_color)' : '1px solid var(--common-border-color)',
                                                        borderRadius: '8px'
                                                    }}
                                                    sx={{ position: 'relative' }}
                                                >
                                                    <Box p={3}>
                                                        <Box sx={{ ...style.serviceItem, ...style.title }}>
                                                            <Box style={{ display: 'flex' }}>
                                                                <Typography>{data?.fieldServiceOrderNumber}</Typography>
                                                                {
                                                                    permissions?.fieldServiceOrder?.isRead &&
                                                                    <Box ml={1}>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                window.open(`${routes.fieldServiceOrderDetail.path}/${data?._id}`);
                                                                            }}
                                                                        >
                                                                            <OpenInNewIcon fontSize="small" color="primary" />
                                                                        </IconButton>
                                                                    </Box>
                                                                }
                                                            </Box>
                                                        </Box>
                                                        <Box style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', ...style.borderBottom }}>
                                                            <Box sx={{ ...style.title, textAlign: 'unset' }}>
                                                                <Typography component={'span'} style={{ ...style.date, marginBottom: '8px', marginTop: '5px' }}>
                                                                    <EventNoteIcon style={{ fontSize: '15px' }} />
                                                                    {moment(data?.technicianAssign?.estimateStartDate).format(dateFormat)} -{' '}
                                                                    {moment(data?.technicianAssign?.estimateEndDate).format(dateFormat)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Box mt={1}>
                                                            <Typography style={style.titleText}>
                                                                Customer: <span style={style.subTitleText}>{data?.customerAccount?.optionLabel}</span>
                                                            </Typography>
                                                            <Typography style={{ ...style.titleText, marginBottom: 0 }}>
                                                                Location: <span style={style.subTitleText}>{data?.shippingAddress?.optionLabel}</span>
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={8} xl={9}>
                                <Box p={2} className="container-with-border">
                                    {Object.keys(frameWorkComponent).length > 0 ? (
                                        isMobile && !isTablet ? (
                                            <CustomSwipableList
                                                allowSelection={false}
                                                allowSwipe={true}
                                                permissions={permissions.fieldticketInvoice}
                                                primaryField={columns?.find((d) => d.primaryField)}
                                                onClick={(data) => { }}
                                                dataRows={dataRows}
                                                selectedRecords={selectedRecords}
                                                dispatch={dispatch}
                                                onEdit={(data) => {
                                                }}
                                                extraParamsToCheckDelete={true}
                                                onDelete={(data) => {
                                                }}
                                                rowCount={rowCount}
                                                page={page}
                                                loading={loading}
                                                additionalDetails={[]}
                                                owerCollaboratorInitialsOrImages=""
                                                onCreate={false}
                                                showClone={true}
                                                onClone={(data) => {
                                                }}
                                                chips={[]}
                                                renderedFrom={renderedFrom}
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
                                                allowAction={true}
                                                loading={loading}
                                                renderedFrom={renderedFrom}
                                                refreshGrid={fetchFieldTicketData}
                                                showOnlyShowFilteredRecordSwitch={false}
                                                showFilters={false}
                                                resource={sidebarResource.fieldTicket}
                                                allowSelection={false}
                                            />
                                        )
                                    ) : null}
                                </Box>
                            </Grid>
                        </Grid>
                    )
                        :
                        (
                            <Box p={2} height={500}>
                                <CommonSkeleton lenArray={[...Array(10).keys()]} />
                            </Box>
                        )
                }
            </Box>
            {createInvoiceDialog.open && <CreateInvoiceDialog
                fieldTicketData={createInvoiceDialog.data}
                onClose={() => setCreateInvoiceDialog({ open: false, data: null })}
                onSuccess={() => {
                    setCreateInvoiceDialog({ open: false, data: null });
                    fetchFieldTicketData();
                }}
            />}
            {viewInvoiceDialog.open && (
                <ViewInvoice
                    pageData={null}
                    invoiceData={{ ...viewInvoiceDialog.data, invoiceNumber: viewInvoiceDialog?.data?.invoice, _id: viewInvoiceDialog?.data?.invoiceId }}
                    estimateStartDate={null}
                    onClose={() => {
                        setViewInvoiceDialog({ open: false, data: null });
                    }}
                    onSuccess={() => {
                        setViewInvoiceDialog({ open: false, data: null });
                    }}
                />
            )}
        </Box>
    );
};

export default FieldTicketInvoice;

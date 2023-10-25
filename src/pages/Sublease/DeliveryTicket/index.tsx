import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
    deliveryTicket,
    gridLoadingTimeout,
    DELIVERY_TICKET_STATUS,
    DELIVERY_TICKET_TYPE,
    DELIVERY_TICKET_REFERENCE_TYPE,
    DELIVERY_FROM_TO_TYPE,
    repairOrder,
    ASSET_STATUS,
    WORK_ORDER_STATUS,
    productionOrder,
    CHILD_RESOURCE,
    sublease
} from '../../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { uniq, map, startCase, upperFirst, capitalize } from 'lodash';
import { ExpandMore } from '@material-ui/icons';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { useAppTheme } from 'src/constants/AppConfig';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { generateCustomTableColumns } from 'src/constants/columns';


const LoadingTicket = ({ subleaseData, fetchData, ticketType, setNextStep, stepFullScreen, renderedFrom, allowedToEdit, setCurrentStep }) => {
    const toastConfig = useContext(CustomToastContext);
    const [columns, setColumns] = useState(null);
    const [anchorActionEl, setAnchorActionEl] = useState(null);
    const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
    const [rowsData, setRowsData] = useState(null);
    const [selectedRecords, setSelectedRecords] = useState([]);

    useEffect(() => {
        fetchFields();
    }, [])

    const fetchRecords = async () => {
        setNextStep(false);
        try {
            var data: any = [];

            const response = await axiosInstance().get(`${sublease.api}/asset/${subleaseData._id}`);
            data = response?.data?.data;
            let rows = data.filter((e) => !e?.parentId);

            const {
                data: { data: deliveryTicketList }
            } = await axiosInstance().get(
                `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.sublease}&referenceId=${subleaseData._id}`
            );
            rows.forEach((parent, i) => {
                parent.index = i + 1;
                parent.detail = parent.assetNumber
                parent.type = 'Asset'
            });

            deliveryTicketList?.map((obj) => {
                if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
                    rows.map((d, index) => {
                        if (obj?.productInventory?.some((p) => d?._id === p?.optionValue)) {
                            rows[index][`LoadingTicket`] = obj?.ticketName;
                            rows[index][`LoadingTicketId`] = obj?._id;
                            rows[index][`LoadingTicketStatus`] = obj?.status;
                            if (obj?.status === DELIVERY_TICKET_STATUS.delivered && ticketType === DELIVERY_TICKET_TYPE.loading) {
                                rows[index]['hideSelection'] = true;
                            }
                        }
                    });
                }
            });
            if (ticketType === DELIVERY_TICKET_TYPE.receiving) {
                deliveryTicketList?.map((obj) => {
                    if (obj.ticketType === DELIVERY_TICKET_TYPE.receiving) {
                        rows.map((d, index) => {
                            if (obj?.productInventory?.some((p) => d?._id === p?.optionValue)) {
                                rows[index][`ReceivingTicket`] = obj?.ticketName;
                                rows[index][`ReceivingTicketId`] = obj?._id;
                                rows[index][`ReceivingTicketStatus`] = obj?.status;
                                if (obj?.status === DELIVERY_TICKET_STATUS.delivered && ticketType === DELIVERY_TICKET_TYPE.receiving) {
                                    rows[index]['hideSelection'] = true;
                                }
                            }
                        });
                    }
                });
            }
            setRowsData(rows);
            if (rows?.every((e) => e[`${ticketType}TicketStatus`] === DELIVERY_TICKET_STATUS.delivered)) {
                setNextStep(true);
            }
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };
    const fetchFields = async () => {
        let coloum: any = [
            {
                accessor: 'index',
                Header: 'Index',
                width: 70,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
                Footer: () => {
                    return <>Total</>;
                }
            },
            {
                accessor: 'type',
                Header: 'Type',
                disableFilters: true,
                sticky: isMobile ? 'none' : 'left',
                width: 200,
                Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
            },
            {
                accessor: 'detail',
                Header: ' Details',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row, rows }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p className="text-truncate">{row.original?.detail}</p>
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    if (row.original.type === 'product') {
                                        window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                                    } else {
                                        window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                                    }
                                }}
                            >
                                <OpenInNewIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Box>
                    </div>
                )
            },
            {
                accessor: 'description',
                Header: 'Description',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
                }
            },
            {
                accessor: `Status`,
                Header: `status`,
                width: 200,
                Cell: ({ row }) => row?.original[`status`] ? <p className="text-truncate">{row?.original[`status`]}</p> : <NoDataCell />
            },
            {
                accessor: `LoadingTicket`,
                Header: `Loading Ticket`,
                width: 200,
                Cell: ({ row }) => row?.original[`LoadingTicket`] ?
                    <div style={{ display: "flex" }}>
                        <p className="text-truncate">{row?.original[`LoadingTicket`]}</p>
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    window.open(`${routes.deliveryTicketDetail.path}/${row.original[`LoadingTicketId`]}`);
                                }}
                            >
                                <OpenInNewIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Box>
                    </div>
                    : <NoDataCell />
            }, {
                accessor: `LoadingTicketStatus`,
                Header: `Loading Ticket Status`,
                width: 200,
                Cell: ({ row }) => row?.original[`LoadingTicketStatus`] ? <p className="text-truncate">{row?.original[`LoadingTicketStatus`]}</p> : <NoDataCell />
            },
            ...(ticketType === DELIVERY_TICKET_TYPE.receiving ? [{
                accessor: `ReceivingTicket`,
                Header: `Receiving Ticket`,
                width: 200,
                Cell: ({ row }) => row?.original[`ReceivingTicket`] ?
                    <div style={{ display: "flex" }}>
                        <p className="text-truncate">{row?.original[`ReceivingTicket`]}</p>
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    window.open(`${routes.deliveryTicketDetail.path}/${row.original[`ReceivingTicketId`]}`);
                                }}
                            >
                                <OpenInNewIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Box>
                    </div>
                    : <NoDataCell />
            }, {
                accessor: `ReceivingTicketStatus`,
                Header: `Receiving Ticket Status`,
                width: 200,
                Cell: ({ row }) => row?.original[`ReceivingTicketStatus`] ? <p className="text-truncate">{row?.original[`ReceivingTicketStatus`]}</p> : <NoDataCell />
            }] : [])
        ];
        coloum = [...coloum];
        setColumns(coloum);
        fetchRecords();
    };
    const openActions = (event) => {
        setAnchorActionEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorActionEl(null);
    };


    const handleDeliveryTicketDialog = () => {
        if (selectedRecords.length) {
            const data = {};
            data['ticketName'] = subleaseData?.subleaseName || "";
            data['referenceId'] = subleaseData._id;
            data['startDate'] = new Date();
            data['endDate'] = new Date();
            data['isPickupFromDisable'] = true;
            data['isDeliveryToDisable'] = true;
            if (ticketType === DELIVERY_TICKET_TYPE.loading) {
                data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
                data['pickupFrom'] = subleaseData?.warehouse?.optionValue;
                data['pickupFromAddress'] = subleaseData?.warehouse?.optionValue;
                data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
                data['deliveryTo'] = subleaseData?.fromWarehouse?.optionValue;
                data['deliveryToAddress'] = subleaseData?.fromWarehouse?.optionValue;
            } else {
                data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
                data['pickupFrom'] = subleaseData?.fromWarehouse?.optionValue;
                data['pickupFromAddress'] = subleaseData?.fromWarehouse?.optionValue;
                data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
                data['deliveryTo'] = subleaseData?.warehouse?.optionValue;
                data['deliveryToAddress'] = subleaseData?.warehouse?.optionValue;
            }
            if (subleaseData?.processor?.optionValue) {
                data['processor'] = subleaseData?.processor?.optionValue;
            }
            data['status'] = DELIVERY_TICKET_STATUS.indTransit;
            setShowTicketDialog({ open: true, data: data });
        }
    };

    const handelProcessTickets = () => {
        let data = {};
        const loadingTicketIds = uniq(map(selectedRecords, `${ticketType}TicketId`));
        if (loadingTicketIds.length) {
            data['_ids'] = loadingTicketIds?.map((e) => e);
            data['status'] = DELIVERY_TICKET_STATUS.delivered;
            data['signatures'] = [];
            data['warehouse'] = subleaseData?.warehouse?.optionValue;
            axiosInstance()
                .post(`${deliveryTicket.api}/updatebulk`, data)
                .then(({ data: { data } }) => {
                    fetchRecords();
                    fetchData();
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: `Delivered Successfully`
                    });
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
    };

    return (
        <>
            <Box display="flex" justifyContent="flex-end" pt={1}>
                <Box display="flex" alignItems="center" gridGap={8}>
                    {allowedToEdit && (
                        <Fragment>
                            <Button
                                variant="outlined"
                                color="default"
                                size="small"
                                onClick={openActions}
                                aria-controls="action-menu"
                                disabled={selectedRecords.length === 0}
                                endIcon={<ExpandMore />}
                                className="new-dropdown-v1"
                            >
                                Actions
                            </Button>
                            <Menu
                                anchorEl={anchorActionEl}
                                keepMounted
                                getContentAnchorEl={null}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left'
                                }}
                                id="action-menu"
                                open={Boolean(anchorActionEl)}
                                onClose={closeActions}
                            >
                                {
                                    ticketType === DELIVERY_TICKET_TYPE.loading && (
                                        <MenuItem
                                            onClick={() => {
                                                closeActions();
                                                handleDeliveryTicketDialog();
                                            }}
                                            disabled={selectedRecords.length === 0 || selectedRecords.some((f) => f.hasOwnProperty(`LoadingTicketId`))}
                                        >
                                            Create Loading Ticket
                                        </MenuItem>
                                    )
                                }
                                {
                                    ticketType === DELIVERY_TICKET_TYPE.receiving && (
                                        <MenuItem
                                            onClick={() => {
                                                closeActions();
                                                handleDeliveryTicketDialog();
                                            }}
                                            disabled={selectedRecords.length === 0 || (selectedRecords.some((f) => f.hasOwnProperty(`ReceivingTicketId`)) || !selectedRecords?.every((f) => f.hasOwnProperty(`LoadingTicketId`) || f.status !== ASSET_STATUS.available))}
                                        >
                                            Create Receiving Ticket
                                        </MenuItem>
                                    )
                                }
                                <MenuItem
                                    disabled={
                                        selectedRecords.length === 0 ||
                                        selectedRecords.filter((e: any) => e[`${ticketType}TicketStatus`] === DELIVERY_TICKET_STATUS.indTransit).length !== selectedRecords.length
                                    }
                                    onClick={() => {
                                        handelProcessTickets();
                                        closeActions();
                                    }}
                                >{
                                        ticketType === 'loading' ? 'Delivered to Plant' : 'Received at Plant'
                                    }
                                </MenuItem>
                            </Menu>
                            <Box mx={1} />
                        </Fragment>
                    )}
                </Box>
            </Box>
            <Grid item xs={12} md={12} sm={12} className="mt-3">
                {columns && rowsData ? (
                    <>
                        <Box zIndex={5} width={'100%'}>
                            <CustomReactTable
                                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
                                columns={columns}
                                data={rowsData}
                                setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
                                onSelect={setSelectedRecords}
                                childrenProperty="subRows"
                                uniqueKey="_id"
                                renderedFrom={renderedFrom}
                                isClientSideGrid={true}
                                hideExpander={true}
                                hideSelection={!allowedToEdit}
                                hideAction={true}
                            />
                        </Box>
                    </>
                ) : (
                    <Box p={2} height={500}>
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </Grid>
            {showTicketDialog.open && (
                <ManageDeliveryTicket
                    ticketType={ticketType}
                    referenceType={DELIVERY_TICKET_REFERENCE_TYPE.sublease}
                    referenceData={showTicketDialog.data}
                    onClose={() => setShowTicketDialog({ open: false, data: {} })}
                    productInventory={selectedRecords}
                    products={[]}
                    onSuccess={() => {
                        setShowTicketDialog({ open: false, data: {} });
                        fetchRecords();
                    }}
                />
            )}
        </>
    );
};

export default LoadingTicket;
import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import {
    deliveryTicket,
    DELIVERY_TICKET_STATUS,
    DELIVERY_TICKET_TYPE,
    DELIVERY_TICKET_REFERENCE_TYPE,
    DELIVERY_FROM_TO_TYPE,
    sublease
} from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { uniq, map, startCase } from 'lodash';
import { ExpandMore } from '@material-ui/icons';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { subleaseActions, subleaseMessage } from 'src/constants/messageHelpers';
import CustomMessageDialog from 'src/components/MessageDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';


const LoadingTicket = ({ subleaseData, fetchData, ticketType, setNextStep, setNextStepToolTip, stepFullScreen, renderedFrom, allowedToEdit }) => {
    const { state, dispatch } = useTableReducer();
    const { selectedRecords } = state;
    const toastConfig = useContext(CustomToastContext);
    const [columns, setColumns] = useState(null);
    const [anchorActionEl, setAnchorActionEl] = useState(null);
    const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
    const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });

    useEffect(() => {
        fetchFields();
    }, [])

    const fetchFields = async () => {
        let coloum: any = [
            {
                accessor: 'index',
                Header: 'Index',
                width: 70,
                sticky: 'left',
                Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
            },
            {
                accessor: 'type',
                Header: 'Type',
                disableFilters: true,
                sticky: isMobile || isTablet ? 'none' : 'left',
                width: 100,
                Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
            },
            {
                accessor: 'detail',
                Header: ' Details',
                minWidth: 200,
                width: 200,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p className="text-truncate">{row.original?.detail}</p>
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    window.open(`${routes.serializedAssetDetail.path}/${row.original._id}`);
                                }}
                            >
                                <OpenInNewIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Box>
                    </div>
                )
            },
            {
                accessor: `productName`,
                Header: `Product`,
                width: 200,
                Cell: ({ row }) => row?.original?.productName ?
                    <div style={{ display: "flex", alignItems: 'center' }}>
                        <p className="text-truncate">{row?.original?.productName}</p>
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    window.open(`${routes.productDetail.path}/${row.original?.productId}`);
                                }}
                            >
                                <OpenInNewIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Box>
                    </div>
                    : <NoDataCell />
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
                accessor: `status`,
                Header: `Status`,
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
            },
            {
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

    const fetchRecords = async () => {
        dispatch({ type: 'loading', loading: true });
        dispatch({ type: 'selection', selectedRecords: [] });
        setNextStep(false);
        setNextStepToolTip(null);
        try {
            var data: any = [];

            const response = await axiosInstance().get(`${sublease.api}/asset/${subleaseData._id}`);
            data = response?.data?.data;
            let rows = data.filter((e) => !e?.parentId);

            const { data: { data: deliveryTicketList } } = await axiosInstance().get(
                `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.sublease}&referenceId=${subleaseData._id}`
            );

            rows.forEach((parent, i) => {
                parent.index = i + 1;
                parent.detail = parent.assetNumber
                parent.productName = parent?.product?.optionLabel
                parent.productId = parent?.product?.optionValue
                parent.description = parent?.productDescription?.optionLabel
                parent.type = 'Asset'
            });

            deliveryTicketList?.map((obj) => {
                if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
                    rows.map((d, index) => {
                        if (obj?.productInventory?.some((p) => d?._id === p?.optionValue)) {
                            rows[index][`LoadingTicket`] = obj?.ticketName;
                            rows[index][`LoadingTicketId`] = obj?._id;
                            rows[index][`LoadingTicketStatus`] = obj?.status;
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

                            }
                        });
                    }
                });
            }
            dispatch({ type: 'initialize', data: rows, count: rows?.length });
            dispatch({ type: 'loading', loading: false });
            if (rows?.every((e) => e[`${ticketType}TicketStatus`] === DELIVERY_TICKET_STATUS.delivered)) {
                setNextStep(true);
                setNextStepToolTip(null);
            } else {
                setNextStep(false);
                if (ticketType === DELIVERY_TICKET_TYPE.loading) {
                    setNextStepToolTip(subleaseMessage.deliverLoadingTicketStep);
                } else if (ticketType === DELIVERY_TICKET_TYPE.receiving) {
                    setNextStepToolTip(subleaseMessage.deliverReceivingTicketStep);
                }
            }
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
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
                data['pickupFrom'] = subleaseData?.fromWarehouse?.optionValue;
                data['pickupFromAddress'] = subleaseData?.fromWarehouse?.optionValue;
                data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
                data['deliveryTo'] = subleaseData?.toWarehouse?.optionValue;
                data['deliveryToAddress'] = subleaseData?.toWarehouse?.optionValue;
            } else {
                data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
                data['pickupFrom'] = subleaseData?.toWarehouse?.optionValue;
                data['pickupFromAddress'] = subleaseData?.toWarehouse?.optionValue;
                data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
                data['deliveryTo'] = subleaseData?.fromWarehouse?.optionValue;
                data['deliveryToAddress'] = subleaseData?.fromWarehouse?.optionValue;
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

    const validateAction = (action) => {
        const errorMessages = [];
        selectedRecords?.forEach((e) => {
            if (action === subleaseActions.createLoadingTicket) {
                if (e.hasOwnProperty('LoadingTicketId')) {
                    errorMessages.push({ index: e.index, message: subleaseMessage.loadingAlreadyCreated });
                }
            }
            else if (action === subleaseActions.createReceivingTicket) {
                if (e.hasOwnProperty('ReceivingTicketId')) {
                    errorMessages.push({ index: e.index, message: subleaseMessage.receivingAlreadyCreated });
                }
            }
            else if (action === subleaseActions.deliveredToWarehouse) {
                if (!e.hasOwnProperty('LoadingTicketId')) {
                    errorMessages.push({ index: e.index, message: subleaseMessage.loadingNotCreated });
                }
                else if (e?.LoadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
                    errorMessages.push({ index: e.index, message: subleaseMessage.loadingAlreadyDelivered });
                }
            }
            else if (action === subleaseActions.receivedToWarehouse) {
                if (!e.hasOwnProperty('ReceivingTicketId')) {
                    errorMessages.push({ index: e.index, message: subleaseMessage.receivingNotCreated });
                }
                else if (e?.ReceivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
                    errorMessages.push({ index: e.index, message: subleaseMessage.receivingAlreadyDelivered });
                }
            }
        });
        if (errorMessages?.length) {
            setOpenMessageDialog({ open: true, errorMessages: errorMessages });
            return true;
        }
        return false;
    };

    return (
        <>
            <Box display="flex" justifyContent="flex-end" m={1}>
                <Box display="flex" alignItems="center" >
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
                        {ticketType === DELIVERY_TICKET_TYPE.loading && (
                            <MenuItem
                                onClick={() => {
                                    if (!validateAction(subleaseActions.createLoadingTicket)) {
                                        handleDeliveryTicketDialog();
                                    }
                                    closeActions();
                                }}
                            >
                                Create Loading Ticket
                            </MenuItem>
                        )}
                        {ticketType === DELIVERY_TICKET_TYPE.receiving && (
                            <MenuItem
                                onClick={() => {
                                    if (!validateAction(subleaseActions.createReceivingTicket)) {
                                        handleDeliveryTicketDialog();
                                    }
                                    closeActions();
                                }}
                            >
                                Create Receiving Ticket
                            </MenuItem>
                        )}
                        <MenuItem
                            onClick={() => {
                                if (ticketType === DELIVERY_TICKET_TYPE.loading && !validateAction(subleaseActions.deliveredToWarehouse)) {
                                    handelProcessTickets();
                                }
                                else if (ticketType === DELIVERY_TICKET_TYPE.receiving && !validateAction(subleaseActions.receivedToWarehouse)) {
                                    handelProcessTickets();
                                }
                                closeActions();
                            }}
                        >{ticketType === DELIVERY_TICKET_TYPE.loading ? 'Delivered to Plant' : 'Received at Plant'}
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>
            <Grid item xs={12} md={12} sm={12} className="mt-3">
                {columns ? (
                    <Box zIndex={5}>
                        <CustomReactTable
                            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
                            columns={columns}
                            state={state}
                            dispatch={dispatch}
                            refreshGrid={fetchRecords}
                            renderedFrom={renderedFrom}
                            isClientSideGrid={true}
                            hideSelection={!allowedToEdit}
                            hideAction={true}
                        />
                    </Box>
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
            {openMessageDialog.open && (
                <CustomMessageDialog
                    open={openMessageDialog.open}
                    errorMessages={openMessageDialog.errorMessages}
                    onClose={() => {
                        setOpenMessageDialog({ open: false, errorMessages: [] });
                    }}
                />
            )}
        </>
    );
};

export default LoadingTicket;
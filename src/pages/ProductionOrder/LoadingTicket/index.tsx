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
    productionOrder,
    CHILD_RESOURCE,
    MATERIAL_TYPE
} from '../../../constants/helpers';
import { isMobile } from 'react-device-detect';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { uniq, map, startCase } from 'lodash';
import { ExpandMore } from '@material-ui/icons';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { generateCustomTableColumns } from 'src/constants/columns';


const LoadingTicket = ({ productionOrderData, setNextStep, stepFullScreen, renderedFrom, allowedToEdit }) => {

    const toastConfig = useContext(CustomToastContext);
    const [columns, setColumns] = useState(null);
    const [anchorActionEl, setAnchorActionEl] = useState(null);
    const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
    const [rowsData, setRowsData] = useState(null);
    const [selectedRecords, setSelectedRecords] = useState([]);

    const {
        state: { user, permissions }
    }: any = useData();

    useEffect(() => {
        fetchFields();
    }, [])

    const fetchRecords = async () => {
        setNextStep(false);
        try {
            var data: any = [];

            const response = await axiosInstance().get(`${productionOrder.api}/material/${productionOrderData._id}`);
            data = response?.data?.data;
            let rows = data.material.filter((e) => e.type === MATERIAL_TYPE.product);

            const { data: { data: deliveryTicketList } } = await axiosInstance().get(
                `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.productionOrder}&referenceId=${productionOrderData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
            );
            rows.forEach((parent, i) => {
                parent.index = i + 1;
                parent.detail = parent.productDetail?.productName;
                parent.description = parent?.productDetail?.productDescription;
                parent.qty = parent.qty;
            });
            deliveryTicketList?.map((obj) => {
                if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
                    rows.map((d, index) => {
                        if (obj?.products?.some((p) => d?.materialId === p?.product)) {
                            rows[index]['loadingTicket'] = obj?.ticketName;
                            rows[index]['loadingTicketId'] = obj?._id;
                            rows[index]['loadingTicketStatus'] = obj?.status;
                            if (obj?.status === DELIVERY_TICKET_STATUS.delivered) {
                                rows[index]['hideSelection'] = true;
                            }
                        }
                    });
                }
            });
            if (rows?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered)?.length === rows?.length) {
                setNextStep(true);
            }
            setRowsData(rows);
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const fetchFields = async () => {
        const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.productionOrderDetail}`);
        var data = response?.data?.data;
        data = CURReplaceByCurrencySingle(data, productionOrderData?.currency || 'USD');
        data?.forEach((e) => {
            e.isColumnEditable = false;
        });
        const newColumns = generateCustomTableColumns(data, productionOrderData?.currency || 'USD', renderedFrom);
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
                width: 100,
                Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
            },
            {
                accessor: 'detail',
                Header: ' Details',
                minWidth: 200,
                width: 200,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row, rows }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p className="text-truncate">{row.original?.detail}</p>
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
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
                accessor: 'loadingTicket',
                Header: 'Loading Ticket',
                width: 200,
                Cell: ({ row }) => row?.original?.loadingTicket ?
                    <div style={{ display: "flex" }}>
                        <p className="text-truncate">{row?.original?.loadingTicket}</p>
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    window.open(`${routes.deliveryTicketDetail.path}/${row.original.loadingTicketId}`);
                                }}
                            >
                                <OpenInNewIcon fontSize="small" color="primary" />
                            </IconButton>
                        </Box>
                    </div>
                    : <NoDataCell />
            }, {
                accessor: 'loadingTicketStatus',
                Header: 'Loading Ticket Status',
                width: 200,
                Cell: ({ row }) => row?.original?.loadingTicketStatus ? <p className="text-truncate">{row?.original?.loadingTicketStatus}</p> : <NoDataCell />
            }
        ];
        coloum = [...coloum, ...newColumns];
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
            data['ticketName'] = productionOrderData?.productionOrderNumber || "";
            data['referenceId'] = productionOrderData._id;
            data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
            data['pickupFrom'] = productionOrderData?.warehouse?.optionValue;
            data['pickupFromAddress'] = productionOrderData?.warehouse?.optionValue;
            data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
            data['deliveryTo'] = productionOrderData?.customerAccount?.optionValue;
            data['deliveryToAddress'] = productionOrderData?.shippingAddress?.optionValue;
            data['startDate'] = new Date();
            data['endDate'] = new Date();
            data['isPickupFromDisable'] = true;
            data['isDeliveryToDisable'] = true;
            if (productionOrderData?.processor?.optionValue) {
                data['processor'] = productionOrderData?.processor?.optionValue;
            }
            data['status'] = DELIVERY_TICKET_STATUS.indTransit;
            setShowTicketDialog({ open: true, data: data });
        }
    };

    const handelProcessTickets = () => {
        let data = {};
        const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
        if (loadingTicketIds.length) {
            data['_ids'] = loadingTicketIds?.map((e) => e);
            data['status'] = DELIVERY_TICKET_STATUS.delivered;
            data['signatures'] = [];
            data['warehouse'] = productionOrderData?.warehouse?.optionValue;
            axiosInstance()
                .post(`${deliveryTicket.api}/updatebulk`, data)
                .then(({ data: { data } }) => {
                    fetchRecords();
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
                                <MenuItem
                                    onClick={() => {
                                        closeActions();
                                        handleDeliveryTicketDialog();
                                    }}
                                    disabled={selectedRecords.length === 0 || selectedRecords.some((f) => f.hasOwnProperty('loadingTicketId'))}
                                >
                                    Create Loading Ticket
                                </MenuItem>
                                <MenuItem
                                    disabled={
                                        selectedRecords.length === 0 ||
                                        selectedRecords.filter((e: any) => e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.indTransit).length !== selectedRecords.length
                                    }
                                    onClick={() => {
                                        handelProcessTickets();
                                        closeActions();
                                    }}
                                >
                                    Delivered to Customer
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
                                hideSelection={!allowedToEdit}
                                hideAction={!allowedToEdit}
                                hideExpander={true}
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
                    ticketType={DELIVERY_TICKET_TYPE.loading}
                    referenceType={DELIVERY_TICKET_REFERENCE_TYPE.productionOrder}
                    referenceData={showTicketDialog.data}
                    onClose={() => setShowTicketDialog({ open: false, data: {} })}
                    productInventory={[]}
                    products={selectedRecords?.map((e) => ({ ...e, _id: e?.materialId }))}
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
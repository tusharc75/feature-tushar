import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Checkbox, Chip, CircularProgress, Dialog, FormControlLabel, FormGroup, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { useData } from 'src/StateProvider/Provider';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import moment from 'moment';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, fieldTicket } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { fetch_field_ticket_material_fields } from '../helper';
import { generateCustomTableColumns } from 'src/constants/columns';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import EditIcon from '@material-ui/icons/Edit';
import { startCase } from 'lodash';


const CreateInvoiceDialog = ({ id, fieldTicketData, renderedFrom, invoiceData, onSuccess, onClose }) => {
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();

    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [isUpdating, setUpdating] = useState(false);


    useEffect(() => {
        fetchFields();
    }, []);

    useEffect(() => {
        if (columns) {
            fetchData();
        }
    }, [columns]);

    const fetchFields = async () => {
        setColumns(null);
        var { fields: data, allFields } = await fetch_field_ticket_material_fields(fieldTicketData?.currency);

        const newColumns = generateCustomTableColumns(data, fieldTicketData?.currency, renderedFrom);
        let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
        if (qtyIndex > -1) {
            newColumns[qtyIndex].accessor = 'qtyDisplay';
        }
        let column: any = [
            {
                accessor: 'srno',
                Header: 'Index',
                width: 70,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
                Footer: () => {
                    return <>Total</>;
                }
            },
            {
                accessor: 'type',
                Header: 'Type',
                sticky: isMobile ? 'none' : 'left',
                width: 150,
                disableFilters: true,
                Cell: ({ row }) =>
                    row.original['type'] ? (
                        <p> {`${startCase(row.original?.type)} `} </p>
                    ) : (
                        <NoDataCell />
                    )
            },
            {
                accessor: 'detail',
                Header: 'Details',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p> {row.original.detail}</p>
                        <Box ml={1}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    if (row?.original?.type === 'product' || row?.original?.type === 'service') {
                                        let path = routes.serviceMasterDetail.path;
                                        if (row?.original?.type === 'product') {
                                            path = routes.productDetail.path;
                                        }
                                        window.open(`${path}/${row.original.materialId}`);
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
            }
        ];
        column = [...column, ...newColumns];
        // column.push({
        //     accessor: 'action',
        //     Header: '',
        //     minWidth: 50,
        //     width: 50,
        //     sticky: 'right',
        //     disableFilters: true,
        //     canDrag: false,
        //     Cell: ({ row }) =>
        //         row?.original?.isEditable ? (
        //             <IconButton
        //                 size="small"
        //                 aria-label="Details"
        //                 onClick={() => {
        //                     // setIsProductEdit({ open: true, rowData: row.original });
        //                 }}
        //             >
        //                 <EditIcon color="primary" />
        //             </IconButton>
        //         )
        //             :
        //             ''
        // });
        setColumns(column);
    };

    const fetchData = async () => {
        const response = await axiosInstance().get(`${fieldTicket.api}/${id}/material`);
        const data = response?.data?.data?.material;
        data.forEach((parent, i) => {
            console.log('invoiceData', invoiceData, parent?._id)
            invoiceData?.forEach(invoice => {
                invoice?.material?.forEach(_m => {
                    if (_m?._id === parent?._id) {
                        parent.hideSelection = true;
                        parent.isAppliedInvoice = true;
                    }
                })
            });
            parent.srno = i + 1;
            parent.detail =
                parent?.type === 'service' ?
                    parent?.serviceDetail?.serviceName
                    :
                    parent?.type === 'product' ?
                        parent?.productDetail?.productName
                        :
                        ''
            parent.description =
                parent?.type === 'service' ?
                    parent?.serviceDetail?.serviceDescription || ''
                    :
                    parent?.type === 'product' ?
                        parent?.productDetail?.productDescription
                        :
                        '- - -'
            parent.qtyDisplay = parent.qty;
            parent.type = parent.type;
            parent.isValid = parent['finalPrice_' + fieldTicketData?.currency?.toLowerCase()] ? true : false;
            if (!parent.isValid) {
                parent.hideSelection = true;
            }
        });
        setRowsData(data);
        setSelectedRecords([]);
    }

    const handleCreateInvoice = () => {
        selectedRecords?.forEach((element) => {
            delete element?.srno;
            delete element?.detail;
            delete element?.qtyDisplay;
            delete element?.productDetail;
            delete element?.serviceDetail;
            delete element?.service;
            delete element?.description;
        });
        console.log('selectedRecords', selectedRecords)
        setUpdating(true);
        axiosInstance()
            .post(`${fieldTicket.api}/${id}/invoice`, {
                material: selectedRecords,
            })
            .then(() => {
                setUpdating(false);
                onSuccess();
            })
            .catch((error) => {
                setUpdating(false);
                toastConfig.setToastConfig(error);
            });
    };

    return (
        <>
            <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
                <CustomDialogHeader title={`Create Invoice `} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
                <CustomDialogContent>
                    <>
                        {columns && rowsData ? (
                            <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} p={1}>
                                <CustomReactTable
                                    height={'calc(100vh - 285px)'}
                                    columns={columns}
                                    data={rowsData}
                                    setWholeRowsCellColor={(rowData) => {
                                        if (!rowData?.isValid) return 'error';
                                        if (rowData?.isAppliedInvoice) return 'isAppliedBill';
                                    }}
                                    onSelect={setSelectedRecords}
                                    childrenProperty="subRows"
                                    uniqueKey="_id"
                                    renderedFrom="field_ticket_create_invoice"
                                    isClientSideGrid={true}
                                    hideExpander={true}
                                />
                            </Box>
                        ) : (
                            <Box p={2} height={500}>
                                <CommonSkeleton lenArray={[...Array(10).keys()]} />
                            </Box>
                        )}
                    </>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button
                        type="button"
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                            onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <HtmlTooltip
                        title={
                            !selectedRecords?.length
                                ? 'Please select items '
                                : ''
                        }
                    >
                        <span>
                            <Button
                                type="button"
                                variant="contained"
                                color="primary"
                                size="small"
                                disabled={isUpdating || selectedRecords?.length ? false : true}
                                onClick={() => {
                                    handleCreateInvoice();
                                }}
                            >
                                Create Invoice
                            </Button>
                        </span>
                    </HtmlTooltip>
                </CustomDialogFooter>
            </Dialog>
        </>
    );
};

export default CreateInvoiceDialog;

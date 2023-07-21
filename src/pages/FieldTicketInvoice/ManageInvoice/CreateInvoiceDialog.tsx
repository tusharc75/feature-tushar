import { useState, useEffect, useContext, } from 'react';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Dialog, IconButton } from '@material-ui/core';
import { useData } from 'src/StateProvider/Provider';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { generateCustomTableColumns } from 'src/constants/columns';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { startCase } from 'lodash';
import { fetch_field_ticket_material_fields } from 'src/pages/FieldTicket/helper';




const CreateInvoiceDialog = ({ fieldTicketData, onSuccess, onClose }) => {
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();

    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    // const [selectedRecords, setSelectedRecords] = useState([]);
    // const [isUpdating, setUpdating] = useState(false);
    // const [allFields, setAllFields] = useState([]);
    // const [material, setMaterial] = useState([]);
    // const [orginalMaterial, setOrginalMaterial] = useState([]);
    // const [appliedDate, setAppliedDate] = useState(false);
    // const [rowsApplied, setRowsApplied] = useState([]);


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

        const newColumns = generateCustomTableColumns(data, fieldTicketData?.currency, 'field_ticket_create_invoice');
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
                        {row.original['type'] !== 'additionalCost' && (
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
                        )}
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
        setColumns(column);
    };

    const fetchData = async () => {
        let data = [];
        const response = await axiosInstance().get(`/field-ticket/${fieldTicketData._id}/material`);
        const material = response?.data?.data?.material

        const responseAdditionalCostData = await axiosInstance().get(`/field-ticket/${fieldTicketData._id}/cost`);
        let additionalCostData = responseAdditionalCostData?.data?.data || [];

        material?.forEach((parent, i) => {
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
            if (parent?.estimateStartDate || parent?.estimateEndDate) {
                parent['actualStartDate'] = parent?.estimateStartDate;
                parent['actualEndDate'] = parent?.estimateEndDate;
                parent['actualJobDuration'] = parent?.estimateJobDuration;
            }
        });

        data = [...material, ...additionalCostData]

        setRowsData(data);
    }


    const handleCreateInvoice = () => {
        rowsData?.forEach((element) => {
            delete element?.srno;
            delete element?.detail;
            delete element?.qtyDisplay;
            delete element?.productDetail;
            delete element?.serviceDetail;
            delete element?.service;
            delete element?.description;
        });
        axiosInstance()
            .post(`${routes.fieldTicketInvoice.path}/${fieldTicketData._id}/invoice`, {
                material: rowsData.filter((d) => d.type !== 'additionalCost'),
                additionalCost: rowsData.filter((d) => d.type === 'additionalCost')
            })
            .then(() => {
                onSuccess();
                toastConfig.setToastConfig({
                    open: true,
                    message: 'Invoice created successfully',
                    severity: 'success'
                })
            })
            .catch((error) => {
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
                                        if (rowData?.invalidDate) return 'error';
                                        if (rowData?.isAppliedBill) return 'isAppliedBill';
                                        return ''
                                    }}
                                    onSelect={() => { }}
                                    childrenProperty="subRows"
                                    uniqueKey="_id"
                                    renderedFrom="field_ticket_create_invoice"
                                    isClientSideGrid={true}
                                    hideExpander={true}
                                    hideSelection={true}
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
                        title={'Create Invoice'}
                    >
                        <span>
                            <Button
                                type="button"
                                variant="contained"
                                color="primary"
                                size="small"
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
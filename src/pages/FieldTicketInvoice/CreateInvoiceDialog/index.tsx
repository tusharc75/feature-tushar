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

    const renderedFrom = 'field_ticket_create_invoice';

    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);

    useEffect(() => {
        fetchFields();
        fetchData();
    }, []);

    const fetchFields = async () => {
        setColumns(null);
        var { fields } = await fetch_field_ticket_material_fields(fieldTicketData?.currency);
        const newColumns = generateCustomTableColumns(fields, fieldTicketData?.currency, renderedFrom);
        let column: any = [
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
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p>{`${startCase(row.original?.type)} `}</p>
                    </div>
                )
            },
            {
                accessor: 'detail',
                Header: 'Details',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row, rows }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p title={row.original.detail}  >
                            {row.original.detail}
                        </p>
                        {['product', 'service'].includes(row.original.type) &&
                            <Box ml={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (row.original.type === 'service') {
                                            window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                                        } else if (row.original.type === 'product') {
                                            window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                                        }
                                    }}
                                >
                                    <OpenInNewIcon fontSize="small" color="primary" />
                                </IconButton>
                            </Box>}
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
        const materialResponce = await axiosInstance().get(`/field-ticket/${fieldTicketData._id}/material`);
        const material = materialResponce?.data?.data?.material

        const costResponce = await axiosInstance().get(`/field-ticket/${fieldTicketData._id}/cost`);
        const cost = costResponce?.data?.data || [];

        material?.forEach((parent, i) => {
            parent.index = i + 1;
            parent.detail = parent?.type === 'service' ? parent?.serviceDetail?.serviceName
                : parent?.type === 'product' ? parent?.productDetail?.productName
                    : ''
            parent.description = parent?.type === 'service' ? parent?.serviceDetail?.serviceDescription
                : parent?.type === 'product' ? parent?.productDetail?.productDescription
                    : ''
            parent.qty = parent.qty;
            parent.type = parent.type;
            if (parent?.estimateStartDate || parent?.estimateEndDate) {
                parent['actualStartDate'] = parent?.estimateStartDate;
                parent['actualEndDate'] = parent?.estimateEndDate;
                parent['actualJobDuration'] = parent?.estimateJobDuration;
            }
        });

        cost?.forEach((ele, i) => {
            ele.index = (i + 1) + material?.length;
            ele.type = 'manualEntry';
            ele.detail = ele.description;
        })

        data = [...material, ...cost]
        setRowsData(data);
    }

    const handleCreateInvoice = () => {
        rowsData?.forEach((element) => {
            if (element.type !== 'manualEntry') {
                delete element?.description;
            }
            delete element?.index;
            delete element?.detail;
            delete element?.productDetail;
            delete element?.serviceDetail;
            delete element?.estimateStartDate;
            delete element?.estimateEndDate;
            delete element?.estimateJobDuration;
        });
        axiosInstance().post(`${routes.fieldTicketInvoice.path}/${fieldTicketData._id}/invoice`, {
            material: rowsData.filter((d) => d.type !== 'manualEntry'),
            additionalCost: rowsData.filter((d) => d.type === 'manualEntry')
        })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    message: data.message,
                    severity: 'success'
                })
                onSuccess();
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}>
        <CustomDialogHeader
            title={`Create Invoice`}
            onClose={onClose}
            showRequiredLabel={false}></CustomDialogHeader>
        <CustomDialogContent>
            {columns && rowsData ? (
                <Box zIndex={5} width={'100%'} height={'calc(100vh - 180px)'} p={1}>
                    <CustomReactTable
                        height={'calc(100vh - 180px)'}
                        columns={columns}
                        data={rowsData}
                        onSelect={() => { }}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                        renderedFrom={renderedFrom}
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
            <HtmlTooltip title={'Create Invoice'}   >
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
            </HtmlTooltip>
        </CustomDialogFooter>
    </Dialog>

    );
};

export default CreateInvoiceDialog;
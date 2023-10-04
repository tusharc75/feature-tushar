import { useState, useEffect, useContext, } from 'react';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box, Dialog, IconButton } from '@material-ui/core';
import { isMobile } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, FIELD_TICKET_STATUS, MATERIAL_TYPE } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { generateCustomTableColumns } from 'src/constants/columns';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { camelCase, startCase } from 'lodash';
import { fetch_field_ticket_material_fields } from 'src/pages/FieldTicket/helper';
import { useData } from 'src/StateProvider/Provider';

const CreateInvoiceDialog = ({ fieldTicketData, onSuccess, onClose }) => {

    const toastConfig = useContext(CustomToastContext);

    const renderedFrom = `${camelCase(routes?.invoice.title)}_create`;

    const {
        state: { permissions, selectedEntity, user }
    }: any = useData();

    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);

    useEffect(() => {
        fetchFields();
        fetchData();
    }, []);

    const fetchFields = async () => {
        setColumns(null);
        const currency = fieldTicketData[0]?.currency;
        var fields = await fetch_field_ticket_material_fields(currency);
        fields?.forEach((e) => {
            e.isColumnEditable = false;
        });
        const newColumns = generateCustomTableColumns(fields, currency, renderedFrom);
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
                accessor: 'fieldTicketNumber',
                Header: 'Field Ticket',
                Cell: ({ row }) =>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p className="text-truncate">{row.original.fieldTicketNumber}</p>
                        {permissions?.fieldTicket?.isRead &&
                            <Box ml={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        window.open(`${routes.fieldTicketDetail.path}/${row.original.fieldTicketId}`);
                                    }}
                                >
                                    <OpenInNewIcon fontSize="small" color="primary" />
                                </IconButton>
                            </Box>
                        }
                    </div>
            },
            {
                accessor: 'type',
                Header: 'Type',
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
                Cell: ({ row, rows }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p title={row.original.detail}  >
                            {row.original.detail}
                        </p>
                        {[MATERIAL_TYPE.service, MATERIAL_TYPE.product].includes(row.original.type) &&
                            <Box ml={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (row.original.type === MATERIAL_TYPE.service) {
                                            window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                                        } else if (row.original.type === MATERIAL_TYPE.product) {
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

        let material = []
        let cost = []

        const fieldTicketId = fieldTicketData?.map(d => d._id);

        const { data: { data: data } } = await axiosInstance().get(`${routes?.fieldTicketInvoice.path}/material?fieldTicketId=${JSON.stringify(fieldTicketId)}`);

        material = data?.material || []
        cost = data?.cost || []

        material?.forEach((parent, i) => {
            parent.index = i + 1;
            parent.detail = parent?.type === MATERIAL_TYPE.service ? parent?.serviceDetail?.serviceName
                : parent?.type === MATERIAL_TYPE.product ? parent?.productDetail?.productName
                    : ''
            parent.description = parent?.type === MATERIAL_TYPE.service ? parent?.serviceDetail?.serviceDescription
                : parent?.type === MATERIAL_TYPE.product ? parent?.productDetail?.productDescription
                    : ''
        });

        cost?.forEach((ele, i) => {
            ele.index = (i + 1) + material?.length;
            ele.type = 'manualEntry';
            ele.detail = ele.description;
        })

        setRowsData([...material, ...cost]);
    }

    const handleCreateInvoice = () => {
        axiosInstance().post(`${routes.fieldTicketInvoice.path}/invoice`, {
            fieldTicketIds: fieldTicketData.map((e) => e._id),
        }).then(({ data }) => {
            toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: data.message,
            });
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
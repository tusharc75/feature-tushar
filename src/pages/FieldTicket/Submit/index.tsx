import { Box, Button, IconButton } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { generateCustomTableColumns } from 'src/constants/columns';
import routes from 'src/components/Helpers/Routes';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { fetch_field_ticket_material_fields } from '../helper';
import { FIELD_TICKET_STATUS, fieldTicket, sidebarResource } from 'src/constants/helpers';
import PreviewDownload from 'src/components/PreviewDownload';
import { set, startCase } from 'lodash';
import ManageSubmit from './ManageSubmit';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const Submit = ({ stepFullScreen, fieldTicketData, id, renderedFrom, allowedToEdit, fetchData }) => {
    const toastConfig = useContext(CustomToastContext);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState([]);
    const [submitDialog, setSubmitDialog] = useState(false);

    useEffect(() => {
        fetchFields();
        fetchGridData();
    }, [id]);

    const fetchFields = async () => {
        setColumns(null);
        var fields = await fetch_field_ticket_material_fields(fieldTicketData?.currency);
        if (!allowedToEdit) {
            fields?.forEach((e) => {
                e.isColumnEditable = false;
            });
        }
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

    const fetchGridData = async () => {

        const materialResponse = await axiosInstance().get(`${fieldTicket.api}/${id}/material`);
        const costResponse = await axiosInstance().get(`${fieldTicket.api}/${id}/cost`)

        const material = materialResponse?.data?.data?.material;
        const costs = costResponse?.data?.data || [];

        material?.forEach((parent, i) => {
            parent.index = i + 1;
            parent.detail = parent?.productDetail?.productName || parent?.serviceDetail?.serviceName || '';
            parent.description = parent?.productDetail?.productDescription || parent?.serviceDetail?.serviceDescription || '';
            parent.qty = parent.qty;
            parent.type = parent.type;
        });

        costs?.forEach((ele, i) => {
            ele.index = (i + 1) + material?.length;
            ele.detail = ele.description || "";
            ele.description = ele.description || "";
            ele.type = 'manualEntry';
        });

        setRowsData([...material, ...costs]);
    };

    const handleReOpen = async () => {
        await axiosInstance().patch(`${fieldTicket.api}/status/${fieldTicketData._id}`, {
            status: FIELD_TICKET_STATUS.inProgress
        }).then((res) => {
            fetchData()
            toastConfig.setToastConfig({
                type: 'SUCCESS',
                message: 'Field Ticket Re Opened successfully'
            })
        }).catch((err) => {
            toastConfig.setToastConfig(err)
        })
    }


    return (
        <>
            <Box display="flex" justifyContent="space-between" m={1}>
                <Box display="flex" alignItems="center">
                    <PreviewDownload resource={sidebarResource.fieldTicket} referenceId={id} columns={columns} isSendEmail />
                </Box>
                <Box display="flex">
                    {(fieldTicketData.status === FIELD_TICKET_STATUS.new || fieldTicketData.status === FIELD_TICKET_STATUS.inProgress) && <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        onClick={() => {
                            setSubmitDialog(true);
                        }}
                    >
                        Submit
                    </Button>}
                    {fieldTicketData.status === FIELD_TICKET_STATUS.submitted && <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        onClick={handleReOpen}
                    >
                        Re Open
                    </Button>}
                </Box>
            </Box>
            {columns && rowsData ? (
                <Box zIndex={5} width={'100%'}>
                    <CustomReactTable
                        height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                        columns={columns}
                        data={rowsData}
                        onSelect={() => { }}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                        hideSelection={true}
                        hideAction={true}
                        renderedFrom="field_ticket_submit"
                        isClientSideGrid={true}
                        hideExpander={true}
                    />
                </Box>
            ) : (
                <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
                </Box>
            )}
            {
                submitDialog && <ManageSubmit
                    fieldTicketData={fieldTicketData}
                    onClose={() => {
                        setSubmitDialog(false);
                    }}
                    onSuccess={() => {
                        setSubmitDialog(false);
                        fetchData();
                    }}
                />
            }
        </>
    );
};

export default Submit;

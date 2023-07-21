import { Box, IconButton } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { generateCustomTableColumns } from 'src/constants/columns';
import routes from 'src/components/Helpers/Routes';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { fetch_field_ticket_material_fields } from '../helper';
import { fieldTicket, sidebarResource } from 'src/constants/helpers';
import PreviewDownload from 'src/components/PreviewDownload';

const Submit = ({ stepFullScreen, fieldTicketData, id, renderedFrom, allowedToEdit, setNextStep }) => {
    setNextStep(false);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState([]);

    const fetchFields = async () => {
        setColumns(null);
        var { fields: data, allFields } = await fetch_field_ticket_material_fields(fieldTicketData?.currency);
        if (!allowedToEdit) {
            allFields?.forEach((e) => {
                e.isColumnEditable = false;
            });
        }
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
                accessor: 'detail',
                Header: 'Details',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row, rows }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {!allowedToEdit ? (
                            <p> {row.original.detail}</p>
                        ) : (
                            <p
                                title={row.original.detail}
                            >
                                {row.original.detail}
                            </p>
                        )}
                        {['product', 'service'].includes(row.original.type) && <Box ml={1}>
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
            },
            {
                accessor: 'competencyType',
                Header: 'Competency Type',
                width: 250,
                Cell: ({ row }) => (row.original['competencyType'] ? <p>{row.original?.competencyType}</p> : <NoDataCell />)
            },
            {
                accessor: 'competencies',
                Header: 'Competencies',
                width: 250,
                Cell: ({ row }) => (row.original['competencies'] ? <p>{row.original?.competencies}</p> : <NoDataCell />)
            },
        ];
        column = [...column, ...newColumns];
        setColumns(column);
    };

    const fetchMaterial = async () => {
        const response = await axiosInstance().get(`${fieldTicket.api}/${id}/material`);
        const costs = await axiosInstance()
            .get(`${fieldTicket.api}/${id}/cost`)
        const data = response?.data?.data?.material;

        data?.forEach((parent, i) => {
            parent.srno = i + 1;
            parent.detail = `${parent?.serviceDetail?.serviceName || parent?.productDetail?.productName || ''}`;
            parent.description = `${parent?.serviceDetail?.serviceDescription || ''}`;
            parent.competencyType = `${parent?.serviceDetail?.competencyType?.optionLabel || ''}`;
            parent.qtyDisplay = parent.qty;
            parent.type = parent.type;
        });
        const costData = costs?.data?.data?.map((e, i) => {
            e.srno = i + 1 + data.length;
            e.detail = e.costType || "";
            e.type = 'additionalCost';
            return e;
        })
        setRowsData([...data, ...costData]);
    };

    useEffect(() => {
        fetchFields();
    }, [id]);

    useEffect(() => {
        if (columns) {
            fetchMaterial();
        }
    }, [columns]);


    return (
        <>
            <Box display="flex" justifyContent="space-between" m={1}>
                <Box display="flex" alignItems="center">
                </Box>
                <Box display="flex">
                    <PreviewDownload resource={sidebarResource.fieldTicket} referenceId={id} columns={columns} />

                </Box>
            </Box>
            {columns && rowsData ? (
                <Box zIndex={5} width={'100%'}>
                    <CustomReactTable
                        height={stepFullScreen ? 'calc(100vh - 440px)' : '278px'}
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
                <Box p={2} height={stepFullScreen ? 500 : 278}>
                    <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
                </Box>
            )}

        </>
    );
};

export default Submit;

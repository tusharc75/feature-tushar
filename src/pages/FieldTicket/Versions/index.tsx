import { Box, Button, Dialog, IconButton } from "@material-ui/core";
import moment from "moment";
import { useEffect, useState } from "react";
import AttachFileIcon from '@material-ui/icons/AttachFile';
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable from "src/components/CustomReactTable/CustomReactTable";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { CHILD_RESOURCE, CustomDialogTransition, RESOURCE_LABEL, dateTimeFormat, fieldTicket } from "src/constants/helpers";
import { useData } from 'src/StateProvider/Provider';
import ManageAttachment from "src/components/Activity/Attachments/ManageAttachment";
import { isMobile, isTablet } from "react-device-detect";
import { fetch_field_ticket_material_fields, fetch_field_ticket_submit_fields } from "../helper";
import { generateCustomTableColumns } from "src/constants/columns";
import { CURReplaceByCurrencySingle } from "src/constants/formulaUtility";
import { startCase } from "lodash";
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

function Version({ id, label, child_resource, resource, referenceData, versions = null, renderedFrom, handleClose }) {

    const [fullScreen, setFullScreen] = useState(true);
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [selectedVersion, setSelectedVersion] = useState(null)

    useEffect(() => {
        fetchFields()
    }, [])

    useEffect(() => {
        if (selectedVersion) {
            fetchData()
        }
    }, [selectedVersion])

    const fetchFields = async () => {
        setColumns(null);
        const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE[child_resource]}`);
        const data = CURReplaceByCurrencySingle(response?.data?.data, referenceData?.referenceData ? referenceData?.currency : "USD");

        data?.forEach((e) => {
            e.isColumnEditable = false;
        });

        const newColumns = generateCustomTableColumns(data, referenceData?.currency, renderedFrom);
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

        const version = await axiosInstance().get(`${fieldTicket.api}/${selectedVersion}/version?resource=${RESOURCE_LABEL[resource]}&id=${id}`)
        const versionData = version.data.data;

        const material = versionData?.material || []
        const cost = versionData?.cost || []

        versionData?.material?.forEach((parent, i) => {
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

        versionData?.cost?.forEach((ele, i) => {
            ele.index = (i + 1) + material?.length;
            ele.type = 'manualEntry';
            ele.detail = ele.description;
        })

        data = [...material, ...cost]
        setRowsData(data);
    }


    return (
        <>
            <Dialog
                open
                fullScreen={fullScreen}
                maxWidth="md"
                fullWidth
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        handleClose();
                    }
                }}
            >
                <CustomDialogHeader
                    title={`Version - ${label}`}
                    onClose={handleClose}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen((prevState) => !prevState);
                    }}
                    showRequiredLabel={false}
                    showManimizeMaximize={true}
                />
                <CustomDialogContent>
                    <Box width={'100%'} display='flex' flexWrap='wrap'>
                        {
                            versions && versions?.map((v: any, i) => (
                                <Box
                                    m={0.5}
                                    p={1}
                                    border={1}
                                    className="cursor-pointer"
                                    borderColor="var(--common-border-color)"
                                    onClick={() => {
                                        setRowsData(null);
                                        if (selectedVersion === v?._id) {
                                            setSelectedVersion(null);
                                        } else {
                                            setSelectedVersion(v?._id);
                                        }
                                    }}
                                    style={{ display: 'inline-block' }}
                                    bgcolor={v?._id === selectedVersion ? 'var(--dark-primary, var(--primary))' : 'var(--dark-secondary, transparent)'}
                                    color={v?._id === selectedVersion && 'white'}
                                >
                                    {`Version - ${i + 1}`}
                                </Box>
                            ))
                        }
                    </Box>
                    {rowsData && columns ? (
                        <Box zIndex={5} width={'100%'} mt={2}>
                            <CustomReactTable
                                height={'calc(100vh - 393px)'}
                                columns={columns}
                                data={rowsData}
                                onSelect={() => { }}
                                childrenProperty="subRows"
                                uniqueKey="_id"
                                hideSelection={true}
                                hideAction={true}
                                renderedFrom="field_ticket_version"
                                isClientSideGrid={true}
                                hideExpander={true}
                            />
                        </Box>
                    ) : (
                        <Box p={2} height={500} bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
                </CustomDialogContent>
            </Dialog>
        </>
    );
}

export default Version;

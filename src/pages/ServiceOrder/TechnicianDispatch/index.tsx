import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { dateTimeFormat, serviceOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { calculateRowsField, getNestedSubRows } from 'src/components/RentalManagment/helper';
import ProductionOrderQty from 'src/pages/ProductionOrder/Productpackage/ProductionOrderQty';
import SendIcon from '@material-ui/icons/Send'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import moment from 'moment';

const TechnicianDispatch = ({
    serviceOrderData,
    setNextStep,
    currencySymbol,
    renderedFrom,
    stepFullScreen,
    allowedToEdit
}: any) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();


    const [selectedProducts, setSelectedProducts] = useState([]);
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setDeleting] = useState(false);

    const [addEmployeeMasterDialog, setAddEmployeeMasterDialog] = useState({ open: false });
    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);

    useEffect(() => {
        fetchFields();
    }, []);

    useEffect(() => {
        fetchData();
    }, [columns]);

    const fetchFields = async () => {
        const column: any = [
            {
                accessor: 'technician',
                Header: 'Technician',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {`${row.original?.technician?.firstName} ${row.original?.technician?.lastName} - (${row.original?.technician?.employeeNumber})`}
                        <IconButton
                            size="small"
                            style={{ marginLeft: "10px" }}
                            onClick={() => {
                                window.open(`${routes.employeeMasterDetail.path}/${row.original?.technician?._id}`);
                            }}
                        >
                            <OpenInNewIcon fontSize="small" color="primary" />
                        </IconButton>
                    </div>
                )
            },
            {
                accessor: 'service',
                Header: ' Service',
                minWidth: 300,
                width: 300,
                sticky: isMobile ? 'none' : 'left',
                Cell: ({ row }) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {row.original?.service?.serviceName}
                        <IconButton
                            size="small"
                            style={{ marginLeft: "10px" }}
                            onClick={() => {
                                window.open(`${routes.serviceMasterDetail.path}/${row.original?.service?._id}`);
                            }}
                        >
                            <OpenInNewIcon fontSize="small" color="primary" />
                        </IconButton>
                    </div>
                )
            },
            {
                accessor: 'status',
                Header: 'Status',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['status'] ? <p className="text-truncate">{row.original.status}</p> : <NoDataCell />;
                }
            },
            {
                accessor: 'estimateStartDate',
                Header: 'Estimate Start Date',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['estimateStartDate'] ? <p>{moment(row.original['estimateStartDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
                }
            },
            {
                accessor: 'estimateEndDate',
                Header: 'Estimate End Date',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['estimateEndDate'] ? <p>{moment(row.original['estimateEndDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
                }
            },
        ];
        column.push({
            accessor: 'action',
            Header: '',
            minWidth: 50,
            width: 50,
            sticky: 'right',
            disableFilters: true,
            canDrag: false,
            Cell: ({ row }) => {
                return allowedToEdit ? (
                    row.original.status === "Assigned" ?
                        <HtmlTooltip title={'Dispatch'}>
                            <span>
                                <IconButton
                                    size="small"
                                    aria-label="Dispatch"
                                    onClick={() => {
                                        const obj: any = [{ _id: row.original._id, technician: row.original?.technician?._id }];
                                        handleDispatch(obj);
                                    }}
                                >
                                    <SendIcon fontSize="small" color={'primary'} />
                                </IconButton>
                            </span>
                        </HtmlTooltip>
                        : row.original.status === "Dispatched" ? <HtmlTooltip title={'Complete'}>
                            <span>
                                <IconButton
                                    size="small"
                                    aria-label="Complete"
                                    onClick={() => {
                                        const obj: any = [{ _id: row.original._id, technician: row.original?.technician?._id }];
                                        handleCompleted(obj);
                                    }}
                                >
                                    <CheckCircleIcon fontSize="small" color={'primary'} />
                                </IconButton>
                            </span>
                        </HtmlTooltip>
                            : null
                ) : null
            }
        });
        setColumns(column);
    };

    const fetchData = async () => {
        var data: any = [];
        const response = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/material`);

        const responseTechnician = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/technician`);
        const technician = responseTechnician?.data?.data;

        data = response?.data?.data;
        let rows = data.material.filter((e) => e.parentId === null);
        rows = rows.filter((e) => e.type === 'service' || (e.type === 'package' && e.packageDetail?.packageType === 'Service'));
        const rowsTechnician: any = [];
        rows.forEach((parent, i) => {
            technician.filter((e) => e._id === parent._id)?.forEach((element, i) => {
                const obj: any = {};
                obj._id = parent._id;
                obj.service = parent.serviceDetail
                obj.technician = element?.technician
                obj.estimateStartDate = element?.estimateStartDate
                obj.estimateEndDate = element?.estimateEndDate
                obj.status = element?.status
                rowsTechnician.push(obj)
            });
        });
        setRowsData(rowsTechnician);
        if (rowsTechnician.some(d => d.status !== 'Completed')) {
            setNextStep(false)
        }
        setSelectedProducts([]);
    };

    const handleAssignTechnician = async (rows) => {
        const sendData: any = [];
        rows?.forEach((e) => {
            sendData.push({
                _id: selectedProducts[0]?._id,
                service: selectedProducts[0]?.materialId,
                technician: e?._id,
                estimateStartDate: selectedProducts[0]?.estimateStartDate,
                estimateEndDate: selectedProducts[0]?.estimateEndDate
            })
        })
        axiosInstance().post(`${serviceOrder.api}/${serviceOrderData._id}/technician`, sendData)
            .then(() => {
                setAddEmployeeMasterDialog({ open: false });
                fetchData()
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const handleDelete = (rows) => {
        setDeleting(true);
        axiosInstance()
            .put(`${serviceOrder.api}/${serviceOrderData?._id}/technician/delete`, rows)
            .then(() => {
                fetchData();
                setDeleting(false);
                setDeleteData(null);
            })
            .catch((error) => {
                setDeleting(false);
                setDeleteData(null);
                toastConfig.setToastConfig(error);
            });
    };

    const handleDispatch = (rows) => {
        setDeleting(true);
        axiosInstance()
            .put(`${serviceOrder.api}/${serviceOrderData?._id}/technician/dispatched`, rows)
            .then(() => {
                fetchData();
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const handleCompleted = (rows) => {
        setDeleting(true);
        axiosInstance()
            .put(`${serviceOrder.api}/${serviceOrderData?._id}/technician/complete`, rows)
            .then(() => {
                fetchData();
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const handleDeleteMultiple = () => {
        const obj: any = [];
        const dataToDelete = selectedProducts && selectedProducts.filter((e) => e.type === 'technician');
        dataToDelete?.forEach((ele) => {
            obj.push({ _id: ele._id, technician: ele?.technician });
        });
        dataToDelete?.forEach((ele) => {
            getNestedSubRows(obj, ele);
        });
        setDeleteData(obj);
    };

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Fragment>
            <Grid container spacing={2}>
                {allowedToEdit && (
                    <Grid item xs={12} md={12} sm={12}>
                        <Box display="flex" justifyContent="space-between" m={1} mb={0}>
                            <Box display="flex"></Box>
                            <Box display="flex">
                                <Button
                                    variant={'outlined'}
                                    color="primary"
                                    size="small"
                                    onClick={handleClick}
                                    disabled={!Boolean(selectedProducts && selectedProducts.length)}
                                    endIcon={<BiChevronDown />}
                                >
                                    Actions
                                </Button>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={open}
                                    getContentAnchorEl={null}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left'
                                    }}
                                    onClose={handleClose}
                                >
                                    <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Dispatched selected records' : 'Select records to dispatch'}>
                                        <MenuItem
                                            disabled={isDeleting}
                                            onClick={() => {
                                                const obj: any = selectedProducts.filter(d => d.status === "Assigned").map(ele => { return { _id: ele?._id, technician: ele?.technician?._id } });
                                                handleDispatch(obj)
                                                handleClose();
                                            }}
                                        >
                                            Dispatched
                                        </MenuItem>
                                    </HtmlTooltip>
                                    <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Complete selected records' : 'Select records to complete'}>
                                        <MenuItem
                                            disabled={isDeleting}
                                            onClick={() => {
                                                const obj: any = selectedProducts.filter(d => d.status === "Dispatched").map(ele => { return { _id: ele?._id, technician: ele?.technician?._id } });
                                                handleCompleted(obj)
                                                handleClose();
                                            }}
                                        >
                                            Completed
                                        </MenuItem>
                                    </HtmlTooltip>
                                </Menu>
                            </Box>
                        </Box>
                    </Grid>
                )}
                <Grid item xs={12} md={12} sm={12}>
                    {columns && rowsData ? (
                        <Box
                            zIndex={5}
                            width={'100%'}
                            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                        >
                            <CustomReactTable
                                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                                columns={columns}
                                data={rowsData}
                                onSelect={setSelectedProducts}
                                childrenProperty="subRows"
                                uniqueKey="_id"
                                hideSelection={!allowedToEdit}
                                renderedFrom={`${renderedFrom}_technician`}
                                isClientSideGrid={true}
                                hideExpander={true}
                            />
                        </Box>
                    ) : (
                        <Box p={2} height={500} bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
                </Grid>
            </Grid>
            {deleteData && (
                <ConfirmationDialog
                    open={true}
                    message={`Are you sure you want to delete the record(s)?`}
                    onClose={() => setDeleteData(null)}
                    onOk={() => handleDelete(deleteData)}
                    okBtnLoading={isDeleting}
                />
            )}
            {addEmployeeMasterDialog.open && (
                <AssignEmployeeDialog
                    reference={'service'}
                    onSuccess={(data) => {
                        handleAssignTechnician(data);
                    }}
                    handleClose={() => {
                        setAddEmployeeMasterDialog({ open: false });
                    }}
                    ids={[]}
                />
            )}
        </Fragment>
    );
};

export default TechnicianDispatch;

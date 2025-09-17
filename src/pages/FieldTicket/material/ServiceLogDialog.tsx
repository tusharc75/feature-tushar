import { useContext, useEffect, useState } from 'react';
import { Dialog, Box, IconButton } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, displayDate, fieldTicket, gridLoadingTimeout, sidebarResource } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { camelCase, isEmpty } from 'lodash';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete } from '@mui/icons-material';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const ServiceLogDialog = ({ fieldTicketID, id, serviceName, onClose, allowedToEdit, fetchRecords = null }) => {
    const renderedFrom = `${camelCase(sidebarResource?.fieldServiceOrder)}_services_logs`;
    const { state, dispatch } = useTableReducer({ renderedFrom });
    const toastConfig = useContext(CustomToastContext);
    const [deleteServiceLogConfirmDialog, setDeleteServiceLogConfirmDialog] = useState({ open: false, data: null });
    const [okBtnLoading, setOkBtnLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [fieldTicketID, id]);

    const fetchData = async () => {
        try {
            dispatch({ type: 'loading', loading: true });
            const response = await axiosInstance().get(`${fieldTicket.api}/${fieldTicketID}/material/${id}/service-log`);
            const serviceLogData = response?.data?.data;
            serviceLogData?.forEach((log) => {
                log.canDelete = true;
            });
            dispatch({ type: 'initialize', data: serviceLogData, count: serviceLogData?.length });
            setTimeout(() => {
                dispatch({ type: 'loading', loading: false });
            }, gridLoadingTimeout);
        } catch (e) {
            toastConfig.setToastConfig(e);
            dispatch({ type: 'loading', loading: false });
        }
    };

    const columns: any = [
        {
            accessor: 'startDate',
            Header: 'Estimate Start Date',
            disabled: true,
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) => {
                return (
                    <>
                        {row?.original?.startDate ? (
                            <>
                                <h5 className="text-truncate" title={`${displayDate(row?.original?.startDate)}`}>
                                    {displayDate(row?.original?.startDate)}
                                </h5>
                            </>
                        ) : (
                            <NoDataCell />
                        )}
                    </>
                );
            }
        },
        {
            accessor: 'endDate',
            Header: 'Estimate End Date',
            disableFilters: true,
            disableSortBy: true,
            disabled: true,
            Cell: ({ row }) => {
                return (
                    <>
                        {row?.original?.endDate ? (
                            <>
                                <h5 className="text-truncate" title={`${displayDate(row?.original?.endDate)}`}>
                                    {displayDate(row?.original?.endDate)}
                                </h5>
                            </>
                        ) : (
                            <NoDataCell />
                        )}
                    </>
                );
            }
        },
        {
            accessor: 'startedBy',
            Header: 'Started By',
            disabled: true,
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) =>
                !isEmpty(row?.original?.startedBy) ? (
                    <Link
                        className="link text-truncate"
                        title={row?.original?.startedBy?.optionLabel}
                        to={`${routes.userDetail.path}/${row?.original?.startedBy?.optionValue}`}
                        target={'_blank'}
                    >
                        {row?.original?.startedBy?.optionLabel}
                    </Link>
                ) : (
                    <NoDataCell />
                )
        },
        {
            accessor: 'endedBy',
            Header: 'Ended By',
            disabled: true,
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }) =>
                !isEmpty(row?.original?.endedBy) ? (
                    <Link
                        className="link text-truncate"
                        title={row?.original?.endedBy?.optionLabel}
                        to={`${routes.userDetail.path}/${row?.original?.endedBy?.optionValue}`}
                        target={'_blank'}
                    >
                        {row?.original?.endedBy?.optionLabel}
                    </Link>
                ) : (
                    <NoDataCell />
                )
        },
        {
            accessor: 'action',
            Header: 'Actions',
            minWidth: 100,
            width: 100,
            sticky: 'right',
            disableFilters: true,
            disableSortBy: true,
            canDrag: false,
            Cell: ({ row }) => {
                return (
                    <>
                        <HtmlTooltip
                            title={row?.original?.canDelete ? 'Delete' : 'Can only delete most recent log'}
                        >
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={!row?.original?.canDelete}
                                    onClick={() => {
                                        setDeleteServiceLogConfirmDialog({ open: true, data: [{ _id: id, serviceLogId: row.original._id }] });
                                    }}
                                >
                                    <Delete fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
                                </IconButton>
                            </span>
                        </HtmlTooltip>
                    </>
                );
            }
        }
    ];


    const handleDeleteServiceLogs = (data: any[]) => {
        setOkBtnLoading(true);
        dispatch({ type: 'loading', loading: true });
        axiosInstance()
            .delete(`${fieldTicket.api}/${fieldTicketID}/material/service-log`, { data })
            .then((response) => {
                toastConfig.setToastConfig({
                    open: true,
                    message: response?.data?.message,
                    type: 'success'
                });
                setOkBtnLoading(false);
                setDeleteServiceLogConfirmDialog({ open: false, data: null });
                fetchData();
                fetchRecords();
            })
            .catch((err) => {
                setOkBtnLoading(false);
                setDeleteServiceLogConfirmDialog({ open: false, data: null });
                toastConfig.setToastConfig(err);
                dispatch({ type: 'loading', loading: false });
            });
    };

    return (
        <Dialog
            open={true}
            TransitionComponent={CustomDialogTransition}
            fullScreen={true}
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                    onClose();
                }
            }}
            maxWidth="sm"
            fullWidth
        >
            <CustomDialogHeader title={`${serviceName || ''} - Logs`} onClose={onClose} showRequiredLabel={false} />
            <CustomDialogContent>
                {columns ? (
                    <CustomReactTable
                        height={'calc(120vh - 393px)'}
                        columns={columns}
                        state={state}
                        dispatch={dispatch}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={true}
                        hideSelection={true}
                        hideAction={!allowedToEdit}
                        hideExportTable={true}
                        refreshGrid={fetchData}
                    />
                ) : (
                    <Box p={2} height={500}>
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
                {deleteServiceLogConfirmDialog.open && (
                    <ConfirmationDialog
                        open={deleteServiceLogConfirmDialog.open}
                        message={`Are you sure you want to delete log?`}
                        onClose={() => {
                            setDeleteServiceLogConfirmDialog({ open: false, data: null });
                        }}
                        onOk={() => {
                            handleDeleteServiceLogs(deleteServiceLogConfirmDialog.data);
                        }}
                        okBtnLoading={okBtnLoading}
                    />
                )}
            </CustomDialogContent>
        </Dialog>
    );
};

export default ServiceLogDialog;

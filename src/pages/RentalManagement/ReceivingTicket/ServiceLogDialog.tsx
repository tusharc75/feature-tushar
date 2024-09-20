import { useContext, useEffect, useState } from 'react';
import { Dialog, Box, IconButton } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, dateFormat, gridLoadingTimeout, rentalManagement } from 'src/constants/helpers';
import moment from 'moment';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { camelCase, isEmpty } from 'lodash';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete, Edit } from '@material-ui/icons';
import StartStopServiceDateDialog from './StartStopServiceDateDialog';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const ServiceLogDialog = ({ rentalId, id, serviceName, onClose, onSuccess, allowedToEdit, fetchRecords, maxInvoiceDate = null }) => {
  const renderedFrom = `${camelCase(routes?.rentalManagement.title)}_services_logs`;

  const {
    state: { user }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const toastConfig = useContext(CustomToastContext);
  const [editDateDialog, setEditDateDialog] = useState({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });
  const { dataRows } = state;
  const [deleteServiceLogConfirmDialog, setDeleteServiceLogConfirmDialog] = useState({ open: false, data: null });
  const [okBtnLoading, setOkBtnLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [rentalId, id]);

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}/${id}/service-log`);
      const serviceLogData = response?.data?.data;
      serviceLogData?.forEach((log, index) => {
        if (index === 0) {
          log.canDelete = true;
        }
        if (
          (maxInvoiceDate && log?.endDate >= maxInvoiceDate && log.startDate <= maxInvoiceDate) ||
          (maxInvoiceDate >= log.startDate && !log?.endDate) ||
          (maxInvoiceDate && log?.endDate <= maxInvoiceDate)
        ) {
          log.canEdit = false;
          log.canDelete = false;
        } else {
          log.canEdit = true;
        }
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
      Header: 'Actual Start Date',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.startDate ? (
              <>
                <h5 className="text-truncate" title={`${moment(row?.original?.startDate)?.format(dateFormat)}`}>
                  {moment(row?.original?.startDate)?.format(dateFormat)}
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
      Header: 'Actual End Date',
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.endDate ? (
              <>
                <h5 className="text-truncate" title={`${moment(row?.original?.endDate)?.format(dateFormat)}`}>
                  {moment(row?.original?.endDate)?.format(dateFormat)}
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
            <HtmlTooltip title={row?.original?.canEdit ? `Update -Actual Start/End Date` : 'Invoice already created'}>
              <span>
                <IconButton
                  size="small"
                  disabled={!row?.original?.canEdit}
                  onClick={() => {
                    let minStartDate = null,
                      maxEndDate = null;
                    dataRows?.forEach((d: any, index: number) => {
                      if (d._id === row.original._id) {
                        if (index !== 0) {
                          maxEndDate = dataRows[index - 1]?.startDate;
                        }
                        if (index !== dataRows?.length - 1) {
                          minStartDate = dataRows[index + 1]?.endDate;
                        }
                      }
                    });
                    if (minStartDate) {
                      minStartDate = new Date(minStartDate);
                      minStartDate.setDate(minStartDate.getDate() + 1);
                    }
                    if (maxEndDate) {
                      maxEndDate = new Date(maxEndDate);
                      maxEndDate.setDate(maxEndDate.getDate() - 1);
                    }
                    setEditDateDialog({ open: true, loading: false, minStartDate: minStartDate, maxEndDate: maxEndDate, data: row?.original });
                  }}
                >
                  <Edit fontSize="small" color={row?.original?.canEdit ? 'primary' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
            <HtmlTooltip
              title={!row?.original?.canEdit ? `Invoice already created` : row?.original?.canDelete ? 'Delete' : 'Can only delete most recent log'}
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

  const handleSubmitChangeDates = (values) => {
    setEditDateDialog({ ...editDateDialog, loading: true });
    let data = { ids: [id], serviceLogId: editDateDialog?.data?._id, ...values };

    axiosInstance()
      .put(`${rentalManagement.api}/${rentalId}/start-end-date`, data)
      .then((response) => {
        toastConfig.setToastConfig({
          open: true,
          message: response?.data?.message,
          type: 'success'
        });
        setEditDateDialog({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });
        fetchData();
        onSuccess();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setEditDateDialog({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });
      });
  };

  const handleDeleteServiceLogs = (data: any[]) => {
    setOkBtnLoading(true);
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .delete(`${rentalManagement.api}/productpackage/${rentalId}/service-log`, { data })
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
            hideAction={!allowedToEdit || !user?.role?.selectedEntity?.policy?.isAllowServicePerformRentalManagement}
            hideExportTable={true}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {editDateDialog.open && (
          <StartStopServiceDateDialog
            data={editDateDialog.data}
            type={editDateDialog?.data?.endDate ? 'startStop' : 'start'}
            open={editDateDialog.open}
            onClose={() => {
              setEditDateDialog({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });
            }}
            handleSubmit={handleSubmitChangeDates}
            loading={editDateDialog.loading}
            minStartDate={editDateDialog.minStartDate}
            maxEndDate={editDateDialog.maxEndDate}
          />
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

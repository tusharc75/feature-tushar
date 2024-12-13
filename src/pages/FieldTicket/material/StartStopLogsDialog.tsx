import { useContext, useEffect, useState } from 'react';
import { Dialog, Box, IconButton } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, displayDateTime, fieldTicket, sidebarResource } from 'src/constants/helpers';
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
import StartStopDate from './StartStopDateDialog';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const StartStopLogsDialog = ({ onClose, referenceId, _id, fetchRecords }) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldTicket)}_start_stop_logs`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows } = state;
  const [startStopDateDialog, setStartStopDateDialog] = useState({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, _id: null });
  const [okBtnLoading, setOkBtnLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [_id, referenceId]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${fieldTicket.api}/technician/start-stop-logs?referenceId=${referenceId}&_id=${_id}`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'initialize', data: data, count: data?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const columns: any = [
    {
      accessor: 'startDate',
      Header: 'Start Date',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.startDate ? (
              <>
                <h5 className="text-truncate">{displayDateTime(row.original?.startDate)}</h5>
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
      Header: 'End Date',
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.endDate ? (
              <>
                <h5 className="text-truncate">{displayDateTime(row.original?.endDate)}</h5>
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
            <HtmlTooltip title={`Update Start/End Date`}>
              <span>
                <IconButton
                  size="small"
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
                      minStartDate.setHours(0, 0, 0, 0);
                    }
                    if (maxEndDate) {
                      maxEndDate = new Date(maxEndDate);
                      maxEndDate.setDate(maxEndDate.getDate() - 1);
                      maxEndDate.setHours(23, 59, 59, 999);
                    }
                    setStartStopDateDialog({ open: true, loading: false, minStartDate: minStartDate, maxEndDate: maxEndDate, data: row?.original });
                  }}
                >
                  <Edit fontSize="small" color={'primary'} />
                </IconButton>
              </span>
            </HtmlTooltip>
            <HtmlTooltip title={'Delete'}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    setConfirmDialog({ open: true, _id: row.original._id });
                  }}
                >
                  <Delete fontSize="small" color={'error'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        );
      }
    }
  ];

  const handleUpdateLog = (values, _id) => {
    setStartStopDateDialog({ ...startStopDateDialog, loading: true });

    axiosInstance()
      .put(`${fieldTicket.api}/technician/update-log`, { ...values, _id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setStartStopDateDialog({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });
        fetchData();
        fetchRecords();
      })
      .catch((error) => {
        setStartStopDateDialog({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteLog = (ids: any[]) => {
    setOkBtnLoading(true);
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${fieldTicket.api}/technician/delete-log`, { ids })
      .then((response) => {
        toastConfig.setToastConfig({
          open: true,
          message: response?.data?.message,
          type: 'success'
        });
        setOkBtnLoading(false);
        setConfirmDialog({ open: false, _id: null });
        fetchData();
        fetchRecords();
      })
      .catch((err) => {
        setOkBtnLoading(false);
        setConfirmDialog({ open: false, _id: null });
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
      <CustomDialogHeader title={`Logs`} onClose={onClose} showRequiredLabel={false} />
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
            hideExportTable={true}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {startStopDateDialog.open && (
          <StartStopDate
            type={startStopDateDialog?.data?.endDate ? 'startStop' : 'start'}
            onClose={() => {
              setStartStopDateDialog({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });
            }}
            handleSubmit={(values, _id) => {
              handleUpdateLog(values, _id);
            }}
            loading={startStopDateDialog.loading}
            minStartDate={startStopDateDialog.minStartDate}
            maxEndDate={startStopDateDialog.maxEndDate}
            data={startStopDateDialog.data}
          />
        )}
        {confirmDialog.open && (
          <ConfirmationDialog
            open={confirmDialog.open}
            message={`Are you sure you want to delete log?`}
            onClose={() => {
              setConfirmDialog({ open: false, _id: null });
            }}
            onOk={() => {
              handleDeleteLog([confirmDialog._id]);
            }}
            okBtnLoading={okBtnLoading}
          />
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default StartStopLogsDialog;

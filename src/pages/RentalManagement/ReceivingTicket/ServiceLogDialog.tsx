import { useContext, useEffect, useState } from 'react';
import { Dialog, Box, IconButton } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, dateFormat, gridLoadingTimeout, rentalManagement } from 'src/constants/helpers';
import moment from 'moment';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { isEmpty } from 'lodash';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Edit } from '@material-ui/icons';
import StartStopServiceDateDialog from './StartStopServiceDateDialog';

const ServiceLogDialog = ({ rentalId, id, assetNumber, open, onClose, renderedFrom, onSuccess }) => {

  const { state, dispatch } = useTableReducer();
  const toastConfig = useContext(CustomToastContext);

  const [editDateDialog, setEditDateDialog] = useState({ open: false, type: null, loading: false, minDate: null, maxDate: null, _id: null });

  const { dataRows } = state;

  useEffect(() => {
    fetchData();
  }, [rentalId, id])

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}/${id}/service-log`);
      dispatch({ type: 'initialize', data: response?.data?.data, count: response?.data?.data?.length });
      setTimeout(() => { dispatch({ type: 'loading', loading: false }) }, gridLoadingTimeout);
    } catch (e) {
      toastConfig.setToastConfig(e);
      dispatch({ type: 'loading', loading: false });
    }
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    if (inputField.hasOwnProperty('startDate')) {
      for (const [index, d] of dataRows.entries()) {
        if (d._id === updatedData._id) {
          if (updatedData['endDate'] && new Date(updatedData['endDate']) < new Date(inputField['startDate'])) {
            toastConfig.setToastConfig({ open: true, type: 'error', message: `Start Date can't exceed End Date` });
            return;
          } else if (index !== dataRows?.length - 1 && new Date(dataRows[index + 1].endDate) > new Date(inputField['startDate'])) {
            toastConfig.setToastConfig({ open: true, type: 'error', message: `Start Date can't be less than previous log End Date` });
            return;
          }
        }
      }
    } else if (inputField.hasOwnProperty('endDate')) {
      for (const [index, d] of dataRows.entries()) {
        if (d._id === updatedData._id) {
          if (!d.endDate) {
            toastConfig.setToastConfig({ open: true, type: 'error', message: `Service not stopped yet` });
            return;
          }
          if (new Date(updatedData['startDate']) > new Date(inputField['endDate'])) {
            toastConfig.setToastConfig({ open: true, type: 'error', message: `Start Date can't exceed End Date` });
            return;
          } else if (index !== 0 && new Date(dataRows[index - 1].startDate) < new Date(inputField['endDate'])) {
            toastConfig.setToastConfig({ open: true, type: 'error', message: `End Date can't be greater than next log Start Date` });
            return;
          }
        }
      }
    }
    dispatch({ type: 'loading', loading: true });
    const values: any = { _id: updatedData?._id };
    Object.keys(inputField)?.map((_key) => {
      values[_key] = updatedData[_key] ? updatedData[_key] : '';
    });
    let data = { ids: [id], type: 'update', ...values };
    axiosInstance().put(`${rentalManagement.api}/${rentalId}/start-end-date`, data).then(({ data }) => {
      fetchData();
      onSuccess();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
    }).catch((error) => {
      toastConfig.setToastConfig(error);
      dispatch({ type: 'loading', loading: false });
    });
  };

  const columns: any = [
    {
      accessor: 'startDate',
      Header: 'Start Date',
      disabled: true,
      Cell: ({ row }) => {
        return (
          <>
            {
              row?.original?.startDate ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 className="text-truncate" title={`${moment(row?.original?.startDate)?.format(dateFormat)}`}>
                      {moment(row?.original?.startDate)?.format(dateFormat)}
                    </h5>
                    <HtmlTooltip title={'Edit Start Date'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            let date = null;
                            dataRows?.forEach((d: any, index: number) => {
                              if (d._id === row.original._id) {
                                if (index !== dataRows?.length - 1) {
                                  date = dataRows[index + 1]?.endDate;
                                }
                              }
                            })
                            setEditDateDialog({ open: true, type: 'start', loading: false, minDate: date ? new Date(date) : null, maxDate: row?.original?.endDate ? new Date(row?.original?.endDate) : null, _id: row?.original?._id });
                          }}
                        >
                          <Edit fontSize="small" color={'primary'} />
                        </IconButton>
                      </span>
                    </HtmlTooltip>
                  </div>
                </>
              ) : (
                <NoDataCell />
              )}
          </>
        )
      }
    },
    {
      accessor: 'endDate',
      Header: 'End Date',
      disabled: true,
      Cell: ({ row }) => {
        return (
          <>
            {
              row?.original?.endDate ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 className="text-truncate" title={`${moment(row?.original?.endDate)?.format(dateFormat)}`}>
                      {moment(row?.original?.endDate)?.format(dateFormat)}
                    </h5>
                    <HtmlTooltip title={'Edit End Date'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            let date = null;
                            dataRows?.forEach((d: any, index: number) => {
                              if (d._id === row.original._id) {
                                if (index !== 0) {
                                  date = dataRows[index - 1]?.startDate;
                                }
                              }
                            })
                            setEditDateDialog({ open: true, type: 'stop', loading: false, minDate: new Date(row?.original?.startDate), maxDate: date ? new Date(date) : null, _id: row?.original?._id });
                          }}
                        >
                          <Edit fontSize="small" color={'primary'} />
                        </IconButton>
                      </span>
                    </HtmlTooltip>
                  </div>
                </>
              ) : (
                <NoDataCell />
              )}
          </>
        )
      }
    },
    {
      accessor: 'startedBy',
      Header: 'Started By',
      disabled: true,
      Cell: ({ row }) =>
        !isEmpty(row?.original?.startedBy) ? (
          <Link className="link text-truncate" title={row?.original?.startedBy?.optionLabel} to={`${routes.userDetail.path}/${row?.original?.startedBy?.optionValue}`} target={'_blank'}>
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
      Cell: ({ row }) =>
        !isEmpty(row?.original?.endedBy) ? (
          <Link className="link text-truncate" title={row?.original?.endedBy?.optionLabel} to={`${routes.userDetail.path}/${row?.original?.endedBy?.optionValue}`} target={'_blank'}>
            {row?.original?.endedBy?.optionLabel}
          </Link>
        ) : (
          <NoDataCell />
        )
    }
  ];

  const handleSubmitChangeDates = (values) => {
    setEditDateDialog({ ...editDateDialog, loading: true });
    let data = { ids: [id], serviceLogId: editDateDialog?._id, ...values };

    axiosInstance().put(`${rentalManagement.api}/${rentalId}/start-end-date`, data).then((response) => {
      toastConfig.setToastConfig({
        open: true,
        message: response?.data?.message,
        type: 'success'
      });
      setEditDateDialog({ open: false, type: null, loading: false, minDate: null, maxDate: null, _id: null });
      fetchData();
    })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setEditDateDialog({ open: false, type: null, loading: false, minDate: null, maxDate: null, _id: null });
      });
  };

  return (
    <Dialog
      open={open}
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
      <CustomDialogHeader title={`${assetNumber || ''} Service Logs`} onClose={onClose} showRequiredLabel={false} />
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
            hideAction={true}
            hideExportTable={true}
          // onSaveEdit={onSaveInlineEdit}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {editDateDialog.open && (
          <StartStopServiceDateDialog
            data={[]}
            type={editDateDialog.type}
            open={editDateDialog.open}
            onClose={() => {
              setEditDateDialog({ open: false, type: null, loading: false, minDate: null, maxDate: null, _id: null });
            }}
            handleSubmit={handleSubmitChangeDates}
            loading={editDateDialog.loading}
            staticMinDate={editDateDialog.minDate}
            staticMaxDate={editDateDialog.maxDate}
          />
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default ServiceLogDialog;

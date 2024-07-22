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
import { useData } from 'src/StateProvider/Provider';

const ServiceLogDialog = ({ rentalId, id, assetNumber, open, onClose, renderedFrom, onSuccess, owner }) => {
  const {
    state: { user }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const toastConfig = useContext(CustomToastContext);

  const [editDateDialog, setEditDateDialog] = useState({ open: false, loading: false, minStartDate: null, maxEndDate: null, data: null });

  const { dataRows } = state;

  useEffect(() => {
    fetchData();
  }, [rentalId, id])

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}/${id}/service-log`);
      const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalId}/invoice/material-end-date-qty`);
      let invoiceData = invoiceResponse?.data?.data?.material || [];
      const maxInvoiceDate = invoiceData?.find((ele)=> ele._id===id)?.endDate;
      const serviceLogData = response?.data?.data;

      serviceLogData?.forEach((log)=>{
        if(maxInvoiceDate && log.endDate<=maxInvoiceDate){
          log.canEdit = false;
        }else{
          log.canEdit = true;
        }
      })
      
      dispatch({ type: 'initialize', data: serviceLogData, count: serviceLogData?.length });
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
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => {
        return (
          <>
            {
              row?.original?.startDate ? (
                <>
                  <h5 className="text-truncate" title={`${moment(row?.original?.startDate)?.format(dateFormat)}`}>
                    {moment(row?.original?.startDate)?.format(dateFormat)}
                  </h5>
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
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => {
        return (
          <>
            {
              row?.original?.endDate ? (
                <>
                  <h5 className="text-truncate" title={`${moment(row?.original?.endDate)?.format(dateFormat)}`}>
                    {moment(row?.original?.endDate)?.format(dateFormat)}
                  </h5>
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
      disableFilters: true,
      disableSortBy: true,
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
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        !isEmpty(row?.original?.endedBy) ? (
          <Link className="link text-truncate" title={row?.original?.endedBy?.optionLabel} to={`${routes.userDetail.path}/${row?.original?.endedBy?.optionValue}`} target={'_blank'}>
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
            <HtmlTooltip title={row?.original?.canEdit && user?.user?._id === owner ?`Update - Start Date/End Date` : 'Invoice already created'}>
              <span>
                <IconButton
                  size="small"
                  disabled={!row?.original?.canEdit || user?.user?._id !== owner}
                  onClick={() => {
                    let minStartDate = null, maxEndDate = null;
                    dataRows?.forEach((d: any, index: number) => {
                      if (d._id === row.original._id) {
                        if (index !== 0) {
                          maxEndDate = dataRows[index - 1]?.startDate;
                        }
                        if (index !== dataRows?.length - 1) {
                          minStartDate = dataRows[index + 1]?.endDate;
                        }
                      }
                    })
                    minStartDate = minStartDate ? new Date(minStartDate) : null;
                    maxEndDate = maxEndDate ? new Date(maxEndDate) : null;
                    setEditDateDialog({ open: true, loading: false, minStartDate: minStartDate, maxEndDate: maxEndDate, data: row?.original });
                  }}
                >
                  <Edit fontSize="small" color={row?.original?.canEdit && user?.user?._id === owner ? 'primary' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        )
      }
    }
  ];

  const handleSubmitChangeDates = (values) => {
    setEditDateDialog({ ...editDateDialog, loading: true });
    let data = { ids: [id], serviceLogId: editDateDialog?.data?._id, ...values };

    axiosInstance().put(`${rentalManagement.api}/${rentalId}/start-end-date`, data).then((response) => {
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
            hideAction={false}
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
            data={editDateDialog.data}
            type={null}
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
      </CustomDialogContent>
    </Dialog>
  );
};

export default ServiceLogDialog;

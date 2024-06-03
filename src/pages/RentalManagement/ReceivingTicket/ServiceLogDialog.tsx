import { useContext, useEffect } from 'react';
import { Dialog, Box } from '@material-ui/core';
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

const ServiceLogDialog = ({ rentalId, id, assetNumber, open, onClose, renderedFrom, onSuccess }) => {

  const { state, dispatch } = useTableReducer();
  const toastConfig = useContext(CustomToastContext);

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
      editable: true,
      type: "date",
      Cell: ({ row }) =>
        row?.original?.startDate ? (
          <h5 className="text-truncate" title={`${moment(row?.original?.startDate).format(dateFormat)}`}>
            {moment(row?.original?.startDate)?.format(dateFormat)}
          </h5>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'endDate',
      Header: 'End Date',
      disabled: true,
      editable: true,
      type: "date",
      Cell: ({ row }) =>
        row?.original?.endDate ? (
          <h5 className="text-truncate" title={`${moment(row?.original?.endDate).format(dateFormat)}`}>
            {moment(row?.original?.endDate)?.format(dateFormat)}
          </h5>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'startedBy',
      Header: 'Started By',
      disabled: true,
      Cell: ({ row }) =>
        !isEmpty(row?.original?.startedBy) ? (
          <Link className="link text-truncate" title={row?.original?.startedBy?.optionLabel} to={`${routes.userDetail.path}/${row?.original?.startedBy?.optionValue}`}>
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
          <Link className="link text-truncate" title={row?.original?.endedBy?.optionLabel} to={`${routes.userDetail.path}/${row?.original?.endedBy?.optionValue}`}>
            {row?.original?.endedBy?.optionLabel}
          </Link>
        ) : (
          <NoDataCell />
        )
    }
  ];

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
            onSaveEdit={onSaveInlineEdit}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default ServiceLogDialog;

import { useContext, useEffect } from 'react';
import { Dialog, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, dateFormat, rentalManagement } from 'src/constants/helpers';
import moment from 'moment';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { isEmpty } from 'lodash';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';

const ServiceLogDialog = ({ rentalId, id, assetNumber, open, onClose, renderedFrom}) => {

    const { state, dispatch } = useTableReducer();
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
      fetchData();
    }, [rentalId, id])

    const fetchData = async () => {
      try{
        dispatch({ type: 'selection', selectedRecords: [] });
        dispatch({ type: 'loading', loading: true });
        const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}/${id}/service-log`);
        dispatch({ type: 'initialize', data: response?.data?.data, count: response?.data?.data?.length });
      } catch (e) {
        toastConfig.setToastConfig(e);
        dispatch({ type: 'loading', loading: false });
      }
    } 

    const columns: any = [
        {
          accessor: 'startDate',
          Header: 'Start Date',
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
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth
      >
        <CustomDialogHeader title={`${assetNumber || ''} Service Logs`} onClose={onClose} showRequiredLabel={false}/>
        <CustomDialogContent>
            {columns ? (
                <CustomReactTable
                    height={'calc(100vh - 393px)'}
                    columns={columns}
                    state={state}
                    dispatch={dispatch}
                    renderedFrom={renderedFrom}
                    isClientSideGrid={true}
                    hideSelection={true}
                    hideAction={true}
                    hideExportTable={true}
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

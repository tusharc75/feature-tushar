import { useEffect, useContext, useState } from 'react';
import { Dialog, IconButton } from '@mui/material';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { sidebarResource, workOrder } from 'src/constants/helpers';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const TechnicianHistoryDialog: any = ({ onClose, status, user, userName }) => {

  const renderedFrom = `${camelCase(sidebarResource.workOrder)}_Technician_History`;

  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    fetchData()
  }, [status, user]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance().get(`${workOrder.api}/technician-history?status=${status}&userId=${user}`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'initialize', data: data, count: data?.length });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  };

  const columns = [
    {
      accessor: 'workOrderNumber',
      Header: 'Work Order',
      Cell: ({ row }) => (
        row?.original?.workOrderNumber ? (
          <div className="flex items-center gap-2">
            <p>{row.original?.workOrderNumber}</p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.workOrderDetail.path}/${row.original?.workOrder}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>)
          : (
            <NoDataCell />
          )
      )
    },
    {
      accessor: 'service',
      Header: 'Service',
      Cell: ({ row }) => (
        row?.original?.service ? (
          <div className="flex items-center gap-2">
            <p>{row.original?.service?.optionLabel}</p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serviceMasterDetail.path}/${row.original?.service?.optionValue}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>)
          : (
            <NoDataCell />
          )
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => (
        <>
          <p>{row.original.status}</p>
        </>
      )
    },
    {
      accessor: 'workOrderType',
      Header: 'Type',
      Cell: ({ row }) => (
        <>
          <p>{row.original.workOrderType}</p>
        </>
      )
    }
  ];

  return (
    <Dialog open={true} fullScreen={fullScreen} fullWidth maxWidth="md">
      <CustomDialogHeader
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        onClose={onClose} title={`${userName} - ${status}`} showRequiredLabel={false} />
      <CustomDialogContent>
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          hideSelection={true}
          isClientSideGrid={true}
          isFullScreen={fullScreen}
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default TechnicianHistoryDialog;
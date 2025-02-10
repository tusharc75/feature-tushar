import React, { useEffect, useContext } from 'react';
import { Dialog } from '@mui/material';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { sidebarResource, workOrder } from 'src/constants/helpers';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';

interface WorkOrderStatusDialogProps {
  onClose: () => void;
  status: string;
  assignedUser: string;
}

const renderedFrom = `${sidebarResource.workOrder}_StatusDialog`;

const WorkOrderStatusDialog: React.FC<WorkOrderStatusDialogProps> = ({ onClose, status, assignedUser }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });

  useEffect(() => {
    if (status && assignedUser) {
      fetchData();
    }
  }, [status, assignedUser]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });

    const api = `${workOrder.api}/technician-work-order-detail?status=${status}&assignedUser=${assignedUser}`;
    try {
      const response = await axiosInstance().get(api);
      dispatch({ type: 'initialize', data: response?.data?.data, count: response?.data?.data?.length });
    } catch (err) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(err);
    }
  };

  const columns = [
    {
      accessor: 'workOrderNumber',
      Header: 'Work Order Number',
      minWidth: 100,
      width: 110,
      Cell: ({ row }) => (
        <>
          <p>{row?.original?.workOrderNumber}</p>
        </>
      )
    },
    {
      accessor: 'materialId',
      Header: 'Service',
      minWidth: 100,
      width: 110,
      Cell: ({ row }) => (
        <>
          <p>{row?.original?.materialId?.optionLabel}</p>
        </>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      minWidth: 100,
      width: 110,
      Cell: ({ row }) => (
        <>
          <p>{row.original.status}</p>
        </>
      )
    },
    {
      accessor: 'workOrderType',
      Header: 'Type',
      minWidth: 100,
      width: 110,
      Cell: ({ row }) => (
        <>
          <p>{row.original.workOrderType}</p>
        </>
      )
    }
  ];

  return (
    <Dialog open={true} fullWidth maxWidth="md">
      <CustomDialogHeader onClose={onClose} title="Work Orders" showRequiredLabel={false} />
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
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default WorkOrderStatusDialog;
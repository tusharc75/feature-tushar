import React, { useEffect, useState, useContext } from 'react';
import {
  Typography,
  Box,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { workOrder } from 'src/constants/helpers';

interface WorkOrderStatusDialogProps {
  open: boolean;
  onClose: () => void;
  status: string;
  assignedUser: string;
}

const WorkOrderStatusDialog: React.FC<WorkOrderStatusDialogProps> = ({ open, onClose, status, assignedUser }) => {
  const toastConfig = useContext(CustomToastContext);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setWorkOrders([]);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchWorkOrders();
    }
  }, [open]);

  const fetchWorkOrders = async () => {
    setLoading(true);
    setWorkOrders([]);

    const api = `${workOrder.api}/technician-work-order-detail?status=${status}&assignedUser=${assignedUser}`;
    try {
      const response = await axiosInstance().get(api);
      setWorkOrders(response.data.data || []);
    } catch (err) {
      toastConfig.setToastConfig(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="md">
      <CustomDialogHeader onClose={onClose} title="Work Orders" />
      <CustomDialogContent>
        {loading ? (
          <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
        ) : workOrders.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Work Order Number</strong></TableCell>
                  <TableCell><strong>Service</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workOrders.map((workOrder, index) => (
                  <TableRow key={index}>
                    <TableCell>{workOrder?.workOrderNumber}</TableCell>
                    <TableCell>{workOrder?.materialId?.optionLabel}</TableCell>
                    <TableCell>{workOrder?.status}</TableCell>
                    <TableCell>{workOrder?.workOrderType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box textAlign="center" padding={2}>
            <Typography variant="body1">No work orders found.</Typography>
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default WorkOrderStatusDialog;

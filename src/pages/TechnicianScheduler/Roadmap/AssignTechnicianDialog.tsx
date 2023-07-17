import { Button, Dialog, Typography, Box } from '@material-ui/core';
import React, { useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { fieldServiceOrder, fieldTicket } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function AssignTechnicianDialog({ technicianData, selectedServiceOrder, handleClose, handleSucess }) {
  const toastConfig = useContext(CustomToastContext);

  const handleAssign = () => {
    const data = selectedServiceOrder?.map((ele) => {
      return {
        uniqueId: ele?.service?.uniqueId,
        service: ele?.serviceId,
        technician: technicianData?._id,
        fieldTicket: ele._id,
        status: "Assigned",
        estimateStartDate: ele?.service?.estimateStartDate,
        estimateEndDate: ele?.service?.estimateEndDate
      }
    })
    axiosInstance()
      .post(`${fieldTicket.api}/technician`, { technician: data })
      .then(() => {
        handleSucess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog open={true}>
      <CustomDialogHeader title="Assign Technician" onClose={handleClose} showRequiredLabel={false} />
      <CustomDialogContent>
        <Box p={2}>
          <Typography variant="body1" color="textPrimary">
            Do You want to assign {technicianData?.firstName || ''} {technicianData?.lastName || ''} to{' '}
            {`${selectedServiceOrder[0]?.service?.serviceName} (${selectedServiceOrder[0]?.fieldTicketNumber})`}?{' '}
          </Typography>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" color="primary" onClick={handleClose}>
          Close
        </Button>
        <Button size="small" variant="contained" color="primary" onClick={handleAssign}>
          Assign
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default AssignTechnicianDialog;

import { Button, Dialog, Typography, Box } from '@material-ui/core';
import React, { useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { fieldServiceOrder, fieldTicket, rentalManagement } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function AssignTechnicianDialog({ technicianData, selectedServiceOrder, handleClose, handleSucess }) {
  const toastConfig = useContext(CustomToastContext);

  const handleAssign = () => {
    const type = selectedServiceOrder[0]?.fieldTicketNumber ? 'fieldTicket' : selectedServiceOrder[0]?.rentalJobName ?
      'rentalJob' : "";
    const data = selectedServiceOrder?.map((ele) => {
      return {
        uniqueId: ele?.service?.uniqueId,
        service: ele?.serviceId,
        technician: technicianData?._id,
        ...(type === 'fieldTicket' ? {
          fieldTicket: ele?.resourceId,
          startDate: ele?.service?.estimateStartDate,
          endDate: ele?.service?.estimateEndDate
        } : {
          rentalJob: ele?.resourceId,
          startDate: ele?.estimateStartDate,
          endDate: ele?.estimateEndDate
        }),
        status: "Assigned",
      }
    })
    const baseApi = type === 'fieldTicket' ? fieldTicket.api : type === "rentalJob" ? rentalManagement.api : "";
    axiosInstance()
      .post(`${baseApi}/technician`, { technician: data })
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
            {`${selectedServiceOrder[0]?.service?.serviceName} (${selectedServiceOrder[0]?.fieldTicketNumber || selectedServiceOrder[0]?.rentalJobName})`}?{' '}
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

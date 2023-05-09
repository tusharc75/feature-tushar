import { Button, Dialog, Typography, Box } from '@material-ui/core';
import React, { useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { serviceOrder } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function AssignTechnicianDialog({ technicianData, selectedServiceOrder, handleClose, handleSucess }) {

  const toastConfig = useContext(CustomToastContext);

  const handleAssign = () => {
    const data: any = [
      {
        uniqueId: selectedServiceOrder[0]?.service?.uniqueId,
        service: selectedServiceOrder[0]?.service?.materialId,
        technician: technicianData?._id,
        estimateStartDate: selectedServiceOrder[0]?.service?.estimateStartDate,
        estimateEndDate:selectedServiceOrder[0]?.service?.estimateEndDate
      }
    ];
    axiosInstance().post(`${serviceOrder.api}/${selectedServiceOrder[0]._id}/technician`, data)
      .then(() => {
        handleSucess()
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
            Do You want to assign {technicianData?.firstName || ''} {technicianData?.lastName || ''}  to{' '}
            {`${selectedServiceOrder[0]?.service?.serviceName} (${selectedServiceOrder[0]?.serviceOrderNumber})`}?{' '}
          </Typography>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          size="small"
          color="primary"
          onClick={handleClose}>
          Close
        </Button>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={handleAssign}>
          Assign
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default AssignTechnicianDialog;

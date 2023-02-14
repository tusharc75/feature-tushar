import { Button, Dialog, Typography } from '@material-ui/core';
import React from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { serviceOrder } from 'src/constants/helpers';

function AssignTechnicianDialog({ technicianData, selectedServiceOrder, onClose, onOk }) {
  const assignTechnicianToServiceOrder = () => {
    const sendData: any = [
      {
        _id: selectedServiceOrder[0]?.service?._id,
        service: selectedServiceOrder[0]?.service?.materialId,
        technician: technicianData?._id,
        estimateStartDate: selectedServiceOrder[0]?.estimateStartDate,
        estimateEndDate: selectedServiceOrder[0]?.estimateEndDate
      }
    ];

    axiosInstance()
      .post(`${serviceOrder.api}/${selectedServiceOrder[0]._id}/technician`, sendData)
      .then(() => {
        onOk();
        onClose();
      })
      .catch((error) => {
        // toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog open={true}>
      <CustomDialogHeader title="Assign Technician" onClose={onClose} showRequiredLabel={false} />
      <CustomDialogContent>
        {console.log(technicianData, selectedServiceOrder)}
        <div>
          <Typography variant="body1" color="textPrimary">
            Do You want to assign {technicianData?.firstName || ''} {technicianData?.lastName || ''} {`(${technicianData.employeeNumber || ''})`} to{' '}
            {`${selectedServiceOrder[0]?.service?.serviceName} (${selectedServiceOrder[0]?.serviceOrderNumber})`}?{' '}
          </Typography>
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" color="primary" onClick={assignTechnicianToServiceOrder}>
          Assign
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default AssignTechnicianDialog;

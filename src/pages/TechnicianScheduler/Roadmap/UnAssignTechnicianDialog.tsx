import { useContext } from 'react';
import { Button, Dialog, Typography, Box } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { rentalManagement } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function UnAssignTechnicianDialog({ technicianData, handleClose, handleSucess }) {
  const toastConfig = useContext(CustomToastContext);

  const handleUnAssign = () => {
    axiosInstance()
      .put(`${rentalManagement.api}/technician`, { ids: [{ id: technicianData?.technicianHistoryId }] })
      .then(() => {
        handleSucess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog open={true}>
      <CustomDialogHeader title="Un-Assign Technician" onClose={handleClose} showRequiredLabel={false} />
      <CustomDialogContent>
        <Box p={2}>
          <Typography variant="body1" color="textPrimary">
            Do You want to un-assign ?
          </Typography>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" color="primary" onClick={handleClose}>
          Close
        </Button>
        <Button size="small" variant="contained" color="primary" onClick={handleUnAssign}>
          Un-Assign
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default UnAssignTechnicianDialog;

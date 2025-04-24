import { Dialog, Typography, Box } from '@mui/material';
import { useContext, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

function AssignTechnicianDialog({ technicianData, selectedResource, selectedServiceOrder, handleClose, handleSucess }) {
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  const handleAssign = (skipDateValidation = false) => {
    const data = selectedServiceOrder?.map((ele) => {
      return {
        uniqueId: ele?.service?.uniqueId,
        service: ele?.serviceId,
        technician: technicianData?._id,
        warehouse: ele?.warehouse,
        referenceId: ele?.resourceId,
        estimateStartDate: ele?.service?.estimateStartDate || ele?.estimateStartDate,
        estimateEndDate: ele?.service?.estimateEndDate || ele?.estimateEndDate,
      };
    });
    setIsSubmitting(true);
    axiosInstance()
      .post(`${selectedResource.api}/technician`, { technician: data, skipDateValidation })
      .then(() => {
        handleSucess();
        setIsSubmitting(false);
        setShowConfirmBox(false)
      })
      .catch((error) => {
        if (skipDateValidation) {
          toastConfig.setToastConfig(error);
        }
        else {
          setShowConfirmBox(true)
        }
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog open={true} TransitionComponent={CustomDialogTransition}>
      <CustomDialogHeader title="Assign Technician" onClose={handleClose} showRequiredLabel={false} />
      <CustomDialogContent>
        <Box p={2}>
          <Typography variant="body1" color="textPrimary">
            Do you want to assign{' '}
            {`${selectedServiceOrder[0]?.service?.serviceName || ''} (${selectedServiceOrder[0]?.fieldTicketNumber || selectedServiceOrder[0]?.rentalJobName || selectedServiceOrder[0]?.fieldServiceOrderNumber})`}{' '}
            to {technicianData?.firstName || ''} {technicianData?.lastName || ''}?
          </Typography>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={handleClose}>
          Close
        </ThemeButton>
        <ThemeButton
          isLoading={isSubmitting}
          buttonType="theme"
          onClick={() => {
            handleAssign()
          }}
          disabled={isSubmitting}>
          Assign
        </ThemeButton>
      </CustomDialogFooter>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`A technician is already scheduled during these dates. Do you still wish to proceed with this assignment?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={() => {
            handleAssign(true)
          }}
        />
      )}
    </Dialog>
  );
}

export default AssignTechnicianDialog;

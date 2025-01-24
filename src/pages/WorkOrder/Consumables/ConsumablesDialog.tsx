import { Dialog } from '@mui/material';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import Consumables from './';
import { CustomDialogTransition } from 'src/constants/helpers';

const ConsumablesDialog = ({ onSuccess, handleClose, workOrderData, service, uniqueId, stepId, serviceName }) => {
  return (
    <Dialog
      fullWidth
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullScreen={true}
      open={true}
      onClose={handleClose}
      aria-labelledby="consume-dialog"
    >
      <CustomDialogHeader
        title={serviceName ? `${serviceName} - Products/Consumables` : 'Products/Consumables'}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <Consumables
          allowedToEdit={true}
          isCreate={true}
          service={service}
          uniqueId={uniqueId}
          stepId={stepId}
          serviceName={serviceName}
          workOrderData={workOrderData}
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default ConsumablesDialog;

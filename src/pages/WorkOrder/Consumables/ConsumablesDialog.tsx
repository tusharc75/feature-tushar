import { Dialog } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import Consumables from './';

const ConsumablesDialog = ({ onSuccess, handleClose, workOrderId, service, uniqueId, stepId, serviceName }) => {

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="consume-dialog">
      <CustomDialogHeader
        title={`${serviceName} - Products/Consumables`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <Consumables
          allowedToEdit={true}
          isCreate={true}
          workOrderId={workOrderId}
          service={service}
          uniqueId={uniqueId}
          stepId={stepId}
          serviceName={serviceName}
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default ConsumablesDialog;

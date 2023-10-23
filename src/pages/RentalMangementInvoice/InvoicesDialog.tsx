
import { CustomDialogTransition, rentalManagement } from 'src/constants/helpers';
import ProgressiveBilling from '../RentalManagement/ProgressiveBilling';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const InvoiceDialog = ({ rentalManagementData, rentalId, rentalJobName, handleClose }) => {
  return (
    <>
      <Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}>
        <CustomDialogHeader
          title={`Invoices : ${rentalJobName}`}
          onClose={() => {
            handleClose()
          }}
          showRequiredLabel={false} />
        <CustomDialogContent>
          <ProgressiveBilling
            rentalId={rentalId}
            rentalManagementData={rentalManagementData}
            allowCreateInvoice={false}
          />
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceDialog;

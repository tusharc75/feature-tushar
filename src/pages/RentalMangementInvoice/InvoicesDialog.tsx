
import { CustomDialogTransition, rentalManagement } from 'src/constants/helpers';
import Invoices from './Invoices';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const InvoiceDialog = ({rentalManagementData, rentalId, rentalName, handleClose }) => {
  return (
    <>
      <Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}>
        <CustomDialogHeader
          title={`Invoices : ${rentalName}`}
          onClose={() => {
            handleClose()
          }}
          showRequiredLabel={false} />
        <CustomDialogContent>
          <Invoices
            rentalId={rentalId}
            rentalManagementData = {rentalManagementData}
          />
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceDialog;

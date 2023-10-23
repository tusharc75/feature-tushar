
import { CustomDialogTransition } from 'src/constants/helpers';
import Invoices from '../../Sublease/Invoices';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const InvoiceDialog = ({ subleaseId, subleaseName, handleClose }) => {
  return (
    <>
      <Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}>
        <CustomDialogHeader
          title={`Invoices : ${subleaseName}`}
          onClose={() => {
            handleClose()
          }}
          showRequiredLabel={false} />
        <CustomDialogContent>
          <Invoices
            subleaseId={subleaseId}
          />
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceDialog;

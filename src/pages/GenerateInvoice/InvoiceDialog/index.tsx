
import { CustomDialogTransition } from 'src/constants/helpers';
import Invoices from './Invoices';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const InvoiceDialog = ({ resourceId, selectedResource, handleClose, headerName }) => {
  return (
    <>
      <Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}>
        <CustomDialogHeader
          title={`Invoices: ${headerName}`}
          onClose={() => {
            handleClose()
          }}
          showRequiredLabel={false} />
        <CustomDialogContent>
          <Invoices
            resourceId={resourceId}
            resourceName={selectedResource.key}
          />
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceDialog;

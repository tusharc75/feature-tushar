
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import Invoices from './Invoices';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import ProgressiveBilling from 'src/pages/RentalManagement/ProgressiveBilling';

const InvoiceDialog = ({ resourceData, selectedResource, handleClose }) => {
  return (
    <>
      <Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}>
        <CustomDialogHeader
          title={`Invoices: ${resourceData[selectedResource.fieldName]}`}
          onClose={() => {
            handleClose()
          }}
          showRequiredLabel={false} />
        <CustomDialogContent>
          {selectedResource.resource === sidebarResource.rentalManagement ? (
            <ProgressiveBilling
              rentalId={resourceData?._id}
              rentalManagementData={resourceData}
              allowCreateInvoice={false}
            />
          ) : (
            <Invoices
              resourceId={resourceData?._id}
              resourceName={selectedResource.key}
            />
          )}

        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceDialog;

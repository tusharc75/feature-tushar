import { checkIsAllowedToEdit, CustomDialogTransition, RENTAL_STATUS, sidebarResource } from 'src/constants/helpers';
import Invoices from './Invoices';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import ProgressiveBilling from 'src/pages/RentalManagement/ProgressiveBilling';
import { useData } from 'src/StateProvider/Provider';

const InvoiceDialog = ({ resourceData, selectedResource, handleClose }) => {

  const {
    state: { user }
  }: any = useData();

  return (
    <>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={`Invoices: ${resourceData[selectedResource.fieldName]}`}
          onClose={() => {
            handleClose();
          }}
          showRequiredLabel={false}
        />
        <CustomDialogContent isFooterPresent={false}>
          {selectedResource.resource === sidebarResource.rentalManagement ? (
            <ProgressiveBilling
              rentalId={resourceData?._id}
              rentalManagementData={resourceData}
              allowCreateInvoice={false}
            />
          ) : (
            <Invoices
              resourceId={resourceData?._id}
              resource={selectedResource.resource}
              invoiceFieldName={selectedResource.invoiceFieldName} />
          )}
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceDialog;

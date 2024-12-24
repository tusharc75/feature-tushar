import { Button, Dialog } from '@mui/material';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, SERVICE_ORDER_STATUS, checkIsAllowedToEdit, sidebarResource } from 'src/constants/helpers';
import FieldTicket from '../FieldServiceOrder/FieldTicket';
import { useData } from 'src/StateProvider/Provider';
import { useEffect, useState } from 'react';

export default function ViewFieldTicketDialog({ onClose, serviceOrderData }) {
  const {
    state: { user, permissions }
  }: any = useData();

  const [allowedToEdit, setAllowedToEdit] = useState(false);

  useEffect(() => {
    setAllowedToEdit(
      permissions?.fieldTicket?.isUpdate &&
        checkIsAllowedToEdit(user, sidebarResource.fieldTicket, serviceOrderData) &&
        ![SERVICE_ORDER_STATUS.closed]?.includes(serviceOrderData?.status)
    );
  }, [serviceOrderData]);

  return (
    <>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={`Field Ticket - ${serviceOrderData?.fieldServiceOrderNumber}`}
          onClose={onClose}
          showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <FieldTicket
            serviceOrderData={serviceOrderData}
            setNextStep={() => {}}
            allowedToEdit={allowedToEdit}
            handleChangeStatus={() => {}}
            fetchServiceOrderData={() => {}}
            resource={sidebarResource.fieldServiceTechnician}
          />
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
            Cancel
          </Button>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
}

import { Dialog } from '@mui/material';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, SERVICE_ORDER_STATUS, checkIsAllowedToEdit, sidebarResource } from 'src/constants/helpers';
import FieldTicket from '../FieldServiceOrder/FieldTicket';
import { useData } from 'src/StateProvider/Provider';
import { useEffect, useState } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export default function ViewFieldTicketDialog({ onClose, resource, resourceData }) {
  const {
    state: { user, permissions }
  }: any = useData();

  const [allowedToEdit, setAllowedToEdit] = useState(false);

  useEffect(() => {
    setAllowedToEdit(permissions?.fieldTicket?.isUpdate &&
      checkIsAllowedToEdit(user, sidebarResource.fieldTicket, resourceData) && ![SERVICE_ORDER_STATUS.closed]?.includes(resourceData?.status)
    );
  }, [resourceData]);

  return (
    <>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={`Field Ticket - ${resourceData?.fieldServiceOrderNumber || resourceData?.rentalJobName}`}
          onClose={onClose}
          showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <FieldTicket
            resourceData={resourceData}
            resource={resource}
            allowedToEdit={allowedToEdit}
            handleChangeStatus={() => { }}
            fetchResourceData={() => { }}
            fromFieldServiceTechnician={true}
          />
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton buttonType='transparent' onClick={onClose}>
            Cancel
          </ThemeButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
}

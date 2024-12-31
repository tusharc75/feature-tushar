import { CustomDialogTransition } from '../../../constants/helpers';
import Dialog from '@mui/material/Dialog/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import MultipleTicketProcess from './MultipleTicketProcess';

const MultipleTicket = ({ referenceData, ticketType, referenceType, handleClose }) => {
  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title={`Process ${ticketType} Ticket`} onClose={handleClose}></CustomDialogHeader>
      <div className="listing-grid p-3">
        <MultipleTicketProcess referenceData={referenceData} ticketType={ticketType} referenceType={referenceType} />
      </div>
    </Dialog>
  );
};

export default MultipleTicket;

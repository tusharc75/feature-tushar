import { DELIVERY_TICKET_REFERENCE_TYPE } from '../../../constants/helpers';
import TypewiseTickets from '../../../components/DeliveryTicket/TypewiseTickets';


const Tickets = ({ repairJobData, renderedFrom }) => {
  return <TypewiseTickets referenceType={DELIVERY_TICKET_REFERENCE_TYPE.repairJob} referenceId={repairJobData?._id} renderedFrom={renderedFrom} />;
};

export default Tickets;

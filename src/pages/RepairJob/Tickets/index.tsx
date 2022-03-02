import { DELIVERY_TICKET_REFRENCE_TYPE } from '../../../constants/helpers';
import TypewiseTickets from '../../../components/DeliveryTicket/TypewiseTickets';


const Tickets = ({ repairJobData, renderedFrom }) => {
  return <TypewiseTickets refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.repairJob} refrenceId={repairJobData?._id} renderedFrom={renderedFrom} />;
};

export default Tickets;

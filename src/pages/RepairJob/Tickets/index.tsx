import { DELIVERY_TICKET_REFRENCE_TYPE } from '../../../constants/helpers';
import TypewiseTickets from '../../../components/DeliveryTicket/TypewiseTickets';


const Tickets = ({ repairJobId, renderedFrom = 'repairJobTickets' }) => {
    return (
        <TypewiseTickets
            refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.repairJob}
            refrenceId={repairJobId}
            renderedFrom={renderedFrom}
        />
    );
};

export default Tickets;

import { DELIVERY_TICKET_REFRENCE_TYPE } from '../../../constants/helpers';
import TypewiseTickets from '../../../components/DeliveryTicket/TypewiseTickets';

const Tickets = ({ subleaseId, renderedFrom = 'SubleasingTickets' }) => {
    return (
        <TypewiseTickets
            refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.sublease}
            refrenceId={subleaseId}
            renderedFrom={renderedFrom}
        />
    );
};

export default Tickets;

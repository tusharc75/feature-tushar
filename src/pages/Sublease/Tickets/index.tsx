import { DELIVERY_TICKET_REFERENCE_TYPE } from '../../../constants/helpers';
import TypewiseTickets from '../../../components/DeliveryTicket/TypewiseTickets';

const Tickets = ({ subleaseId, renderedFrom = 'SubleasingTickets' }) => {
    return (
        <TypewiseTickets
            referenceType={DELIVERY_TICKET_REFERENCE_TYPE.sublease}
            referenceId={subleaseId}
            renderedFrom={renderedFrom}
        />
    );
};

export default Tickets;

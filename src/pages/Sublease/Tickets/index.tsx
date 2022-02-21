import { DELIVERY_TICKET_REFRENCE_TYPE } from '../../../constants/helpers';
import TypewiseTickets from '../../../components/DeliveryTicket/TypewiseTickets';

const renderedFrom = 'SubleasingTickets';

const Tickets = ({ subleaseData }) => {
    return (
        <TypewiseTickets
            refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.sublease}
            refrenceId={subleaseData._id}
            renderedFrom={renderedFrom}
        />
    );
};

export default Tickets;

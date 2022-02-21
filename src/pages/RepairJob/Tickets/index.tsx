import { DELIVERY_TICKET_REFRENCE_TYPE } from '../../../constants/helpers';
import TypewiseTickets from '../../../components/DeliveryTicket/TypewiseTickets';

const renderedFrom = 'repairJobTickets';

const Tickets = ({ repairJobData }) => {
    return (
        <TypewiseTickets
            refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.repairJob}
            refrenceId={repairJobData._id}
            renderedFrom={renderedFrom}
        />
    );
};

export default Tickets;

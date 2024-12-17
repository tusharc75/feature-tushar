import queryString from 'query-string';
import { useHistory, useParams } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import WorkOrderDetailContent from 'src/pages/WorkOrder/WorkOrderDetailContent';

const WorkOrderDetails = () => {
  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  return <WorkOrderDetailContent id={id} tab={tab} renderedFrom={sidebarResource?.workOrder} />;
};

export default WorkOrderDetails;

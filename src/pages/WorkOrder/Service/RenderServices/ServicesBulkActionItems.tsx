import { BulkActionContainer } from 'src/components/CustomReactTable/GridHeader';
import { MATERIAL_TYPE, WORK_ORDER_STATUS, WORKORDER_SERVICE_STATUS } from 'src/constants/helpers';

const ServicesBulkActionItems = ({ selectedServices, workOrderData, onClickCompleteServices }) => {
  return (
    <BulkActionContainer>
      <BulkActionContainer.Button
        id={'complete-services'}
        disabled={[WORK_ORDER_STATUS.draft, WORK_ORDER_STATUS.onHold, WORK_ORDER_STATUS.completed]?.includes(workOrderData?.status) || !selectedServices?.every(e => [WORKORDER_SERVICE_STATUS.inProgress, WORKORDER_SERVICE_STATUS.pending].includes(e?.status))}
        onClick={() => {
          onClickCompleteServices(selectedServices?.filter(e => e?.type === MATERIAL_TYPE.service)?.map(e => ({ service: e?._id, uniqueId: e?.uniqueId })))
        }}
      >
        Complete Services
      </BulkActionContainer.Button>
    </BulkActionContainer>
  );
};

export default ServicesBulkActionItems;

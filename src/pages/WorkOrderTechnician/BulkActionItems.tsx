import { groupBy } from 'lodash';
import { BulkActionContainer } from 'src/components/CustomReactTable/GridHeader';
import { MATERIAL_TYPE, WORK_ORDER_STATUS, WORKORDER_SERVICE_STATUS } from 'src/constants/helpers';

const BulkActionItems = ({ selectedRecords, setWorkOrdersCompleteServicesDialog }) => {
  return (
    <BulkActionContainer>
      <BulkActionContainer.Button
        disabled={
          selectedRecords?.length &&
          selectedRecords?.filter(
            (s) => s?.customServiceStatus === WORKORDER_SERVICE_STATUS.pending && s?.status !== WORK_ORDER_STATUS.onHold && s?.canPerform
          )?.length === selectedRecords?.length
            ? false
            : true
        }
        onClick={() => {
          const groupedWorkOrder = groupBy(
            selectedRecords?.filter((e) => !!e?.workOrderId),
            'workOrderId'
          );
          const data: any = [];
          for (const workOrderId in groupedWorkOrder) {
            data.push({
              workOrder: workOrderId,
              services: groupedWorkOrder[workOrderId]
                ?.filter((e) => e?.type === MATERIAL_TYPE.service)
                ?.map((e) => ({ service: e?.serviceId, uniqueId: e?.uniqueId }))
            });
          }
          setWorkOrdersCompleteServicesDialog({ open: true, workOrders: data });
        }}
      >
        Complete Service(s)
      </BulkActionContainer.Button>
    </BulkActionContainer>
  );
};

export default BulkActionItems;

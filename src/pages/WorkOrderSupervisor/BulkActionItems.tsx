import { BulkActionContainer } from 'src/components/CustomReactTable/GridHeader';
import { WORKORDER_SERVICE_STATUS } from 'src/constants/helpers';
import { isCreateRepairOrderDisabled } from 'src/pages/WorkOrderSupervisor/helper';
import { useData } from 'src/StateProvider/Provider';

const BulkActionItems = ({
  selectedRecords,
  selectedRecordsP,
  selectedRecordsS,
  viewType,
  tableViewStatus,
  setRepairOrderDialog,
  workOrderListRef,
  setWorkStationAssignDialog,
  setAssignTechnicianDialog,
  setConsumablesDialog
}) => {
  const {
    state: { resources, permissions }
  }: any = useData();

  const canShowWorkStationButton = permissions?.workStations?.isRead;
  const isTable = viewType === 'table-view';
  const isCard = !isTable;

  const isTablePlanned = tableViewStatus === WORKORDER_SERVICE_STATUS.planned;
  const allPlanned = selectedRecords?.every((r) => r?.status === WORKORDER_SERVICE_STATUS.planned);
  const anyPlanned = selectedRecords?.some((r) => r?.status === WORKORDER_SERVICE_STATUS.planned);
  const cardState = allPlanned ? 'allPlanned' : anyPlanned ? 'mixed' : 'allNotPlanned';
  const showCreateRepairOrder = (isTable && isTablePlanned) || (isCard && (cardState === 'allPlanned' || cardState === 'mixed'));

  const baseShowAssign = (isTable && !isTablePlanned) || (isCard && cardState !== 'allPlanned');

  const showAssignTechnician = baseShowAssign;
  const showAssignWorkStation = canShowWorkStationButton && baseShowAssign;
  const showAddConsumables = baseShowAssign;
  return (
    <BulkActionContainer>
      {showCreateRepairOrder && (
        <BulkActionContainer.Button
          disabled={viewType === 'table-view' ? isCreateRepairOrderDisabled(selectedRecords) : isCreateRepairOrderDisabled(selectedRecordsP)}
          onClick={() => {
            setRepairOrderDialog(true);
          }}
        >
          Create {resources?.repairOrder?.titleSingular}
        </BulkActionContainer.Button>
      )}
      {showAssignTechnician && (
        <BulkActionContainer.Button
          disabled={
            selectedRecordsS?.some((r) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(r?.status)) ||
            !selectedRecordsS?.length
          }
          onClick={() => {
            if (viewType === 'table-view') {
              workOrderListRef.current?.setAssignTechnicianDialog(true);
            } else {
              setAssignTechnicianDialog({ open: true, multiple: true });
            }
          }}
        >
          Assign Technicians
        </BulkActionContainer.Button>
      )}
      {showAssignWorkStation && (
        <BulkActionContainer.Button
          disabled={
            selectedRecordsS?.some((r) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.skipped]?.includes(r?.status)) ||
            !selectedRecordsS?.length
          }
          onClick={() => {
            if (viewType === 'table-view') {
              workOrderListRef.current?.setWorkStationAssignDialog(true);
            } else {
              setWorkStationAssignDialog({ open: true, multiple: true });
            }
          }}
        >
          Assign {resources?.workStations?.titlePlural}
        </BulkActionContainer.Button>
      )}
      {showAddConsumables && (
        <BulkActionContainer.Button
          disabled={!selectedRecordsS?.length}
          onClick={() => {
            setConsumablesDialog({ open: true, multiple: true });
          }}
        >
          Add Products/Consumables
        </BulkActionContainer.Button>
      )}
    </BulkActionContainer>
  );
};

export default BulkActionItems;

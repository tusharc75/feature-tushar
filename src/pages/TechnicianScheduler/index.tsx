import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Box } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import ButtonMenu from 'src/components/ButtonMenu';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useDndSensors } from 'src/hooks';
import ServiceOrderSidebar from 'src/pages/TechnicianScheduler/ServiceOrderSidebar';
import { SingleRow } from 'src/pages/TechnicianScheduler/ServiceOrderSidebar/TechnicianList';
import { TechnicianResource, useTechnicianResources } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import Roadmap from './Roadmap';

const filter = { view: 'Technician View', resource: '', fieldTicket: '' };

function TechnicianScheduler() {
  const toastConfig = useContext(CustomToastContext);
  const [selectedResource, setSelectedReSource] = useState<TechnicianResource | null>(null);
  const technicianResources = useTechnicianResources(toastConfig, setSelectedReSource);
  const [assignTechnicianDialogData, setAssignTechnicianDialogData] = useState({ open: false, technicianData: null, service: null });
  const [unAssignTechnicianDialog, setUnAssignTechnicianDialog] = useState({ open: false, data: null });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const sensors = useDndSensors();

  const onDragStart = (event: DragStartEvent) => {
    if (!event.active) return;
    setActiveItem(event.active.data.current.props);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    if (!event.over || !event.over.data.current.item || !event.active.data.current.row) return;
    const { active, over } = event;

    const technicianData = over.data.current.item;
    const service = active.data.current.row;

    setAssignTechnicianDialogData({ open: true, service, technicianData });
  };

  const {
    state: { resources }
  }: any = useData();

  const headerSLot = useMemo(() => {
    if (technicianResources)
      return (
        <ButtonMenu
          showChevron={true}
          getLabel={(d) => d.title}
          items={technicianResources}
          getSelectedMenuItem={(item) => item.key === selectedResource.key}
          onItemClick={(e, item) => {
            setSelectedReSource(item);
          }}
        >
          <span className="flex items-center gap-2 [&_svg]:text-[18px]">{selectedResource?.title}</span>
        </ButtonMenu>
      );
    return null;
  }, [selectedResource?.key, selectedResource?.title, technicianResources]);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: resources?.technicianScheduler?.titlePlural }]} />
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <DndContext sensors={sensors} onDragEnd={onDragEnd} onDragStart={onDragStart}>
          <Roadmap
            filter={filter}
            refresh={refresh}
            selectedRecords={selectedRecords}
            handleUnAssignTechnician={(data) => {
              setUnAssignTechnicianDialog({ open: true, data: data });
            }}
            leftSidebarTitle={`Unscheduled ${selectedResource?.title}`}
            leftSidebar={
              <ServiceOrderSidebar
                setRefresh={setRefresh}
                selectedResource={selectedResource}
                assignTechnicianDialog={assignTechnicianDialogData}
                unAssignTechnicianDialog={unAssignTechnicianDialog}
                handleSucess={() => {
                  setRefresh((prev) => !prev);
                  setAssignTechnicianDialogData({ open: false, technicianData: null, service: null });
                  setUnAssignTechnicianDialog({ open: false, data: null });
                }}
                handleClose={() => {
                  setAssignTechnicianDialogData({ open: false, technicianData: null, service: null });
                  setUnAssignTechnicianDialog({ open: false, data: null });
                }}
                setSelectedRecords={setSelectedRecords}
              />
            }
            headerSlot={headerSLot}
          />
          <DragOverlay>{activeItem && <SingleRow {...activeItem} className="cursor-grabbing" />}</DragOverlay>
        </DndContext>
      </Box>
    </Box>
  );
}

export default TechnicianScheduler;

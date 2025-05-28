import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Box } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import ButtonMenu from 'src/components/ButtonMenu';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useDndSensors } from 'src/hooks';
import { SingleTechnician } from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/Sidebar';
import ServiceOrderSidebar from 'src/pages/TechnicianScheduler/ServiceOrderSidebar';
import { SingleRow } from 'src/pages/TechnicianScheduler/ServiceOrderSidebar/TechnicianList';
import { RoadMapProvider, useRoadMapStore } from 'src/pages/TechnicianScheduler/Store';
import { TechnicianResource, useTechnicianResources } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import Roadmap from './Roadmap';
import axiosInstance from 'src/axios/axiosInstance';

const filter = { view: 'Technician View', resource: '', fieldTicket: '' };

function TechnicianSchedulerImpl() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_d, setStore] = useRoadMapStore((state) => state.activeItemData);
  const toastConfig = useContext(CustomToastContext);
  const [selectedResource, setSelectedReSource] = useState<TechnicianResource | null>(null);
  const technicianResources = useTechnicianResources(toastConfig, setSelectedReSource);
  const [assignTechnicianDialogData, setAssignTechnicianDialogData] = useState({ open: false, technicians: null, services: null });
  const [unAssignTechnicianDialog, setUnAssignTechnicianDialog] = useState({ open: false, data: null });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [refreshRoadMap, setRefreshRoadMap] = useState(false);
  const [refreshServiceData, setRefreshServiceData] = useState(false);
  const [viewType, setViewType] = useState<any>('job');
  const [activity, setActivity] = useState(null);
  const sensors = useDndSensors();
  const [assignServiceDialog, setAssignServiceDialog] = useState({ open: false, data: null });

  const onDragStart = (event: DragStartEvent) => {
    if (!event.active) return;
    setActiveItem(event.active.data.current.props);
    setStore({ activeItemData: { data: event.active.data.current?.row || event.active.data.current?.item, type: event.active.data.current.type } });
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    setStore({ activeItemData: null });
    const { active, over } = event;
    if (over && over.data.current.accepts.includes(active.data.current.type)) {
      const activeType = active.data.current.type;
      const isFromTechnician = activeType === 'technician';
      let technicianData, service;

      if (isFromTechnician) {
        technicianData = active.data.current.item;
        service = over.data.current.row;
      } else {
        technicianData = over.data.current.item;
        service = active.data.current.row;
      }

      setAssignTechnicianDialogData({ open: true, technicians: [technicianData], services: [service] });
    }
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

  const fetchRoadmap = async () => {
    await axiosInstance()
      .get(`/technician-scheduler/get-schedule?resource=${selectedResource.resource}`)
      .then(({ data: { data } }) => {
        setActivity(data);
      });
  };

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
            assignServiceDialog={assignServiceDialog}
            setAssignServiceDialog={setAssignServiceDialog}
            refreshRoadMap={refreshRoadMap}
            selectedRecords={selectedRecords}
            setAssignTechnicianDialog={setAssignTechnicianDialogData}
            activity={activity}
            fetchRoadmap={fetchRoadmap}
            handleUnAssignTechnician={(data) => {
              setUnAssignTechnicianDialog({ open: true, data: data });
            }}
            setViewType={setViewType}
            viewType={viewType}
            selectedResource={selectedResource}
            refreshAll={() => {
              setRefreshServiceData((prev) => !prev);
              setRefreshRoadMap((prev) => !prev);
            }}
            leftSidebar={(isMobile) => (
              <ServiceOrderSidebar
                isMobile={isMobile}
                viewType={viewType}
                selectedResource={selectedResource}
                assignTechnicianDialog={assignTechnicianDialogData}
                setAssignTechnicianDialogData={setAssignTechnicianDialogData}
                unAssignTechnicianDialog={unAssignTechnicianDialog}
                handleSuccess={() => {
                  setRefreshRoadMap((prev) => !prev);
                  setAssignTechnicianDialogData({ open: false, technicians: null, services: null });
                  setUnAssignTechnicianDialog({ open: false, data: null });
                  setRefreshServiceData((prev) => !prev);
                  setAssignServiceDialog({ open: false, data: null });
                }}
                handleClose={() => {
                  setAssignTechnicianDialogData({ open: false, technicians: null, services: null });
                  setUnAssignTechnicianDialog({ open: false, data: null });
                }}
                setSelectedRecords={setSelectedRecords}
                refreshServiceData={refreshServiceData}
              />
            )}
            headerSlot={headerSLot}
          />
          <DragOverlay>
            {activeItem?.type === 'technician' ? (
              <SingleTechnician {...activeItem} className="flex h-[90px] cursor-grabbing items-center justify-center border" />
            ) : (
              <SingleRow {...activeItem} className="cursor-grabbing" />
            )}
          </DragOverlay>
        </DndContext>
      </Box>
    </Box>
  );
}

const TechnicianScheduler = () => (
  <RoadMapProvider>
    <TechnicianSchedulerImpl />
  </RoadMapProvider>
);
export default TechnicianScheduler;

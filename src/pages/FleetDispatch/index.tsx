import { Box, IconButton } from '@mui/material';
import { Map } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import update from 'immutability-helper';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import DispatchDialog from './DispatchDialog';
import DispatchList from './DispatchList';
import MapView from './Map';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import FleetDispatchBox from './DispatchCard';
import { useDndSensors } from 'src/hooks';
import { useData } from 'src/StateProvider/Provider';

const FleetDispatch = () => {
  const toastConfig = useContext(CustomToastContext);

  const [fleets, setFleets] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState({ open: false, fleet: null, job: null });
  const [showMapView, setShowMapView] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const {
    state: { resources }
  }: any = useData();

  const fetchData = () => {
    axiosInstance()
      .get(`/fleet-dispatch/available-job-fleet`)
      .then(({ data: { data } }) => {
        setFleets(data?.fleets || []);
        setJobs(data?.jobs || []);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDispatch = (fleet, job) => {
    setDispatchDialogOpen({ open: true, fleet: fleet, job: job });
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    if (!event.over) return;
    const { active, over } = event;
    const activeProps = active.data.current.props;
    const overProps = over.data.current.props;

    const activeType = activeProps.cardType;
    const overType = overProps.cardType;
    if (activeType === overType) return;
    const data = { [activeType]: activeProps.data, [overType]: overProps.data };
    handleDispatch(data['fleet'], data['job']);
  };

  const sensors = useDndSensors();

  const onDragStart = (event: DragStartEvent) => {
    if (!event?.active) return;
    setActiveItem(event.active.data.current.props);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: resources?.fleetDispatch?.titlePlural }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Box className="d-flex justify-content-end align-items-center mb-4">
          <Box className="d-flex align-items-center">
            <IconButton
              size="small"
              onClick={() => {
                setShowMapView(true);
              }}
            >
              <Map fontSize="small" color="primary" />
            </IconButton>
            <IconButton className="ml-2" size="small" onClick={fetchData}>
              <RefreshIcon fontSize="small" color="primary" />
            </IconButton>
          </Box>
        </Box>
        {fleets && jobs ? (
          <>
            <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <ul className="grid grid-cols-2 min-[725px]:grid-cols-2 min-[1195px]:md:grid-cols-2">
                <div>
                  <DispatchList activity={fleets} cardType="fleet" />
                </div>
                <div>
                  <DispatchList activity={jobs} cardType="job" />
                </div>
              </ul>
              <DragOverlay dropAnimation={null}>{activeItem && <FleetDispatchBox {...activeItem} />}</DragOverlay>
            </DndContext>
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {dispatchDialogOpen.open && (
          <DispatchDialog
            handleSucess={() => {
              setDispatchDialogOpen({ open: false, fleet: null, job: null });
              fetchData();
            }}
            handleClose={() => {
              setDispatchDialogOpen({ open: false, fleet: null, job: null });
            }}
            fleet={dispatchDialogOpen.fleet}
            job={dispatchDialogOpen.job}
          />
        )}
        {dispatchDialogOpen.open && (
          <DispatchDialog
            handleSucess={() => {
              setDispatchDialogOpen({ open: false, fleet: null, job: null });
              fetchData();
            }}
            handleClose={() => {
              setDispatchDialogOpen({ open: false, fleet: null, job: null });
            }}
            fleet={dispatchDialogOpen.fleet}
            job={dispatchDialogOpen.job}
          />
        )}
        {showMapView && (
          <MapView
            handleClose={() => {
              setShowMapView(false);
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default FleetDispatch;

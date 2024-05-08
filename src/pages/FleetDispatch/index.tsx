import { Box, IconButton } from '@material-ui/core';
import { Map } from '@material-ui/icons';
import RefreshIcon from '@material-ui/icons/Refresh';
import { useCallback, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import DispatchDialog from './DispatchDialog';
import DispatchList from './DispatchList';
import MapView from './Map';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import update from 'immutability-helper';

const FleetDispatch = () => {
  const toastConfig = useContext(CustomToastContext);

  const [fleets, setFleets] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState({ open: false, fleet: null, job: null });
  const [showMapView, setShowMapView] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

  const moveCard = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      if (result.destination.droppableId !== result.source.droppableId) return;
      const { source, destination } = result;
      const dragIndex = source.index;
      const dropIndex = destination?.index;
      function updateList(list, setList) {
        const dragCard = list[dragIndex];
        setList(
          update(list, {
            $splice: [
              [dragIndex, 1],
              [dropIndex, 0, dragCard]
            ]
          })
        );
      }
      if (source.droppableId === 'fleet') {
        updateList(fleets, setFleets);
      }
      if (source.droppableId === 'job') {
        updateList(jobs, setJobs);
      }
    },
    [fleets, jobs]
  );

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.fleetDispatch.title }]} />
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
          <DragDropContext onDragEnd={moveCard}>
            <div className="grid grid-cols-1 min-[725px]:grid-cols-2 min-[1195px]:md:grid-cols-3">
              <DispatchList activity={fleets} cardType="fleet" handleDispatch={handleDispatch} />
              <DispatchList activity={jobs} cardType="job" handleDispatch={handleDispatch} />
            </div>
          </DragDropContext>
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

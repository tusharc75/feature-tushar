import { Box, Grid, IconButton } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { DndProvider } from 'react-dnd';
import { isMobile, isTablet } from 'react-device-detect';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DispatchList from './DispatchList';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import DispatchDialog from './DispatchDialog';
import { Map } from '@material-ui/icons';
import RefreshIcon from '@material-ui/icons/Refresh';
import MapView from './Map';

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
          <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
            <Grid container spacing={2}>
              <Grid item md={6} xs={12} style={{ paddingTop: '0px' }}>
                <DispatchList activity={fleets} cardType="fleet" handleDispatch={handleDispatch} />
              </Grid>
              <Grid item md={6} xs={12} style={{ paddingTop: '0px' }}>
                <DispatchList activity={jobs} cardType="job" handleDispatch={handleDispatch} />
              </Grid>
            </Grid>
          </DndProvider>
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

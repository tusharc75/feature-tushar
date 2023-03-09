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
import { RefreshButton } from 'src/components/AgGridComponents/GridButtons';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { Close, Map } from '@material-ui/icons';
import MapView from './Map';

const FleetDispatch = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);

  const [fleets, setFleets] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState({ open: false, fleet: null, job: null });
  const [showMapView, setShowMapView] = useState(false)

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
      {!showMapView ?
        <Box className={`detail-container-v1`}>
          <Box className='d-flex justify-content-end align-items-center mb-4'>
            <Box className="d-flex align-items-center">
              <IconButton
                style={{ padding: 0 }}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowMapView(true)
                }}
              >
                <Map fontSize="medium" />
              </IconButton>
            </Box>
            <RefreshButton isOffline={isOffline} refreshGrid={fetchData} style={{ border: 'none' }} />
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
            <Box p={2} height={500} bgcolor="white">
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
        </Box>
        :
        <Box style={{ position: 'relative' }}>
          <MapView />
          <IconButton
            onClick={() => {
              setShowMapView(false)
            }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 1
            }}
          >
            <Close />
          </IconButton>
        </Box>
      }
    </Box>
  );
};

export default FleetDispatch;

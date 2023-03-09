import { Box, Grid, makeStyles, Typography } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { DndProvider } from 'react-dnd';
import { isMobile, isTablet } from 'react-device-detect';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ManageFleetReceiverDialog from './ReceiverDialog';
import moment from 'moment';
import { dateFormat } from 'src/constants/helpers';

const useStyles = makeStyles(() => ({
  fleetBox: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    margin: '0px 6px 14px',
    borderRadius: '4px',
    border: '1px solid #ebebeb',
    padding: '15px',
    transition: 'transform .2s, background .3s',
    '&:hover': {
      transform: 'scale(1.02)',
      zIndex: '1'
    }
  }
}));
const FleetReceiver = () => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [fleets, setFleets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiverDialogOpen, setReceiverDialogOpen] = useState({ open: false, fleet: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`/fleet-receiver`)
      .then(({ data: { data } }) => {
        setFleets(data?.data || []);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.fleetReceiver.title }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {!loading ? (
          fleets?.length > 0 ? (
            <Grid container spacing={2}>
              <Grid item md={6} xs={12} sm={4} style={{ paddingTop: '0px' }}>
                {fleets?.map((data, index) => (
                  <Box
                    className={classes.fleetBox}
                    onClick={() => {
                      setReceiverDialogOpen({ open: true, fleet: data });
                    }}
                  >
                    <Box mr="10px">
                      <Typography variant="subtitle2">Fleet Number : {data?.fleet?.optionLabel ?? ''}</Typography>
                      <Typography variant="subtitle2">Asset : {data?.asset?.optionLabel ?? ''}</Typography>
                      <Typography variant="subtitle2">Dispatch Date : {moment(data?.dispatchDate).format(dateFormat)}</Typography>
                      <Typography variant="subtitle2">Status : {data?.status ?? ''}</Typography>
                    </Box>
                  </Box>
                ))}
              </Grid>
            </Grid>
          ) : (
            <Box p={2} height={500} bgcolor="white">
              No Data Found
            </Box>
          )
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {receiverDialogOpen?.open && (
        <ManageFleetReceiverDialog
          handleClose={() => {
            setReceiverDialogOpen({ open: false, fleet: null });
          }}
          handleSucess={() => {
            setReceiverDialogOpen({ open: false, fleet: null });
            fetchData();
          }}
          data={receiverDialogOpen?.fleet}
        />
      )}
    </Box>
  );
};

export default FleetReceiver;

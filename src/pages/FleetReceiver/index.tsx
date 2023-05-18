import { Box, Grid, makeStyles, Typography } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ManageFleetReceiverDialog from './ReceiverDialog';
import moment from 'moment';
import { dateFormat } from 'src/constants/helpers';
import LocalShippingIcon from '@material-ui/icons/LocalShipping';

const useStyles = makeStyles((theme) => ({
  fleetBox: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    margin: '0px 6px 14px',
    borderRadius: '4px',
    border: '1px solid #ebebeb',
    padding: '15px',
    backgroundColor: '#F8FFFC',
    transition: 'transform .2s, background .3s',
    '&:hover': {
      transform: 'scale(1.02)',
      zIndex: '1'
    }
  },
  contentContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    [theme.breakpoints.down('md')]: {
      marginBottom: '20px'
    }
  },
  truckIcon: {
    transform: 'rotateY(180deg)'
  },
  primaryText: {
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: '1.28',
    color: '#2A3042',
    marginBottom: '14px'
  },
  secondaryText: {
    fontWeight: 400,
    fontSize: '13px',
    lineHeight: 1.5,
    color: '#5B5B5B',

    '& strong': {
      fontWeight: 600,
      color: '#2A3042'
    },
    marginBottom: '4px',
    '&:last-of-type': {
      marginBottom: 0
    }
  },
  icon: {
    fontSize: '20px',
    display: 'inline-block !important',
    verticalAlign: 'bottom',
    marginRight: '10px'
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
              {fleets?.map((data, index) => (
                <Grid item md={6} xs={12} sm={4}>
                  <Box
                    key={index}
                    className={classes.fleetBox}
                    onClick={() => {
                      setReceiverDialogOpen({ open: true, fleet: data });
                    }}
                  >
                    <Box className={classes.contentContainer}>
                      <Box sx={{ flexBasis: '20px' }}>
                        <LocalShippingIcon className={`${classes.truckIcon} ${classes.icon}`} />
                      </Box>
                      <Box sx={{ flexBasis: 'calc(100% - 35px)' }}>
                        <Typography className={classes.primaryText}>Fleet : {data?.fleet?.fleetNumber}</Typography>
                        <Typography className={classes.primaryText}>
                          <strong>PRS :</strong> {data?.asset?.assetNumber}
                        </Typography>
                        <Typography className={classes.primaryText}>
                          <strong>Job :</strong> {data?.job?.jobNumber}
                        </Typography>
                        <Typography className={classes.secondaryText}>
                          <strong>Customer :</strong> {data?.job?.customerAccount?.optionLabel}
                        </Typography>
                        <Typography className={classes.secondaryText}>
                          <strong>Location :</strong> {data?.job?.billingAddress?.optionLabel}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box p={2} height={500}>
              No Data Found
            </Box>
          )
        ) : (
          <Box p={2} height={500}>
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

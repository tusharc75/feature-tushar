import { Box, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ManageFleetReceiverDialog from './ReceiverDialog';
import moment from 'moment';
import { dateFormat } from 'src/constants/helpers';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useData } from 'src/StateProvider/Provider';

const useStyles = makeStyles((theme) => ({
  fleetBox: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    margin: '0px 6px 14px',
    borderRadius: '12px',
    border: '1px solid var(--common-border-color)',
    backgroundColor: 'var(--dark-secondary, #F8FFFC)',
    transition: 'transform .2s, background .3s',
    boxShadow: '0px 3.555040121078491px 35.55039978027344px rgba(0, 0, 0, 0.08)',
    '&:hover': {
      transform: 'scale(1.02)',
      zIndex: '1'
    }
  },

  truckIcon: {
    transform: 'rotateY(180deg)'
  },
  primaryText: {
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: '1.28',
    color: 'var(--dark-primary-text, #2A3042)',
    marginBottom: '14px'
  },
  secondaryText: {
    fontWeight: 400,
    fontSize: '13px',
    lineHeight: 1.5,
    color: 'var(--dark-secondary-text, #5B5B5B)',

    '& strong': {
      fontWeight: 600,
      color: 'var(--dark-primary-text, #2A3042)'
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
  const {
    state: { resources }
  }: any = useData();

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
          <CustomBreadCrumbs routes={[{ title: resources?.fleetReceiver?.titlePlural }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {!loading ? (
          fleets?.length > 0 ? (
            <Grid container spacing={2}>
              {fleets?.map((data, index) => (
                <Grid item xs={12} sm={6} md={4}>
                  <Box
                    key={index}
                    className={`${classes.fleetBox} p-[15px] md:p-[27px_20px_45px]`}
                    onClick={() => {
                      setReceiverDialogOpen({ open: true, fleet: data });
                    }}
                  >
                    <Box className={`flex flex-wrap gap-[16px]`}>
                      <Box className="basis-[28px]">
                        <LocalShippingIcon className="w-full" />
                      </Box>
                      <Box className="basis-[calc(100%-calc(30px+16px))]">
                        <Typography className={classes.primaryText}>Fleet : {data?.fleet?.fleetNumber}</Typography>
                        <Typography className={classes.secondaryText}>
                          <strong>PRS :</strong> {data?.asset?.assetNumber}
                        </Typography>
                        <Typography className={classes.secondaryText}>
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

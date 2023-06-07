import { Box, Grid, IconButton, makeStyles, Typography } from '@material-ui/core';
import { Fragment, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useData } from 'src/StateProvider/Provider';
import { Map } from '@material-ui/icons';
import MapView from './MapView';
import routes from 'src/components/Helpers/Routes';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Activity from '../../components/Activity';
import { ACTIVITY_RESOURCE } from 'src/constants/helpers';
import MetricsWithIcon from 'src/components/MetricsWithIcon';
import { ImAttachment } from 'react-icons/im';

const useStyles = makeStyles((theme) => ({
  cardBox: {
    borderRadius: '12px',
    border: '1px solid var(--common-border-color,#ebebeb)',
    backgroundColor: 'var(--dark-secondary, #fff)',
    boxShadow: '0px 3px 30px rgba(0, 0, 0, 0.08)',
    position: 'relative',
    padding: '18px 16px 18px 20px',
    height: '100%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 20
  },
  leftContent: {
    flexGrow: 1
  },
  text: {
    fontSize: '14px',
    lineHeight: '1.28',
    color: 'var(--dark-primary-text, #2A3042)',
    marginBottom: '6px'
  },
  icons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  buttons: {
    background: 'var(--dark-primary, #FFFFFF)',
    boxShadow: '0px 3.42857px 34.2857px rgba(0, 0, 0, 0.12)',
    borderRadius: '5.14286px',
    maxWidth: 35,
    minWidth: 35,
    height: 35,
    '& svg': {
      maxWidth: 18,
      maxHeight: 18,
      color: 'var(--dark-primary-text, #545454)'
    }
  },
  gaugeContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    maxWidth: '400px',
    paddingTop: '13px',
    paddingBottom: '10px',
    gap: '10px'
  },
  singleGauge: {
    maxWidth: '150px',
    flexBasis: '150px',
    padding: '10px 10px 0 0',

    [theme.breakpoints.up('md')]: {
      flexBasis: '50%',
      maxWidth: '50%'
    },
    [theme.breakpoints.up('lg')]: {
      flexBasis: '33.333%',
      maxWidth: '33.333%'
    }
  }
}));

const CardView = ({ data, fields, setFleetMasterId, setOpen, setDeleteRecord, setShowDeleteConfirmBox }) => {
  const classes = useStyles();
  const history = useHistory();
  const [showActivity, setActivityShow] = useState({ open: false, referenceId: '' });

  const {
    state: { permissions }
  }: any = useData();

  const [mapView, setMapView] = useState({
    open: false,
    lat: null,
    lng: null
  });

  return (
    <Fragment>
      <Grid container spacing={2}>
        {data.map((fleetMaster, index) => {
          return (
            <Grid item lg={4} md={4} sm={6} xs={12} key={index}>
              <Box
                className={`${classes.cardBox}`}
                onClick={(e) => {
                  history.push(`${routes.fleetMasterDetail.path}/${fleetMaster?._id}`);
                }}
              >
                <Box className={classes.leftContent}>
                  <Typography className={classes.text}>
                    <strong>Fleet Number :</strong> {fleetMaster?.fleetNumber}
                  </Typography>
                  <Typography className={classes.text}>
                    <strong>Current Location :</strong> {fleetMaster?.currentLocation?.optionLabel}
                  </Typography>
                  <Box className={classes.gaugeContainer}>
                    <MetricsWithIcon value={fleetMaster?.temperature} type="temperature" suffixText={'°F'} />
                    <MetricsWithIcon value={fleetMaster?.pressure} type="pressure" suffixText={'PSI'} />
                    <MetricsWithIcon value={fleetMaster?.volume} type="volume" suffixText={'MMcf'} />
                  </Box>
                </Box>
                <Box className={classes.icons}>
                  <HtmlTooltip title="Attachment">
                    <IconButton
                      size="small"
                      aria-label="Attachment"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivityShow({ open: true, referenceId: fleetMaster?._id });
                      }}
                      className={classes.buttons}
                    >
                      <ImAttachment size={16} />
                    </IconButton>
                  </HtmlTooltip>
                  <HtmlTooltip title="Map">
                    <IconButton
                      size="small"
                      aria-label="Map"
                      className={classes.buttons}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMapView({
                          open: true,
                          lat: fleetMaster?.currentLocation?.latitude,
                          lng: fleetMaster?.currentLocation?.longitude
                        });
                      }}
                    >
                      <Map />
                    </IconButton>
                  </HtmlTooltip>
                  {permissions?.fleetMaster?.isCreate ? (
                    <HtmlTooltip title="Clone">
                      <IconButton
                        size="small"
                        className={classes.buttons}
                        aria-label="Clone"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFleetMasterId(fleetMaster?._id);
                          setOpen({ open: true, isClone: true });
                        }}
                      >
                        <FileCopyIcon />
                      </IconButton>
                    </HtmlTooltip>
                  ) : (
                    <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
                      <IconButton aria-label="Clone" size="small" className={classes.buttons}>
                        <FileCopyIcon />
                      </IconButton>
                    </HtmlTooltip>
                  )}

                  {permissions?.fleetMaster?.isDelete ? (
                    <HtmlTooltip title="Delete">
                      <IconButton
                        size="small"
                        className={classes.buttons}
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteRecord(fleetMaster);
                          setShowDeleteConfirmBox(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </HtmlTooltip>
                  ) : (
                    <HtmlTooltip className="cursor-stop" title="You do not have permission to delete">
                      <IconButton aria-label="Delete" size="small" className={classes.buttons}>
                        <DeleteIcon />
                      </IconButton>
                    </HtmlTooltip>
                  )}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
      <Box className="main-container-v1">
        {showActivity.open && <div className="backdrop-new-v1" onClick={() => setActivityShow({ open: false, referenceId: '' })}></div>}
        <div className={`activity-new-v1 ${showActivity.open ? 'show-activity-v1' : 'hide-activity-v1'}`}>
          <Grid container>
            <Grid item xs={12}>
              <div>
                {showActivity.open && (
                  <Activity
                    resourceId={showActivity.referenceId}
                    resource={ACTIVITY_RESOURCE.fleetMaster}
                    restrictedAddActivities={
                      permissions && permissions[`${ACTIVITY_RESOURCE.fleetMaster}`] && permissions[`${ACTIVITY_RESOURCE.fleetMaster}`].isUpdate
                        ? []
                        : ['Attachment', 'Case']
                    }
                    relatedTo={[
                      {
                        type: ACTIVITY_RESOURCE.fleetMaster,
                        referenceId: showActivity.referenceId,
                        access: true
                      }
                    ]}
                    close={() => setActivityShow({ open: false, referenceId: '' })}
                    handleActivityRefresh={() => {}}
                    emails={[]}
                  />
                )}
              </div>
            </Grid>
          </Grid>
        </div>
      </Box>
      {mapView.open && (
        <MapView
          handleClose={() => {
            setMapView({
              open: false,
              lat: null,
              lng: null
            });
          }}
          lat={mapView.lat}
          lng={mapView.lng}
        />
      )}
    </Fragment>
  );
};

export default CardView;

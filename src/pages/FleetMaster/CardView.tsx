import { Box, Grid, IconButton, makeStyles, Typography } from '@material-ui/core';
import { Fragment, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useData } from 'src/StateProvider/Provider';
import { Map } from '@material-ui/icons';
import MapView from './MapView';
import routes from 'src/components/Helpers/Routes';
import Gauges from 'src/components/Gauges';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Activity from '../../components/Activity';
import { ACTIVITY_RESOURCE } from 'src/constants/helpers';

const useStyles = makeStyles((theme) => ({
    cardBox: {
        borderRadius: '4px',
        border: '1px solid #ebebeb',
        backgroundColor: "#F8FFFC",
        position: 'relative',
        padding: '15px',
        paddingBottom: '35px',
        height: '100%',
        cursor: 'pointer'
    },
    text: {
        fontSize: '14px',
        lineHeight: '1.28',
        color: '#2A3042',
        marginBottom: '7px'
    },
    icons: {
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    gaugeContainer: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '400px',
        paddingTop: '15px',
        paddingBottom: '10px',
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
    const [showActivity, setActivityShow] = useState({ open: false, referenceId: "" });

    const {
        state: { permissions }
    }: any = useData();

    const [mapView, setMapView] = useState({
        open: false,
        lat: null,
        lng: null
    })

    return (
        <Fragment>
            <Grid container spacing={2}>
                {data.map((fleetMaster, index) => {
                    return (<Grid item lg={4} md={4} sm={6} xs={12} key={index}>
                        <Box className={`${classes.cardBox}`}
                            onClick={(e) => {
                                history.push(`${routes.fleetMasterDetail.path}/${fleetMaster?._id}`);
                            }}>
                            <Typography className={classes.text}><strong>Fleet Number :</strong> {fleetMaster?.fleetNumber}</Typography>
                            <Typography className={classes.text}><strong>Current Location :</strong> {fleetMaster?.currentLocation?.optionLabel}</Typography>
                            <Box className={classes.gaugeContainer}>
                                <Gauges className={classes.singleGauge} max={200} value={fleetMaster?.temperature} lebel="TEMP" suffix={<> °F</>} />
                                <Gauges className={classes.singleGauge} max={1000} value={fleetMaster?.pressure} lebel="PRESSURE" suffix={<> PSI</>} />
                                <Gauges className={classes.singleGauge} max={1000} value={fleetMaster?.volume} lebel="VOLUME" suffix={<> MMcf</>} />
                            </Box>
                            <Box className={classes.icons}>
                                <HtmlTooltip title="Attachment">
                                    <IconButton
                                        size="small"
                                        aria-label="Attachment"
                                        style={{ marginRight: '8px' }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setActivityShow({ open: true, referenceId: fleetMaster?._id })
                                        }}
                                    >
                                        <AttachFileIcon color="primary" />
                                    </IconButton>
                                </HtmlTooltip>
                                <HtmlTooltip title="Map">
                                    <IconButton
                                        size="small"
                                        aria-label="Map"
                                        style={{ marginRight: '8px' }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setMapView({
                                                open: true,
                                                lat: fleetMaster?.currentLocation?.latitude,
                                                lng: fleetMaster?.currentLocation?.longitude,
                                            })
                                        }}
                                    >
                                        <Map color="primary" />
                                    </IconButton>
                                </HtmlTooltip>
                                {permissions?.fleetMaster?.isCreate ? (
                                    <HtmlTooltip title="Clone">
                                        <IconButton
                                            size="small"
                                            aria-label="Clone"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setFleetMasterId(fleetMaster?._id);
                                                setOpen({ open: true, isClone: true });
                                            }}
                                        >
                                            <FileCopyIcon fontSize="small" color="primary" />
                                        </IconButton>
                                    </HtmlTooltip>
                                ) : (
                                    <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
                                        <IconButton aria-label="Clone" size="small">
                                            <FileCopyIcon fontSize="small" />
                                        </IconButton>
                                    </HtmlTooltip>
                                )}

                                {permissions?.fleetMaster?.isDelete ? (
                                    <HtmlTooltip title="Delete">
                                        <IconButton
                                            aria-label="Delete"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteRecord(fleetMaster);
                                                setShowDeleteConfirmBox(true);
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </HtmlTooltip>
                                ) : (
                                    <HtmlTooltip className="cursor-stop" title="You do not have permission to delete">
                                        <IconButton aria-label="Delete" size="small">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </HtmlTooltip>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                    )
                })}
            </Grid>
            {showActivity.open &&
                <div className={`activity-new-v1 show-activity-v1}`}>
                    <Grid container>
                        <Grid item xs={12}>
                            <div>
                                <Activity
                                    resourceId={showActivity.referenceId}
                                    resource={ACTIVITY_RESOURCE.fleetMaster}
                                    restrictedAddActivities={
                                        permissions && permissions[`${ACTIVITY_RESOURCE.fleetMaster}`]
                                            && permissions[`${ACTIVITY_RESOURCE.fleetMaster}`].isUpdate ? [] : ['Attachment', 'Case']
                                    }
                                    relatedTo={[
                                        {
                                            type: ACTIVITY_RESOURCE.fleetMaster,
                                            referenceId: showActivity.referenceId,
                                            access: true
                                        }
                                    ]}
                                    close={() => setActivityShow({ open: false, referenceId: "" })}
                                    handleActivityRefresh={() => { }}
                                    emails={[]}
                                />
                            </div>
                        </Grid>
                    </Grid>
                </div>
            }
            {mapView.open &&
                <MapView handleClose={() => {
                    setMapView({
                        open: false,
                        lat: null,
                        lng: null
                    })
                }}
                    lat={mapView.lat}
                    lng={mapView.lng}
                />}
        </Fragment>
    );
};

export default CardView;

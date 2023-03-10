import { Box, Grid, IconButton, makeStyles, Tooltip, Typography } from '@material-ui/core';
import { Fragment, useEffect, useState } from 'react';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useData } from 'src/StateProvider/Provider';
import { Map } from '@material-ui/icons';
import MapView from './MapView';

const useStyles = makeStyles((theme) => ({
    cardBox: {
        borderRadius: '4px',
        border: '1px solid #ebebeb',
        backgroundColor: "#F8FFFC",
        position: 'relative',
        padding: '15px',
        paddingBottom: '35px',
        height: '100%'
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
    }
}));

const CardView = ({ data, fields, setFleetMasterId, setOpen, setDeleteRecord, setShowDeleteConfirmBox }) => {
    const classes = useStyles();

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
                {
                    data.map((fleetMaster, index) => {
                        return (
                            <Grid item lg={4} md={4} sm={6} xs={12} key={index}>
                                <Box className={`${classes.cardBox}`}>
                                    <Typography className={classes.text}><strong>Fleet Number :</strong> {fleetMaster?.fleetNumber}</Typography>
                                    <Typography className={classes.text}><strong>Current Location :</strong> {fleetMaster?.currentLocation?.optionLabel}</Typography>
                                    <Box className={classes.icons}>
                                        <Tooltip title="Map">
                                            <IconButton
                                                size="small"
                                                aria-label="Map"
                                                style={{ marginRight: '8px' }}
                                                onClick={() => {
                                                    setMapView({
                                                        open: true,
                                                        lat: fleetMaster?.currentLocation?.latitude,
                                                        lng: fleetMaster?.currentLocation?.longitude,
                                                    })
                                                }}
                                            >
                                                <Map color="primary" />
                                            </IconButton>
                                        </Tooltip>
                                        {permissions?.fleetMaster?.isCreate ? (
                                            <Tooltip title="Clone">
                                                <IconButton
                                                    size="small"
                                                    aria-label="Clone"
                                                    onClick={() => {
                                                        setFleetMasterId(fleetMaster?._id);
                                                        setOpen({ open: true, isClone: true });
                                                    }}
                                                >
                                                    <FileCopyIcon fontSize="small" color="primary" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
                                                <IconButton aria-label="Clone" size="small">
                                                    <FileCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {permissions?.fleetMaster?.isDelete ? (
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    aria-label="Delete"
                                                    onClick={() => {
                                                        setDeleteRecord(fleetMaster);
                                                        setShowDeleteConfirmBox(true);
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" color="error" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip className="cursor-stop" title="You do not have permission to delete">
                                                <IconButton aria-label="Delete" size="small">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        )
                    })
                }
            </Grid>
            {mapView.open &&
                <MapView
                    handleClose={() => {
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

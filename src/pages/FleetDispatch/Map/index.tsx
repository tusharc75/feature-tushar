import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Dialog } from '@material-ui/core';
import { GoogleMap, Marker } from '@react-google-maps/api';
import axiosInstance from '../../../axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const containerStyle = {
    minHeight: '500px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
};

const MapView = ({ handleClose }) => {

    const [fleets, setFleets] = useState(null)

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axiosInstance().get(`${routes?.fleetMaster.path}`).then(({ data: { data } }) => {
            setFleets(data?.data);
        })
            .catch((error) => {
            });
    };

    if (!window.google || typeof window.google !== 'object') return <div>Loading...</div>;

    return <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={handleClose}
        open={true}
    >
        <CustomDialogHeader
            title={"Fleet Map"}
            onClose={(e, reason) => {
                handleClose()
            }}
            showRequiredLabel={false}
        />
        <CustomDialogContent>
            {fleets ? (
                <Box width={'100%'} height={'100%'} overflow="hidden" borderRadius={1}>
                    <GoogleMap
                        options={{
                            mapTypeId: google.maps.MapTypeId.ROADMAP,
                            mapTypeControlOptions: {
                                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
                            },
                            styles: [
                                {
                                    featureType: 'water',
                                    stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
                                },
                                { featureType: 'landscape', stylers: [{ color: '#f2f2f2' }] },
                                {
                                    featureType: 'road',
                                    stylers: [{ saturation: -100 }, { lightness: 45 }]
                                },
                                {
                                    featureType: 'road.highway',
                                    stylers: [{ visibility: 'simplified' }]
                                },

                                { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                                { featureType: 'poi', stylers: [{ visibility: 'off' }] }
                            ],
                            gestureHandling: 'cooperative'
                        }}
                        mapContainerStyle={containerStyle}
                        center={{ lat: 31.9686, lng: 99.9018 }}
                        zoom={4}
                    >
                        {fleets?.map((item) => {
                            return (
                                <Marker position={new google.maps.LatLng(item?.currentLocation?.latitude, item?.currentLocation?.longitude)} />
                            )
                        })}
                    </GoogleMap>
                </Box>
            ) : (
                <Box width={'100%'} height={'100%'} display="flex" justifyContent="center" alignItems="center">
                    <CircularProgress />
                </Box>
            )}
        </CustomDialogContent>
    </Dialog>
};

export default MapView;

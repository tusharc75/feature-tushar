import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Dialog } from '@material-ui/core';
import { DirectionsRenderer, GoogleMap, Marker, LoadScript, MarkerClusterer, Polyline, InfoWindow } from '@react-google-maps/api';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const containerStyle = {
    minHeight: '500px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
};

const MapView = ({ handleClose, lat, lng }) => {

    const data = [
        {
            lat: 34.847115,
            lng: -106.186151
        },
        {
            lat: 41.958956,
            lng: -87.235257
        },
        {
            lat: 46.514608,
            lng: -110.527067
        },
        {
            lat: 36.681231,
            lng: -118.795964
        },
    ]

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
            {lat ? (
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
                        center={new google.maps.LatLng(lat, lng)}
                        zoom={4}
                    >
                        <Marker position={new google.maps.LatLng(lat, lng)} />
                        <MarkerClusterer>
                            {(clusterer) => (
                                <>
                                    {data?.map((data: any, index) => (
                                        <Marker
                                            key={Math.random()}
                                            label={{
                                                text: (index + 1)?.toString(),
                                                fontWeight: 'bold',
                                                color: 'white',
                                                fontSize: '14px'
                                            }}
                                            // onClick={() => {
                                            //     setSelectedService(data);
                                            // }}
                                            position={new google.maps.LatLng(data?.lat, data?.lng)}
                                            clusterer={clusterer}
                                        />
                                    ))}
                                    <Polyline
                                        path={data?.map((data: any) => new google.maps.LatLng(data?.lat, data?.lng))}
                                        options={{
                                            strokeColor: '#0000FF',
                                            strokeOpacity: 1,
                                            strokeWeight: 2,
                                            icons: [{ icon: { path: 'M -2,-2 2,0 M 2,-2 -2,0', strokeOpacity: 1, scale: 1 } }]
                                        }}
                                    />
                                </>
                            )}
                        </MarkerClusterer>
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

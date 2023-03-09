import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@material-ui/core';
import { GoogleMap, Marker } from '@react-google-maps/api';
import axiosInstance from '../../../axios/axiosInstance';

const MapView = () => {
    const [fleets, setFleets] = useState([])
    const [loadingData, setLoadingData] = React.useState(false);

    const containerStyle = {
        minHeight: '500px',
        height: '100%',
        maxWidth: '100%',
        minWidth: '100%'
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        setLoadingData(true)
        axiosInstance()
            .get(`/fleet-dispatch/available-job-fleet`)
            .then(({ data: { data } }) => {
                setFleets(data?.fleets || []);
                setLoadingData(false)
            })
            .catch((error) => {
                // toastConfig.setToastConfig(error);
                setLoadingData(false)
            });
    };

    if (!window.google || typeof window.google !== 'object') return <div>Loading...</div>;

    return !loadingData ? (
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
                {/* {
                    [0, 10].map((item) => {
                        return (
                            <Marker
                                position={new google.maps.LatLng(20.9686 + item, 80.9018 + item)}
                            />
                        )
                    })
                } */}
                {
                    fleets.map((item) => {
                        return (
                            <Marker
                                position={new google.maps.LatLng(item?.currentLocation?.latitude, item?.currentLocation?.longitude)}
                            />
                        )
                    })
                }
            </GoogleMap>
        </Box>
    ) : (
        <Box width={'100%'} height={'100%'} display="flex" justifyContent="center" alignItems="center">
            <CircularProgress />
        </Box>
    );
};

export default MapView;

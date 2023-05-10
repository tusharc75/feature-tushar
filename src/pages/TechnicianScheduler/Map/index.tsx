import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@material-ui/core';
import { GoogleMap, Marker, MarkerClusterer, InfoWindow, Polyline } from '@react-google-maps/api';
import axiosInstance from '../../../axios/axiosInstance';

const MapView = ({ technician }) => {
  const [center, setCenter] = React.useState(null);
  const [serviceData, setServiceData] = React.useState([]);
  const [selectedService, setSelectedService] = React.useState(null);
  const [loadingData, setLoadingData] = React.useState(false);

  const containerStyle = {
    minHeight: '500px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
  };

  useEffect(() => {
    fetchData();
  }, [technician]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/technician-scheduler/technician-service/${technician}`);
      if (data) {
        setServiceData(data);
      }
      setLoadingData(false);
    } catch (error) {
      setLoadingData(false);
    }
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
        center={center || { lat: 31.9686, lng: 99.9018 }}
        zoom={4}
      >
        <MarkerClusterer>
          {(clusterer) => (
            <>
              {serviceData?.map((data: any, index) => (
                <Marker
                  key={data._id}
                  label={{
                    text: (index + 1)?.toString(),
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  onClick={() => {
                    setSelectedService(data);
                  }}
                  position={new google.maps.LatLng(data?.shippingAddress?.latitude, data?.shippingAddress?.longitude)}
                  clusterer={clusterer}
                />
              ))}
              <Polyline
                path={serviceData?.map((data: any) => new google.maps.LatLng(data?.shippingAddress?.latitude, data?.shippingAddress?.longitude))}
                options={{
                  strokeColor: '#0000FF',
                  strokeOpacity: 1,
                  strokeWeight: 2,
                  icons: [{ icon: { path: 'M -2,-2 2,0 M 2,-2 -2,0', strokeOpacity: 1, scale: 1 } }]
                }}
              />
              {selectedService && (
                <InfoWindow
                  key={selectedService._id}
                  position={new google.maps.LatLng(selectedService?.shippingAddress?.latitude, selectedService?.shippingAddress?.longitude)}
                  onCloseClick={() => setSelectedService(null)}
                >
                  <div>{selectedService?.fieldServiceOrderNumber}</div>
                </InfoWindow>
              )}
            </>
          )}
        </MarkerClusterer>
      </GoogleMap>
    </Box>
  ) : (
    <Box width={'100%'} height={'100%'} display="flex" justifyContent="center" alignItems="center">
      <CircularProgress />
    </Box>
  );
};

export default MapView;

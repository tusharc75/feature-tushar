import React, { useContext, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { GoogleMap, Marker, MarkerClusterer, InfoWindow, Polyline } from '@react-google-maps/api';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const MapView = ({ userIds }) => {

  const [locationData, setLocationData] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [loadingData, setLoadingData] = React.useState(false);
  const [mapCenter, setMapCenter] = React.useState({ lat: 31.9686, lng: 99.9018 });
  const toastConfig = useContext(CustomToastContext);

  const containerStyle = {
    minHeight: '500px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
  };

  useEffect(() => {
    fetchData();
  }, [userIds]);

  //calculating map center based on the locations for inital view to cover maximum locations
  const calculateMapCenter = (locations) => {
    if (!locations || locations.length === 0) return;

    let totalLat = 0;
    let totalLng = 0;
    let validLocations = 0;

    locations.forEach(location => {
      if (location?.latitude && location?.longitude) {
        totalLat += parseFloat(location.latitude);
        totalLng += parseFloat(location.longitude);
        validLocations++;
      }
    });

    if (validLocations > 0) {
      const centerLat = totalLat / validLocations;
      const centerLng = totalLng / validLocations;
      setMapCenter({ lat: centerLat, lng: centerLng });
    }
  };

  const fetchData = async () => {
    setLoadingData(true);
    setLocationData([]);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/user/live-location?userIds=${JSON.stringify(userIds)}`);
      if (data && data.length > 0) {
        setLocationData(data);
        calculateMapCenter(data);
      }
      setLoadingData(false);
    } catch (error) {
      setLoadingData(false);
      toastConfig.setToastConfig(error);
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
        center={mapCenter}
        zoom={4}
      >
        <MarkerClusterer>
          {(clusterer) => (
            <>
              {locationData?.map((data: any, index) => (
                <Marker
                  key={data._id}
                  label={{
                    text: (index + 1)?.toString(),
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  onClick={() => {
                    setSelectedUser(data);
                  }}
                  position={new google.maps.LatLng(data?.latitude, data?.longitude)}
                  clusterer={clusterer}
                />
              ))}
              <Polyline
                path={locationData?.map((data: any) => new google.maps.LatLng(data?.latitude, data?.longitude))}
                options={{
                  strokeColor: '#0000FF',
                  strokeOpacity: 1,
                  strokeWeight: 2,
                  icons: [{ icon: { path: 'M -2,-2 2,0 M 2,-2 -2,0', strokeOpacity: 1, scale: 1 } }]
                }}
              />
              {selectedUser && (
                <InfoWindow
                  key={selectedUser._id}
                  position={new google.maps.LatLng(selectedUser?.latitude, selectedUser?.longitude)}
                  onCloseClick={() => setSelectedUser(null)}
                >
                  <div style={{ backgroundColor: 'white', color: 'black', minWidth: 100 }}>
                    <h4 style={{ margin: 0 }}>{selectedUser?.user?.optionLabel}</h4>
                  </div>
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

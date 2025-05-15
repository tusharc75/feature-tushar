import React, { useContext, useEffect } from 'react';
import { Avatar, Box, CircularProgress } from '@mui/material';
import { GoogleMap, Marker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { AccountCircle } from '@mui/icons-material';
import { displayDateTime } from 'src/constants/helpers';


const MapView = ({ userIds }) => {

  const [locationData, setLocationData] = React.useState([]);
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

  const calculateMapCenter = (locations) => {
    if (!locations || locations.length === 0) return;
    if (locations?.length === 1) {
      setMapCenter({ lat: locations[0].latitude, lng: locations[0].longitude });
      return
    }
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
      if (data?.length > 0) {
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
                <>
                  <Marker
                    key={data._id}
                    label={{
                      text: data?.user?.optionLabel[0],
                      fontWeight: 'bold',
                      color: 'white',
                      fontSize: '14px'
                    }}
                    position={new google.maps.LatLng(data?.latitude, data?.longitude)}
                    clusterer={clusterer}
                  />
                  <InfoWindow
                    key={data._id}
                    options={{
                      headerDisabled: true,
                      disableAutoPan: true,
                      pixelOffset: new window.google.maps.Size(0, -30),
                    }}

                    position={new google.maps.LatLng(data?.latitude, data?.longitude)}
                  >
                    <div className="flex items-center bg-white text-black min-w-[100px] px-2 py-1 rounded">
                      <Avatar alt="Remy Sharp" src={data?.user?.avatar} className="h-9 w-9 mr-2">
                        <AccountCircle className="text-[20px]" />
                      </Avatar>
                      <div className="flex flex-col leading-[1.2]">
                        <span className="text-[13px] font-semibold">{data?.user?.optionLabel}</span>
                        <span className="pt-[2px] text-[11px] font-light text-[#333]">{`Last Updated : ${displayDateTime(data?.date)}`}</span>
                      </div>
                    </div>
                  </InfoWindow>
                </>
              ))}
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

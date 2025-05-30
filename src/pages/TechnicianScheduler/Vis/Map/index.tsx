import { AccountCircle, Close } from '@mui/icons-material';
import { Avatar, Box, CircularProgress, IconButton } from '@mui/material';
import { GoogleMap, InfoWindow, Marker, MarkerClusterer } from '@react-google-maps/api';
import React, { memo, useContext, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { cn, displayDateTime } from 'src/constants/helpers';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const MapView = memo(() => {
  const [userIds] = useTimelineStore((state) => state.mapData);

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
    const fetchData = async () => {
      if (!userIds || userIds?.length === 0) return;
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
    fetchData();
  }, [toastConfig, userIds]);

  const calculateMapCenter = (locations) => {
    if (!locations || locations.length === 0) return;
    if (locations?.length === 1) {
      setMapCenter({ lat: locations[0].latitude, lng: locations[0].longitude });
      return;
    }
    let totalLat = 0;
    let totalLng = 0;
    let validLocations = 0;
    locations.forEach((location) => {
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

  if (!window.google || typeof window.google !== 'object') return <div>Loading...</div>;

  return (
    <div className="absolute inset-0  z-10 h-full w-full overflow-hidden rounded-md">
      {!loadingData ? (
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
                        pixelOffset: new window.google.maps.Size(0, -30)
                      }}
                      position={new google.maps.LatLng(data?.latitude, data?.longitude)}
                    >
                      <div className="flex min-w-[100px] items-center rounded bg-white px-2 py-1 text-black">
                        <Avatar alt="Remy Sharp" src={data?.user?.avatar} className="mr-2 h-9 w-9">
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
      ) : (
        <Box
          width={'100%'}
          height={'100%'}
          display="flex"
          justifyContent="center"
          className="absolute inset-0 bg-gray-300 dark:bg-gray-800"
          alignItems="center"
        >
          <CircularProgress />
        </Box>
      )}{' '}
    </div>
  );
});

export default function Map({ className }: { className?: string }) {
  const [mapData, setStore] = useTimelineStore((state) => state.mapData);
  if (!mapData) return null;
  return (
    <div className={cn('h-[--container-h]', className)}>
      <MapView />
      <span className="absolute left-1/2 top-2 z-10 rounded-[5px] bg-[var(--dark-secondary,white)] shadow-md [transform:translateX(-50%)] ">
        <IconButton
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setStore({ mapData: null });
          }}
          style={{
            borderRadius: '5px'
          }}
        >
          <Close />
        </IconButton>
      </span>
    </div>
  );
}

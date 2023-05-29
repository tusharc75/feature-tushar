import React from 'react';
import { Box, Typography, CircularProgress } from '@material-ui/core';
import { GoogleMap, Marker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';

import axiosInstance from 'src/axios/axiosInstance';

type locationType = {
  count: number;
  location: {
    concatedName: string;
    latitude: number;
    longitude: number;
  };
  _id: string | any;
};

interface MapViewProps {
  data: any[];
  height: number | string;
}

const MapView = (props: MapViewProps) => {
  const { data, height } = props;
  const [isFetching, setFetching] = React.useState(false);
  const [center, setCenter] = React.useState(null);
  const [selectedAsset, setSelectedAsset] = React.useState([]);
  const [selectedBase, setSelectedBase] = React.useState(null);

  const containerStyle = {
    minHeight: '100%',
    height: '100%',
    maxWidth: '600px',
    minWidth: '100%'
  };

  const fetchLocationData = React.useCallback(async (id: string, assetData: locationType) => {
    setSelectedBase(assetData);
    setSelectedAsset([]);
    setFetching(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`dashboard/location-base-status-count?location=${id}`);
      if (data) {
        setSelectedAsset(data);
      }
      setFetching(false);
    } catch (error) {
      setFetching(false);
    }
  }, []);

  if (!window.google || typeof window.google !== 'object') return <div>Loading...</div>;

  if (!data || !Array.isArray(data) || data.length === 0) return <div>No data</div>;

  return (
    <Box height={height} borderRadius={4} overflow="hidden" className="">
      <GoogleMap
        onClick={() => {
          selectedBase && setSelectedBase(null);
        }}
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
        center={center || { lat: 37.09, lng: -95.713 }}
        zoom={4}
      >
        <MarkerClusterer>
          {(clusterer) =>
            data.length > 0
              ? data.map(
                  (asset: locationType) =>
                    asset?._id && (
                      <Marker
                        key={asset._id}
                        label={{
                          text: asset.count.toString(),
                          fontWeight: 'bold',
                          color: 'black',
                          fontSize: '14px'
                        }}
                        onClick={() => {
                          // setCenter(new google.maps.LatLng(asset?.location?.latitude, asset?.location?.longitude));
                          fetchLocationData(asset._id, asset);
                        }}
                        position={new google.maps.LatLng(asset?.location?.latitude, asset?.location?.longitude)}
                        clusterer={clusterer}
                      />
                    )
                )
              : null
          }
        </MarkerClusterer>

        {selectedBase && (
          <InfoWindow
            position={new google.maps.LatLng(selectedBase?.location.latitude, selectedBase?.location.longitude)}
            onCloseClick={() => {
              if (isFetching) return;
              setSelectedBase(null);
              setSelectedAsset([]);
            }}
          >
            {selectedAsset.length > 0 || !isFetching ? (
              <Box textAlign={'left'} maxWidth={250}>
                <Typography color="textPrimary" variant="body1">
                  {`"${selectedBase?.location.concatedName}"`}
                </Typography>
                <Box my={1} />
                <Typography color="textPrimary" variant="body2">
                  <strong>Total Asset: </strong>
                  {selectedBase?.count}
                </Typography>
                {selectedAsset.map((d: { count: number; status: string }) => (
                  <Typography key={d.status} color="textPrimary" variant="body2">
                    <strong>{`${d.status}: `}</strong>
                    {d.count}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Box width={100} p={2} display={'flex'} justifyContent={'center'}>
                <CircularProgress size={18} color="primary" />
              </Box>
            )}
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
};

export default MapView;

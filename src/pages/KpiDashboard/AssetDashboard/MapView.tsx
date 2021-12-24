import React from 'react';
import { Box, Typography, CircularProgress } from '@material-ui/core';
import { GoogleMap, Marker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import axiosInstance from '../../../axios/axiosInstance';

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
  loading?: boolean;
  smallScreen?: boolean;
}

const MapView = (props: MapViewProps) => {
  const { data, smallScreen } = props;

  const [isFetching, setFetching] = React.useState(false);
  const [map, setMap] = React.useState(null);
  const [selectedAsset, setSelectedAsset] = React.useState([]);
  const [selectedBase, setSelectedBase] = React.useState(null);

  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds();
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  const center = {
    lat: 37.09,
    lng: -95.713
  };

  const containerStyle = {
    height: smallScreen ? '500px' : '700px',
    maxWidth: '600px',
    minWidth: '100%'
  };

  const fetchLocationData = async (id: string, assetData: locationType) => {
    setSelectedBase(assetData);
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
  };

  if (!google) return <div>Google Maps error, please refresh page</div>;

  if (typeof google === 'object' && typeof google.maps === 'object')
    return (
      <Box height={smallScreen ? '500px' : '700px'} borderRadius={8} overflow="hidden">
        <GoogleMap
          options={{
            zoom: 3,
            center: center,
            disableDoubleClickZoom: true,
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
            ]
          }}
          mapContainerStyle={containerStyle}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          <MarkerClusterer>
            {(clusterer) =>
              data.map(
                (asset: locationType) =>
                  asset?._id && (
                    <Marker
                      key={asset._id}
                      label={{
                        text: asset.count.toString(),
                        fontWeight: 'bold',
                        color: 'white',
                        fontSize: '18px'
                      }}
                      onClick={() => fetchLocationData(asset._id, asset)}
                      position={new google.maps.LatLng(asset?.location?.latitude, asset?.location?.longitude)}
                      clusterer={clusterer}
                    />
                  )
              )
            }
          </MarkerClusterer>

          {selectedBase && (
            <InfoWindow
              position={new google.maps.LatLng(selectedBase?.location.latitude, selectedBase?.location.longitude)}
              onCloseClick={() => {
                setSelectedBase(null)
                setSelectedAsset([])
              }}
            >
              {selectedAsset.length > 0 || !isFetching ? (
                <Box textAlign={'left'} maxWidth={250}>
                  <Typography color="textPrimary" variant="body1">
                    {`"${selectedBase?.location.concatedName}"`}
                  </Typography>
                  <Box my={1} />
                  <Typography color="textPrimary" variant="body2">
                    <strong>Total: </strong>
                    {selectedBase?.count}
                  </Typography>
                  {selectedAsset.map((d: { count: number, status: string }) => (
                    <Typography color="textPrimary" variant="body2">
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

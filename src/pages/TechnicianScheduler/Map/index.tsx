import React from 'react';
import { Box, CircularProgress } from '@material-ui/core';
import { GoogleMap, Marker, MarkerClusterer, InfoWindow, Polyline } from '@react-google-maps/api';
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
  technician: any;
  onClose: () => void;
}

const MapView = (props: MapViewProps) => {
  const { data, technician, onClose } = props;
  const [isFetching, setFetching] = React.useState(false);
  const [center, setCenter] = React.useState(null);
  const [selectedAsset, setSelectedAsset] = React.useState([]);
  const [selectedBase, setSelectedBase] = React.useState(null);

  const containerStyle = {
    minHeight: '500px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
  };

  const fetchLocationData = async () => {
    console.log(technician);
    setSelectedAsset([]);
    setFetching(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/technician-scheduler/technician-service/${technician}`);
      if (data) {
        setSelectedAsset(data);
      }
      setFetching(false);
    } catch (error) {
      setFetching(false);
    }
  };

  if (!window.google || typeof window.google !== 'object') return <div>Loading...</div>;

  return (
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
        center={center || { lat: 25.8391492, lng: 77.5541247 }}
        zoom={4}
      >
        <MarkerClusterer>
          {(clusterer) => (
            <>
              {data.map(
                (asset: locationType) =>
                  asset?._id && (
                    <Marker
                      key={asset._id}
                      label={{
                        text: asset.count.toString(),
                        fontWeight: 'bold',
                        color: 'white',
                        fontSize: '14px'
                      }}
                      onClick={() => {
                        fetchLocationData();
                        setSelectedBase(asset);
                      }}
                      position={new google.maps.LatLng(asset?.location?.latitude, asset?.location?.longitude)}
                      clusterer={clusterer}
                    />
                  )
              )}
              <Polyline
                path={data.map((asset) => new google.maps.LatLng(asset?.location?.latitude, asset?.location?.longitude))}
                options={{
                  strokeColor: '#0000FF',
                  strokeOpacity: 0.8,
                  strokeWeight: 1,
                  icons: [{ icon: { path: 'M -2,-2 2,0 M 2,-2 -2,0', strokeOpacity: 1, scale: 1 } }]
                }}
              />
              {selectedBase && (
                <InfoWindow
                  position={{ lat: selectedBase?.location?.latitude, lng: selectedBase?.location?.longitude }}
                  onCloseClick={() => setSelectedBase(null)}
                >
                  {isFetching ? (
                    <Box width={100} p={2} display={'flex'} justifyContent={'center'}>
                      <CircularProgress size={18} color="primary" />
                    </Box>
                  ) : (
                    <div>alksdjf</div>
                  )}
                </InfoWindow>
              )}
            </>
          )}
        </MarkerClusterer>
      </GoogleMap>
    </Box>
  );
};

export default MapView;

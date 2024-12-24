import { useEffect, useState } from 'react';
import { Box, CircularProgress, Dialog, Typography } from '@mui/material';
import { GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';
import axiosInstance from '../../../axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const containerStyle = {
  minHeight: '500px',
  height: '100%',
  maxWidth: '100%',
  minWidth: '100%'
};

const MapView = ({ handleClose }) => {
  const [fleets, setFleets] = useState(null);
  const [map, setMap] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axiosInstance()
      .get(`${routes?.fleetMaster.path}`)
      .then(({ data: { data } }) => {
        setFleets(data?.data);
      })
      .catch((error) => {});
  };
  const handleMarkerClick = (marker) => {
    setActiveMarker(marker);
  };

  const handleInfoClose = () => {
    setActiveMarker(null);
  };

  if (!window.google || typeof window.google !== 'object') return <div>Loading...</div>;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (fleets && map) {
      const bounds = new google.maps.LatLngBounds();
      fleets?.forEach((item) => {
        bounds.extend(new google.maps.LatLng(item?.currentLocation?.latitude || '', item?.currentLocation?.longitude || ''));
      });
      map.fitBounds(bounds);
    }
  }, [fleets, map]);

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={handleClose}
      open={true}
    >
      <CustomDialogHeader
        title={'Fleet Map'}
        onClose={(e, reason) => {
          handleClose();
        }}
        showRequiredLabel={false}
      />
      <CustomDialogContent isFooterPresent={false}>
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
              //   center={{ lat: 31.9686, lng: 99.9018 }}
              zoom={4}
              onLoad={(map) => setMap(map)}
            >
              {fleets?.map((item) => {
                return (
                  <Marker
                    key={item?.id}
                    icon={{
                      url: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABSUlEQVR4nO2UrUsEQRiHH9OFC4Im8YomrRcEg/4HXjhsFi2nwX9BsBhNWqx2ixbbgUFBrxkEPw7B5mJQQVDx7njltzIM67kLuysc+8ALM++8zDMfuwMFBYNIDWikFLNJxF9AN6U4TyLuphit/xYfePkOcAnMZC3u/DL+AJSzFLu5TefjuwU28hK7LAKvwFje4iHgAtjKQzzuydeBqzzEUfGe1QMSp5aFlJ/MclyxUY8xqdUY031qVoHDJOKWOvfApzNoD8Gdd38N9Z+Bx5iSNvDizfsj3lN72SkwibHjiZ+AEWAYCP6Qnug3mnJy9kt9c6zJjRVNFmgRxq5qwmsJJA3FR1q4H2dA0xNvA5VQPAe8AdfAB7CmsPaNxqzGKAGnOuZAbctFMam6to56P6poQjusOrmqcjbmUtLO632kIaPAEjCvnRcUDCg9vq9rL5joM3oAAAAASUVORK5CYII=`,
                      size: new google.maps.Size(30, 30)
                    }}
                    position={new google.maps.LatLng(item?.currentLocation?.latitude, item?.currentLocation?.longitude)}
                    onClick={() => handleMarkerClick(item)}
                    onMouseOver={() => handleMarkerClick(item)}
                    onMouseOut={handleInfoClose}
                  />
                );
              })}
              {activeMarker && (
                <InfoWindow
                  key={activeMarker?.id}
                  options={{
                    disableAutoPan: true,
                    pixelOffset: new google.maps.Size(0, -30)
                  }}
                  position={new google.maps.LatLng(activeMarker.currentLocation?.latitude, activeMarker.currentLocation?.longitude)}
                  //   onCloseClick={handleInfoClose}
                >
                  <Typography>{activeMarker?.fleetNumber ?? ''}</Typography>
                </InfoWindow>
              )}
            </GoogleMap>
            {/* to hide close button on InfoWindow */}
            <style>{`.gm-ui-hover-effect { display: none !important; }`}</style>
          </Box>
        ) : (
          <Box width={'100%'} height={'100%'} display="flex" justifyContent="center" alignItems="center">
            <CircularProgress />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default MapView;

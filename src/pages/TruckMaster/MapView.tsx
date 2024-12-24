import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Dialog } from '@mui/material';
import { DirectionsRenderer, GoogleMap, Marker, LoadScript, Polyline } from '@react-google-maps/api';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const containerStyle = {
  minHeight: '500px',
  height: '100%',
  maxWidth: '100%',
  minWidth: '100%'
};

const pathCoordinates = [
  { lat: '29.73427', lon: '-95.22856' },
  { lat: '29.73249', lon: '-95.22847' },
  { lat: '29.73249', lon: '-95.24041' },
  { lat: '29.73241', lon: '-95.24865' },
  { lat: '29.73234', lon: '-95.24976' },
  { lat: '29.73219', lon: '-95.25097' },
  { lat: '29.73211', lon: '-95.252' },
  { lat: '29.73197', lon: '-95.25311' },
  { lat: '29.73211', lon: '-95.25423' },
  { lat: '29.73204', lon: '-95.25509' },
  { lat: '29.73234', lon: '-95.25646' },
  { lat: '29.73409', lon: '-95.25908' },
  { lat: '29.75583', lon: '-95.29214' },
  { lat: '29.75704', lon: '-95.29329' },
  { lat: '29.75712', lon: '-95.29398' },
  { lat: '29.7569', lon: '-95.29432' },
  { lat: '29.7569', lon: '-95.29501' },
  { lat: '29.75682', lon: '-95.29569' },
  { lat: '29.75682', lon: '-95.29664' },
  { lat: '29.75682', lon: '-95.29784' },
  { lat: '29.75838', lon: '-95.30093' },
  { lat: '29.76054', lon: '-95.30514' },
  { lat: '29.76092', lon: '-95.30651' },
  { lat: '29.76181', lon: '-95.30926' },
  { lat: '29.7627', lon: '-95.31235' },
  { lat: '29.76375', lon: '-95.3157' },
  { lat: '29.76442', lon: '-95.31845' },
  { lat: '29.76442', lon: '-95.31888' },
  { lat: '29.76442', lon: '-95.31999' },
  { lat: '29.76471', lon: '-95.32128' },
  { lat: '29.76538', lon: '-95.32291' },
  { lat: '29.76546', lon: '-95.33244' },
  { lat: '29.76467', lon: '-95.33356' },
  { lat: '29.76467', lon: '-95.34292' },
  { lat: '29.76273', lon: '-95.34302' },
  { lat: '29.76247', lon: '-95.34315' },
  { lat: '29.7621', lon: '-95.34337' },
  { lat: '29.76136', lon: '-95.34375' },
  { lat: '29.76091', lon: '-95.3441' },
  { lat: '29.75983', lon: '-95.34487' },
  { lat: '29.75957', lon: '-95.34517' },
  { lat: '29.75942', lon: '-95.34539' },
  { lat: '29.75938', lon: '-95.34564' },
  { lat: '29.75938', lon: '-95.34573' },
  { lat: '29.75942', lon: '-95.34607' },
  { lat: '29.75976', lon: '-95.34667' },
  { lat: '29.76046', lon: '-95.34779' },
  { lat: '29.76106', lon: '-95.34873' },
  { lat: '29.76143', lon: '-95.34938' },
  { lat: '29.76233', lon: '-95.35049' },
  { lat: '29.763', lon: '-95.35118' },
  { lat: '29.76367', lon: '-95.352' },
  { lat: '29.76765', lon: '-95.35204' },
  { lat: '29.76828', lon: '-95.35149' },
  { lat: '29.77052', lon: '-95.35128' },
  { lat: '29.77837', lon: '-95.35136' },
  { lat: '29.77841', lon: '-95.35046' },
  { lat: '29.7783', lon: '-95.35009' },
  { lat: '29.77823', lon: '-95.34966' },
  { lat: '29.77823', lon: '-95.34923' },
  { lat: '29.77834', lon: '-95.34803' },
  { lat: '29.77849', lon: '-95.347' },
  { lat: '29.77864', lon: '-95.34644' },
  { lat: '29.7786', lon: '-95.3406' },
  { lat: '29.78368', lon: '-95.34033' },
  { lat: '29.78457', lon: '-95.33896' },
  { lat: '29.78476', lon: '-95.33836' },
  { lat: '29.78479', lon: '-95.33776' },
  { lat: '29.78479', lon: '-95.33685' },
  { lat: '29.78476', lon: '-95.33621' },
  { lat: '29.78491', lon: '-95.33561' },
  { lat: '29.78479', lon: '-95.33505' },
  { lat: '29.78383', lon: '-95.33497' },
  { lat: '29.78394', lon: '-95.33376' }
];

const MapView = ({ handleClose, lat, lng }) => {
  const [map, setMap] = useState(null);

  if (!window.google || typeof window.google !== 'object') return <div>Loading...</div>;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (pathCoordinates && map) {
      const bounds = new google.maps.LatLngBounds();
      pathCoordinates?.forEach((item: any) => {
        bounds.extend(new google.maps.LatLng(item?.lat, item?.lon));
      });
      map.fitBounds(bounds);
    }
  }, [pathCoordinates, map]);

  //   const polylineCoordinates = [];

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
        title={'Truck Map'}
        onClose={(e, reason) => {
          handleClose();
        }}
        showRequiredLabel={false}
      />
      <CustomDialogContent isFooterPresent={false}>
        {pathCoordinates?.length ? (
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
              zoom={4}
              onLoad={(map) => setMap(map)}
            >
              <Marker
                key={'marker of coordinates'}
                icon={{
                  url: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABSUlEQVR4nO2UrUsEQRiHH9OFC4Im8YomrRcEg/4HXjhsFi2nwX9BsBhNWqx2ixbbgUFBrxkEPw7B5mJQQVDx7njltzIM67kLuysc+8ALM++8zDMfuwMFBYNIDWikFLNJxF9AN6U4TyLuphit/xYfePkOcAnMZC3u/DL+AJSzFLu5TefjuwU28hK7LAKvwFje4iHgAtjKQzzuydeBqzzEUfGe1QMSp5aFlJ/MclyxUY8xqdUY031qVoHDJOKWOvfApzNoD8Gdd38N9Z+Bx5iSNvDizfsj3lN72SkwibHjiZ+AEWAYCP6Qnug3mnJy9kt9c6zJjRVNFmgRxq5qwmsJJA3FR1q4H2dA0xNvA5VQPAe8AdfAB7CmsPaNxqzGKAGnOuZAbctFMam6to56P6poQjusOrmqcjbmUtLO632kIaPAEjCvnRcUDCg9vq9rL5joM3oAAAAASUVORK5CYII=`,
                  size: new google.maps.Size(30, 30),
                  anchor: new google.maps.Point(15, 15)
                }}
                position={
                  new google.maps.LatLng(
                    parseFloat(pathCoordinates[pathCoordinates.length - 1].lat),
                    parseFloat(pathCoordinates[pathCoordinates.length - 1].lon)
                  )
                }
              />
              <Polyline path={pathCoordinates?.map((i: any) => new google.maps.LatLng(i.lat, i.lon))} options={{ strokeColor: '#0000FF' }} />
            </GoogleMap>
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

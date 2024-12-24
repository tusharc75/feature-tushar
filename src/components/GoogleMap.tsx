import { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { isMobile, isTablet } from 'react-device-detect';
import { Box, Dialog } from '@mui/material';
import { useAppTheme } from 'src/constants/AppConfig';
import { CustomDialogTransition, mapDarkTheme, mapLightTheme } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

const GoogleMaps = ({ onClose, locationName, latitude, longitude }) => {
  const [themeColor] = useAppTheme();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  return (
    <>
      <Dialog
        maxWidth="md"
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        onClose={onClose}
        fullWidth
      >
        <CustomDialogHeader
          title={locationName}
          onClose={onClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <Box height={fullScreen ? window.innerHeight - 100 : 500} width={'100%'} borderRadius={4} overflow="hidden">
            <GoogleMap
              key={themeColor}
              options={{
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                gestureHandling: 'cooperative',
                styles: themeColor === 'dark' ? mapDarkTheme : mapLightTheme
              }}
              mapContainerStyle={{
                height: '100%',
                minWidth: '100%'
              }}
              center={new google.maps.LatLng(latitude, longitude)}
              zoom={21}
            >
              <Marker position={new google.maps.LatLng(latitude, longitude)} />
            </GoogleMap>
          </Box>
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default GoogleMaps;

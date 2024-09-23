import { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { isMobile, isTablet } from 'react-device-detect';
import { Box, Button, Dialog } from '@material-ui/core';
import { useAppTheme } from 'src/constants/AppConfig';
import { CustomDialogTransition, mapDarkTheme, mapLightTheme } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

const GoogleMaps = ({ onClose, latitude, longitude }) => {

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
          title={'View Address'}
          onClose={onClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <Box height={400} width={'100%'} borderRadius={4} overflow="hidden">
            <GoogleMap
              key={themeColor}
              options={{
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                gestureHandling: 'cooperative',
                styles: themeColor === 'dark' ? mapDarkTheme : mapLightTheme,
              }}
              mapContainerStyle={{
                height: '100%',
                maxWidth: '600px',
                minWidth: '100%'
              }}
              center={new google.maps.LatLng(latitude, longitude)}
              zoom={15}
            >
              <Marker position={new google.maps.LatLng(latitude, longitude)} />
            </GoogleMap>
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button
            size="small"
            color="primary"
            onClick={onClose}
          >
            Close
          </Button>
        </CustomDialogFooter>
      </Dialog>
    </>
  )
}

export default GoogleMaps;

import { Box, Dialog, Slider } from '@mui/material';
import { useState } from 'react';
import { GoogleMap, GoogleMapProps, Marker, Circle } from '@react-google-maps/api';
import { useAppTheme } from 'src/constants/AppConfig';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { ThemeButton } from '../Helpers/Buttons';


const RadiusFilterDialog = ({ onClose, location, onApply, currentFilter, onMinimizeMaximize, fullScreen }) => {
  const [selectedRadius, setSelectedRadius] = useState(currentFilter?.radius || 50);
  const [themeColor] = useAppTheme();

  const marks = [
    { value: 5, label: '5 Miles' },
    { value: 25, label: '25 Miles' },
    { value: 50, label: '50 Miles' },
    { value: 75, label: '75 Miles' },
    { value: 100, label: '100 Miles' }
  ];

  const mapDarkTheme: GoogleMapProps['options']['styles'] = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }]
    },
    { featureType: 'transit', stylers: [{ visibility: 'on' }] },
    { featureType: 'poi', stylers: [{ visibility: 'on' }] }
  ];

  const mapLightTheme: GoogleMapProps['options']['styles'] = [
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
    { featureType: 'transit', stylers: [{ visibility: 'on' }] },
    { featureType: 'poi', stylers: [{ visibility: 'on' }] }
  ];

  const handleApply = () => {
    onApply({
      latitude: location.latitude,
      longitude: location.longitude,
      radius: selectedRadius
    });
    onClose();
  };

  const handleClear = () => {
    onApply(null);
    onClose();
  };

  const center = new google.maps.LatLng(location.latitude, location.longitude);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={true}
      fullScreen={fullScreen}
      aria-labelledby="radius-filter-dialog"
    >
      <CustomDialogHeader title="Location Radius Filter" showManimizeMaximize={true} onClose={onClose} onMinimizeMaximize={onMinimizeMaximize} />
      <CustomDialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box height={fullScreen ? 'calc(100vh - 250px)' : 400} width={'100%'} borderRadius={4} overflow="hidden">
            <GoogleMap
              key={`${themeColor}-${selectedRadius}`}
              options={{
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                streetViewControl: true,
                gestureHandling: 'cooperative',
                styles: themeColor === 'dark' ? mapDarkTheme : mapLightTheme
              }}
              mapContainerStyle={{
                height: '100%',
                width: '100%'
              }}
              center={center}
              zoom={selectedRadius <= 20 ? 9 : selectedRadius <= 50 ? 8 : 7}
            >
              <Marker position={center} />
              <Circle
                center={center}
                radius={selectedRadius * 1609.34} // Convert miles to meters
                options={{
                  fillColor: themeColor === 'dark' ? '#4fc3f7' : '#2196f3',
                  fillOpacity: 0.2,
                  strokeColor: themeColor === 'dark' ? '#4fc3f7' : '#2196f3',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
            </GoogleMap>
          </Box>

          <Box px={2}>
            <Slider
              onChange={(event, newValue) => setSelectedRadius(newValue as number)}
              min={5}
              max={100}
              step={5}
              defaultValue={selectedRadius}
              marks={marks}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton onClick={handleClear} buttonType="transparent">
          Clear Filter
        </ThemeButton>
        <ThemeButton onClick={onClose} buttonType="transparent">
          Cancel
        </ThemeButton>
        <ThemeButton onClick={handleApply} buttonType="theme">
          Apply Filter
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default RadiusFilterDialog;
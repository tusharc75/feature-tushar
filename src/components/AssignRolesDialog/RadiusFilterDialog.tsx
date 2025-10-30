import { AccountCircle } from '@mui/icons-material';
import { Avatar, Box, Dialog, Slider } from '@mui/material';
import React, { useEffect, useState, useContext } from 'react';
import { GoogleMap, GoogleMapProps, Marker, Circle, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import { useAppTheme } from 'src/constants/AppConfig';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { ThemeButton } from '../Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import { displayDateTime } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const RadiusFilterDialog = ({ onClose, location, onApply, currentFilter, onMinimizeMaximize, fullScreen, filtered }) => {
  const [selectedRadius, setSelectedRadius] = useState(currentFilter?.radius || 50);
  const [themeColor] = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [techniciansLocationData, setTechniciansLocationData] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showCenterInfo, setShowCenterInfo] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = encodeURIComponent(JSON.stringify(filtered));
      const response = await axiosInstance().get(`/rental-management/technician?filtered=${params}`);
      const data = response.data;
      setTechniciansLocationData(data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const marks = [
    { value: 5, label: '5 Miles' },
    { value: 25, label: '25 Miles' },
    { value: 50, label: '50 Miles' },
    { value: 75, label: '75 Miles' },
    { value: 100, label: '100 Miles' },
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

  const displayCenter = mapCenter || center;

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={true}
      fullScreen={fullScreen}
      aria-labelledby="radius-filter-dialog"
    >
      <CustomDialogHeader showRequiredLabel={false} title="Radius Filter" showManimizeMaximize={true} onClose={onClose} onMinimizeMaximize={onMinimizeMaximize} />
      <CustomDialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box height={fullScreen ? 'calc(100vh - 250px)' : 400} width={'100%'} overflow="hidden">
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
              center={displayCenter}
              zoom={selectedRadius <= 20 ? 9 : selectedRadius <= 50 ? 8 : 7}
              onClick={() => {
                setSelectedTechnician(null);
                setShowCenterInfo(false);
              }}
            >
              {/* Center location marker */}
              <Marker
                position={center}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#FF0000',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                }}
                onClick={() => {
                  setShowCenterInfo(true);
                  setMapCenter(center);
                  setSelectedTechnician(null);
                }}
              />

              {/* Center location info window */}
              {showCenterInfo && (
                <InfoWindow
                  options={{
                    pixelOffset: new window.google.maps.Size(0, -15),
                    headerDisabled: true,
                    disableAutoPan: true,
                  }}
                  position={center}
                >
                  <div className="flex min-w-[150px] flex-col rounded bg-white px-3 py-2 text-black">
                    <span className="text-[13px] font-semibold mb-1">Search Center</span>
                    <span className="text-[11px] text-[#666]">
                      Latitude: {parseFloat(location.latitude).toFixed(6)}
                    </span>
                    <span className="text-[11px] text-[#666]">
                      Longitude: {parseFloat(location.longitude).toFixed(6)}
                    </span>
                    <span className="text-[11px] text-[#666] mt-1">
                      Radius: {selectedRadius} Miles
                    </span>
                  </div>
                </InfoWindow>
              )}

              {/* Radius circle */}
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

              {/* Technician markers with clustering */}
              {techniciansLocationData?.length > 0 && (
                <MarkerClusterer>
                  {(clusterer) => (
                    <>
                      {techniciansLocationData?.map((techData: any) => (
                        <React.Fragment key={techData._id}>
                          <Marker
                            label={{
                              text: techData?.user?.optionLabel?.[0] || '',
                              fontWeight: 'bold',
                              color: 'white',
                              fontSize: '14px'
                            }}
                            position={new google.maps.LatLng(techData?.latitude, techData?.longitude)}
                            clusterer={clusterer}
                            onClick={() => {
                              setSelectedTechnician(techData);
                              setMapCenter(new google.maps.LatLng(techData?.latitude, techData?.longitude));
                              setShowCenterInfo(false);
                            }}
                          />

                          {selectedTechnician?._id === techData._id && (
                            <InfoWindow
                              options={{
                                pixelOffset: new window.google.maps.Size(0, -40),
                                headerDisabled: true,
                                disableAutoPan: true
                              }}
                              position={new google.maps.LatLng(techData?.latitude, techData?.longitude)}
                            >
                              <div className="flex min-w-[100px] items-center rounded bg-white px-2 py-1 text-black">
                                <Avatar
                                  alt={techData?.user?.optionLabel}
                                  src={techData?.user?.avatar}
                                  className="mr-2 h-9 w-9"
                                >
                                  {!techData?.user?.avatar && <AccountCircle className="text-[20px]" />}
                                </Avatar>
                                <div className="flex flex-col leading-[1.2]">
                                  <span className="text-[13px] font-semibold">
                                    {techData?.user?.optionLabel}
                                  </span>
                                  <span className="text-[11px] font-light text-[#333] pt-[2px]">
                                    Last Updated: {displayDateTime(techData?.date)}
                                  </span>
                                </div>
                              </div>
                            </InfoWindow>
                          )}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </MarkerClusterer>
              )}
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
          Clear
        </ThemeButton>
        <ThemeButton onClick={onClose} buttonType="transparent">
          Cancel
        </ThemeButton>
        <ThemeButton onClick={handleApply} buttonType="theme">
          Apply
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default RadiusFilterDialog;
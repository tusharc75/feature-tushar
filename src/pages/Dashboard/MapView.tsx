import React from 'react';
import { Box, Typography, CircularProgress, TableBody, IconButton, Table, TableCell, TableRow } from '@mui/material';
import { GoogleMap, Marker, MarkerClusterer, InfoWindow, GoogleMapProps } from '@react-google-maps/api';
import axiosInstance from 'src/axios/axiosInstance';
import { useAppTheme } from 'src/constants/AppConfig';
import routes from 'src/components/Helpers/Routes';
import { FiExternalLink } from 'react-icons/fi';

type locationType = {
  count: number;
  location: {
    concatedName: string;
    latitude: number;
    longitude: number;
  };
  _id: string | any;
};

const mapDarkTheme: GoogleMapProps['options']['styles'] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }]
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
    stylers: [{ color: '#9ca5b3' }]
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
    stylers: [{ color: '#f3d19c' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
  },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] }
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

  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] }
];

interface MapViewProps {
  data: any[];
  height: number | string;
}

const MapView = (props: MapViewProps) => {
  const [themeColor] = useAppTheme();
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
      } = await axiosInstance().get(`/kpi/asset/location-base-status-count?location=${id}`);
      if (data) {
        setSelectedAsset(data);
      }
      setFetching(false);
    } catch (error) {
      setFetching(false);
    }
  }, []);

  const handleMarkerClick = (asset: locationType) => {
    setCenter({ lat: asset.location.latitude, lng: asset.location.longitude });
    fetchLocationData(asset._id, asset);
  };

  if (!window.google || typeof window.google !== 'object') return <div>Loading...</div>;

  if (!data || !Array.isArray(data) || data.length === 0) return <div>No data</div>;

  return (
    <Box height={height} overflow="hidden" className="google-map-chart">
      <GoogleMap
        key={themeColor}
        onClick={() => {
          selectedBase && setSelectedBase(null);
        }}
        options={{
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
          },
          styles: themeColor === 'dark' ? mapDarkTheme : mapLightTheme,
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
                        text: asset.count.toLocaleString(),
                        fontWeight: 'bold',
                        color: 'black',
                        fontSize: '14px'
                      }}
                      onClick={() => handleMarkerClick(asset)}
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
            <div
              ref={(ref) => {
                if (ref) {
                  const infoWindowContent = ref.closest('.gm-style-iw') as HTMLElement;

                  if (infoWindowContent) {
                    infoWindowContent.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    infoWindowContent.style.borderRadius = '8px';
                    infoWindowContent.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
                    if (themeColor === 'dark') {
                      infoWindowContent.style.backgroundColor = 'rgba(14, 14, 35, 0.9)';
                      infoWindowContent.style.color = '#fff';
                      infoWindowContent.style.borderColor = '#0056b3';
                    }
                  }
                }
              }}
            >
              {selectedAsset.length > 0 || !isFetching ? (
                <Box textAlign={'left'} maxWidth={250} padding={0} margin={0}>
                  <Typography color="textPrimary" variant="body1" style={{ marginBottom: '8px' }}>
                    {`"${selectedBase?.location.concatedName}"`}
                  </Typography>
                  <Table
                    style={{
                      borderCollapse: 'collapse',
                      width: '100%',
                      border: '1px solid #ccc',
                      tableLayout: 'auto'
                    }}
                  >
                    <TableBody>
                      <TableRow
                        style={{
                          height: '28px',
                          borderBottom: '1px solid #ddd'
                        }}
                      >
                        <TableCell
                          style={{
                            padding: '2px 6px',
                            borderRight: '1px solid #ddd'
                          }}
                        >
                          <Typography variant="body2" color="textPrimary">
                            <strong>Total Asset</strong>
                          </Typography>
                        </TableCell>
                        <TableCell style={{ padding: '2px 6px' }}>
                          <Box display="flex">
                            <Typography variant="body2">{selectedBase?.count?.toLocaleString()}</Typography>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                window.open(
                                  `${routes.serializedAsset.path}?currentLocation=${encodeURIComponent(JSON.stringify([{ optionLabel: selectedBase?.location.concatedName, optionValue: selectedBase?.location?._id }]))}`,
                                  '_blank'
                                )
                              }
                            >
                              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                      {selectedAsset.map((d) => (
                        <TableRow
                          key={d.status}
                          style={{
                            height: '28px',
                            borderBottom: '1px solid #ddd'
                          }}
                        >
                          <TableCell
                            style={{
                              padding: '2px 6px',
                              borderRight: '1px solid #ddd'
                            }}
                          >
                            <Typography variant="body2" color="textPrimary">
                              <strong>{d.status}</strong>
                            </Typography>
                          </TableCell>
                          <TableCell style={{ padding: '2px 6px' }}>
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" style={{ marginRight: 8 }}>
                                {d.count?.toLocaleString()}
                              </Typography>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  window.open(
                                    `${routes.serializedAsset.path}?assetStatus=${d.status}&currentLocation=${encodeURIComponent(JSON.stringify([{ optionLabel: selectedBase?.location.concatedName, optionValue: selectedBase?.location?._id }]))}`,
                                    '_blank'
                                  )
                                }
                              >
                                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Box width={150} height={150} p={2} display={'flex'} justifyContent={'center'}>
                  <CircularProgress size={18} color="primary" />
                </Box>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
};

export default MapView;

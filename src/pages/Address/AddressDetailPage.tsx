import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import ManageAddressDialog from '../../components/Address/ManageAddressDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { GoogleMap, GoogleMapProps, Marker } from '@react-google-maps/api';
import { useAppTheme } from 'src/constants/AppConfig';

const AddressDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, resources }
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [addressData, setAddressData] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [addressFields, setAddressFields] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.address, title: resources?.address?.titlePlural }]);
  const [themeColor] = useAppTheme();

  useEffect(() => {
    if (id) {
      getAddressFields();
      fetchAddressData();
    }
  }, [id]);

  const mapDarkTheme: GoogleMapProps['options']['styles'] = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] }, // Changed text color to white
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }] // Changed text color to white
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }] // Changed text color to white
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }] // Changed text color to white
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
      stylers: [{ color: '#ffffff' }] // Changed text color to white
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
      stylers: [{ color: '#ffffff' }] // Changed text color to white
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#ffffff' }] // Changed text color to white
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

  const fetchAddressData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/address/${id}`);
      setAddressData(data);
      setCustomizedRoutes([{ ...routes.address, title: resources?.address?.titlePlural }, { title: data.fullAddress }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getAddressFields = () => {
    axiosInstance()
      .get('/field?resource=Address')
      .then(({ data }) => {
        setAddressFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteAddress = () => {
    axiosInstance()
      .put(`/address/remove`, { ids: [id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowDeleteConfirmBox(false);
        history.push(`${routes.address.path}`);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  return (
    <>
      {openUpdateDialog && (
        <ManageAddressDialog
          onClose={closeUpdateDialog}
          addressData={addressData}
          onSuccess={() => {
            fetchAddressData();
            closeUpdateDialog();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete this ${resources?.address?.titleSingular?.toLowerCase()}: ${addressData?.fullAddress} ?`}
          onClose={() => {
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDeleteAddress}
        />
      )}
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={customizedRoutes} />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              <>
                {permissions?.address?.isUpdate && (
                  <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                    {'Edit'}
                  </ThemeButton>
                )}
                {permissions?.address?.isDelete && (
                  <span title={id ? "Primarily selected address can't be deleted" : 'Permanently delete this address'}>
                    <DeleteButton text="Delete" onClick={() => setShowDeleteConfirmBox(true)} />
                  </span>
                )}
              </>
            </Box>
          </Box>
        </Box>
        <Box className="detail-container-v1">
          <Box>
            {loading || !addressFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={addressData} fields={addressFields} />
            )}
            {addressData?.latitude && addressData?.longitude && (
              <Box height={400} width={'100%'} borderRadius={4} overflow="hidden" marginTop={2}>
                <GoogleMap
                  key={themeColor}
                  options={{
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    streetViewControl: true,
                    gestureHandling: 'cooperative',
                    styles: themeColor === 'dark' ? mapDarkTheme : mapLightTheme
                  }}
                  mapContainerStyle={{
                    height: '100%',
                    maxWidth: '600px',
                    minWidth: '100%'
                  }}
                  center={new google.maps.LatLng(addressData?.latitude, addressData?.longitude)}
                  zoom={15}
                >
                  <Marker position={new google.maps.LatLng(addressData?.latitude, addressData?.longitude)} />
                </GoogleMap>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AddressDetailPage;

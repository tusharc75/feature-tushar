import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
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
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { GoogleMap, Marker } from '@react-google-maps/api';

const AddressDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [addressData, setAddressData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [addressFields, setAddressFields] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.address]);

  useEffect(() => {
    if (id) {
      getAddressFields();
      fetchAddressData();
    }
  }, [id]);

  const fetchAddressData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/address/${id}`);
      setAddressData(data);
      setCustomizedRoutes([routes.address, { title: data.fullAddress }]);
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

  const handleDeleteWarehouse = () => {
    if (id) {
      if (permissions?.address?.isDelete) {
        axiosInstance()
          .put(`/address/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            history.push(`${routes.address.path}`);
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
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
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${addressData?.fullAddress}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDeleteWarehouse}
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
                  <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                )}
                {permissions?.address?.isDelete && (
                  <span title={id ? "Primarily selected address can't be deleted" : 'Permanently delete this address'}>
                    <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
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
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={addressData} fields={addressFields} />
            )}
            {addressData?.latitude && addressData?.longitude && (
              <Box height={400} width={'100%'} borderRadius={4} overflow="hidden" marginTop={2}>
                <GoogleMap
                  options={{
                    disableDefaultUI: true,
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
                  mapContainerStyle={{
                    minHeight: '500px',
                    height: '100%',
                    maxWidth: '600px',
                    minWidth: '100%'
                  }}
                  center={
                    addressData?.latitude && addressData?.longitude
                      ? new google.maps.LatLng(addressData?.latitude, addressData?.longitude)
                      : new google.maps.LatLng(37.09, -95.713)
                  }
                  zoom={4}
                >
                  {addressData?.latitude && addressData?.longitude && (
                    <Marker
                      position={new google.maps.LatLng(addressData?.latitude, addressData?.longitude)}
                    />
                  )}
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

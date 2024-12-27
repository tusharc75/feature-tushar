import { useContext, useState, useEffect, Fragment } from 'react';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import DetailsPage from '../../components/Shared/DetailsPage';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Paper, Button, Divider, Typography, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import UpdateDetailsDialog from '../../components/Shared/UpdateDetailsDialog';
import { useData } from '../../StateProvider/Provider';
import { userType } from '../../constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import EditIcon from '@mui/icons-material/Edit';

export default function BrandConfiguration() {
  const [brandDetails, setBrandDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [brandFields, setBrandFields] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    if (user?.user?.userType === userType.brandAdmin) fetchBrandDetails();
  }, []);
  const fetchBrandDetails = () => {
    setLoading(true);
    axiosInstance()
      .get('/brand')
      .then(({ data: { data } }) => {
        setBrandDetails(data);
        if (data?._id && brandFields.length === 0) {
          getBrandFields(data._id);
        } else setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };
  const getBrandFields = (id) => {
    axiosInstance()
      .get(`/field?brand=${id}&resource=Brand`)
      .then(({ data: { data } }) => {
        setBrandFields(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
  };

  const handleUpdate = (values) => {
    setUpdating(true);
    axiosInstance()
      .put('/brand', { ...values })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchBrandDetails();
        closeUpdateDIalog();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.brandConfiguration]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <ThemeButton iconForMobile={<EditIcon />} variant={'outlined'} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
              {'Edit'}
            </ThemeButton>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Grid size={{ xs: 12, sm: 12, lg: 12 }}>
          {user?.user?.userType === userType.brandAdmin ? (
            loading || !brandFields.length || !brandDetails ? (
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            ) : (
              <DetailsPage data={brandDetails} fields={brandFields} />
            )
          ) : (
            <Paper style={{ minHeight: '300px', textAlign: 'center' }}>
              {' '}
              <Typography className="text-capitalize" style={{ display: 'inline-block' }} variant="h6" component="h2" color="primary">
                You don't have permission
              </Typography>
            </Paper>
          )}
        </Grid>
      </Box>
      {openUpdateDialog && (
        <UpdateDetailsDialog
          title="Update Brand"
          openDialog={openUpdateDialog}
          onClose={closeUpdateDIalog}
          data={brandDetails}
          fields={brandFields.filter((o) => o?.fieldData?.fieldName !== 'servicesAccess')}
          isUpdating={isUpdating}
          handleUpdate={handleUpdate}
        />
      )}
    </Box>
  );
}

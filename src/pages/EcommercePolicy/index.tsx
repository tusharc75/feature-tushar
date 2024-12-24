import { Box, Button } from '@mui/material';
import EditIcon from '@material-ui/icons/Edit';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import DetailsPage from '../../components/Shared/DetailsPage';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import DetailsDialog from './DetailsDialog';
import { useData } from 'src/StateProvider/Provider';

const EcommercePolicy = () => {
  const [details, setDetails] = useState({});
  const [fields, setFields] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    state: { resources }
  } = useData();

  useEffect(() => {
    fetchDetails();
    getFields();
  }, []);

  const fetchDetails = () => {
    axiosInstance()
      .get('/e-commerce-policy')
      .then(({ data: { data } }) => {
        setDetails(data);
      })
      .catch((err) => {});
  };

  const getFields = () => {
    axiosInstance()
      .get(`/field?resource=e-Commerce Policy`)
      .then(({ data: { data } }) => {
        setFields(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.eCommercePolicy, title: resources?.eCommercePolicy?.titlePlural }]} />
        <Button
          variant={isMobile && !isTablet ? 'text' : 'contained'}
          size="small"
          className={'btn-outline-v1'}
          onClick={() => {
            setOpen(true);
          }}
        >
          {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
        </Button>
      </Box>
      <Box className={`detail-container-v1`}>
        {fields ? <DetailsPage data={details} fields={fields} /> : <CommonSkeleton lenArray={[...Array(7).keys()]} />}
      </Box>
      {open && (
        <DetailsDialog
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            fetchDetails();
          }}
        />
      )}
    </Box>
  );
};

export default EcommercePolicy;

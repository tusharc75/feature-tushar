import { Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axios/axiosInstance';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import DetailsPage from '../../components/Shared/DetailsPage';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import DetailsDialog from './DetailsDialog';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
      .catch((err) => { });
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
        <ThemeButton
          iconForMobile={<EditIcon />}
          onClick={() => {
            setOpen(true);
          }}
          mobileTooltip={'Edit'}
        >
          {'Edit'}
        </ThemeButton>
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

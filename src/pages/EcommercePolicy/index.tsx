import { useContext, useState, useEffect, Fragment } from 'react';
import { Grid, Typography, Box, Divider, Button } from '@material-ui/core';
import styles from '../Leads/Header.module.scss';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { MdDescription } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { camelCase } from 'lodash';
import axiosInstance from '../../axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import DetailsDialog from './DetailsDialog';
import { isMobile, isTablet } from 'react-device-detect';
import EditIcon from '@material-ui/icons/Edit';

const EcommercePolicy = () => {
  const [details, setDetails] = useState({});
  const [fields, setFields] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
        <CustomBreadCrumbs routes={[{ title: routes.eCommercePolicy.title, path: '' }]} />
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

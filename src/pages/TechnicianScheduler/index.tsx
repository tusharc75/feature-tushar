import { Box, Grid, makeStyles, Paper, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { Fragment, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { serviceOrder } from 'src/constants/helpers';
import Roadmap from './Roadmap';

const capitalize = (string) => {
  return string?.charAt(0)?.toUpperCase() + string?.slice(1);
};

const useStyles = makeStyles((theme) => ({
  activityContainer: {
    padding: '0 10px 10px'
  },
  activityHeader: {
    background: '#dfdfdf',
    margin: '6px 6px',
    borderRadius: '6px',
    '& .MuiGrid-spacing-xs-1': {
      width: 'calc(100% + 14px)'
    }
  }
}));

function TechnicianScheduler() {
  const classes = useStyles();
  const [filter, setFilter] = useState({ view: '', resource: '', serviceOrder: '' });
  const [serviceOrders, setServiceOrders] = useState([]);

  useEffect(() => {
    fetchServiceOrders();
  }, [filter.resource]);

  const fetchServiceOrders = async () => {
    const response: any = await axiosInstance().get(`${serviceOrder.api}`);
    const serviceOrdersData = response?.data?.data?.map((item) => {
      return { optionLabel: item?.serviceOrderNumber, optionValue: item?._id };
    });
    setServiceOrders(serviceOrdersData);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs routes={[{ title: capitalize(routes.technicianScheduler.title) }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Box p={1} pt={2}>
          <Grid container xs={12} md={12} sm={12} spacing={2}>
            <Grid item xs={12} md={4} sm={4}>
              <Autocomplete
                size="small"
                fullWidth
                freeSolo
                options={['Technician View', 'Order View']}
                getOptionLabel={(option) => option}
                value={filter.view || ''}
                onChange={(event, newValue) => {
                  setFilter({ view: newValue, resource: '', serviceOrder: '' });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Select View" size="small" variant="outlined" className={isMobile ? 'serchBox' : ''} />
                )}
              />
            </Grid>
            {filter?.view === 'Order View' && (
              <Grid item xs={12} md={4} sm={4}>
                <Autocomplete
                  size="small"
                  fullWidth
                  freeSolo
                  options={['Service Order']}
                  getOptionLabel={(option: any) => option}
                  value={filter.resource || ''}
                  onChange={(event, newValue) => {
                    setFilter({ ...filter, resource: newValue, serviceOrder: '' });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Resource" size="small" variant="outlined" className={isMobile ? 'serchBox' : ''} />
                  )}
                />
              </Grid>
            )}
            {filter?.resource === 'Service Order' && (
              <Grid item xs={12} md={4} sm={4}>
                <Autocomplete
                  size="small"
                  fullWidth
                  freeSolo
                  options={serviceOrders}
                  getOptionLabel={(option: any) => option.optionLabel}
                  value={serviceOrders?.find((item) => item?.optionValue === filter?.serviceOrder) || ''}
                  onChange={(event, newValue) => {
                    setFilter({ ...filter, serviceOrder: newValue.optionValue });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Service" size="small" variant="outlined" className={isMobile ? 'serchBox' : ''} />
                  )}
                />
              </Grid>
            )}
          </Grid>
        </Box>
        <Box className={classes.activityContainer}>
          <Roadmap filter={filter} />
        </Box>
      </CustomContainer>
    </Fragment>
  );
}

export default TechnicianScheduler;

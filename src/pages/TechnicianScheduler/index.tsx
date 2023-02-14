import { Box, Dialog, DialogTitle, Grid, makeStyles, Paper, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { Fragment, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { serviceOrder } from 'src/constants/helpers';
import Roadmap from './Roadmap';
import ServiceOrder from './ServiceOrder';

function TechnicianScheduler() {

  const [filter, setFilter] = useState({ view: 'Technician View', resource: '', serviceOrder: '' });

  const [serviceOrders, setServiceOrders] = useState([]);

  const [assignTechnicianDialog, setAssignTechnicianDialog] = useState({ open: false, data: null });
  const [refresh, setRefresh] = useState(false);

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

  const [selectedRecords, setSelectedRecords] = useState([]);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.technicianScheduler.title }]} />
        </Box>
      </Box>
      <Box className="detail-container-v1">
        {/* <Box p={1}>
          <Grid container xs={12} md={12} sm={12} spacing={2}>
            <Grid item xs={12} md={4} sm={4}>
              <Autocomplete
                size="small"
                fullWidth
                freeSolo
                options={['Technician View']}
                //options={['Technician View', 'Order View']}
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
        </Box> */}
        <Roadmap
          filter={filter}
          selectedRecords={selectedRecords}
          refresh={refresh}
          handleAssignTechnician={(data) => {
            setAssignTechnicianDialog({ open: true, data: data });
          }} />
        <ServiceOrder
          setSelectedRecords={setSelectedRecords}
          selectedRecords={selectedRecords}
          assignTechnicianDialog={assignTechnicianDialog}
          handleSucess={() => {
            setRefresh(!refresh)
            setAssignTechnicianDialog({ open: false, data: null });
          }}
          handleClose={() => {
            setAssignTechnicianDialog({ open: false, data: null });
          }}
        />
      </Box>
    </Box>
  );
}

export default TechnicianScheduler;

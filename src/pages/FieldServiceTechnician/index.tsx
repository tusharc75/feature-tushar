import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Tab, Tabs, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FieldTicket from './FieldTicket';
import moment from 'moment';
import { dateFormat } from 'src/constants/helpers';
import EventNoteIcon from '@material-ui/icons/EventNote';
import TabPanel from 'src/components/TabPanel';
import Consumables from './Consumables';

const status = {
  completed: 'Completed',
  dispatched: 'Dispatched',
  assigned: 'Assigned'
};

const style = {
  serviceHead: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '5px',
    '& p': {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontWeight: 500
    },
    '& p:first-of-type': {
      gap: '0',
      fontWeight: 500
    }
  },
  borderBottom: {
    borderBottom: '1px solid rgb(211, 211, 211)'
  },
  serviceItem: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: '5px',
    '&:last-of-type': {
      paddingBottom: 0
    },
    gap: '10px',
    '& p ': {
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    }
  }
};

const FieldServiceTechnician = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const [fieldService, setFieldService] = useState(null);
  const [selectedFieldService, setSelectedFieldService] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setFieldService(null);
    axiosInstance()
      .get(`/field-service-technician`)
      .then(({ data: { data } }) => {
        setFieldService(data?.data);
        const isAvailable = data?.data.find((d) => d._id === selectedFieldService?._id);
        const index = data?.data.findIndex((d) => d._id === selectedFieldService?._id);
        if (data?.data?.length) {
          isAvailable ? setSelectedFieldService(data?.data[index]) : setSelectedFieldService(data?.data[0]);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getBgColor = (data) => {
    const currentStatus = data?.technicianAssign?.status;
    let color = 'white';
    switch (currentStatus) {
      case status.assigned:
        color = '#F2FDFF';
        break;
      case status.dispatched:
        color = '#FFF9E3';
        break;
      case status.completed:
        color = '#F2FFEE';
        break;
      default:
        color = 'white';
        break;
    }
    return color;
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.fieldServiceTechnician.title }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {fieldService ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} sm={12}>
              {fieldService?.map((data, index) => {
                return (
                  <Box
                    mb={2}
                    key={index}
                    onClick={() => {
                      setSelectedFieldService(data);
                    }}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedFieldService === data ? '#298b88' : getBgColor(data),
                      color: selectedFieldService === data ? 'white' : 'black',
                      border: '1px solid #ebebeb'
                    }}
                  >
                    <Box p={3}>
                      <Box sx={style.serviceHead}>
                        <Typography>
                          <span>{data?.serviceOrderNumber}</span>
                        </Typography>
                        <Typography>{data?.service?.serviceName}</Typography>
                      </Box>
                      <Box sx={{ ...style.serviceItem, ...style.borderBottom }}>
                        <Typography style={{ fontSize: '12px', fontWeight: '400', color: selectedFieldService === data ? 'white' : 'gray' }}>
                          <EventNoteIcon style={{ fontSize: '15px' }} />
                          {moment(data?.technicianAssign?.estimateStartDate).format(dateFormat)} -{' '}
                          {moment(data?.technicianAssign?.estimateEndDate).format(dateFormat)}
                        </Typography>
                        <Typography style={{ fontWeight: '500' }}>{data?.technicianAssign?.status}</Typography>
                      </Box>
                      <Box sx={style.serviceItem}>
                        <Typography style={{ fontSize: '14px' }}>Customer: {data?.customerAccount?.optionLabel}</Typography>
                      </Box>
                      <Box sx={style.serviceItem}>
                        <Typography style={{ fontSize: '14px' }}>Location: {data?.shippingAddress?.optionLabel}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Grid>
            <Grid item xs={12} md={8} sm={12}>
              {selectedFieldService && (
                <Box
                  style={{
                    border: '1px solid #D3D3D3',
                    borderTop: 'none'
                  }}
                >
                  <Tabs
                    className="new-tab-container-v1"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                      style: {
                        display: 'none'
                      }
                    }}
                  >
                    <Tab
                      className={'tabLayout'}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          {/* <FaWpforms className="mr-1" fontSize="inherit" /> */}
                          Field Ticket
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      className={'tabLayout'}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          {/* <BiFoodMenu className="mr-1" fontSize="inherit" /> */}
                          Consumables
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                  </Tabs>
                  <TabPanel value={tabValue} index={0}>
                    <Box>
                      <FieldTicket selectedFieldService={selectedFieldService} />
                    </Box>
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <Box>
                      <Consumables selectedFieldService={selectedFieldService} recall={fetchData} />
                    </Box>
                  </TabPanel>
                </Box>
              )}
            </Grid>
          </Grid>
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FieldServiceTechnician;

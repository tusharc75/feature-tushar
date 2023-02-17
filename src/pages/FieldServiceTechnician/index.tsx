import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Typography } from '@material-ui/core';
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

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InfoIcon from '@material-ui/icons/Info';
import { FiExternalLink } from 'react-icons/fi';
import EventNoteIcon from '@material-ui/icons/EventNote';

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
      gap: '5px'
    },
    '& p:first-of-type': {
      gap: '0',
      color: 'var(--link)',
      fontWeight: '500'
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axiosInstance()
      .get(`/field-service-technician`)
      .then(({ data: { data } }) => {
        setFieldService(data?.data);
        if (data?.data?.length) {
          setSelectedFieldService(data?.data[0]);
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
  console.log({ selectedFieldService, fieldService });
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
                          {/* <ExpandMoreIcon /> */}
                          <span>{data?.serviceOrderNumber}</span>
                          <FiExternalLink style={{ fontSize: '15px' }} />
                        </Typography>
                        <Typography>
                          {data?.service?.serviceName}
                          <InfoIcon style={{ fontSize: '15px', color: selectedFieldService === data ? 'white' : 'gray' }} />
                        </Typography>
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
                        <Typography>Customer: {data?.customerAccount?.optionLabel}</Typography>
                      </Box>
                      <Box sx={style.serviceItem}>
                        <Typography>Location: {data?.shippingAddress?.optionLabel}</Typography>
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
                    border: '1px solid #D3D3D3'
                  }}
                >
                  <FieldTicket selectedFieldService={selectedFieldService} />
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

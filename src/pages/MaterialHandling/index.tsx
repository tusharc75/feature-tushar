import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Tab, Tabs, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
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

  const [workOrder, setWorkOrder] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setWorkOrder(null);
    axiosInstance()
      .get(`/material-handling`)
      .then(({ data: { data } }) => {
        setWorkOrder(data);
        const isAvailable = data?.find((d) => d._id === selectedWorkOrder?._id);
        const index = data?.findIndex((d) => d._id === selectedWorkOrder?._id);
        if (data?.length) {
          isAvailable ? setSelectedWorkOrder(data[index]) : setSelectedWorkOrder(data[0]);
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
          <CustomBreadCrumbs routes={[{ title: routes.materialHandling.title }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {workOrder ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} sm={12}>
              {workOrder?.map((data, index) => {
                return (
                  <Box
                    mb={2}
                    key={index}
                    onClick={() => {
                      setSelectedWorkOrder(data);
                    }}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedWorkOrder === data ? '#298b88' : getBgColor(data),
                      color: selectedWorkOrder === data ? 'white' : 'black',
                      border: '1px solid #ebebeb'
                    }}
                  >
                    <Box p={3}>
                      <Box sx={style.serviceHead}>
                        <Typography>
                          <span>{data?.workOrderNumber}</span>
                        </Typography>
                      </Box>
                      <Box sx={style.serviceItem}>
                        <Typography>No of Request: {data?.qtyRequestLogs?.length}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Grid>
            <Grid item xs={12} md={8} sm={12}>
              {selectedWorkOrder && (
                <Box
                  style={{
                    border: '1px solid #D3D3D3'
                  }}
                >
                  <Consumables selectedFieldService={selectedWorkOrder} recall={fetchData} style={style} />
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

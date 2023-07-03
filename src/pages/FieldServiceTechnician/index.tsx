import { Box, Button, BoxProps, Grid, IconButton, Menu, MenuItem, Tab, Tabs, Typography } from '@material-ui/core';
import { useContext, useEffect, useRef, useState } from 'react';
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
import RefreshIcon from '@material-ui/icons/Refresh';
import { clearAll, deleteOne, findAll, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

const status = {
  completed: 'Completed',
  dispatched: 'Dispatched',
  assigned: 'Assigned'
};

const style = {
  date: {
    fontSize: 13,
    fontWeight: 400,
    display: 'flex',
    gap: 5,
    alignItems: 'center'
  },
  title: {
    '& p': {
      fontSize: 14,
      fontWeight: 600,
      lineHeight: '20px',
      '& span': {
        fontSize: 13
      }
    }
  },
  titleText: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: '20px',
    marginBottom: 7
  },
  subTitleText: {
    fontSize: 13,
    fontWeight: 400
  },
  serviceHead: {
    '& p': {
      fontSize: 14,
      fontWeight: 600,
      lineHeight: '20px',
      marginBottom: 9
    },
    '& span': {}
  },
  borderBottom: {
    borderBottom: '1px solid var(--common-border-color)'
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
  const { isOffline } = useContext(CustomOfflineContext);

  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const [fieldService, setFieldService] = useState(null);
  const [selectedFieldService, setSelectedFieldService] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [offlineStore, setOfflineStore] = useState([]);
  const [anchorEl, setAnchorEl] = useState({});

  const fieldRef: any = useRef();

  const fieldRemoveRef: any = useRef();

  useEffect(() => {
    fetchData();
    findAllStoredData();
  }, [isOffline]);

  const findAllStoredData = async () => {
    const data = await findAll(objectStore.fieldServiceTechnician);
    setOfflineStore(data?.map((d) => d?._id) || []);
  };

  const fetchData = async () => {
    setFieldService(null);
    if (isOffline) {
      const data: any = await findAll(objectStore.fieldServiceTechnician);
      setFieldService(data);
      setSelectedFieldService(data[0]);
    } else {
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
    }
  };

  const getBgColor = (data) => {
    const currentStatus = data?.technicianAssign?.status;
    let color = 'var(--dark-secondary, white)';
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
        color = 'var(--dark-secondary, white)';
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

  const handleAddOffline = async (fieldService) => {
    await insertUpdate(objectStore.fieldServiceTechnician, fieldService._id, fieldService);
    fieldRef.current.triggerChildFunction();
    closeActions();
    findAllStoredData();
  };

  const handleRemoveOffline = async (fieldService) => {
    deleteOne(objectStore.fieldServiceTechnician, fieldService._id);
    fieldRemoveRef.current.triggerChildFunction();
    closeActions();
    findAllStoredData();
  };

  const openActions = (id, event) => {
    setAnchorEl({ ...anchorEl, [id]: event.currentTarget });
  };

  const closeActions = () => {
    setAnchorEl({});
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.fieldServiceTechnician.title }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {fieldService ? (
          <>
            <Box textAlign={'right'} mb={2}>
              <Button
                onClick={() => {
                  clearAll(objectStore.fieldServiceTechnician);
                  clearAll(objectStore.fieldTicket);
                  findAllStoredData();
                }}
              >
                Clear Offline
              </Button>
              <IconButton size="small" onClick={() => fetchData()} style={{ marginLeft: '8px' }}>
                <RefreshIcon />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={4} xl={3}>
                <Box p={2} className="container-with-border">
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
                          backgroundColor: selectedFieldService === data ? 'var(--dark-secondary, #fff)' : getBgColor(data),
                          border: selectedFieldService === data ? '2px solid var(--new_theme_color)' : '1px solid var(--common-border-color)',
                          borderRadius: '8px'
                        }}
                        sx={{ position: 'relative' }}
                      >
                        <Box p={3}>
                          <Box sx={{ ...style.serviceItem, ...style.title }}>
                            <Typography>{data?.fieldServiceOrderNumber}</Typography>
                            <Typography className={`chip chip-${data?.technicianAssign?.status}`} style={{ fontWeight: '500' }}>
                              {data?.technicianAssign?.status}
                            </Typography>
                          </Box>
                          <Box style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', ...style.borderBottom }}>
                            <Box sx={{ ...style.title, textAlign: 'unset' }}>
                              <Typography>
                                Service Name : <span>{data?.service?.serviceName}</span>
                              </Typography>
                              <Typography component={'span'} style={{ ...style.date, marginBottom: '8px', marginTop: '5px' }}>
                                <EventNoteIcon style={{ fontSize: '15px' }} />
                                {moment(data?.technicianAssign?.estimateStartDate).format(dateFormat)} -{' '}
                                {moment(data?.technicianAssign?.estimateEndDate).format(dateFormat)}
                              </Typography>
                            </Box>
                            {!isOffline && (
                              <>
                                <IconButton size="small" onClick={(e) => openActions(data._id, e)} aria-controls={`action-menu-${data._id}`}>
                                  <MoreHorizIcon />
                                </IconButton>
                                <Menu
                                  anchorEl={anchorEl[data._id]}
                                  keepMounted
                                  getContentAnchorEl={null}
                                  anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left'
                                  }}
                                  id={`action-menu-${data._id}`}
                                  open={Boolean(anchorEl[data._id])}
                                  onClose={closeActions}
                                >
                                  {!offlineStore?.includes(data._id) ? (
                                    <MenuItem onClick={() => handleAddOffline(data)}>Add Offline</MenuItem>
                                  ) : (
                                    <MenuItem onClick={() => handleRemoveOffline(data)}>Remove Offline</MenuItem>
                                  )}
                                </Menu>
                              </>
                            )}
                          </Box>

                          <Box mt={1}>
                            <Typography style={style.titleText}>
                              Customer: <span style={style.subTitleText}>{data?.customerAccount?.optionLabel}</span>
                            </Typography>
                            <Typography style={{ ...style.titleText, marginBottom: 0 }}>
                              Location: <span style={style.subTitleText}>{data?.shippingAddress?.optionLabel}</span>
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>
              <Grid item xs={12} sm={12} md={8} xl={9}>
                {selectedFieldService && (
                  <Box p={2} className="container-with-border">
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
                        label={<div className="d-flex align-items-center tab-font">{routes.fieldTicket.title}</div>}
                        {...a11yProps(0)}
                      />
                      <Tab className={'tabLayout'} label={<div className="d-flex align-items-center tab-font">Consumables</div>} {...a11yProps(1)} />
                    </Tabs>
                    <TabPanel value={tabValue} index={0}>
                      <Box>
                        <FieldTicket selectedFieldService={selectedFieldService} fieldRef={fieldRef} fieldRemoveRef={fieldRemoveRef} />
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
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FieldServiceTechnician;

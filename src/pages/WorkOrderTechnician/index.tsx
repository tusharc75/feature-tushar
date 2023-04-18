import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  makeStyles,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@material-ui/core';
import { Fragment, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import {
  convertMsToTime,
  CustomDialogTransition,
  QUOTATION_STATUS,
  REPAIR_ORDER_TYPE,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_SERVICE_STEP_STATUS
} from 'src/constants/helpers';
import Steps from '../WorkOrder/Service/Steps';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import RefreshIcon from '@material-ui/icons/Refresh';
import FilterListIcon from '@material-ui/icons/FilterList';
import React from 'react';
import { useData } from 'src/StateProvider/Provider';

const useStyles = makeStyles(() => ({
  activityMainBlock: {
    marginTop: '20Px',
    height: 'calc(100vh - 28vh)',
    overflow: 'auto'
  },
  '.MuiGrid-spacing-xs-1': {
    width: 'calc(100vw + 14px)'
  },
  block: {
    borderRadius: '4px',
    minHeight: 'calc(100vh - 33.5vh)',
    height: '100%'
  },
  activitybox: {
    cursor: 'pointer',
    background: 'white',
    position: 'relative',
    margin: '0px 6px 14px',
    borderRadius: '4px',
    // boxShadow: 'rgb(23 43 77 / 20%) 0px 1px 1px, rgb(23 43 77 / 20%) 0px 0px 1px',
    backgroundColor: 'rgb(255, 255, 255)',
    color: 'rgb(23, 43, 77)',
    padding: '14px 15px',
    transition: 'transform .2s, background .3s',
    '&:hover': {
      transform: 'scale(1.02)',
      zIndex: '1'
      // backgroundColor: 'var(--hover_bg)'
    }
  },
  mediumDevice: {
    ['@media (min-width:600px)']: {
      flexGrow: '0',
      maxWidth: '50%',
      flexBasis: '50%'
    },
    ['@media (min-width:768px)']: {
      flexGrow: '0',
      maxWidth: '33.333333%',
      flexBasis: '33.333333%'
    },
    ['@media (min-width:1100px)']: {
      flexGrow: '0',
      maxWidth: '25%',
      flexBasis: '25%'
    }
  },
  taskContainer: {
    backgroundColor: '#FAFDFF',
    padding: '15px',
    marginTop: '34px'
  },
  inputs: {
    boxShadow: '0px 4.74053px 23.7026px rgba(0, 0, 0, 0.06)'
  },
  fixedTopHead: {
    position: 'sticky',
    zIndex: 4,
    top: '0px',
    background: '#FAFDFF'
  }
}));

const WorkOrderTechnician = () => {
  const classes = useStyles();

  const [serviceOpen, setServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceData, setServiceData] = useState([]);

  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [repairOrderOptions, setRepairOrderOptions] = useState([]);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState(null);

  const [showFilter, setShowFilter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [servicesToKeep, setServicesToKeep] = useState(['pending', 'inProgress']);

  const {
    state: { permissions }
  }: any = useData();

  const WORKORDER_TECHNICIAN_SERVICE_STATUS = {
    backlog: 'Backlog',
    pending: 'Pending',
    inProgress: 'In-Progress',
    completed: 'Completed'
  };

  const WORKORDER_STATUS_COLOR = {
    pending: '#FFFFE0',
    inProgress: '#FFD580'
  };

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Work Order,Repair Order`)
      .then(({ data: { data } }) => {
        setWorkOrderOptions(data['Work Order']);
        setRepairOrderOptions(data['Repair Order']);
      });
  }, []);

  useEffect(() => {
    fetchWorkOrderTechnician();
  }, [selectedWorkOrder, selectedRepairOrder]);

  const fetchWorkOrderTechnician = () => {
    setLoading(true);
    let api =
      selectedWorkOrder && selectedRepairOrder
        ? `/work-order-technician?workOrder=${selectedWorkOrder.optionValue}&repairOrder=${selectedRepairOrder.optionValue}`
        : selectedWorkOrder
        ? `/work-order-technician?workOrder=${selectedWorkOrder.optionValue}`
        : selectedRepairOrder
        ? `/work-order-technician?repairOrder=${selectedRepairOrder.optionValue}`
        : `/work-order-technician`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        setServiceData(data);
        if (selectedService) {
          const tempSelected = data?.find((e) => e._id === selectedService?.uniqueId && e?.service?._id === selectedService?._id);
          if (tempSelected) {
            let tempServiceData = tempSelected?.service;
            tempServiceData['uniqueId'] = tempSelected?._id;
            tempServiceData['status'] = tempSelected?.status;
            tempServiceData['assetNumber'] = tempSelected?.workOrderDetail?.serializedAsset?.optionLabel;
            tempServiceData['assetId'] = tempSelected?.workOrderDetail?.serializedAsset?.optionValue;
            tempServiceData['workOrderId'] = tempSelected?.workOrderDetail?._id;
            setSelectedService(tempServiceData);
          }
        }
        setLoading(false);
      })
      ?.catch((err) => {
        setLoading(false);
      });
  };

  const getFieldsWithOtherDetails = (steps: any) => {
    const stepTimes = [];
    steps.forEach((item) => {
      let obj: any = {};
      obj.startDate = item?.startDate;
      obj.endDate = item?.endDate;
      obj.pauseDate = item?.pauseDate;
      obj.duration = item?.duration || 0;
      obj.status = item?.status;
      stepTimes.push(obj);
    });
    return stepTimes;
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.workOrderTechnician.title }]} />
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} gridGap={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              {workOrderOptions && (
                <Box className={classes.inputs}>
                  <Autocomplete
                    options={workOrderOptions}
                    fullWidth
                    getOptionLabel={(option: any) => option.optionLabel}
                    getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                    value={selectedWorkOrder}
                    onChange={(event, newValue) => {
                      setSelectedWorkOrder(newValue);
                    }}
                    size="small"
                    renderInput={(params) => <TextField {...params} label={`Select Work Order`} variant="outlined" />}
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {repairOrderOptions && (
                <Box className={classes.inputs}>
                  <Autocomplete
                    options={repairOrderOptions}
                    fullWidth
                    getOptionLabel={(option: any) => option.optionLabel}
                    getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                    value={selectedRepairOrder}
                    onChange={(event, newValue) => {
                      setSelectedRepairOrder(newValue);
                    }}
                    size="small"
                    renderInput={(params) => <TextField {...params} label={`Select Repair Order`} variant="outlined" />}
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={5}>
              <Box className={classes.inputs}>
                <Autocomplete
                  fullWidth
                  multiple
                  options={Object.keys(WORKORDER_TECHNICIAN_SERVICE_STATUS)?.map((key) => key) || []}
                  disableCloseOnSelect
                  getOptionLabel={(option) => WORKORDER_TECHNICIAN_SERVICE_STATUS[option]}
                  renderOption={(option: any, { selected }: any) => (
                    <React.Fragment>
                      <Checkbox disabled={['pending', 'inProgress']?.includes(option)} checked={servicesToKeep?.includes(option)} />
                      {WORKORDER_TECHNICIAN_SERVICE_STATUS[option]}
                    </React.Fragment>
                  )}
                  size="small"
                  renderInput={(params) => <TextField {...params} label="Services Show" placeholder="Services" variant="outlined" />}
                  value={servicesToKeep}
                  onChange={(event: any, newValue: any) => {
                    if (!newValue.includes('pending') || !newValue.includes('inProgress')) {
                      return;
                    }
                    setServicesToKeep(newValue);
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          <Box>
            <IconButton size="small" onClick={() => fetchWorkOrderTechnician()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        <Box className={classes.taskContainer}>
          <Grid container spacing={2} className={` ${classes.activityMainBlock}`}>
            {Object.keys(WORKORDER_TECHNICIAN_SERVICE_STATUS)
              ?.filter((key) => {
                return servicesToKeep.includes(key);
              })
              ?.map((key, i) => {
                return (
                  <Grid item md={3} xs={12} sm={4} style={{ paddingTop: '0px' }} key={i} className={classes.mediumDevice}>
                    <div className={classes.block}>
                      <Box p={1} className={classes.fixedTopHead}>
                        <Typography variant="subtitle2" style={{ width: '50%' }}>
                          {WORKORDER_SERVICE_STATUS[key]}
                          {' (' + serviceData?.filter((d) => d.status === WORKORDER_SERVICE_STATUS[key]).length + ')'}
                        </Typography>
                      </Box>
                      {!loading
                        ? serviceData
                            ?.filter((d) => d.status === WORKORDER_SERVICE_STATUS[key])
                            .map((data, index) => {
                              const stepTime = getFieldsWithOtherDetails(data?.stepData || []);
                              return (
                                <Box
                                  key={index}
                                  onClick={() => {
                                    let tempServiceData = data?.service;
                                    tempServiceData['uniqueId'] = data?._id;
                                    tempServiceData['status'] = data?.status;
                                    tempServiceData['assetNumber'] = data?.workOrderDetail?.serializedAsset?.optionLabel;
                                    tempServiceData['assetId'] = data?.workOrderDetail?.serializedAsset?.optionValue;
                                    tempServiceData['workOrderId'] = data?.workOrderDetail?._id;
                                    setSelectedService(tempServiceData);
                                    setServiceOpen(true);
                                  }}
                                  style={{
                                    backgroundColor: `${
                                      data.status === WORKORDER_SERVICE_STATUS.pending
                                        ? '#FFFFE0'
                                        : data.status === WORKORDER_SERVICE_STATUS.inProgress
                                        ? '#FFD580'
                                        : data?.serviceStatus
                                        ? data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.passed
                                          ? '#E9FFE8'
                                          : '#FFE9EA'
                                        : 'white'
                                    }`
                                    //cursor: `${data.status === WORKORDER_SERVICE_STATUS.backlog ? 'not-allowed' : 'pointer'}`
                                  }}
                                  className={` ${classes.activitybox}`}
                                >
                                  <Box>
                                    <Grid container>
                                      <Grid item xs={12}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                          <Box display="flex">
                                            <Typography
                                              style={{
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                marginRight: '5px'
                                              }}
                                              variant="subtitle2"
                                            >
                                              {data?.service?.serviceName}
                                            </Typography>
                                          </Box>
                                          <Box ml={1}>
                                            <RenderTotalTime stepTimes={stepTime} />
                                          </Box>
                                          {data?.serviceStatus && (
                                            <Box ml={1}>
                                              <Chip label={data?.serviceStatus} variant="outlined" color={'primary'} />
                                            </Box>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                          <Box mt={1} mr={1}>
                                            <Chip size="small" label={`Work Order : ${data?.workOrderDetail?.workOrderNumber}`} />
                                          </Box>
                                          {data?.workOrderDetail?.serializedAsset?.optionLabel && (
                                            <Box mt={1}>
                                              <Chip size="small" label={`Asset : ${data?.workOrderDetail?.serializedAsset?.optionLabel}`} />
                                            </Box>
                                          )}
                                        </div>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Box>
                              );
                            })
                        : [...Array(3).keys()]?.map((data, index) => {
                            return (
                              <Box key={index} className={` ${classes.activitybox}`} style={{ padding: '0' }}>
                                <Skeleton
                                  variant="rect"
                                  animation="wave"
                                  width={'100%'}
                                  height={100}
                                  style={{ borderRadius: 6, backgroundColor: WORKORDER_STATUS_COLOR[key] }}
                                />
                              </Box>
                            );
                          })}
                    </div>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      </Box>
      {serviceOpen && (
        <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
          <CustomDialogHeader
            showRequiredLabel={false}
            title={`${selectedService?.serviceName} Steps`}
            onClose={() => {
              setServiceOpen(false);
              setSelectedService(null);
            }}
            additionalTitle={
              <Box ml={2}>
                <Typography variant="h6" className={`title-layout text-truncate`}>
                  {`Asset : `}
                  {permissions?.serializedAsset?.isRead ? (
                    <a
                      target="_blank"
                      style={{ textDecoration: 'underline', textUnderlineOffset: '5px' }}
                      href={`${routes.serializedAssetDetail.path}/${selectedService?.assetId}`}
                    >
                      {selectedService?.assetNumber}
                    </a>
                  ) : (
                    selectedService?.assetNumber
                  )}
                </Typography>
              </Box>
            }
          ></CustomDialogHeader>
          <Steps
            workOrderId={selectedService?.workOrderId}
            selectedService={selectedService}
            allowedToEdit={selectedService?.status === WORKORDER_TECHNICIAN_SERVICE_STATUS.backlog ? false : true}
            setDisableCompleteFail={() => {}}
            fetchService={fetchWorkOrderTechnician}
            referencType={'workOrderTechnician'}
            handelClose={() => {
              setServiceOpen(false);
              setSelectedService(null);
            }}
          />
        </Dialog>
      )}
    </Box>
  );
};

const getTotalTime = (stepTimes: any) => {
  let totalTimes = 0;
  let shouldTimerRun = stepTimes?.filter((e) => e.status === WORKORDER_SERVICE_STEP_STATUS.start)?.length ? true : false;
  stepTimes.forEach((item) => {
    totalTimes += item?.duration || 0;
    if (item.startDate && item.status === WORKORDER_SERVICE_STEP_STATUS.start) {
      totalTimes += new Date().getTime() - new Date(item?.pauseDate || item?.startDate).getTime();
    }
  });
  stepTimes.forEach((item) => {});
  return { shouldTimerRun, totalTimes };
};

const RenderTotalTime = ({ stepTimes }: any) => {
  const [time, setTime] = useState(null);
  useEffect(() => {
    const { shouldTimerRun, totalTimes } = getTotalTime(stepTimes);
    let interval;
    if (shouldTimerRun) {
      let currentDifference = totalTimes;
      interval = setInterval(() => {
        currentDifference += 1000;
        setTime(convertMsToTime(currentDifference));
      }, 1000);
    } else {
      setTime(convertMsToTime(totalTimes));
    }
    return () => {
      clearInterval(interval);
    };
  }, [stepTimes]);

  if (stepTimes.length === 0) return <></>;
  return (
    <Box
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        border: '1px solid rgba(0, 0, 0, 0.23)',
        backgroundColor: 'transparent',
        padding: '2px 7px',
        borderRadius: '8px'
      }}
    >
      <AccessTimeIcon style={{ marginRight: '3px', color: 'gray', fontSize: '1rem' }} />
      {time}
    </Box>
  );
};

export default WorkOrderTechnician;

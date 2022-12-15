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
import { CustomDialogTransition, WORKORDER_SERVICE_STATUS } from 'src/constants/helpers';
import Steps from '../WorkOrder/Service/Steps';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import RefreshIcon from '@material-ui/icons/Refresh';
import FilterListIcon from '@material-ui/icons/FilterList';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import React from 'react';

const useStyles = makeStyles(() => ({
  activityContainer: {
    padding: '20px 20px 10px 10px'
  },
  activityMainBlock: {
    marginTop: '20Px',
    height: 'calc(100vh - 32vh)',
    overflow: 'auto'
  },
  '.MuiGrid-spacing-xs-1': {
    width: 'calc(100vw + 14px)'
  },
  block: {
    background: '#f0f0f0',
    borderRadius: '4px',
    minHeight: 'calc(100vh - 33.5vh)',
    height: '100%'
  },
  activitybox: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
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
  }
}));

const WorkOrderTechnician = () => {
  const classes = useStyles();
  const [workOrderId, setWorkOrderId] = useState(null);
  const [service, setService] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [repairOrderOptions, setRepairOrderOptions] = useState([]);
  const [selectedRepairOrder, setSelectedRepairOrder] = useState(null);
  const [serviceDetailsShow, setServiceDetailsShow] = useState(false);
  const [servicesShowDialog, setServicesShowDialog] = useState(false);
  const [loadingWO, setLoadingWO] = useState(false);

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

  const [servicesToKeep, setServicesToKeep] = useState(['pending', 'inProgress']);

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
    setLoadingWO(true);
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
        const otherThanPendingData = data?.filter((item) => item.status !== 'Pending');
        const allPending = data
          ?.filter((item) => item.status === 'Pending')
          ?.sort((a, b) => {
            return a.order - b.order;
          });

        const allPendingData = allPending?.map((item, idx) => {
          let d: any = item;
          if (idx > 0 && item?.order !== allPending[0]?.order) {
            d.status = WORKORDER_SERVICE_STATUS.backlog;
          }
          return d;
        });

        const sortedServiceData = [...allPendingData, ...otherThanPendingData]?.sort((a, b) => {
          return a.order - b.order;
        });

        setServiceData(sortedServiceData);
        setLoadingWO(false);
      })
      ?.catch((err) => {
        setLoadingWO(false);
      });
  };
  const getFieldsWithOtherDetails = (steps) => {
    const stepTimes = [];
    steps?.forEach((item) => {
      let obj: any = {};
      obj.startTime = item?.startDate ? new Date(item?.startDate).getTime() : null;
      obj.endTime = item?.endDate ? new Date(item?.endDate).getTime() : null;
      stepTimes.push(obj);
    });

    return stepTimes;
  };
  const handleToggleServices = (key) => {
    if (servicesToKeep.includes(key)) {
      setServicesToKeep(servicesToKeep.filter((k) => k !== key));
    } else {
      setServicesToKeep([...servicesToKeep, key]);
    }
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs routes={[{ title: routes.workOrderTechnician.title }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Fragment>
          <Box className={classes.activityContainer}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
              {servicesShowDialog ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    {workOrderOptions && (
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
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    {repairOrderOptions && (
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
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
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
                  </Grid>
                </Grid>
              ) : (
                <div></div>
              )}

              <Box className={classes.activityContainer} display={'flex'}>
                <Box>
                  <IconButton size="small" onClick={() => setServicesShowDialog(!servicesShowDialog)}>
                    <FilterListIcon />
                  </IconButton>
                </Box>
                <Box ml={1} />
                <Box>
                  <IconButton size="small" onClick={() => fetchWorkOrderTechnician()}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Grid container spacing={2} className={` ${classes.activityMainBlock}`}>
              {Object.keys(WORKORDER_TECHNICIAN_SERVICE_STATUS)
                ?.filter((key) => {
                  return servicesToKeep.includes(key);
                })
                ?.map((key, i) => {
                  return (
                    <Grid item md={3} xs={12} sm={4} style={{ paddingTop: '0px' }} key={i} className={classes.mediumDevice}>
                      <div className={classes.block}>
                        <Box p={1} className="fixedBoardHeader">
                          <Typography variant="subtitle2" style={{ width: '50%' }}>
                            {WORKORDER_SERVICE_STATUS[key]}
                            {' (' + serviceData?.filter((d) => d.status === WORKORDER_SERVICE_STATUS[key]).length + ')'}
                          </Typography>
                        </Box>
                        {!loadingWO
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
                                      setService(tempServiceData);
                                      setWorkOrderId(data?.workOrderDetail?._id);
                                      setServiceDetailsShow(true);
                                    }}
                                    style={{ backgroundColor: WORKORDER_STATUS_COLOR[key] }}
                                    className={` ${classes.activitybox}`}
                                  >
                                    <Box>
                                      <Grid container>
                                        <Grid item xs={11}>
                                          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                            <Box display="flex" mr="10px">
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
                                            <Box>
                                              <Chip size="small" label={data?.workOrderDetail?.workOrderNumber} />
                                            </Box>
                                            {data?.overAllStepStatus && (
                                              <Box ml={1}>
                                                <Chip
                                                  label={data?.overAllStepStatus}
                                                  variant="outlined"
                                                  // color={data?.overAllStepStatus === 'Fail' ? 'default' : 'primary'}
                                                  style={{
                                                    borderColor: data?.overAllStepStatus === 'Fail' ? 'red' : 'green',
                                                    color: data?.overAllStepStatus === 'Fail' ? 'red' : 'green'
                                                  }}
                                                />
                                              </Box>
                                            )}
                                            <Box>
                                              <RenderTotalTime stepTimes={stepTime} />
                                            </Box>
                                          </div>
                                        </Grid>
                                        <Grid item xs={1}></Grid>
                                      </Grid>
                                    </Box>
                                    <Box pt={2}></Box>
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
        </Fragment>
      </CustomContainer>
      {serviceDetailsShow && (
        <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={serviceDetailsShow}>
          <CustomDialogHeader
            showRequiredLabel={false}
            title={`${service?.serviceName} Steps`}
            onClose={() => {
              setServiceDetailsShow(false);
            }}
          ></CustomDialogHeader>
          <Steps
            workOrderId={workOrderId}
            selectedService={service}
            serviceSteps={[]}
            allowedToEdit={true}
            setDisableCompleteFail={() => {}}
            fetchService={fetchWorkOrderTechnician}
            referencType={'workOrderTechnician'}
          />
        </Dialog>
      )}
    </Fragment>
  );
};

// INTERFACES
interface totalTimeInterface {
  stepTimes: stepTimesInterface[];
}
interface stepTimesInterface {
  startTime?: number | null;
  endTime?: number | null;
}
// RETURN TOTAL TIME IN MS AND SHOULD TIME UPDATE, TAKES LIST OF STARTTIME AND END TIME LIST
const getToalTime = (stepTimes: stepTimesInterface[]) => {
  let totalTimes = 0;
  let shouldTimerRun = stepTimes.filter((item) => item.startTime && item.endTime).length !== stepTimes.length;
  stepTimes.forEach((item) => {
    if (item.startTime && item.endTime) {
      totalTimes += item.endTime - item.startTime;
    }
  });
  return { shouldTimerRun, totalTimes };
};

function convertMsToTime(milliseconds) {
  milliseconds = Math.abs(milliseconds);

  function padTo2Digits(num) {
    num = num - Math.floor(num) !== 0 ? num.toFixed(1) : num;
    return num.toString().padStart(2, '0');
  }
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  let time = '';

  if (hours === 0) {
    time = `00:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
  }
  if (hours === 0 && minutes === 0) {
    time = `00:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
  }
  if (hours > 0 && hours < 24) {
    time = `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
  }
  if (hours >= 24) {
    time = `${padTo2Digits(hours / 24)}d`;
  }
  return time;
}

// RENDER TOTAL TIME COMPONENT
const RenderTotalTime = ({ stepTimes }: totalTimeInterface) => {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const { shouldTimerRun, totalTimes } = getToalTime(stepTimes);
    if (shouldTimerRun) {
      let currentDifference = totalTimes;
      const interval = setInterval(() => {
        currentDifference += 1000;
        setTime(convertMsToTime(currentDifference));
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    } else {
      setTime(convertMsToTime(totalTimes));
    }
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

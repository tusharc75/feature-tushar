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
import { convertMsToTime, CustomDialogTransition, QUOTATION_STATUS, REPAIR_ORDER_TYPE, WORKORDER_SERVICE_STATUS, WORKORDER_SERVICE_STEP_STATUS } from 'src/constants/helpers';
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
    let api = selectedWorkOrder && selectedRepairOrder
      ? `/work-order-technician?workOrder=${selectedWorkOrder.optionValue}&repairOrder=${selectedRepairOrder.optionValue}`
      : selectedWorkOrder
        ? `/work-order-technician?workOrder=${selectedWorkOrder.optionValue}`
        : selectedRepairOrder
          ? `/work-order-technician?repairOrder=${selectedRepairOrder.optionValue}`
          : `/work-order-technician`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        const otherThanPendingData = data?.filter((item) => item.status !== WORKORDER_SERVICE_STATUS.pending);
        var allPendingData: any = [];

        const workOrders: any = []
        data?.filter((e) => e.status === WORKORDER_SERVICE_STATUS.pending).forEach(item => {
          if (!workOrders?.find((e) => e._id === item?.workOrderDetail?._id)) {
            workOrders.push({
              _id: item?.workOrderDetail?._id,
              type: item?.workOrderDetail?.repairOrder?.type,
              quotationStatus: item?.workOrderDetail?.repairOrder?.quotationStatus
            })
          }
        });

        workOrders?.forEach((item) => {
          const services = data?.filter((e) => e.status === WORKORDER_SERVICE_STATUS.pending && e?.workOrderDetail?._id === item?._id)?.sort((a, b) => {
            return a.order - b.order;
          });
          if (services?.length) {
            const firstOrderService = services?.filter((e) => e.order === services[0]?.order)
            const restOrderService = services?.filter((e) => e.order !== services[0]?.order)

            if (firstOrderService?.length) {
              if (item?.type === REPAIR_ORDER_TYPE.internal || firstOrderService[0]?.service?.preWork === true
                || (firstOrderService[0]?.service?.preWork === false && item?.quotationStatus === QUOTATION_STATUS.acceptByCustomer)) {
                firstOrderService?.forEach((s) => {
                  allPendingData.push(s);
                })
              }
              else {
                firstOrderService?.forEach((s) => {
                  allPendingData.push({ ...s, status: WORKORDER_SERVICE_STATUS.backlog });
                })
              }
            }
            restOrderService?.forEach((s) => {
              allPendingData.push({ ...s, status: WORKORDER_SERVICE_STATUS.backlog });
            })
          }
        })
        setServiceData([...allPendingData, ...otherThanPendingData]);
        setLoadingWO(false);
      })
      ?.catch((err) => {
        setLoadingWO(false);
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
                                    if (data.status !== WORKORDER_SERVICE_STATUS.backlog) {
                                      tempServiceData['uniqueId'] = data?._id;
                                      tempServiceData['status'] = data?.status;
                                      tempServiceData['assetNumber'] = data?.workOrderDetail?.serializedAsset?.optionLabel
                                      setService(tempServiceData);
                                      setWorkOrderId(data?.workOrderDetail?._id);
                                      setServiceDetailsShow(true);
                                    }
                                  }}
                                  style={{
                                    backgroundColor: `${data.status === WORKORDER_SERVICE_STATUS.pending ? "#FFFFE0" :
                                      data.status === WORKORDER_SERVICE_STATUS.inProgress ? "#FFD580" :
                                        data?.serviceStatus ? data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.passed ? '#E9FFE8' : '#FFE9EA' : "white"}`,
                                    cursor: `${data.status === WORKORDER_SERVICE_STATUS.backlog ? 'not-allowed' : 'pointer'}`
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
                                              <Chip
                                                label={data?.serviceStatus}
                                                variant="outlined"
                                                color={'primary'}
                                              />
                                            </Box>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', paddingTop: "10px" }}>
                                          <Box>
                                            <Chip size="small" label={data?.workOrderDetail?.workOrderNumber} />
                                          </Box>
                                          {data?.workOrderDetail?.serializedAsset?.optionLabel &&
                                            <Box ml={1}>
                                              <Chip size="small" label={data?.workOrderDetail?.serializedAsset?.optionLabel} />
                                            </Box>
                                          }
                                        </div>
                                      </Grid>
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
            title={`${service?.serviceName} Steps [${service?.assetNumber}]`}
            onClose={() => {
              setServiceDetailsShow(false);
            }}
          ></CustomDialogHeader>
          <Steps
            workOrderId={workOrderId}
            selectedService={service}
            serviceSteps={[]}
            allowedToEdit={true}
            setDisableCompleteFail={() => { }}
            fetchService={fetchWorkOrderTechnician}
            referencType={'workOrderTechnician'}
            handelClose={() => {
              setServiceDetailsShow(false);
            }}
          />
        </Dialog>
      )}
    </Fragment>
  );
};

const getTotalTime = (stepTimes: any) => {
  let totalTimes = 0;
  let shouldTimerRun = stepTimes?.filter((e) => e.status === WORKORDER_SERVICE_STEP_STATUS.start)?.length ? true : false;
  stepTimes.forEach((item) => {
    totalTimes += item?.duration || 0;
    if (item.startDate && item.status === WORKORDER_SERVICE_STEP_STATUS.start) {
      totalTimes += (new Date().getTime() - new Date(item?.pauseDate || item?.startDate).getTime());
    }
  });
  stepTimes.forEach((item) => {
  });
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

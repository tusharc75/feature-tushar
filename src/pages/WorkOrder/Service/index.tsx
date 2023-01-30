import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {
  convertMsToTime,
  QUOTATION_STATUS,
  repairOrder,
  REPAIR_ORDER_TYPE,
  workOrder,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_SERVICE_STEP_STATUS,
  WORK_ORDER_STATUS
} from 'src/constants/helpers';
import { Badge, Box, Chip, Dialog, Divider, Grid, IconButton, Menu, MenuItem, Paper, TextField, useMediaQuery } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import Steps from './Steps';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import Quotation from '../Quotation';
import AssignUserDialog from './AssignUserDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import { GrDrag } from 'react-icons/gr';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import PeopleIcon from '@material-ui/icons/People';
import ConsumablesDialog from '../Consumables/ConsumablesDialog';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { useData } from 'src/StateProvider/Provider';
import Logs from './Logs';
import CompleteDialog from './CompleteDialog';
import { Tabs, Tab } from './Tabs';
import styles from './index.module.scss';
import { IoMdArrowDropup, IoMdArrowDropdown } from 'react-icons/io';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import FormatQuoteIcon from '@material-ui/icons/FormatQuote';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import { PreWorkIcon, PostWorkIcon } from 'src/assets/svg/svgIcons';
import { reverse } from 'lodash';

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

const Service = ({ workOrderId, allowedToEdit, workOrderData, completed, fetchWorkOrderData }) => {

  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      user: { user }, permissions
    }
  } = useData();
  const [serviceSteps, setServiceSteps] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [serviceDialog, setServiceDialog] = useState({ open: false, uniqueId: null, preWork: null });
  const [arrangeView, setArrangeView] = useState(false);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [logsDialog, setLogsDialog] = useState(false);
  const [isColapsed, setIsColapsed] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');
  const [disableCompleteFail, setDisableCompleteFail] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [bottomBarOpen, setBottomBarOpen] = useState(false);
  const [assignSteps, setAssignSteps] = useState(false);
  const [quotationData, setQuotationData] = useState(null);

  useEffect(() => {
    fetchRepairOrderData();
  }, []);

  const fetchRepairOrderData = async () => {

    var quotation: any = null;
    var isQuotation: any = false;


    if (workOrderData.type === 'Repair Order' && workOrderData?.repairOrder?.optionValue) {

      const repairOrderResponse = await axiosInstance().get(`${repairOrder.api}/${workOrderData?.repairOrder?.optionValue}`);
      const repairOrderData: any = repairOrderResponse?.data?.data;

      if (repairOrderData?.type === REPAIR_ORDER_TYPE.external) {
        isQuotation = true;
        const quotationResponse = await axiosInstance().get(`${repairOrder.api}/${workOrderData?.repairOrder?.optionValue}/check/quotation`);
        if (quotationResponse?.data?.data) {
          let keys = Object.keys(quotationResponse?.data?.data?.versions);
          if (keys?.length) {
            const version = quotationResponse?.data?.data?.versions[parseInt(keys[keys.length - 1])];
            quotation = {
              _id: quotationResponse?.data?.data?._id,
              versionId: version?._id,
              quotationNumber: quotationResponse?.data?.data?.quotationNumber,
              status: version?.status
            };
            setQuotationData(quotation);
          }
        }
      }
    }

    const stepDataResponse = await axiosInstance().get(`${workOrder.api}/${workOrderId}/steps-data`);
    setServiceData(stepDataResponse?.data?.data || []);

    const serviceDataResponse = await axiosInstance().get(`${routes.workOrder.path}/service/${workOrderId}`);
    const data: any = serviceDataResponse?.data?.data;

    if (data?.length) {

      data?.forEach((e) => { e.type = 'service' });
      const preWorkService = data?.filter((e) => e.preWork)?.sort((a, b) => (a.order > b.order ? 1 : -1));
      const postWorkService = data?.filter((e) => !e.preWork)?.sort((a, b) => (a.order > b.order ? 1 : -1));
      const quote = [{ _id: 'quotation', uniqueId: 'quotation', order: 9999, type: 'quotation', serviceName: 'Quote to Customer' }];
      const services = isQuotation ? [...preWorkService, ...quote, ...postWorkService] : [...preWorkService, ...postWorkService];

      if (services?.length) {
        let pendingServiceIndex = services?.findIndex((d) => d.status === WORKORDER_SERVICE_STATUS.inProgress);
        if (pendingServiceIndex === -1) {
          let tempServiceSortedArray = reverse([...services]);
          pendingServiceIndex = tempServiceSortedArray.findIndex((d) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(d.status));
          if (pendingServiceIndex === -1) {
            pendingServiceIndex = services.findIndex((d) => d.status === WORKORDER_SERVICE_STATUS.pending);
          }
          else {
            pendingServiceIndex = (services?.length - pendingServiceIndex);
            if (services[pendingServiceIndex]?.type === 'quotation') {
              pendingServiceIndex = pendingServiceIndex + 1;
            }
          }
        }
        pendingServiceIndex = pendingServiceIndex > -1 ? pendingServiceIndex : 0;
        const order = services[pendingServiceIndex]?.order;
        services?.forEach((element, index) => {
          if (element?.type === "service") {
            if (element.order === order || index <= pendingServiceIndex) {
              if (!completed && (allowedToEdit || (element?.assignedUsers?.some((u: any) => u?.optionValue === user?._id) && permissions?.workOrder?.isUpdate))) {
                element.clickable = true;
              }
              else {
                element.clickable = false;
              }
            }
            else {
              element.clickable = false;
            }
          }
        })
        if (isQuotation) {
          if ((quotation && quotation?.status === QUOTATION_STATUS.acceptByCustomer)) {
          }
          else {
            services?.forEach((element) => {
              if (!element?.preWork) {
                element.clickable = false;
              }
            })
          }
        }
        if (selectedService) {
          setSelectedService(services?.find((e) => e?.uniqueId === selectedService?.uniqueId) || null);
        }
        else {
          setSelectedService(services[pendingServiceIndex]);
        }
      }
      setServiceSteps(services);
      if ((services.filter((e) => e.type === 'service'
        && e.status === WORKORDER_SERVICE_STATUS.completed)?.length === services.filter((e) => e.type === 'service')?.length)
        && workOrderData?.status !== WORK_ORDER_STATUS.completed) {
        fetchWorkOrderData()
      }
    } else {
      setServiceSteps([]);
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const handleArrangeUpdate = (rows: any[]) => {
    rows?.forEach((e: any) => {
      delete e.name;
      delete e.preWork;
    });
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/order`, { data: rows || [] })
      .then(({ data }) => {
        fetchRepairOrderData();
        setArrangeView(false);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const updateServiceStatus = (uniqueId, status) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${uniqueId}/status`, { status, comment })
      .then(({ data: { data } }) => {
        fetchRepairOrderData();
        if (openCompleteDialog) {
          setOpenCompleteDialog(false);
        }
        setComment('');
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        if (openCompleteDialog) {
          setOpenCompleteDialog(false);
        }
      });
  };

  const handleAddService = (ids, uniqueId) => {
    const data: any = {};
    data.serviceIds = ids;
    if (uniqueId) {
      data.aboveServiceUniqueId = uniqueId;
    }
    axiosInstance()
      .post(`${workOrder.api}/service/${workOrderId}`, data)
      .then(() => {
        if ([QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer]?.includes(quotationData?.status)) {
          createNewVersionQuote();
        } else {
          fetchRepairOrderData();
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleRemoveService = (id) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/remove`, {
        uniqueIds: [id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        if ([QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.rejectByCustomer]?.includes(quotationData?.status)) {
          createNewVersionQuote();
        } else {
          fetchRepairOrderData();
        }
        if (id === selectedService?.uniqueId) {
          setSelectedService(null);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const createNewVersionQuote = () => {
    axiosInstance()
      .put(`/repair-order/${workOrderData?.repairOrder?.optionValue}/quotation/clone-version`)
      .then(() => {
        fetchRepairOrderData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleColapse = () => {
    setIsColapsed((prev) => !prev);
  };

  useEffect(() => {
    if (mobScreen) {
      setIsColapsed(false);
    }
  }, [mobScreen]);


  const stylesForEveryTab = (selectedService, data) => {
    if (data?.type === 'quotation' && selectedService?.type !== 'quotation') {
      return {
        borderColor: 'rgb(224, 224, 224)',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor:
          quotationData?.status === QUOTATION_STATUS.acceptByCustomer
            ? '#E9FFE8'
            : quotationData?.status === QUOTATION_STATUS.rejectByCustomer
              ? '#FFE9EA'
              : 'white',
        cursor: 'pointer',
        borderRadius: '3px'
      };
    } else if (data?.type === 'quotation' && selectedService?.type === 'quotation') {
      return {
        borderColor: '#329592',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor:
          quotationData?.status === QUOTATION_STATUS.acceptByCustomer
            ? '#E9FFE8'
            : quotationData?.status === QUOTATION_STATUS.rejectByCustomer
              ? '#FFE9EA'
              : 'white',
        cursor: 'pointer',
        boxShadow: 'rgb(0 0 0 / 21%) 0px 25px 20px -20px',
        borderRadius: '3px'
      };
    } else if (!data?.clickable) {
      return {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(25, 24, 24, 0.19)',
        backgroundColor:
          data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.passed
            ? '#E9FFE8'
            : data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.failed
              ? '#FFE9EA'
              : 'white',
        cursor: allowedToEdit ? 'pointer' : 'not-allowed',
        PointerEvent: 'none',
        opacity: '.5'
      };
    }
    if (selectedService?.uniqueId == data?.uniqueId) {
      return {
        borderColor: '#329592',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor:
          data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.passed
            ? '#E9FFE8'
            : data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.failed
              ? '#FFE9EA'
              : 'white',
        cursor: 'pointer',
        boxShadow: 'rgb(0 0 0 / 21%) 0px 25px 20px -20px',
        borderRadius: '3px'
      };
    } else {
      return {
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor:
          data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.passed
            ? '#E9FFE8'
            : data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.failed
              ? '#FFE9EA'
              : 'white',
        borderColor: 'rgb(224, 224, 224)',
        cursor: 'pointer'
      };
    }
  };

  const handleAddStep = (values: any) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-step`, values)
      .then(({ data }) => {
        const temp = selectedService;
        setSelectedService(null);
        setSelectedService(temp);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setAssignSteps(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getFieldsWithOtherDetails = (step: any, serviceData) => {
    const steps = serviceData?.filter((item: any) => item?.uniqueId === step?.uniqueId);
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

  const isAllowedToServiceEdit = !completed && (allowedToEdit || (selectedService?.assignedUsers?.some((u: any) => u?.optionValue === user?._id) && permissions?.workOrder?.isUpdate));

  return (
    <Box>
      {serviceSteps ? (
        <Grid container spacing={2}>
          {!mobScreen ? (
            <Grid
              item
              xs={12}
              sm={5}
              md={4}
              lg={3}
              style={{
                maxWidth: isColapsed ? '76px' : mobScreen ? '100%' : '',
                flexBasis: isColapsed ? '76px' : mobScreen ? '100%' : '',
                transition: 'width 300ms ease 0s, max-width 300ms ease 0s, flex-basis 300ms ease 0s'
              }}
            >
              <Box mb={1} display="flex" style={{ flexWrap: 'wrap', justifyContent: isColapsed ? 'space-around' : 'flex-end' }}>
                {!isColapsed && (
                  <>
                    <Box>
                      <Button
                        disabled={allowedToEdit && !completed ? false : true}
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => setServiceDialog({ open: true, uniqueId: null, preWork: null })}
                      >
                        Add Services
                      </Button>
                    </Box>
                    {serviceSteps?.length > 0 && (
                      <Box marginX={2}>
                        <Button
                          disabled={allowedToEdit && !completed ? false : true}
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => setArrangeView(true)}>
                          <GrDrag fontSize="small" color="primary" className="mr-1" />
                          Arrange
                        </Button>
                      </Box>
                    )}
                  </>
                )}
                {mobScreen || (
                  <IconButton size={'small'} onClick={handleColapse}>
                    {isColapsed ? <ArrowForwardIosIcon /> : <ArrowBackIosIcon />}
                  </IconButton>
                )}
              </Box>
              <Box
                sx={{ height: mobScreen ? 'unset' : 'calc(100vh - 300px)', display: { xs: 'flex', sm: 'block' } }}
                style={{
                  overflowX: mobScreen ? 'auto' : 'hidden',
                  overflowY: mobScreen ? 'hidden' : 'auto',
                  marginBottom: mobScreen ? '20px' : '0px'
                }}
              >
                <Grid
                  container
                  spacing={2}
                  style={{
                    flexDirection: mobScreen ? 'column' : 'row'
                  }}
                >
                  {serviceSteps?.map((data, index) => {
                    const style = stylesForEveryTab(selectedService, data);
                    const stepTimes = getFieldsWithOtherDetails(data, serviceData);
                    return (
                      <Grid item xs={12} key={index}>
                        <Box
                          style={{
                            ...style,
                            transition: '.3s'
                          }}
                          p={2}
                          onClick={() => {
                            if (data?.type === 'service') {
                              setSelectedService(data);
                            }
                          }}
                        >
                          <Grid container>
                            <Grid item xs={10}>
                              <Box
                                display="flex"
                                style={{
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                  position: 'relative',
                                  paddingLeft: !isColapsed && data?.type !== 'quotation' ? '20px' : '',
                                  gap: '5px'
                                }}
                              >
                                {data?.type === 'service' ? (
                                  <Box
                                    style={{
                                      backgroundColor: 'var(--primary)',
                                      color: 'white',
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      lineHeight: '21px',
                                      textAlign: 'center',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px',
                                      flexShrink: 0,
                                      top: '4px',
                                      left: 0
                                    }}
                                    sx={{ position: !isColapsed ? 'absolute' : '' }}
                                  >
                                    <span>{data?.order}</span>
                                  </Box>
                                ) : (
                                  data?.type === 'quotation' && <FormatQuoteIcon />
                                )}
                                {!isColapsed && (
                                  <>
                                    <Box ml={'10px'}>
                                      <Typography>{data?.serviceName}</Typography>
                                    </Box>
                                    {data?.type === 'service' && (
                                      <Box ml={1}>
                                        {data?.preWork ? (
                                          <HtmlTooltip title="Pre Work Service">
                                            <span>
                                              <PreWorkIcon style={{ verticalAlign: 'middle' }} />
                                            </span>
                                          </HtmlTooltip>
                                        ) : (
                                          <HtmlTooltip title="Post Work Service">
                                            <span>
                                              <PostWorkIcon style={{ verticalAlign: 'middle' }} />
                                            </span>
                                          </HtmlTooltip>
                                        )}
                                      </Box>
                                    )}
                                    {data?.type === 'service' && data?.serviceStatus && (
                                      <Box ml={1}>
                                        <Chip
                                          label={data?.serviceStatus}
                                          variant="outlined"
                                          color={data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.passed ? 'default' : 'primary'}
                                          style={{
                                            borderColor: data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.failed ? 'red' : 'green',
                                            color: data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.failed ? 'red' : 'green'
                                          }}
                                        />
                                      </Box>
                                    )}
                                    {data?.type === 'service' && (
                                      <Box ml={1}>
                                        <Chip label={data?.status} variant="outlined" color="primary" />
                                      </Box>
                                    )}
                                    {data?.type === 'service' && data?.assignedUsers?.length > 0 && (
                                      <Box ml={1}>
                                        <HtmlTooltip title={data?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
                                          <PeopleIcon />
                                        </HtmlTooltip>
                                      </Box>
                                    )}
                                    {data?.type === 'quotation' && quotationData && (
                                      <Box ml={1}>
                                        <Chip label={`Status : ${quotationData?.status}`} variant="outlined" color="primary" />
                                      </Box>
                                    )}
                                    <RenderTotalTime stepTimes={stepTimes} />
                                  </>
                                )}
                              </Box>
                            </Grid>
                            {!isColapsed && (
                              <>
                                {data?.type === 'service' && (
                                  <Grid item xs={2} container justify="flex-end">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      aria-label="delete"
                                      disabled={!isAllowedToServiceEdit}
                                      onClick={(event) => {
                                        handleOpenMenu(event);
                                        setSelectedService(data);
                                      }}
                                    >
                                      <MoreHorizIcon />
                                    </IconButton>
                                  </Grid>
                                )}
                              </>
                            )}
                          </Grid>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Grid>
          ) : (
            <Box className={styles.bottomBar} style={{ bottom: bottomBarOpen ? '0' : '-60px' }}>
              <div className={styles.control}>
                <button onClick={() => setBottomBarOpen((prev) => !prev)}>{bottomBarOpen ? <IoMdArrowDropdown /> : <IoMdArrowDropup />}</button>
              </div>
              <Box>
                <Tabs aria-label="scrollable Tabs">
                  {serviceSteps?.map((data, index) => {
                    let isTechnician = data?.assignedUsers?.some((u: any) => u?.optionValue === user?._id);
                    const style = stylesForEveryTab(selectedService, data);
                    return (Boolean(allowedToEdit || isTechnician) && (
                      <Tab
                        key={index}
                        content={
                          <Box
                            style={{
                              ...style,
                              transition: '.3s',
                              borderRadius: '20px',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '5px 8px'
                            }}
                            onClick={() => {
                              if (data?.type === 'service') {
                                setSelectedService(data);
                              }
                            }}
                          >
                            <Box style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {data?.type === 'service' ? (
                                <Box
                                  style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    lineHeight: '18px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    flexShrink: 0,
                                    top: '4px',
                                    left: 0
                                  }}
                                >
                                  <span>{data?.order}</span>
                                </Box>
                              ) : (
                                <div style={{ width: '18px', height: '18px' }}>{data?.type === 'quotation' && <FormatQuoteIcon />}</div>
                              )}
                              <Box>
                                <Typography style={{ fontSize: '12px', fontWeight: '600', lineHeight: '1.2' }}> {data?.serviceName}</Typography>
                                {data?.type === 'service' && (
                                  <Typography style={{ fontSize: '11px', lineHeight: '1.2' }}>{data?.status}</Typography>
                                )}
                                {data?.type === 'quotation' && quotationData && (
                                  <>
                                    <Typography style={{ fontSize: '11px', lineHeight: '1.2' }}>{`Status : ${quotationData?.status}`}</Typography>
                                  </>
                                )}
                                <Box display={'flex'} style={{ gap: '10px', flexWrap: 'wrap' }}>
                                  {data?.type === 'service' &&
                                    (data?.preWork ? (
                                      <HtmlTooltip title="Pre Work Service">
                                        <span>
                                          <PreWorkIcon style={{ verticalAlign: 'middle' }} />
                                        </span>
                                      </HtmlTooltip>
                                    ) : (
                                      <HtmlTooltip title="Post Work Service">
                                        <span>
                                          <PostWorkIcon style={{ verticalAlign: 'middle' }} />
                                        </span>
                                      </HtmlTooltip>
                                    ))}
                                  {data?.type === 'service' && data?.assignedUsers?.length > 0 && (
                                    <HtmlTooltip title={data?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
                                      <PeopleIcon style={{ width: '15px', height: '15px' }} />
                                    </HtmlTooltip>
                                  )}
                                </Box>
                              </Box>
                              {data?.type === 'service' ? (
                                <IconButton
                                  style={{ width: '18px', height: '25px' }}
                                  size="small"
                                  color="primary"
                                  aria-label="delete"
                                  disabled={!isAllowedToServiceEdit}
                                  onClick={(event) => {
                                    handleOpenMenu(event);
                                    setSelectedService(data);
                                  }}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              ) : (
                                <div style={{ width: '18px', height: '25px' }}></div>
                              )}
                            </Box>
                          </Box>
                        }
                      ></Tab>
                    )
                    );
                  })}
                </Tabs>
              </Box>
              <Box my={2} display="flex" style={{ flexWrap: 'wrap', justifyContent: isColapsed ? 'space-around' : 'flex-end' }}>
                {!isColapsed && (
                  <>
                    <Box marginX={2}>
                      <Button
                        variant="outlined"
                        color="primary"
                        disabled={!allowedToEdit}
                        size="small"
                        onClick={() => setServiceDialog({ open: true, uniqueId: null, preWork: null })}
                      >
                        Add Services
                      </Button>
                    </Box>
                    {serviceSteps?.length > 0 && (
                      <Box>
                        <Button disabled={!allowedToEdit} variant="outlined" color="primary" size="small" onClick={() => setArrangeView(true)}>
                          <GrDrag fontSize="small" color="primary" className="mr-1" />
                          Arrange
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}
          {anchorEl && (
            <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
              {allowedToEdit && (
                <MenuItem
                  disabled={!allowedToEdit}
                  onClick={() => {
                    setUserAssignDialog(true);
                    setAnchorEl(null);
                  }}
                >
                  Assign Technicians
                </MenuItem>
              )}
              <MenuItem
                disabled={!allowedToEdit}
                onClick={() => {
                  setServiceDialog({ open: true, uniqueId: selectedService.uniqueId, preWork: selectedService.preWork });
                  setAnchorEl(null);
                }}
              >
                Add Services
              </MenuItem>
              <MenuItem
                disabled={!allowedToEdit || [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(selectedService?.status)}
                onClick={() => {
                  setAssignSteps(true);
                  setAnchorEl(null);
                }}
              >
                Add Step
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setConsumablesDialog(true);
                  setAnchorEl(null);
                }}
              >
                Consume Products
              </MenuItem>
              <MenuItem
                disabled={
                  disableCompleteFail || [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(selectedService?.status)
                }
                onClick={() => {
                  updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.completed);
                  setAnchorEl(null);
                }}
              >
                Complete
              </MenuItem>
              {/* <MenuItem
                disabled={
                  disableCompleteFail || [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(selectedService?.status)
                }
                onClick={() => {
                  updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.failed);
                  setAnchorEl(null);
                }}
              >
                Fail
              </MenuItem> */}
              <MenuItem
                disabled={!allowedToEdit || selectedService?.status === WORKORDER_SERVICE_STATUS.pending ? false : true}
                onClick={() => {
                  handleRemoveService(selectedService?.uniqueId);
                  setAnchorEl(null);
                }}
              >
                Remove
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setLogsDialog(true);
                  setAnchorEl(null);
                }}
              >
                Logs
              </MenuItem>
            </Menu>
          )}
          <Grid
            item
            xs={12}
            sm={7}
            md={8}
            lg={9}
            style={{
              maxWidth: isColapsed ? 'calc(100% - 76px)' : mobScreen ? '100%' : '',
              flexBasis: isColapsed ? 'calc(100% - 76px)' : mobScreen ? '100%' : '',
              transition: 'width 300ms ease 0s, max-width 300ms ease 0s, flex-basis 300ms ease 0s'
            }}
          >
            {selectedService && (
              <Box>
                {selectedService?.type === 'service' ? (
                  allowedToEdit || (selectedService?.assignedUsers?.length > 0 && selectedService?.assignedUsers?.map((u) => u?.optionValue).includes(user?._id)) ? (
                    <Steps
                      workOrderId={workOrderId}
                      selectedService={selectedService}
                      serviceSteps={serviceSteps}
                      allowedToEdit={isAllowedToServiceEdit && selectedService?.clickable}
                      setDisableCompleteFail={setDisableCompleteFail}
                      fetchService={fetchRepairOrderData}
                    />
                  ) : (
                    <Box textAlign="center">
                      <p>No services</p>
                    </Box>
                  )
                ) : (
                  <Quotation />
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {userAssignDialog && (
        <AssignUserDialog
          workOrderData={[
            {
              uniqueId: selectedService?.uniqueId,
              workOrderId: workOrderId
            }
          ]}
          assignedUsers={selectedService?.assignedUsers}
          handleClose={() => {
            setUserAssignDialog(false);
          }}
          handleSucess={() => {
            setUserAssignDialog(false);
            fetchRepairOrderData();
          }}
        />
      )}
      {serviceDialog.open && (
        <AssignServiceDialog
          reference="workorder"
          referenceId={workOrderId}
          handleClose={() => setServiceDialog({ open: false, uniqueId: null, preWork: null })}
          ids={[]}
          onSuccess={(data) => {
            handleAddService(
              data?.map((e) => e.service),
              serviceDialog.uniqueId
            );
            setServiceDialog({ open: false, uniqueId: null, preWork: null });
          }}
          extraStaticFilter={serviceDialog.preWork === null ? [] : [{ field: 'preWork', term: serviceDialog.preWork }]}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            serviceSteps
              ?.filter((e) => e.type === 'service')
              ?.map((d) => {
                return { _id: d?.uniqueId, name: d?.serviceName, order: d?.order, preWork: d?.preWork };
              }) || []
          }
          title={'Arrange'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={handleArrangeUpdate}
          loading={false}
        />
      )}
      {consumablesDialog && (
        <ConsumablesDialog
          onSuccess={() => {
            setConsumablesDialog(false);
            fetchRepairOrderData();
          }}
          handleClose={() => {
            setConsumablesDialog(false);
          }}
          workOrderId={workOrderId}
          from={'service'}
        />
      )}
      {logsDialog && (
        <Logs
          workOrderId={workOrderId}
          serviceId={selectedService?._id}
          uniqueId={selectedService?.uniqueId}
          serviceName={selectedService?.serviceName}
          handleClose={() => {
            setLogsDialog(false);
          }}
        />
      )}
      {openCompleteDialog && (
        <CompleteDialog
          serviceName={selectedService?.serviceName}
          comment={comment}
          setComment={setComment}
          updateStatus={() => updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.completed)}
          handleClose={() => {
            setComment('');
            setOpenCompleteDialog(false);
          }}
        />
      )}
      {assignSteps && (
        <StepDialog
          handleClose={() => {
            setAssignSteps(false);
          }}
          handleSucess={(data) => {
            handleAddStep(data);
          }}
          stepId={''}
          steps={selectedService?.steps}
          reference={'workOrder'}
          workOrderId={workOrderId}
          serviceId={selectedService?._id}
          uniqueId={selectedService?.uniqueId}
        />
      )}
    </Box>
  );
};

export default Service;



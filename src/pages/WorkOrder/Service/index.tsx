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
import { Badge, Box, Chip, Dialog, Divider, Grid, IconButton, Menu, MenuItem, Paper, TextField, Tooltip, useMediaQuery } from '@material-ui/core';
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
import Comments from './Comments';
import CompleteDialog from './CompleteDialog';
import { Tabs, Tab } from './Tabs';
import styles from './index.module.scss';
import { IoMdArrowDropup, IoMdArrowDropdown } from 'react-icons/io';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import FormatQuoteIcon from '@material-ui/icons/FormatQuote';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import { PreWorkIcon, PostWorkIcon } from 'src/assets/svg/svgIcons';
import { isArray, reverse } from 'lodash';
import AttachmentDialog from './AttachmentDialog';
import ManagePurchaseOrder from 'src/pages/PurchaseOrder/ManagePurchaseOrder';
import { AiFillCheckCircle, AiFillExclamationCircle } from 'react-icons/ai';
import { PassIcon, FailIcon } from 'src/assets/svg/svgIcons';

const getTotalTime = (stepTimes: any) => {
  let totalTimes = 0;
  let shouldTimerRun = stepTimes?.filter((e) => e.status === WORKORDER_SERVICE_STEP_STATUS.start)?.length ? true : false;
  stepTimes.forEach((item) => {
    totalTimes += item?.duration || 0;
    if (item.startDate && item.status === WORKORDER_SERVICE_STEP_STATUS.start) {
      totalTimes += new Date().getTime() - new Date(item?.pauseDate || item?.startDate).getTime();
    }
  });
  stepTimes.forEach((item) => { });
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
        fontWeight: 500,
        fontSize: '14px',
        lineHeight: '10px',
        color: '#8B8B8B'
      }}
    >
      <AccessTimeIcon style={{ marginRight: '3px', color: 'gray', fontSize: '1rem' }} />({time})
    </Box>
  );
};

const Service = ({ workOrderId, allowedToEdit, workOrderData, completed, fetchWorkOrderData }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();
  const [serviceSteps, setServiceSteps] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [serviceDialog, setServiceDialog] = useState({ open: false, uniqueId: null, preWork: null });
  const [arrangeView, setArrangeView] = useState(false);
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
  const [logsDialog, setLogsDialog] = useState(false);
  const [commentsDialog, setCommentsDialog] = useState(false);
  const [showManagePurchaseOrder, setShowManagePurchaseOrder] = useState(false);
  const [isColapsed, setIsColapsed] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');
  const [disableCompleteFail, setDisableCompleteFail] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [bottomBarOpen, setBottomBarOpen] = useState(false);
  const [assignSteps, setAssignSteps] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [attchmentsDialog, setAttchmentsDialog] = useState({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });

  useEffect(() => {
    fetchServiceData();
  }, [workOrderData]);

  const fetchServiceData = async () => {
    var quotation: any = null;
    var isQuotation: any = false;

    if (workOrderData.type === 'Repair Order' && workOrderData?.repairOrder?.optionValue) {
      const repairOrderResponse = await axiosInstance().get(`${repairOrder.api}/${workOrderData?.repairOrder?.optionValue}`);
      const repairOrderData: any = repairOrderResponse?.data?.data;

      if (repairOrderData?.addQuotationStep) {
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
      data?.forEach((e) => {
        e.type = 'service';
      });
      const preWorkService = data?.filter((e) => e.preWork)?.sort((a, b) => (a.order > b.order ? 1 : -1));
      const postWorkService = data?.filter((e) => !e.preWork)?.sort((a, b) => (a.order > b.order ? 1 : -1));
      const quote = [{ _id: 'quotation', uniqueId: 'quotation', order: 9999, type: 'quotation', serviceName: 'Quote to Customer' }];
      const services = isQuotation ? [...preWorkService, ...quote, ...postWorkService] : [...preWorkService, ...postWorkService];

      if (services?.length) {
        let pendingServiceIndex = services?.findIndex((d) => d.status === WORKORDER_SERVICE_STATUS.inProgress);
        if (pendingServiceIndex === -1) {
          let tempServiceSortedArray = reverse([...services]);
          pendingServiceIndex = tempServiceSortedArray.findIndex((d) =>
            [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(d.status)
          );
          if (pendingServiceIndex === -1) {
            pendingServiceIndex = services.findIndex((d) => d.status === WORKORDER_SERVICE_STATUS.pending);
          } else {
            pendingServiceIndex = services?.length - pendingServiceIndex;
            if (services[pendingServiceIndex]?.type === 'quotation') {
              pendingServiceIndex = pendingServiceIndex + 1;
            }
          }
        }
        pendingServiceIndex = pendingServiceIndex > -1 ? pendingServiceIndex : 0;
        const order = services[pendingServiceIndex]?.order;
        services?.forEach((element, index) => {
          if (user?.brandPolicy?.workOrderServiceSequence) {
            if (element?.type === 'service') {
              if (element.order === order || index <= pendingServiceIndex) {
                if (
                  !completed &&
                  (allowedToEdit || (element?.assignedUsers?.some((u: any) => u?.optionValue === user?._id) && permissions?.workOrder?.isUpdate))
                ) {
                  element.clickable = true;
                } else {
                  element.clickable = false;
                }
              } else {
                element.clickable = false;
              }
            }
          } else {
            element.clickable = true;
          }
        });

        if (isQuotation) {
          if (quotation && quotation?.status === QUOTATION_STATUS.acceptByCustomer) {
          } else {
            services?.forEach((element) => {
              if (!element?.preWork) {
                element.clickable = false;
              }
            });
          }
        }
        if (selectedService) {
          setSelectedService(services?.find((e) => e?.uniqueId === selectedService?.uniqueId) || null);
        } else {
          setSelectedService(services[pendingServiceIndex]);
        }
      }
      setServiceSteps(services);
      if (
        services.filter((e) => e.type === 'service' && e.status === WORKORDER_SERVICE_STATUS.completed)?.length ===
        services.filter((e) => e.type === 'service')?.length &&
        workOrderData?.status !== WORK_ORDER_STATUS.completed
      ) {
        fetchWorkOrderData();
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
        fetchServiceData();
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
        fetchServiceData();
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
          fetchServiceData();
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
          fetchServiceData();
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
        fetchServiceData();
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

  const stylesForEveryTab = (selectedService, data, index, mobScreen): React.CSSProperties => {
    if (data?.type === 'quotation' && selectedService?.type !== 'quotation') {
      return {
        borderColor: 'var(--dark-mode-border-color, rgb(224, 224, 224))',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        cursor: 'pointer',
        borderTopWidth: index !== 0 && !mobScreen ? 0 : 1
      };
    } else if (data?.type === 'quotation' && selectedService?.type === 'quotation') {
      return {
        borderColor: '#329592',
        borderTopWidth: '1px',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        cursor: 'pointer'
      };
    } else if (!data?.clickable) {
      return {
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--dark-mode-border-color, rgba(25, 24, 24, 0.19))',
        cursor: allowedToEdit ? 'pointer' : 'not-allowed',
        // pointerEvents: 'none',
        opacity: '.5',
        filter: 'grayscale(1)',
        borderTopWidth: index !== 0 && !mobScreen ? 0 : 1
      };
    }
    if (selectedService?.uniqueId == data?.uniqueId) {
      return {
        borderColor: 'var(--dark-active-border-color,#298B88)',
        borderTopWidth: '1px',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        cursor: 'pointer'
      };
    } else {
      return {
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--dark-mode-border-color, rgb(224, 224, 224))',
        cursor: 'pointer',
        borderTopWidth: index !== 0 && !mobScreen ? 0 : 1
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

  const handleUpdatePurchaseOrder = (data: any) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-purchase-order`, { purchaseOrderId: data?._id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setAssignSteps(false);
        setShowManagePurchaseOrder(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const isAllowedToServiceEdit =
    !completed &&
    (allowedToEdit || (selectedService?.assignedUsers?.some((u: any) => u?.optionValue === user?._id) && permissions?.workOrder?.isUpdate));

  return (
    <Box>
      {serviceSteps ? (
        <Grid container spacing={2}>
          {!mobScreen && (
            <Grid
              item
              xs={12}
              sm={5}
              md={5}
              lg={4}
              xl={3}
              style={{
                maxWidth: isColapsed ? 'calc(76px + 40px)' : mobScreen ? '100%' : '',
                flexBasis: isColapsed ? 'calc(76px + 40px)' : mobScreen ? '100%' : '',
                transition: 'width 300ms ease 0s, max-width 300ms ease 0s, flex-basis 300ms ease 0s'
              }}
            >
              <Box className="container-with-border" p={'20px'}>
                {/* ------------------ TOP BUTTONS ------------------ */}
                <Box
                  mb={1}
                  display="flex"
                  style={{
                    flexWrap: 'wrap',
                    justifyContent: isColapsed ? 'space-around' : 'flex-end'
                  }}
                >
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
                            onClick={() => setArrangeView(true)}
                          >
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
                {/* ------------------ LEFT SIDE CONTENTS ------------------ */}
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
                    style={{
                      flexDirection: mobScreen ? 'column' : 'row'
                    }}
                  >
                    {serviceSteps?.map((data, index) => {
                      const style = stylesForEveryTab(selectedService, data, index, mobScreen);
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
                                    gap: '10px'
                                  }}
                                >
                                  {/* Serial Number or Quote icon */}
                                  {data?.type === 'service' ? (
                                    <Box
                                      style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'white',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        lineHeight: '20px',
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
                                      <Box
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          flexWrap: 'wrap',
                                          flexBasis: data?.type === 'quotation' ? 'calc(100% - 30px)' : '100%'
                                        }}
                                      >
                                        <Box ml={'10px'}>
                                          <Typography style={{ fontWeight: 600 }}>{data?.serviceName}</Typography>
                                        </Box>
                                        {user?.brandPolicy?.servicePrePost && data?.type === 'service' && (
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
                                        {data?.type === 'service' && data?.assignedUsers?.length > 0 && (
                                          <Box ml={1}>
                                            <HtmlTooltip title={data?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
                                              <PeopleIcon style={{ color: 'var(--primary)', maxWidth: '22px' }} />
                                            </HtmlTooltip>
                                          </Box>
                                        )}
                                      </Box>

                                      {/* Chips */}
                                      <Box style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flexBasis: '100%', gap: '8px' }}>
                                        {data?.type === 'service' && (
                                          <Box ml={1}>
                                            <Chip
                                              label={data?.status}
                                              variant="outlined"
                                              style={{
                                                borderColor:
                                                  data?.status === WORKORDER_SERVICE_STEP_STATUS.completed
                                                    ? '#E1FCE3'
                                                    : data?.status === WORKORDER_SERVICE_STEP_STATUS.failed
                                                      ? '#fabebe'
                                                      : WORKORDER_SERVICE_STEP_STATUS.skipped === data?.status
                                                        ? '#D3D3D3' : '#FFF5DD',
                                                color:
                                                  data?.status === WORKORDER_SERVICE_STEP_STATUS.completed
                                                    ? data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.passed
                                                      ? '#059825'
                                                      : '#EE0E06'
                                                    : data?.status === WORKORDER_SERVICE_STEP_STATUS.failed
                                                      ? '#fa0202'
                                                      : WORKORDER_SERVICE_STEP_STATUS.skipped === data?.status
                                                        ? 'inherit' : '#FF8C21',
                                                background:
                                                  data?.status === WORKORDER_SERVICE_STEP_STATUS.completed
                                                    ? data?.serviceStatus === WORKORDER_SERVICE_STEP_STATUS.passed
                                                      ? '#E1FCE3'
                                                      : '#FFECEB'
                                                    : data?.status === WORKORDER_SERVICE_STEP_STATUS.failed
                                                      ? '#fabebe'
                                                      : WORKORDER_SERVICE_STEP_STATUS.skipped === data?.status
                                                        ? '#D3D3D3'
                                                        : '#FFF5DD',
                                                fontWeight: 700
                                              }}
                                            />
                                          </Box>
                                        )}
                                        {data?.type === 'quotation' && quotationData && (
                                          <Box ml={1}>
                                            <Chip label={`Status : ${quotationData?.status}`} variant="outlined" color="primary" />
                                          </Box>
                                        )}

                                        {user?.brandPolicy?.workOrderTimer && <RenderTotalTime stepTimes={stepTimes} />}
                                      </Box>
                                    </>
                                  )}
                                </Box>
                              </Grid>
                              {!isColapsed && (
                                <>
                                  {data?.type === 'service' && (
                                    <Grid item xs={2} container justify="flex-end">
                                      <div>
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
                                        {/* PassFail */}
                                        <>
                                          {data?.type === 'service' && data?.serviceStatus && (
                                            <RenderStatusIcon
                                              style={{ maxWidth: 24, height: 24, margin: '5px auto 0' }}
                                              stepStatus={data?.serviceStatus}
                                            />
                                          )}
                                          {data?.type === 'quotation' && quotationData && (
                                            <RenderStatusIcon
                                              style={{ maxWidth: 24, height: 24, margin: '5px auto 0' }}
                                              stepStatus={quotationData?.status}
                                            />
                                          )}
                                        </>
                                      </div>
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
              </Box>
            </Grid>
          )}
          <Grid
            item
            xs={12}
            sm={7}
            md={7}
            lg={8}
            xl={9}
            style={{
              maxWidth: isColapsed ? 'calc(100% - calc(76px + 40px))' : mobScreen ? '100%' : '',
              flexBasis: isColapsed ? 'calc(100% - calc(76px + 40px))' : mobScreen ? '100%' : '',
              transition: 'width 300ms ease 0s, max-width 300ms ease 0s, flex-basis 300ms ease 0s'
            }}
          >
            <Box
              className="container-with-border"
              style={{
                overflow: 'hidden',
                minHeight: '100%'
              }}
            >
              {selectedService && (
                <>
                  {selectedService?.type === 'service' ? (
                    allowedToEdit ||
                      (selectedService?.assignedUsers?.length > 0 && selectedService?.assignedUsers?.map((u) => u?.optionValue).includes(user?._id)) ? (
                      <Steps
                        workOrderId={workOrderId}
                        warehouse={workOrderData?.warehouse}
                        selectedService={selectedService}
                        allServices={serviceSteps}
                        allowedToEdit={isAllowedToServiceEdit && selectedService?.clickable}
                        setDisableCompleteFail={setDisableCompleteFail}
                        fetchService={fetchServiceData}
                        referencType="workOrder"
                      />
                    ) : (
                      <Box textAlign="center">
                        <p>No services</p>
                      </Box>
                    )
                  ) : (
                    <Quotation />
                  )}
                </>
              )}
            </Box>
          </Grid>
          {mobScreen && (
            <Box className={styles.bottomBar} style={{ bottom: bottomBarOpen ? '0' : '-60px' }}>
              <div className={styles.control}>
                <button onClick={() => setBottomBarOpen((prev) => !prev)}>{bottomBarOpen ? <IoMdArrowDropdown /> : <IoMdArrowDropup />}</button>
              </div>
              <Box>
                <Tabs aria-label="scrollable Tabs">
                  {serviceSteps?.map((data, index) => {
                    let isTechnician = data?.assignedUsers?.some((u: any) => u?.optionValue === user?._id);
                    const style = stylesForEveryTab(selectedService, data, index, mobScreen);
                    return Boolean(allowedToEdit || isTechnician) ? (
                      <Tab
                        key={index}
                        content={
                          <Box
                            style={{
                              transition: '.3s',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            onClick={() => {
                              if (data?.type === 'service') {
                                setSelectedService(data);
                              }
                            }}
                          >
                            <Grid item xs={12} key={index}>
                              <Box
                                style={{
                                  ...style,
                                  padding: '8px 10px',
                                  transition: '.3s'
                                }}
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
                                        gap: '10px'
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
                                            lineHeight: '20px',
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
                                          <Box
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              flexWrap: 'wrap',
                                              flexBasis: data?.type === 'quotation' ? 'calc(100% - 30px)' : '100%'
                                            }}
                                          >
                                            <Box ml={'10px'}>
                                              <Typography>{data?.serviceName}</Typography>
                                            </Box>
                                            {user?.brandPolicy?.servicePrePost && data?.type === 'service' && (
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
                                            <>
                                              {data?.type === 'service' && data?.serviceStatus && (
                                                <Box ml={1}>
                                                  <RenderStatusIcon stepStatus={data?.serviceStatus} />
                                                </Box>
                                              )}
                                              {data?.type === 'quotation' && quotationData && (
                                                <Box ml={1}>
                                                  <RenderStatusIcon stepStatus={quotationData?.status} />
                                                </Box>
                                              )}
                                            </>
                                            {data?.type === 'service' && data?.assignedUsers?.length > 0 && (
                                              <Box ml={1}>
                                                <HtmlTooltip title={data?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
                                                  <PeopleIcon style={{ color: 'var(--primary)', maxWidth: '22px' }} />
                                                </HtmlTooltip>
                                              </Box>
                                            )}
                                          </Box>

                                          {/* Chips */}
                                          <Box style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flexBasis: '100%', gap: '8px' }}>
                                            {data?.type === 'service' && (
                                              <Box ml={1}>
                                                <Chip
                                                  label={data?.status}
                                                  variant="outlined"
                                                  style={{
                                                    borderColor:
                                                      data?.status === WORKORDER_SERVICE_STEP_STATUS.completed
                                                        ? '#E1FCE3'
                                                        : data?.status === WORKORDER_SERVICE_STEP_STATUS.failed
                                                          ? '#fabebe'
                                                          : '#FFF5DD',
                                                    color:
                                                      data?.status === WORKORDER_SERVICE_STEP_STATUS.completed
                                                        ? '#048E0A'
                                                        : data?.status === WORKORDER_SERVICE_STEP_STATUS.failed
                                                          ? '#fa0202'
                                                          : '#FF8C21',
                                                    background:
                                                      data?.status === WORKORDER_SERVICE_STEP_STATUS.completed
                                                        ? '#E1FCE3'
                                                        : data?.status === WORKORDER_SERVICE_STEP_STATUS.failed
                                                          ? '#fabebe'
                                                          : '#FFF5DD',
                                                    fontWeight: 700
                                                  }}
                                                />
                                              </Box>
                                            )}
                                            {data?.type === 'quotation' && quotationData && (
                                              <Box ml={1}>
                                                <Chip label={`Status : ${quotationData?.status}`} variant="outlined" color="primary" />
                                              </Box>
                                            )}
                                          </Box>
                                        </>
                                      )}
                                    </Box>
                                  </Grid>
                                  {!isColapsed && (
                                    <>
                                      {data?.type === 'service' && (
                                        <Grid item xs={2} container justify="flex-end">
                                          <div style={{ display: 'flex' }}>
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
                                          </div>
                                        </Grid>
                                      )}
                                    </>
                                  )}
                                </Grid>
                              </Box>
                            </Grid>
                          </Box>
                        }
                      ></Tab>
                    ) : (
                      <Tab key={index}></Tab>
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
                Add Steps
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAttchmentsDialog({
                    open: true,
                    uniqueServiceId: selectedService.uniqueId,
                    stepId: null,
                    serviceName: selectedService.serviceName,
                    stepName: selectedService?.serviceName || ''
                  });
                  setAnchorEl(null);
                }}
              >
                Upload Documents
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setConsumablesDialog({
                    open: true,
                    uniqueId: selectedService.uniqueId,
                    service: selectedService._id,
                    stepId: null,
                    serviceName: selectedService.serviceName
                  });
                  setAnchorEl(null);
                }}
              >
                Add/Consume Products
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
              <MenuItem
                onClick={() => {
                  setCommentsDialog(true);
                  setAnchorEl(null);
                }}
              >
                Comments
              </MenuItem>
              {user?.brandPolicy?.subcontractPurchaseOrder && (
                <MenuItem
                  onClick={() => {
                    setShowManagePurchaseOrder(true);
                    setAnchorEl(null);
                  }}
                >
                  Subcontract PO
                </MenuItem>
              )}
            </Menu>
          )}
        </Grid>
      ) : (
        <Box p={2} height={500}>
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
            fetchServiceData();
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
              data?.map((e) => e._id),
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
      {consumablesDialog.open && (
        <ConsumablesDialog
          onSuccess={() => {
            setConsumablesDialog({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
            fetchServiceData();
          }}
          handleClose={() => {
            setConsumablesDialog({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
          }}
          workOrderId={workOrderId}
          service={consumablesDialog.service}
          uniqueId={consumablesDialog.uniqueId}
          stepId={consumablesDialog.stepId}
          serviceName={consumablesDialog.serviceName}
          warehouse={workOrderData?.warehouse}
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
      {commentsDialog && (
        <Comments
          workOrderId={workOrderId}
          uniqueId={selectedService?.uniqueId}
          serviceName={selectedService?.serviceName}
          stepId={null}
          handleClose={() => {
            setCommentsDialog(false);
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
      {attchmentsDialog.open && (
        <AttachmentDialog
          workOrderId={workOrderId}
          uniqueServiceId={attchmentsDialog.uniqueServiceId}
          stepId={attchmentsDialog.stepId}
          serviceName={attchmentsDialog.serviceName}
          stepName={attchmentsDialog.stepName}
          handleClose={() => {
            setAttchmentsDialog({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });
          }}
          handleSuccess={() => { }}
        />
      )}
      {showManagePurchaseOrder && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={null}
          onClose={() => setShowManagePurchaseOrder(false)}
          onSuccess={(data: any) => {
            handleUpdatePurchaseOrder(data);
          }}
          products={[]}
          services={[
            {
              service: selectedService?.materialId,
              unit: isArray(selectedService?.unit) && selectedService?.unit?.length ? selectedService?.unit[0] : '',
              qty: 1
            }
          ]}
          warehouseId={workOrderData?.warehouse?.optionValue}
        />
      )}
    </Box>
  );
};

export default Service;

const RenderStatusIcon = ({ stepStatus, style = {}, ...others }: { stepStatus: string; style?: React.CSSProperties }) => {
  return (
    <>
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.passed && (
        <HtmlTooltip title={stepStatus}>
          <Box style={{ ...style, color: '#059825' }} {...others}>
            <PassIcon style={{ display: 'block', width: '100%', height: '100%' }} />
          </Box>
        </HtmlTooltip>
      )}
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.failed && (
        <HtmlTooltip title={stepStatus}>
          <Box style={{ ...style, color: '#EE0E06' }} {...others}>
            <FailIcon style={{ display: 'block', width: '100%', height: '100%' }} />
          </Box>
        </HtmlTooltip>
      )}
    </>
  );
};

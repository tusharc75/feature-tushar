import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import {
  convertMsToTime,
  getObjKeys,
  getObjKeysWithValues,
  RESOURCE_LABEL,
  setFieldsInAscendingOrder,
  workOrder,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_SERVICE_STEP_STATUS
} from 'src/constants/helpers';
import { Box, IconButton, Grid, Typography, Chip } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import StepFieldsDialog from './StepFieldsDialog';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import CompleteDialog from './CompleteDialog';
import { useData } from 'src/StateProvider/Provider';
import SettingsIcon from '@material-ui/icons/Settings';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import AttachmentDialog from './AttachmentDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const TimerComponent = ({ stepData, updateTime = true }) => {
  const [time, setTime] = useState(null);
  useEffect(() => {
    if (!updateTime) {
      setTime(convertMsToTime(stepData?.duration || 0));
    } else {
      setTime(convertMsToTime(stepData?.duration || 0));
    }
    const interval = setInterval(() => {
      if (updateTime)
        setTime(convertMsToTime((stepData?.duration || 0) + (new Date().getTime() - new Date(stepData?.pauseDate || stepData?.startDate).getTime())));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [stepData]);

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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      height: 'calc(100vh - 221px)',
      overflowY: 'auto',
      ['@media (max-width:767px)']: {
        height: 'calc(100vh - 364px)'
      },
      ['@media (max-width: 600px)']: {
        height: 'calc(100vh - 368px)'
      }
    },
    backButton: {
      marginRight: theme.spacing(1)
    },
    heading: {
      fontSize: theme.typography.pxToRem(16)
    },
    accordion: {
      border: '1px solid hsl(0deg 0% 85%)',
      '&::before': {
        content: 'unset !important',
        display: 'none'
      },
      '&.Mui-expanded': {
        margin: '15px 0'
      },
      marginBottom: '15px',
      '&:last-child': {
        marginBottom: '1px'
      },
      boxShadow: 'none !important'
    },
    accordionHeading: {
      padding: '16px',
      ['@media (min-width:768px)']: {
        padding: '16px 20px'
      },
      ['@media (min-width:1024px)']: {
        padding: '16px 40px'
      },
      ['@media (min-width:1150px)']: {
        padding: '16px 40px'
      },
      '& > div': {
        alignItems: 'center',
        justifyContent: 'space-between'
      },
      '&:first-of-type': {
        borderRadius: '8px 8px 0 0'
      },
      '&:last-of-type': {
        borderRadius: '0 0 8px 8px'
      }
    },
    badge: {
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
      fontSize: '10px'
    },
    green: {
      backgroundColor: 'rgba(0,255,0,.1)'
    },
    red: {
      backgroundColor: 'rgba(255,0,0,.1)'
    },
    white: {
      backgroundColor: 'white'
    },
    checkbox: {
      padding: '0',
      color: '#000000',
      '&.Mui-checked': {
        color: '#000000'
      }
    },
    mainContainer: {}
  })
);

const Service = ({ workOrderId, selectedService, allowedToEdit, setDisableCompleteFail, fetchService, referencType = '', handelClose = null }) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [serviceDetails, setServiceDetails] = useState(null);
  const [addServiceConfirmation, setAddServiceConfirmation] = useState({ open: false, status: '', services: [], step: null, type: '' });
  const [selectedStep, setSelectedStep] = useState(null);
  const [stepState, setStepState] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [comment, setComment] = useState('');
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [assignSteps, setAssignSteps] = useState(false);
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [viewStep, setViewStep] = React.useState({ open: false, step: null });
  const [isAllStepDone, setIsAllStepDone] = React.useState(false);
  const [attchmentsDialog, setAttchmentsDialog] = useState({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });

  useEffect(() => {
    fetchServiceData();
  }, [selectedService]);

  const fetchServiceData = async () => {
    const stepDataResponse = await axiosInstance().get(`${workOrder.api}/${workOrderId}/steps-data`);
    const stepsData = stepDataResponse?.data?.data || [];
    setServiceData(stepsData);
    const serviceDetailResponse = await axiosInstance().get(`${workOrder.api}/service/detail/${selectedService._id}/${workOrderId}`);
    var serviceDetail = serviceDetailResponse?.data?.data;
    serviceDetail.steps = serviceDetail?.steps?.sort((a, b) => a?.order - b?.order);

    serviceDetail.steps?.forEach((ele, index) => {
      ele.isAllowToPerform = false;
      if (index === 0) {
        ele.isAllowToPerform = true;
      } else if (index > 0) {
        const prevStep = serviceDetail?.steps[index - 1];
        const prevStepData = stepsData?.find(
          (d) => d.uniqueId === selectedService?.uniqueId && d.serviceId === selectedService._id && d.stepId === prevStep?._id
        );
        const currStepData = stepsData?.find(
          (d) => d.uniqueId === selectedService?.uniqueId && d.serviceId === selectedService._id && d.stepId === ele?._id
        );
        if (prevStepData?.passFailStatus || currStepData?.passFailStatus) {
          ele.isAllowToPerform = true;
        }
        if (prevStep?.order === ele?.order) {
          const stepOfFirstOrder = serviceDetail?.steps?.find((e) => e.order === ele?.order);
          if (stepOfFirstOrder?.isAllowToPerform) {
            ele.isAllowToPerform = true;
          }
        }
      }
    });

    setServiceDetails(serviceDetail);

    if (serviceDetail?.steps?.length) {
      const completedSteps = stepsData.filter(
        (d) =>
          d.uniqueId === selectedService?.uniqueId &&
          d.serviceId === selectedService._id &&
          [
            WORKORDER_SERVICE_STEP_STATUS.passed,
            WORKORDER_SERVICE_STEP_STATUS.completed,
            WORKORDER_SERVICE_STEP_STATUS.failed,
            WORKORDER_SERVICE_STEP_STATUS.skipped,
            WORKORDER_SERVICE_STEP_STATUS.end
          ].includes(d?.passFailStatus)
      );

      const allStepsDone = isEqual(completedSteps.map((d) => d.stepId).sort(), serviceDetail?.steps?.map((d) => d._id).sort());

      setDisableCompleteFail(!allStepsDone);
      setIsAllStepDone(allStepsDone);

      if (allStepsDone && [WORKORDER_SERVICE_STATUS.inProgress, WORKORDER_SERVICE_STATUS.pending].includes(selectedService.status)) {
        setOpenCompleteDialog(true);
      }
    }
  };

  const updateServiceStatus = (uniqueId, status) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${uniqueId}/status`, { status, comment })
      .then(({ data: { data } }) => {
        fetchService();
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

  const handleAddStep = (values: any) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-step`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setAssignSteps(false);
        fetchServiceData();
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddService = (ids, step) => {
    const data: any = {};
    data.serviceIds = ids;
    if (selectedService?.uniqueId) {
      data.aboveServiceUniqueId = selectedService?.uniqueId;
      data.createdFromStep = step?._id;
    }
    axiosInstance()
      .post(`${workOrder.api}/service/${workOrderId}`, data)
      .then(() => {
        setAddServiceConfirmation({ open: false, services: [], status: '', step: null, type: '' });
        fetchService();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const getFields = (step) => {
    let stepData = null;
    let fieldData = { fields: [], formsData: [], values: {} };
    let fieldsDataForCreate = step?.fields ? step?.fields : [];
    let tempServiceData = serviceData?.find((d) => d.uniqueId === selectedService?.uniqueId && d.stepId === step?._id);

    if (tempServiceData) {
      stepData = tempServiceData;
      if (step?.fields?.length) {
        fieldData = {
          fields: fieldsDataForCreate,
          formsData: setFieldsInAscendingOrder(fieldsDataForCreate),
          values: getObjKeysWithValues(tempServiceData, fieldsDataForCreate)
        };
      }
    } else {
      if (step?.fields?.length) {
        fieldData = {
          fields: fieldsDataForCreate,
          formsData: setFieldsInAscendingOrder(fieldsDataForCreate),
          values: getObjKeys('', fieldsDataForCreate)
        };
      }
    }

    let isStepValid = true;
    let givenValues = {};
    const requiredFields = fieldsDataForCreate.filter((f) => f.required);

    requiredFields.forEach((f) => {
      if (fieldData.values[f.fieldName]) {
        givenValues[f.fieldName] = fieldData.values[f.fieldName];
      } else {
        if (givenValues[f.fieldName]) delete givenValues[f.fieldName];
      }
    });

    if (requiredFields.length === Object.keys(givenValues).length) {
      isStepValid = true;
    } else {
      isStepValid = false;
    }

    return { fieldData, stepData, isStepValid };
  };

  const handleSubmit = async (values, step) => {
    let tempData = {
      uniqueId: selectedService?.uniqueId,
      serviceId: selectedService._id,
      stepId: step?._id
    };
    axiosInstance()
      .put(`${workOrder.api}/update-steps-data/${workOrderId}`, { ...tempData, ...values })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSelectedStep(null);
        fetchServiceData();
        fetchService();
        if (step?.isPassFail) {
          const type = automatePassFail(values, step);
          handlePassFail(type, step);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const automatePassFail = (values: any, step: any): string => {
    const fields = getFields(step).fieldData?.fields.filter((field) => field.type === 'decimal');
    let invalidValues: any = {};
    const keys = Object.keys(values);
    keys.forEach((k) => {
      const field = fields.find((f: any) => f?.fieldName === k);
      if (field && field.fieldName === k) {
        if (parseFloat(values[k]) > field?.maxValue || parseFloat(values[k]) < field?.minValue) {
          invalidValues[k] = 'Invalid value';
        } else if (invalidValues[k]) {
          delete invalidValues[k];
        }
      }
    });
    return Object.keys(invalidValues).length > 0 ? WORKORDER_SERVICE_STEP_STATUS.failed : WORKORDER_SERVICE_STEP_STATUS.passed;
  };

  const handleStartEnd = (type, stepId) => {
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/${type}`, {
        uniqueId: selectedService?.uniqueId,
        serviceId: selectedService._id,
        stepId: stepId
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchServiceData();
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handlePassFail = (type, step) => {
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/pass-fail`, {
        uniqueId: selectedService?.uniqueId,
        serviceId: selectedService._id,
        stepId: step._id,
        passFailStatus: type
      })
      .then(({ data }) => {
        const result = data?.data;
        if (type === WORKORDER_SERVICE_STEP_STATUS.passed && result?.isPassAddon && result?.passAddon?.length) {
          if (referencType === 'workOrderTechnician') {
            handleAddService(
              result?.passAddon?.map((e) => e._id),
              step
            );
          } else {
            setAddServiceConfirmation({
              open: true,
              status: WORKORDER_SERVICE_STEP_STATUS.passed,
              services: result?.passAddon,
              step: step,
              type: ''
            });
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isFailAddon && result?.failAddon?.length) {
          if (referencType === 'workOrderTechnician') {
            handleAddService(
              result?.failAddon?.map((e) => e._id),
              step
            );
          } else {
            setAddServiceConfirmation({
              open: true,
              status: WORKORDER_SERVICE_STEP_STATUS.failed,
              services: result?.failAddon,
              step: step,
              type: ''
            });
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.passed && result?.isJumpStepPass && result?.jumpStepsPass?.length) {
          if (referencType !== 'workOrderTechnician') {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.passed, open: true, type: 'jumpStep' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isJumpStepFail && result?.jumpStepsFail?.length) {
          if (referencType !== 'workOrderTechnician') {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.failed, open: true, type: 'jumpStep' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isQuoteRevisionOnFail) {
          if (referencType !== 'workOrderTechnician') {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.failed, open: true, type: 'isQuoteRevisionOnFail' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isReturnToStepOnFail && result?.returnToStepOnFail) {
          if (referencType !== 'workOrderTechnician') {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.failed, open: true, type: 'returnToStepOnFail' }));
          }
        }
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchServiceData();
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handlePauseResume = (statusType, stepData) => {
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/pause-resume`, {
        uniqueId: stepData?.uniqueId,
        id: stepData?._id,
        serviceId: stepData?.serviceId,
        stepId: stepData?.stepId,
        status: statusType
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchServiceData();
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateStep = (values: any) => {
    values.order = viewStep?.step?.order;
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/update-step`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setViewStep({ open: false, step: null });
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return serviceDetails ? (
    serviceDetails?.steps?.length ? (
      <Box
        className={classes.mainContainer}
        sx={{ position: 'relative', overflow: 'hidden' }}
        style={{ backgroundColor: 'rgba(242, 243, 247, 0.6)' }}
      >
        <div className={classes.root}>
          {serviceDetails?.steps?.map((step, index) => {
            const { stepData, isStepValid } = getFields(step);
            if (referencType === 'workOrderTechnician' && stepData?.passFailStatus === WORKORDER_SERVICE_STEP_STATUS.skipped) {
              return '';
            }
            let isAnyTechnician = selectedService?.assignedUsers?.length ? true : false;
            let isMeTechnician = selectedService?.assignedUsers?.find((u) => u?.optionValue === user?._id) || false;
            if (referencType === 'workOrderTechnician') {
              isMeTechnician = true;
            }
            return (
              <Box
                key={`${step._id}_${selectedService?.uniqueId}}`}
                border={1}
                borderColor={'grey.300'}
                style={{
                  cursor: !stepData?.status ? 'default' : 'pointer',
                  transition: 'background .5s ease',
                  backgroundColor: selectedStep?._id === step._id ? '#ecfdf7' : ''
                }}
                className={`${classes.accordionHeading}  ${
                  Boolean(stepData?.passFailStatus)
                    ? `${
                        Boolean([WORKORDER_SERVICE_STEP_STATUS.passed, WORKORDER_SERVICE_STEP_STATUS.completed].includes(stepData?.passFailStatus))
                          ? classes.green
                          : ''
                      } ${stepData?.passFailStatus === WORKORDER_SERVICE_STEP_STATUS.failed ? classes.red : ''}`
                    : classes.white
                }`}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', marginLeft: '-10px', marginTop: '-10px' }}>
                  <Box sx={{ display: 'flex', paddingLeft: '10px', paddingTop: '10px', alignItems: 'center' }}>
                    <Box>
                      <Chip
                        color="primary"
                        // label={referencType === 'workOrderTechnician' ? step?.order : `${selectedService?.order}.${step?.order || index + 1}`}
                        label={referencType === 'workOrderTechnician' ? step?.order : `${step?.order || index + 1}`}
                      />
                    </Box>
                    <Box ml={1}>
                      <Typography className={classes.heading} style={{ fontWeight: '600' }}>
                        {step.stepName}
                      </Typography>
                    </Box>
                  </Box>
                  {step?.isAllowToPerform && (
                    <Box
                      sx={{
                        justifyContent: 'flex-end',
                        paddingLeft: '10px',
                        paddingTop: '10px',
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      gridGap={'8px'}
                    >
                      {stepData?.startDate && (
                        <TimerComponent stepData={stepData} updateTime={stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start ? true : false} />
                      )}
                      {[
                        WORKORDER_SERVICE_STEP_STATUS.start,
                        WORKORDER_SERVICE_STEP_STATUS.pause,
                        WORKORDER_SERVICE_STEP_STATUS.needReperform
                      ].includes(stepData?.status) &&
                        (isMeTechnician || !isAnyTechnician) && (
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            disabled={!allowedToEdit}
                            onClick={(e) => {
                              if ([WORKORDER_SERVICE_STEP_STATUS.pause, WORKORDER_SERVICE_STEP_STATUS.needReperform].includes(stepData?.status)) {
                                handlePauseResume(WORKORDER_SERVICE_STEP_STATUS.start, stepData);
                              } else if (stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start) {
                                handlePauseResume(WORKORDER_SERVICE_STEP_STATUS.pause, stepData);
                              }
                            }}
                          >
                            {stepData?.status === WORKORDER_SERVICE_STEP_STATUS.pause
                              ? 'Resume'
                              : stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start
                              ? 'Pause'
                              : 'Restart'}
                          </Button>
                        )}
                      {!stepData?.startDate && (isMeTechnician || !isAnyTechnician) ? (
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          disabled={!allowedToEdit}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedService.status === WORKORDER_SERVICE_STATUS.pending) {
                              updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.inProgress);
                            }
                            handleStartEnd(WORKORDER_SERVICE_STEP_STATUS.start, step._id);
                          }}
                        >
                          Start
                        </Button>
                      ) : stepData?.passFailStatus ? (
                        <Chip label={stepData?.passFailStatus} variant="outlined" color="primary" />
                      ) : stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start && isStepValid && (isMeTechnician || !isAnyTechnician) ? (
                        step?.isPassFail ? (
                          <>
                            <Button
                              variant="outlined"
                              color="secondary"
                              disabled={!allowedToEdit}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePassFail(WORKORDER_SERVICE_STEP_STATUS.passed, step);
                              }}
                            >
                              Pass
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              className={'btn-red-v1'}
                              disabled={!allowedToEdit}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePassFail(WORKORDER_SERVICE_STEP_STATUS.failed, step);
                              }}
                            >
                              Fail
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              disabled={!allowedToEdit}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePassFail(WORKORDER_SERVICE_STEP_STATUS.completed, step);
                              }}
                            >
                              Complete
                            </Button>
                          </>
                        )
                      ) : null}
                      {stepData?.status &&
                      ![WORKORDER_SERVICE_STEP_STATUS.pause, WORKORDER_SERVICE_STEP_STATUS.needReperform].includes(stepData?.status) &&
                      ![WORKORDER_SERVICE_STEP_STATUS.skipped].includes(stepData?.passFailStatus) &&
                      (isMeTechnician || !isAnyTechnician) ? (
                        [
                          WORKORDER_SERVICE_STEP_STATUS.passed,
                          WORKORDER_SERVICE_STEP_STATUS.failed,
                          WORKORDER_SERVICE_STEP_STATUS.completed
                        ]?.includes(stepData?.passFailStatus) ? (
                          <>
                            <Box marginX={1} />
                            <Box>
                              <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                disabled={!allowedToEdit}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEnd('reopen', step._id);
                                }}
                              >
                                Re-open
                              </Button>
                            </Box>
                          </>
                        ) : step?.fields?.length ? (
                          <>
                            <Box marginX={1} />
                            <Box>
                              <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                disabled={!allowedToEdit}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStep(step);
                                  setStepState(stepData);
                                }}
                              >
                                Enter Value
                              </Button>
                            </Box>
                          </>
                        ) : null
                      ) : null}
                    </Box>
                  )}
                  <Box
                    sx={{
                      justifyContent: 'flex-end',
                      display: 'flex',
                      alignItems: 'center',
                      paddingTop: '10px'
                    }}
                  >
                    <Box ml={1}>
                      <HtmlTooltip title="Upload Document">
                        <IconButton
                          aria-label="close"
                          onClick={() => {
                            setAttchmentsDialog({
                              open: true,
                              uniqueServiceId: selectedService.uniqueId,
                              stepId: step?._id,
                              serviceName: selectedService.serviceName,
                              stepName: step.stepName
                            });
                          }}
                          size="small"
                          color="inherit"
                        >
                          <AttachFileIcon color="primary" fontSize="small" />
                        </IconButton>
                      </HtmlTooltip>
                    </Box>
                    {referencType !== 'workOrderTechnician' && (
                      <Box ml={1}>
                        <IconButton
                          aria-label="close"
                          onClick={() => {
                            setViewStep({ open: true, step: step });
                          }}
                          size="small"
                          color="inherit"
                        >
                          <SettingsIcon color="inherit" fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
          {isAllStepDone && [WORKORDER_SERVICE_STATUS.inProgress, WORKORDER_SERVICE_STATUS.pending].includes(selectedService.status) && (
            <Box pt={2}>
              <Grid container justify="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={(e) => {
                    setOpenCompleteDialog(true);
                  }}
                >
                  Complete
                </Button>
              </Grid>
            </Box>
          )}
        </div>
        {Boolean(selectedStep) ? (
          <StepFieldsDialog
            workOrderId={workOrderId}
            fieldData={getFields(selectedStep)?.fieldData}
            handleClose={() => {
              setSelectedStep(null);
              fetchServiceData();
            }}
            referencType={referencType}
            handleSubmit={handleSubmit}
            selectedService={selectedService}
            allowedToEdit={allowedToEdit}
            step={selectedStep}
            stepData={stepState}
          />
        ) : null}
        {openCompleteDialog && (
          <CompleteDialog
            serviceName={selectedService?.serviceName}
            comment={comment}
            setComment={setComment}
            updateStatus={() => {
              updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.completed);
              if (handelClose) {
                handelClose();
              }
            }}
            handleClose={() => {
              setComment('');
              setOpenCompleteDialog(false);
            }}
          />
        )}
        {addServiceConfirmation.open && (
          <ConfirmationDialog
            open={true}
            message={
              addServiceConfirmation.type === 'returnToStepOnFail'
                ? `As per the logic applied on this step, we need to return to step ${addServiceConfirmation.services
                    ?.map((e) => e.serviceName)
                    ?.toString()}. Do you want to continue ?`
                : addServiceConfirmation.type === 'isQuoteRevisionOnFail'
                ? ` Step fail requires Quote Revision. Do you confirm on this?`
                : addServiceConfirmation.type === 'jumpStep'
                ? ` As per the logic applied on this step, we will skip few steps in this service. Do you want to continue?`
                : `As per the logic applied on this step, a new service  ${addServiceConfirmation.services
                    ?.map((e) => e.serviceName)
                    ?.toString()} has been added. Do you want to Add ? `
            }
            onClose={() => {
              setAddServiceConfirmation({ open: false, services: [], status: '', step: null, type: '' });
            }}
            onOk={() => {
              if (addServiceConfirmation.type === '') {
                handleAddService(
                  addServiceConfirmation.services?.map((e) => e._id),
                  addServiceConfirmation.step
                );
              }
              setAddServiceConfirmation({ open: false, services: [], status: '', step: null, type: '' });
            }}
          />
        )}
        {viewStep.open && (
          <StepDialog
            handleClose={() => {
              setViewStep({ open: false, step: null });
            }}
            handleSucess={(data) => {
              handleUpdateStep(data);
            }}
            stepId={viewStep.step?._id}
            stepData={viewStep.step}
            notEditable={viewStep.step?.customStep === true ? false : true}
            steps={serviceDetails?.steps}
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
            handleSuccess={() => {}}
          />
        )}
      </Box>
    ) : (
      <>
        <Box p={2} height={500} bgcolor="rgba(242, 243, 247, 0.6)" textAlign="center">
          {referencType !== 'workOrderTechnician' && (
            <Button variant="contained" color="primary" onClick={() => setAssignSteps(true)}>
              Add Step
            </Button>
          )}
        </Box>
        {assignSteps && (
          <StepDialog
            handleClose={() => {
              setAssignSteps(false);
            }}
            handleSucess={(data) => {
              handleAddStep(data);
            }}
            stepId={''}
            steps={serviceDetails?.steps}
            reference={'workOrder'}
            workOrderId={workOrderId}
            serviceId={selectedService?._id}
            uniqueId={selectedService?.uniqueId}
          />
        )}
      </>
    )
  ) : (
    <Box p={2} height={500} bgcolor="white">
      <CommonSkeleton lenArray={[...Array(10).keys()]} />
    </Box>
  );
};

export default Service;

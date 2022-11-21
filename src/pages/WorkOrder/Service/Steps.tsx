import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import {
  dateTimeFormat,
  getObjKeys,
  getObjKeysWithValues,
  serviceMaster,
  setFieldsInAscendingOrder,
  workOrder,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_SERVICE_STEP_STATUS,
  yupSchema
} from 'src/constants/helpers';
import { Box, Divider, Grid, Badge, Accordion, AccordionDetails, AccordionSummary, Typography, Chip, Checkbox } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import StepFieldsDialog from './StepFieldsDialog';
import moment from 'moment';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import CompleteDialog from './CompleteDialog';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import FieldDialog from 'src/pages/ServiceMaster/Steps/FieldDialog';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      height: 'calc(100vh - 290px)',
      overflowY: 'auto',
      ['@media (max-width:767px)']: {
        height: 'calc(100vh - 349px)'
      },
      ['@media (max-width: 600px)']: {
        height: 'calc(100vh - 299px)'
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
    mainContainer: {
      padding: '10px',
      ['@media (min-width:768px)']: {
        padding: '17px'
      },
      ['@media (min-width:1024px)']: {
        padding: '25px'
      }
    }
  })
);

const Service = ({
  workOrderId,
  selectedService,
  serviceSteps,
  allowedToEdit,
  setDisableCompleteFail,
  fetchService,
  referencType = ""
}) => {

  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [stepList, setStepList] = useState([]);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [addServiceConfirmation, setAddServiceConfirmation] = useState({ open: false, status: '', services: [], step: null, values: null });
  const [selectedStep, setSelectedStep] = useState(null);
  const [inSteps, setInSteps] = useState(false);
  const [stepState, setStepState] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [comment, setComment] = useState('');
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [assignSteps, setAssignSteps] = useState(false);
  const [openFieldDialog, setOpenFieldDialog] = useState(false);
  const [addStepFields, setAddStepFields] = useState({ fields: [], section: [] });

  useEffect(() => {
    getServiceData()
  }, []);

  useEffect(() => {
    if (addServiceConfirmation.open) return;
    axiosInstance().get(`${workOrder.api}/service/detail/${selectedService._id}/${workOrderId}`).then(({ data: { data } }) => {
      setServiceDetails(data);
      const steps = data?.steps?.map((d) => d.stepName);
      setStepList(steps);
      const completedSteps = serviceData.filter((d) => d.uniqueId === selectedService?.uniqueId && d.serviceId === selectedService._id &&
        [
          WORKORDER_SERVICE_STEP_STATUS.passed,
          WORKORDER_SERVICE_STEP_STATUS.completed,
          WORKORDER_SERVICE_STEP_STATUS.failed,
          WORKORDER_SERVICE_STEP_STATUS.skipped,
          WORKORDER_SERVICE_STEP_STATUS.end
        ].includes(d?.passFailStatus)
      );

      const allStepsDone = isEqual(completedSteps.map((d) => d.stepId).sort(), data?.steps?.map((d) => d._id).sort());
      setDisableCompleteFail(!allStepsDone);

      if (inSteps && allStepsDone && selectedService.status === WORKORDER_SERVICE_STATUS.inProgress) {
        setOpenCompleteDialog(true);
        setInSteps(false);
      }
    })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [addServiceConfirmation, selectedService._id, serviceData]);

  const getServiceData = () => {
    axiosInstance()
      .get(`${workOrder.api}/${workOrderId}/steps-data`)
      .then(({ data: { data } }) => {
        setServiceData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
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
    values.fields = addStepFields?.fields;
    return new Promise((resolve, reject) => {
      axiosInstance()
        .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-step`, values)
        .then(({ data }) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  const handleAddService = (ids, forMinMax = false, step = null, values = null) => {
    const data: any = {};
    data.serviceIds = ids;
    if (selectedService?.uniqueId) {
      data.aboveServiceUniqueId = selectedService?.uniqueId;
      data.createdFrom = selectedService?.uniqueId;
    }
    axiosInstance()
      .post(`${workOrder.api}/service/${workOrderId}`, data)
      .then(() => {
        if (forMinMax) {
          const type = automatePassFail(values, step);
          handlePassFail(type, step?._id);
        }
        setAddServiceConfirmation({ open: false, services: [], status: '', step: null, values: null });
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
    let tempServiceData = serviceData.find((d) => d.uniqueId === selectedService?.uniqueId && d.serviceId === selectedService._id && d.stepId === step?._id);

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
        getServiceData();
        const serviceIds = determinServiceDialog(values, step);
        if (serviceIds.length > 0) {
          const services = serviceIds.filter((s) => {
            return serviceSteps.findIndex((s1) => s1._id === s._id) === -1;
          });
          if (services.length > 0) {
            setAddServiceConfirmation({ open: true, status: '', services, step, values });
          }
        } else if (step?.isPassFail) {
          const type = automatePassFail(values, step);
          handlePassFail(type, step?._id);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const determinServiceDialog = (values: any, step: any) => {
    const { fieldData } = getFields(step);
    const minMaxFields = fieldData.fields.filter((f) => {
      const keys = Object.keys(f);
      if (keys.includes('minValueServiceAdd') || keys.includes('maxValueServiceAdd')) {
        return true;
      } else {
        return false;
      }
    });
    const serviceIds = [];
    minMaxFields.forEach((f) => {
      if (values[f?.fieldName] && values[f?.fieldName] < f?.minValue && f?.minValueServiceAdd) {
        serviceIds.push({ _id: f?.minValueServiceAdd });
      } else if (values[f?.fieldName] && values[f?.fieldName] > f?.maxValue && f?.maxValueServiceAdd) {
        serviceIds.push({ _id: f?.maxValueServiceAdd });
      }
    });
    return serviceIds;
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
        getServiceData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handlePassFail = (type, stepId) => {
    setInSteps(true);
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/pass-fail`, {
        uniqueId: selectedService?.uniqueId,
        serviceId: selectedService._id,
        stepId: stepId,
        passFailStatus: type
      })
      .then(({ data }) => {
        const result = data?.data;

        if (type === WORKORDER_SERVICE_STEP_STATUS.passed && result?.isPassAddon && result?.passAddon?.length) {
          const services = result?.passAddon.filter((s) => {
            return serviceSteps.findIndex((s1) => s1._id === s._id) === -1;
          });

          if (services.length > 0) {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.passed, open: true, services }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isFailAddon && result?.failAddon?.length) {
          const services = result?.failAddon.filter((s) => {
            return serviceSteps.findIndex((s1) => s1._id === s._id) === -1;
          });
          if (services.length > 0) {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.failed, open: true, services }));
          }
        }
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        getServiceData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  function convertMsToTime(milliseconds) {
    function padTo2Digits(num) {
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

  return stepList ? (stepList?.length ? (
    <Box
      className={classes.mainContainer}
      sx={{ position: 'relative', overflow: 'hidden' }}
      style={{ backgroundColor: 'rgba(242, 243, 247, 0.6)' }}
    >
      <div className={classes.root}>
        {serviceDetails?.steps?.map((step, index) => {
          const { stepData, isStepValid } = getFields(step);
          return (
            <Box
              key={step._id}
              border={1}
              borderColor={'grey.300'}
              style={{
                cursor: !stepData?.status ? 'default' : 'pointer',
                transition: 'background .5s ease',
                backgroundColor: selectedStep?._id === step._id ? '#ecfdf7' : ''
              }}
              className={`${classes.accordionHeading}  ${Boolean(stepData?.passFailStatus)
                ? `${Boolean([WORKORDER_SERVICE_STEP_STATUS.passed, WORKORDER_SERVICE_STEP_STATUS.completed].includes(stepData?.passFailStatus))
                  ? classes.green : ''} ${stepData?.passFailStatus === WORKORDER_SERVICE_STEP_STATUS.failed ? classes.red : ''}` : classes.white}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!stepData?.status) return;
                setSelectedStep(step);
                setStepState(stepData);
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', marginLeft: '-10px', marginTop: '-10px' }}>
                <Box sx={{ display: 'flex', paddingLeft: '10px', paddingTop: '10px' }}>
                  <Box>
                    <Chip color="primary" label={referencType === "workOrderTechnician" ? index + 1 : `${serviceSteps.findIndex((item) => item?._id === selectedService?._id) + 1}.${index + 1}`} />
                  </Box>
                  <Box ml={1}>
                    <Typography className={classes.heading} style={{ fontWeight: '600' }}>
                      {step.stepName}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ justifyContent: 'flex-end', paddingLeft: '10px', paddingTop: '10px', marginLeft: 'auto', display: 'flex' }}>
                  {stepData?.startDate && (
                    <Box
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        border: '1px solid rgba(0, 0, 0, 0.23)',
                        backgroundColor: 'transparent',
                        padding: '2px 7px',
                        borderRadius: '8px',
                        marginRight: '8px'
                      }}
                    >
                      <AccessTimeIcon style={{ marginRight: '3px', color: 'gray', fontSize: '1rem' }} />
                      {convertMsToTime(new Date(stepData?.endDate ? stepData?.endDate : new Date()).getTime() - new Date(stepData?.startDate).getTime())}
                    </Box>
                  )}
                  {!stepData?.status ? (
                    <Box>
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
                          handleStartEnd('start', step._id);
                        }}
                      >
                        Start
                      </Button>
                    </Box>
                  ) : stepData?.passFailStatus ? (
                    <Box ml={1}>
                      <Chip label={stepData?.passFailStatus} variant="outlined" color="primary" />
                    </Box>
                  ) : stepData?.status === 'start' && isStepValid ? (
                    step?.isPassFail ? (
                      <Box display="inline-flex">
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePassFail(WORKORDER_SERVICE_STEP_STATUS.passed, step._id);
                          }}
                        >
                          Pass
                        </Button>
                        <Box marginX={1} />
                        <DeleteButton
                          text="Fail"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePassFail(WORKORDER_SERVICE_STEP_STATUS.failed, step._id);
                          }}
                        />
                      </Box>
                    ) : (
                      <Box display="inline-flex">
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePassFail(WORKORDER_SERVICE_STEP_STATUS.completed, step._id);
                          }}
                        >
                          Complete
                        </Button>
                      </Box>
                    )
                  ) : null}
                </Box>
              </Box>
            </Box>
          );
        })}
      </div>
      <StepFieldsDialog
        isOpen={Boolean(selectedStep)}
        fieldData={getFields(selectedStep)?.fieldData}
        isStepValid={getFields(selectedStep)?.isStepValid}
        handleClose={() => setSelectedStep(null)}
        handleSubmit={handleSubmit}
        step={selectedStep}
        stepData={stepState}
      />
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
      {addServiceConfirmation.open && (
        <ConfirmationDialog
          open={true}
          message={
            addServiceConfirmation.status === WORKORDER_SERVICE_STEP_STATUS.failed
              ? `Since the previous step was failed, the service requested in the add-on service will then be added. ` +
              addServiceConfirmation.services?.map((e) => e.serviceName)?.toString()
              : addServiceConfirmation.status === WORKORDER_SERVICE_STEP_STATUS.passed
                ? `On pass, a new service has been added in compliance with the configuration ` +
                addServiceConfirmation.services?.map((e) => e.serviceName)?.toString()
                : `You have to add addional services based on your recent action`
          }
          onClose={() => {
            setAddServiceConfirmation({ open: false, services: [], status: '', step: null, values: null });
          }}
          onOk={() => {
            handleAddService(
              addServiceConfirmation.services?.map((e) => e._id),
              addServiceConfirmation.status === '' ? true : false,
              addServiceConfirmation.step,
              addServiceConfirmation.values
            );
            setAddServiceConfirmation({ open: false, services: [], status: '', step: null, values: null });
          }}
        />
      )}
    </Box>
  ) : (
    <>
      <Box p={2} height={500} bgcolor="rgba(242, 243, 247, 0.6)" textAlign="center">
        <Button variant="contained" color="primary" onClick={() => setAssignSteps(true)}>
          Add Step
        </Button>
      </Box>
      {assignSteps && (
        <StepDialog
          handleClose={() => {
            setAssignSteps(false);
          }}
          handleSucess={() => {
            setAssignSteps(false);
            getServiceData();
            setAddStepFields({ fields: [], section: [] });
          }}
          handleAddStep={handleAddStep}
          stepId={''}
          steps={selectedService?.steps}
          reference={'workOrder'}
          workOrderId={workOrderId}
          serviceId={selectedService?._id}
          uniqueId={selectedService?.uniqueId}
          setOpenFieldDialog={setOpenFieldDialog}
        />
      )}
      {openFieldDialog && (
        <FieldDialog
          reference={'workOrder'}
          serviceId={selectedService?._id}
          stepIds={selectedService?.steps?.map((d) => d?._id)}
          steps={[]}
          sectionData={addStepFields?.section}
          handleClose={() => {
            setOpenFieldDialog(false);
          }}
          handleSucess={(fieldsData: any) => {
            setOpenFieldDialog(false);
            setAddStepFields(fieldsData);
          }}
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

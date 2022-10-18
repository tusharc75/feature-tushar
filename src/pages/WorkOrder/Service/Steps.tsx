import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
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
import moment from 'moment';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import StepFieldsDialog from './StepFieldsDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      height: 'calc(100vh - 250px)',
      overflowY: 'auto'
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
    red: { backgroundColor: 'rgba(255,0,0,.1)' },
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
  uniqueId,
  serviceId,
  serviceData,
  getServiceData,
  handleAddService,
  serviceSteps,
  selectedServiceStatus,
  updateServiceStatus,
  allowedToEdit,
  setDisableCompleteFail,
  setOpenCompleteDialog,
  serviceIndex
}) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [stepList, setStepList] = useState([]);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [addServiceConfirmation, setAddServiceConfirmation] = useState({ open: false, services: [] });
  const [disabledFieldSteps, setDisabledFieldSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [inSteps, setInSteps] = useState(false);
  const [validStep, setValidStep] = useState({});
  const [stepState, setStepState] = useState(null);

  useEffect(() => {
    axiosInstance()
      .get(`${workOrder.api}/service/detail/${serviceId}`)
      .then(({ data: { data } }) => {
        setServiceDetails(data);
        const steps = data?.steps?.map((d) => d.stepName);
        setStepList(steps);
        const completedSteps = serviceData.filter(
          (d) =>
            d.uniqueId === uniqueId &&
            d.serviceId === serviceId &&
            [
              WORKORDER_SERVICE_STEP_STATUS.passed,
              WORKORDER_SERVICE_STEP_STATUS.completed,
              WORKORDER_SERVICE_STEP_STATUS.failed,
              WORKORDER_SERVICE_STEP_STATUS.end
            ].includes(d?.passFailStatus)
        );
        const allStepsDone = isEqual(completedSteps.map((d) => d.stepId).sort(), data?.steps?.map((d) => d._id).sort());
        setDisabledFieldSteps(completedSteps.map((d) => d.stepId));
        setDisableCompleteFail(!allStepsDone);

        if (inSteps && allStepsDone && selectedServiceStatus === WORKORDER_SERVICE_STATUS.inProgress) {
          setOpenCompleteDialog(true);
          setInSteps(false);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [serviceId, serviceData]);

  const getFields = (step) => {
    let stepData = null;
    let fieldData = { fields: [], formsData: [], values: {} };

    let fieldsDataForCreate = step?.fields ? step?.fields : [];
    let tempServiceData = serviceData.find((d) => d.uniqueId === uniqueId && d.serviceId === serviceId && d.stepId === step?._id);

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
      uniqueId: uniqueId,
      serviceId: serviceId,
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
        getServiceData();
        if (step?.isPassFail) {
          const type = automatePassFail(values, step);
          handlePassFail(type, step?._id);
        }
        setSelectedStep(null);
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
        uniqueId: uniqueId,
        serviceId: serviceId,
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
        uniqueId: uniqueId,
        serviceId: serviceId,
        stepId: stepId,
        passFailStatus: type
      })
      .then(({ data }) => {
        const result = data?.data;
        if (type === WORKORDER_SERVICE_STEP_STATUS.passed && result?.isPassAddon && result?.passAddon?.length) {
          setAddServiceConfirmation({ open: true, services: result?.passAddon });
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isFailAddon && result?.failAddon?.length) {
          setAddServiceConfirmation({ open: true, services: result?.failAddon });
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

  return stepList?.length ? (
    <Box className={classes.mainContainer} sx={{ position: 'relative', overflow: 'hidden' }} style={{ backgroundColor: 'rgba(242, 243, 247, 0.9)' }}>
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
                backgroundColor: selectedStep?._id === step._id ? '#ECFDF7' : '#FFFFFF'
              }}
              className={`${classes.accordionHeading} ${
                [WORKORDER_SERVICE_STEP_STATUS.passed, WORKORDER_SERVICE_STEP_STATUS.completed].includes(stepData?.passFailStatus) && classes.green
              } ${stepData?.passFailStatus === WORKORDER_SERVICE_STEP_STATUS.failed && classes.red}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!stepData?.status) return;
                setSelectedStep(step);
                setStepState(stepData);
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', marginLeft: '-10px', marginTop: '-10px' }}>
                <Box sx={{ display: 'flex', paddingLeft: '10px', paddingTop: '10px' }}>
                  <Box sx={{ padding: '0 20px 0 0' }}>
                    <Checkbox className={classes.checkbox} aria-label="Step Selected checkbox" checked={selectedStep?._id === step._id} />
                  </Box>
                  <Box>
                    <Chip color="primary" label={`${serviceIndex}.${index + 1}`} />
                  </Box>
                  <Box ml={1}>
                    <Typography className={classes.heading} style={{ fontWeight: '600' }}>
                      {step.stepName}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ justifyContent: 'flex-end', paddingLeft: '10px', paddingTop: '10px' }}>
                  {!stepData?.status ? (
                    <Box>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        disabled={!allowedToEdit}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedServiceStatus === WORKORDER_SERVICE_STATUS.pending) {
                            updateServiceStatus(uniqueId, WORKORDER_SERVICE_STATUS.inProgress);
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
              {/* <Box>
                <Grid container>
                  {stepData?.startDate ? (
                    <Grid item style={{ paddingTop: '20px', paddingRight: '20px', flexGrow: 1 }}>
                      <Typography variant="caption">Start By</Typography>
                      <Typography variant="body2"> {stepData?.startedBy?.optionLabel}</Typography>
                      <Typography variant="caption"> {moment(stepData?.startDate).format(dateTimeFormat)}</Typography>
                    </Grid>
                  ) : null}
                  {stepData?.endDate ? (
                    <Grid item style={{ paddingTop: '20px', paddingRight: '20px', flexGrow: 1 }}>
                      <Typography variant="caption">End By</Typography>
                      <Typography variant="body2"> {stepData?.endedBy?.optionLabel}</Typography>
                      <Typography variant="caption"> {moment(stepData?.endDate).format(dateTimeFormat)}</Typography>
                    </Grid>
                  ) : null}
                  {stepData?.startDate && stepData?.endDate ? (
                    <Grid item style={{ paddingTop: '20px', flexGrow: 1 }}>
                      <Typography variant="caption">Duration</Typography>
                      <Typography variant="body2">{`${moment(stepData?.endDate).diff(moment(stepData?.startDate), 'hours')} hours`}</Typography>
                    </Grid>
                  ) : null}
                </Grid>
              </Box> */}
            </Box>
          );
        })}
      </div>
      {/* {Boolean(selectedStep) && (
        <StepFieldsDialog
          isOpen={Boolean(selectedStep)}
          fieldData={getFields(selectedStep)?.fieldData}
          handleClose={() => setSelectedStep(null)}
          handleSubmit={handleSubmit}
          step={selectedStep}
        />
      )} */}
      <StepFieldsDialog
        isOpen={Boolean(selectedStep)}
        fieldData={getFields(selectedStep)?.fieldData}
        handleClose={() => setSelectedStep(null)}
        handleSubmit={handleSubmit}
        step={selectedStep}
        stepData={stepState}
      />
      {addServiceConfirmation.open && (
        <ConfirmationDialog
          open={true}
          message={`You have to add addional services based on your recent action - ${addServiceConfirmation.services
            ?.map((e) => e.serviceName)
            ?.toString()}`}
          onClose={() => {
            setAddServiceConfirmation({ open: false, services: [] });
          }}
          onOk={() => {
            handleAddService(
              addServiceConfirmation.services?.map((e) => e._id),
              uniqueId
            );
            setAddServiceConfirmation({ open: false, services: [] });
          }}
        />
      )}
      {addServiceConfirmation.open && (
        <ConfirmationDialog
          open={true}
          message={`You have to add addional services based on your recent action - ${addServiceConfirmation.services
            ?.map((e) => e.serviceName)
            ?.toString()}`}
          onClose={() => {
            setAddServiceConfirmation({ open: false, services: [] });
          }}
          onOk={() => {
            handleAddService(
              addServiceConfirmation.services?.map((e) => e._id),
              uniqueId
            );
            setAddServiceConfirmation({ open: false, services: [] });
          }}
        />
      )}
    </Box>
  ) : (
    <Box p={2} height={500} bgcolor="white">
      <CommonSkeleton lenArray={[...Array(10).keys()]} />
    </Box>
  );
};
export default Service;

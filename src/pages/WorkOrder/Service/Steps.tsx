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
  yupSchema
} from 'src/constants/helpers';
import { Box, Divider, Grid, Badge, Accordion, AccordionDetails, AccordionSummary, Typography, Chip } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import moment from 'moment';
import { RiShareForwardFill } from 'react-icons/ri';
import { TiArrowBack } from 'react-icons/ti';
import FormTypes from 'src/components/Helpers/FormTypes';
import { FaDiceOne } from 'react-icons/fa';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

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
      '&.Mui-expanded': {
        minHeight: 'unset !important',
        borderBottom: '1px solid hsl(0deg 0% 70%)'
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
    red: { backgroundColor: 'rgba(255,0,0,.1)' }
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
  allowedToEdit
}) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const [currentStep, setCurrentStep] = useState(0);

  const [stepList, setStepList] = useState([]);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [addServiceConfirmation, setAddServiceConfirmation] = useState({ open: false, services: [] });
  const [disabledFieldSteps, setDisabledFieldSteps] = useState([]);

  useEffect(() => {
    axiosInstance()
      .get(`${workOrder.api}/service/detail/${serviceId}`)
      .then(({ data: { data } }) => {
        setServiceDetails(data);
        const steps = data?.steps?.map((d) => d.stepName);
        setStepList(steps);
        var curStep = 0;
        const compltedSteps = serviceData?.filter((e) => e.uniqueId === serviceDetails?._id && e.status === 'end');
        if (compltedSteps?.length < steps?.length) {
          curStep = compltedSteps?.length;
        } else if (compltedSteps?.length === steps?.length) {
          curStep = compltedSteps?.length - 1;
        }
        setCurrentStep(curStep);
        setDisabledFieldSteps(serviceData.filter((d) => d.uniqueId === uniqueId && d.serviceId === serviceId && ['Pass', 'Complete', 'Fail'].includes(d?.passFailStatus)).map(d => d.stepId))
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [serviceId]);

  const handleNext = () => {
    setCurrentStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setCurrentStep((prevActiveStep) => prevActiveStep - 1);
  };

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
    return { fieldData, stepData };
  };

  const handleSubmit = async (values, stepId) => {
    let tempData = {
      uniqueId: uniqueId,
      serviceId: serviceId,
      stepId: stepId
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
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/pass-fail`, {
        uniqueId: uniqueId,
        serviceId: serviceId,
        stepId: stepId,
        passFailStatus: type
      })
      .then(({ data }) => {
        const result = data?.data;
        if (type === 'Pass' && result?.isPassAddon && result?.passAddon?.length) {
          setAddServiceConfirmation({ open: true, services: result?.passAddon });
        } else if (type === 'Fail' && result?.isFailAddon && result?.failAddon?.length) {
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
    handleNext();
  };

  function validate(values) {
    const errors = {};
    return errors;
  }

  return stepList?.length ? (
    <Box>
      <div className={classes.root}>
        {serviceDetails?.steps?.map((step, index) => {
          const { fieldData, stepData } = getFields(step);
          return (
            <Accordion key={step._id} className={classes.accordion}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
                className={`${classes.accordionHeading} ${['Pass', 'Complete'].includes(stepData?.passFailStatus) && classes.green} ${stepData?.passFailStatus === 'Fail' && classes.red
                  }`}
              >
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box mr={2} className={classes.badge}>
                    {index + 1}
                  </Box>
                  <Typography className={classes.heading} style={{ fontWeight: '600' }}>
                    {step.stepName}
                  </Typography>
                </div>
                {stepData?.passFailStatus ? (
                  <Box ml={1}>
                    <Chip label={stepData?.passFailStatus} variant="outlined" color="primary" />
                  </Box>
                ) : null}
              </AccordionSummary>
              <AccordionDetails style={{ display: 'block', padding: '16px' }}>
                {!stepData?.status || stepData?.status === 'start' ? (
                  <>
                    {!stepData?.status ? (
                      <Box mb={2}>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          disabled={!allowedToEdit}
                          onClick={() => {
                            if (selectedServiceStatus === WORKORDER_SERVICE_STATUS.pending) { updateServiceStatus(uniqueId, WORKORDER_SERVICE_STATUS.inProgress) }
                            handleStartEnd('start', step._id);
                          }}
                        >
                          Start
                        </Button>
                      </Box>
                    ) : null}
                    {stepData?.status === 'start' ? (
                      step?.isPassFail ?
                        <Box display="flex" mb={2}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => {
                              handlePassFail('Pass', step._id);
                            }}
                          >
                            Pass
                          </Button>
                          <Box marginX={1} />
                          <DeleteButton
                            text="Fail"
                            onClick={() => handlePassFail('Fail', step._id)}
                          />
                        </Box>
                        :
                        <Box display="flex" mb={2}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => {
                              handlePassFail('Complete', step._id);
                            }}
                          >
                            Complete
                          </Button>
                        </Box>
                    ) : null}
                  </>
                ) : null}
                {fieldData.fields.length ? (
                  <>
                    <Formik
                      initialValues={fieldData.values}
                      validationSchema={yupSchema(fieldData.fields)}
                      onSubmit={(values) => handleSubmit(values, step._id)}
                      validate={validate}
                      enableReinitialize
                    >
                      {({ values, errors, setFieldValue, touched, submitForm }) => (
                        <Fragment>
                          <Form autoComplete="off" autoCorrect="off" noValidate>
                            {fieldData.formsData.length > 0 &&
                              fieldData.formsData?.map((form, index1) => {
                                return form?.name ? (
                                  <div key={index1}>
                                    <div className="detail-box-content">
                                      <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                                      <h2 className="form-label-style form-label-quotes">{form?.name}</h2>
                                    </div>
                                    <Box marginY={2}>
                                      <Grid spacing={3} container>
                                        {form?.sectionFields?.map((field, index2) => (
                                          <Grid key={index2} item xs={12} sm={6} md={6}>
                                            {
                                              <FormTypes
                                                {...field}
                                                fieldData={field}
                                                disabled={disabledFieldSteps.includes(step._id) || (Boolean(workOrderId) && field.disableOnEdit)}
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                label={field.fieldLabel}
                                                name={field.fieldName}
                                                type={field.type}
                                                options={field.option}
                                                setFieldValue={(name, value) => {
                                                  setFieldValue(name, value);
                                                }}
                                                required={field.required}
                                                fullWidth
                                                isTooltip={field?.isTooltip || false}
                                                tooltipMessage={field?.tooltipMessage}
                                                size="small"
                                                imageOrFileUploadCompletePercentage={null}
                                              />
                                            }
                                          </Grid>
                                        ))}
                                      </Grid>
                                    </Box>
                                  </div>
                                ) : (
                                  form?.sectionFields.map((field) => (
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
                                      disabled={disabledFieldSteps.includes(step._id) || (Boolean(workOrderId) && field.disableOnEdit)}
                                      isNew={Boolean(workOrderId)}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      style={{ visibility: 'hidden' }}
                                    />
                                  ))
                                );
                              })}
                          </Form>
                          <Box display="flex" justifyContent="flex-end">
                            {disabledFieldSteps.includes(step._id) ? <CustomButton
                              variant="contained"
                              color="primary"
                              type="submit"
                              disabled={!allowedToEdit}
                              onClick={(e) => {
                                setDisabledFieldSteps(disabledFieldSteps.filter(d => d !== step._id))
                              }}
                            >
                              {' '}
                              Edit
                            </CustomButton>
                              : <CustomButton
                                variant="contained"
                                color="primary"
                                type="submit"
                                disabled={!allowedToEdit}
                                onClick={(e) => {
                                  e.preventDefault();
                                  // handleScroll(errors);
                                  submitForm();
                                }}
                              >
                                {' '}
                                Save
                              </CustomButton>}
                          </Box>
                        </Fragment>
                      )}
                    </Formik>
                  </>
                ) : null}
                <Box>
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
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </div>

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
  ) : <Box p={2} height={500} bgcolor="white">
    <CommonSkeleton lenArray={[...Array(10).keys()]} />
  </Box>;
};
export default Service;

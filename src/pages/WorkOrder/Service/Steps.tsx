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
import { Box, Divider, Grid, IconButton, Accordion, AccordionDetails, AccordionSummary, Typography } from '@material-ui/core';
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

const STEP_WIDTH = 200;
const ICON_WIDTH = 40;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%'
    },
    backButton: {
      marginRight: theme.spacing(1)
    },
    heading: {
      fontSize: theme.typography.pxToRem(16)
    }

    // pbStepper: {
    //   paddingBottom: '50px',
    //   overflow: 'auto',
    //   [theme.breakpoints.down('xs')]: {
    //     overflow: 'auto'
    //   }
    // },
    // instructions: {
    //   marginTop: theme.spacing(1),
    //   marginBottom: theme.spacing(1)
    // },
    // stepContent: {
    //   margin: theme.spacing(1)
    // },
    // stepTitle: {
    //   textOverflow: 'ellipsis',
    //   overflow: 'hidden',
    //   display: '-webkit-box !important',
    //   '-webkit-line-clamp': '2',
    //   '-webkit-box-orient': 'vertical',
    //   whiteSpace: 'normal',
    //   paddingTop: '0 !important',
    //   paddingBottom: '0 !important',
    //   height: '32px',
    //   marginBottom: '5px'
    // }
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
  updateServiceStatus
}) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  // const [currentStep, setCurrentStep] = useState(0);
  // const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });

  const [stepList, setStepList] = useState([]);
  // const [stepId, setStepId] = useState(null);
  // const [stepData, setStepData] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);
  // const [disabledNextStep, setDisabledNextStep] = useState(true);
  const [addServiceConfirmation, setAddServiceConfirmation] = useState({ open: false, services: [] });

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
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [serviceId]);

  // useEffect(() => {
  //   if (currentStep > -1) {
  //     // setInitialDataFields();
  //   }
  // }, [currentStep, serviceData, serviceDetails]);

  // const setInitialDataFields = () => {
  //   setInitialData({ fields: [], values: {} });
  //   if (serviceDetails?.steps?.length) {
  //     let fieldsDataForCreate = serviceDetails?.steps[currentStep]?.fields ? serviceDetails?.steps[currentStep]?.fields : [];
  //     if (serviceDetails?.steps[currentStep]) {
  //       setStepId(serviceDetails?.steps[currentStep]?._id);
  //     }
  //     let tempServiceData = serviceData.find(
  //       (d) => d.uniqueId === uniqueId && d.serviceId === serviceId && d.stepId === serviceDetails?.steps[currentStep]?._id
  //     );
  //     if (tempServiceData) {
  //       setStepData(tempServiceData);
  //       setInitialData({
  //         fields: setFieldsInAscendingOrder(fieldsDataForCreate),
  //         values: getObjKeysWithValues(tempServiceData, fieldsDataForCreate)
  //       });
  //     } else {
  //       setStepData(null);
  //       setInitialData({ fields: setFieldsInAscendingOrder(fieldsDataForCreate), values: getObjKeys('', fieldsDataForCreate) });
  //     }
  //     if (tempServiceData && tempServiceData?.status === 'end') {
  //       setDisabledNextStep(false);
  //     } else {
  //       setDisabledNextStep(true);
  //     }
  //   }
  // };

  // const handleNext = () => {
  //   setCurrentStep((prevActiveStep) => prevActiveStep + 1);
  // };

  // const handleBack = () => {
  //   setCurrentStep((prevActiveStep) => prevActiveStep - 1);
  // };

  const getFields = (step) => {
    let stepData = null;
    let fieldData = { fields: [], values: {} };
    if (step?.fields?.length) {
      let fieldsDataForCreate = step?.fields ? step?.fields : [];
      let tempServiceData = serviceData.find((d) => d.uniqueId === uniqueId && d.serviceId === serviceId && d.stepId === step?._id);

      if (tempServiceData) {
        stepData = tempServiceData;
        fieldData = {
          fields: setFieldsInAscendingOrder(fieldsDataForCreate),
          values: getObjKeysWithValues(tempServiceData, fieldsDataForCreate)
        };
      } else {
        fieldData = { fields: setFieldsInAscendingOrder(fieldsDataForCreate), values: getObjKeys('', fieldsDataForCreate) };
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
  };

  function validate(values) {
    const errors = {};
    return errors;
  }

  // const handleScroll = (errors) => {
  //   const err = Object.keys(errors);
  //   if (err.length) {
  //     const input = document.querySelector(`input[name=${err[0]}]`);
  //     input.scrollIntoView({
  //       behavior: 'smooth',
  //       block: 'center',
  //       inline: 'start'
  //     });
  //   }
  // };

  // const scrollRight = (elm) => {
  //   elm.scrollLeft -= STEP_WIDTH;
  // };
  // const scrollLeft = (elm) => {
  //   elm.scrollLeft += STEP_WIDTH;
  // };

  // const stepContainer = React.useRef<HTMLHeadingElement>(null);

  return stepList?.length ? (
    <Box>
      <div className={classes.root}>
        {serviceDetails?.steps?.map((step) => {
          const { fieldData, stepData } = getFields(step);
          console.log(step);
          return (
            <Accordion key={step._id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2a-content" id="panel2a-header">
                <Typography className={classes.heading} style={{ fontWeight: '600' }}>
                  {step.stepName}
                </Typography>
              </AccordionSummary>
              <AccordionDetails style={{ display: 'block' }}>
                {!stepData?.status || stepData?.status === 'start' ? (
                  <>
                    {!stepData?.status ? (
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => {
                          handleStartEnd('start', step._id);
                        }}
                      >
                        Start
                      </Button>
                    ) : null}
                    {stepData?.status === 'start' ? (
                      <Box display="flex">
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
                        <DeleteButton text="Fail" onClick={() => handlePassFail('Fail', step._id)} />
                      </Box>
                    ) : null}
                  </>
                ) : null}
                {/* // data start */}
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
                            {fieldData.fields.length > 0 &&
                              fieldData.fields?.map((form, index1) => {
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
                                      disabled={Boolean(workOrderId) && field.disableOnEdit}
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
                          <Box display="flex" justifyContent="flex-end" pt={2}>
                            <CustomButton
                              variant="contained"
                              color="primary"
                              type="submit"
                              onClick={(e) => {
                                e.preventDefault();
                                // handleScroll(errors);
                                submitForm();
                              }}
                            >
                              {' '}
                              Save
                            </CustomButton>
                          </Box>
                        </Fragment>
                      )}
                    </Formik>
                    <Divider style={{ marginTop: '8px' }} />
                  </>
                ) : (
                  <Box p={3} textAlign="center">
                    <Typography variant="h5">📪 Empty</Typography>
                  </Box>
                )}
                <Box mt={2}>
                  <Grid container justifyContent="space-between" spacing={1} style={{ maxWidth: '833px', margin: '0 auto' }}>
                    {stepData?.startDate ? (
                      <Grid item>
                        <Typography variant="caption">Start By</Typography>
                        <Typography variant="body2"> {stepData?.startedBy?.optionLabel}</Typography>
                        <Typography variant="caption"> {moment(stepData?.startDate).format(dateTimeFormat)}</Typography>
                      </Grid>
                    ) : null}
                    {stepData?.endDate ? (
                      <Grid item>
                        <Typography variant="caption">End By</Typography>
                        <Typography variant="body2"> {stepData?.endedBy?.optionLabel}</Typography>
                        <Typography variant="caption"> {moment(stepData?.endDate).format(dateTimeFormat)}</Typography>
                      </Grid>
                    ) : null}
                    {stepData?.startDate && stepData?.endDate ? (
                      <Grid item>
                        <Typography variant="caption">Duration</Typography>
                        <Typography variant="body2">{`${moment(stepData?.endDate).diff(moment(stepData?.startDate), 'hours')} hours`}</Typography>
                      </Grid>
                    ) : null}
                    {stepData?.passFailStatus ? (
                      <Grid item>
                        <Typography variant="caption">Status</Typography>
                        <Typography variant="body2">{`${stepData?.passFailStatus} `}</Typography>
                      </Grid>
                    ) : null}
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </div>
      {/* 
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexBasis: `${ICON_WIDTH}px` }}>
          <IconButton
            color="primary"
            onClick={() => {
              scrollRight(stepContainer.current);
              handleBack();
            }}
            size="small"
            disabled={currentStep === 0}
          >
            <TiArrowBack size={25} />
          </IconButton>
        </Box>

        <div style={{ overflow: 'auto', flexBasis: `calc(100% - ${ICON_WIDTH * 2}px)` }} id="scroller_id">
          <Stepper
            className={`${classes.pbStepper} stepper-responsive mt-2`}
            activeStep={currentStep}
            alternativeLabel
            ref={stepContainer}
            style={{ scrollBehavior: 'smooth' }}
          >
            {stepList?.map((label) => (
              <Step key={label} style={{ minWidth: `${STEP_WIDTH}px` }}>
                <StepLabel>
                  <Box className={`${classes.stepTitle}`}>{label}</Box>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </div>
        <Box sx={{ flexBasis: `${ICON_WIDTH}px` }}>
          <IconButton
            color="primary"
            onClick={() => {
              scrollLeft(stepContainer.current);
              handleNext();
            }}
            size="small"
            disabled={currentStep === stepList?.length - 1 || disabledNextStep}
          >
            <RiShareForwardFill size={25} />
          </IconButton>
        </Box>
      </Box>
     
      {!stepData?.status || stepData?.status === 'start' ? (
        <Fragment>
          <Box p={2}>
            {!stepData?.status ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => {
                  handleStartEnd('start');
                  if (selectedServiceStatus === WORKORDER_SERVICE_STATUS.pending) {
                    updateServiceStatus(uniqueId, WORKORDER_SERVICE_STATUS.inProgress)
                  }
                }}
              >
                Start
              </Button>
            ) : null}
            {stepData?.status === 'start' ? (
              <Box display="flex">
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => {
                    handlePassFail('Pass');
                  }}
                >
                  Pass
                </Button>
                <Box marginX={1} />
                <DeleteButton text="Fail" onClick={() => handlePassFail('Fail')} />
              </Box>
            ) : null}
          </Box>
        </Fragment>
      ) : null}
     
      {initialData.fields.length ? (
        <Fragment>
          <Box p={2}>
            <Formik
              initialValues={initialData.values}
              validationSchema={yupSchema(initialData.fields)}
              onSubmit={handleSubmit}
              validate={validate}
              enableReinitialize
            >
              {({ values, errors, setFieldValue, touched, submitForm }) => (
                <Fragment>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {initialData.fields.length > 0 &&
                      initialData.fields?.map((form, index1) => {
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
                              disabled={Boolean(workOrderId) && field.disableOnEdit}
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
                  <Box display="flex" justifyContent="flex-end" pt={2}>
                    <CustomButton
                      variant="contained"
                      color="primary"
                      type="submit"
                      onClick={(e) => {
                        e.preventDefault();
                        handleScroll(errors);
                        submitForm();
                      }}
                    >
                      {' '}
                      Save
                    </CustomButton>
                  </Box>
                </Fragment>
              )}
            </Formik>
          </Box>
          <Divider />
        </Fragment>
      ) : null} */}

      {/* <Box m={2}>
        <Grid container>
          <Grid item xs={12}>
            <Box display="flex">
              {stepData?.startDate ? (
                <Box>
                  <Typography variant="caption">Start By</Typography>
                  <Typography variant="body2"> {stepData?.startedBy?.optionLabel}</Typography>
                  <Typography variant="caption"> {moment(stepData?.startDate).format(dateTimeFormat)}</Typography>
                </Box>
              ) : null}
              {stepData?.endDate ? (
                <Box ml={2}>
                  <Typography variant="caption">End By</Typography>
                  <Typography variant="body2"> {stepData?.endedBy?.optionLabel}</Typography>
                  <Typography variant="caption"> {moment(stepData?.endDate).format(dateTimeFormat)}</Typography>
                </Box>
              ) : null}
              {stepData?.startDate && stepData?.endDate ? (
                <Box ml={2}>
                  <Typography variant="caption">Duration</Typography>
                  <Typography variant="body2">{`${moment(stepData?.endDate).diff(moment(stepData?.startDate), 'hours')} hours`}</Typography>
                </Box>
              ) : null}
              {stepData?.passFailStatus ? (
                <Box ml={2}>
                  <Typography variant="caption">Status</Typography>
                  <Typography variant="body2">{`${stepData?.passFailStatus} `}</Typography>
                </Box>
              ) : null}
            </Box>
          </Grid>
        </Grid>
      </Box> */}
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
  ) : null;
};
export default Service;

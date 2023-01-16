import React from 'react';
import { Dialog, Box, Grid, Button, Typography, IconButton } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from 'src/components/Helpers/FormTypes';
import { workOrder, WORKORDER_SERVICE_STEP_STATUS, yupSchema, convertMsToTime } from 'src/constants/helpers';
import { dateTimeFormat } from 'src/constants/helpers';
import moment from 'moment';
import styles from './StepFieldsDialog.module.scss';
import CloseIcon from '@material-ui/icons/Close';
import Details from 'src/components/Shared/DetailsPage';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import SettingsIcon from '@material-ui/icons/Settings';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import axiosInstance from 'src/axios/axiosInstance';

const StepFieldsDialog = ({ handleClose, handleSubmit, fieldData, step, workOrderId, stepData, isStepValid, referencType, allowedToEdit, selectedService = null }) => {

  const [isEditing, setEditing] = React.useState(false);
  const [viewStep, setViewStep] = React.useState(false);

  const steps = selectedService?.steps || [];

  const RenderStepData = () => {

    const [time, setTime] = React.useState(convertMsToTime(
      stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start ?
        (stepData?.duration || 0) + (new Date().getTime() - new Date(stepData?.pauseDate || stepData?.startDate).getTime()) : (stepData?.duration || 0)));

    React.useEffect(() => {
      if (stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start) {
        const interval = setInterval(() => {
          setTime(convertMsToTime((stepData?.duration || 0) + (new Date().getTime() - new Date(stepData?.pauseDate || stepData?.startDate).getTime())));
        }, 1000);
        return () => {
          clearInterval(interval);
        };
      }
    }, [stepData]);

    return (
      <Grid container spacing={2} alignItems="center">
        {stepData?.startDate ? (
          <Grid item style={{ paddingRight: '20px', flexGrow: 1 }}>
            <Typography variant="caption">Clock In</Typography>
            <Typography variant="body2"> {stepData?.startedBy?.optionLabel}</Typography>
            <Typography variant="caption"> {moment(stepData?.startDate).format(dateTimeFormat)}</Typography>
          </Grid>
        ) : null}
        {stepData?.endDate ? (
          <Grid item style={{ paddingRight: '20px', flexGrow: 1 }}>
            <Typography variant="caption">Clock Out</Typography>
            <Typography variant="body2"> {stepData?.endedBy?.optionLabel}</Typography>
            <Typography variant="caption"> {moment(stepData?.endDate).format(dateTimeFormat)}</Typography>
          </Grid>
        ) : null}
        {stepData?.startDate &&
          <Grid item style={{ flexGrow: 1 }}>
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
          </Grid>
        }
      </Grid>
    );
  };

  const handleUpdateStep = (values: any) => {
    axiosInstance().put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/update-step`, values)
      .then(({ data }) => {
        setViewStep(false);
        handleClose()
      })
      .catch((err) => {
      });
  };

  return (
    <>
      <div className={`${styles.sidebarContainer} ${styles.active}`}>
        <div className={styles.headersection}>
          <Typography variant="h6" color="inherit" style={{ fontSize: '1rem' }}>
            {step?.stepName}
          </Typography>
          <div className={styles.headerControls}>
            <IconButton aria-label="close" onClick={handleClose} size="small" color="inherit">
              <CloseIcon color="inherit" />
            </IconButton>
          </div>
        </div>
        <Formik
          initialValues={fieldData?.values}
          validationSchema={yupSchema(fieldData?.fields)}
          onSubmit={(values) => handleSubmit(values, step)}
          enableReinitialize
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <div className={styles.content}>
                {fieldData?.fields?.length ?
                  isStepValid && !isEditing ? (
                    <Details
                      containerPadding={'0px'}
                      gridSize={12}
                      data={fieldData.values}
                      fields={fieldData.fields.map((f) => ({ fieldData: f }))}
                    />
                  ) : (
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                      {fieldData?.formsData.length > 0 &&
                        fieldData?.formsData?.map((form, index1) => {
                          return form?.name ? (
                            <div key={index1}>
                              <div className={`detail-box-content ${styles.formHead}`} style={{ color: 'white' }}>
                                <FaDiceOne size={16} color={'inherit'} style={{ marginRight: '5px', float: 'left' }} />
                                <h2>{form?.name}</h2>
                              </div>
                              <Box marginY={2}>
                                <Grid spacing={2} container>
                                  {form?.sectionFields?.map((field, index2) => (
                                    <Grid key={index2} item xs={12}>
                                      <FormTypes
                                        {...field}
                                        row={field.type === 'radio'}
                                        fieldData={field}
                                        disabled={field.disableOnEdit}
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
                                disabled={field.disableOnEdit}
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
                  ) :
                  <div className={styles.centerText}>
                    <Typography variant={'body1'} style={{ color: 'var(--new_theme_color)' }}>
                      No Fields...
                    </Typography>
                  </div>}
                <Box mt={2} className={styles.dates}>
                  <RenderStepData />
                </Box>
              </div>
              <div
                className={styles.footerSection}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                {allowedToEdit ?
                  <IconButton
                    aria-label="close"
                    onClick={() => {
                      setViewStep(true);
                    }}
                    size="small"
                    color="inherit"
                  >
                    <SettingsIcon color="inherit" />
                  </IconButton> : <div />}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'right'
                  }}
                >
                  {isStepValid && !isEditing ? (
                    <>
                      <Button variant="outlined" size="small" onClick={handleClose} color="primary">
                        Close
                      </Button>
                      <Box ml={1} />
                      <Button variant="contained" size="small" onClick={() => setEditing(true)} color="primary">
                        Edit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outlined" size="small" onClick={handleClose} color="primary">
                        Cancel
                      </Button>
                      <Box ml={1} />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          submitForm();
                          setEditing(false);
                        }}
                        color="primary"
                      >
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </Formik>
      </div>
      {viewStep && (
        <StepDialog
          handleClose={() => {
            setViewStep(false);
          }}
          handleSucess={(data) => {
            handleUpdateStep(data)
          }}
          stepId={''}
          stepData={step}
          notEditable={referencType === "workOrderTechnician" ? true : step?.customStep === true ? false : true}
          steps={steps}
          reference={'workOrder'}
          workOrderId={workOrderId}
          serviceId={selectedService?._id}
          uniqueId={selectedService?.uniqueId}
        />
      )}
    </>
  );
};

export default StepFieldsDialog;

import React from 'react';
import { Dialog, Box, Grid, Button, Typography, IconButton } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from 'src/components/Helpers/FormTypes';
import { yupSchema } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

import { dateTimeFormat } from 'src/constants/helpers';
import moment from 'moment';
import { isMobile, isTablet } from 'react-device-detect';
import styles from './StepFieldsDialog.module.scss';
import CloseIcon from '@material-ui/icons/Close';
import Details from 'src/components/Shared/DetailsPage';

const StepFieldsDialog = ({ handleClose, handleSubmit, fieldData, step, isOpen, stepData, isStepValid }) => {
  const [fullScreen, setFullScreen] = React.useState(isMobile || isTablet);
  const [isEditing, setEditing] = React.useState(false);

  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }

  function convertMsToTime(stepData) {
    let startTime = new Date(stepData?.startDate);
    let endTime = new Date(stepData?.endDate);
    let milliseconds = endTime.getTime() - startTime.getTime();
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    let time = '';

    if (hours === 0) {
      time = `${padTo2Digits(minutes)} minutes`;
    }

    if (hours > 0 && hours < 24) {
      time = `${padTo2Digits(hours)} hours, ${padTo2Digits(minutes)} minutes`;
    }

    if (hours >= 24) {
      time = `${padTo2Digits(hours / 24)} days`;
    }
    return time;
  }

  return (
    <>
      <div className={`${styles.sidebarContainer} ${isOpen && styles.active}`}>
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
        {fieldData?.fields.length ? (
          <Formik
            initialValues={fieldData?.values}
            validationSchema={yupSchema(fieldData?.fields)}
            onSubmit={(values) => handleSubmit(values, step)}
            enableReinitialize
          >
            {({ values, errors, setFieldValue, touched, submitForm }) => (
              <>
                <div className={styles.content}>
                  {isStepValid && !isEditing ? (
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
                              <div className={`detail-box ${styles.formHead}`} style={{ color: 'gray', padding: '0' }}>
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
                  )}
                  <Box mt={2} className={styles.dates}>
                    <Grid container spacing={2}>
                      {stepData?.startDate ? (
                        <Grid item style={{ paddingRight: '20px', flexGrow: 1 }}>
                          <Typography variant="caption">Start By</Typography>
                          <Typography variant="body2"> {stepData?.startedBy?.optionLabel}</Typography>
                          <Typography variant="caption"> {moment(stepData?.startDate).format(dateTimeFormat)}</Typography>
                        </Grid>
                      ) : null}
                      {stepData?.endDate ? (
                        <Grid item style={{ paddingRight: '20px', flexGrow: 1 }}>
                          <Typography variant="caption">End By</Typography>
                          <Typography variant="body2"> {stepData?.endedBy?.optionLabel}</Typography>
                          <Typography variant="caption"> {moment(stepData?.endDate).format(dateTimeFormat)}</Typography>
                        </Grid>
                      ) : null}
                      {stepData?.startDate && stepData?.endDate ? (
                        <Grid item style={{ flexGrow: 1 }}>
                          <Typography variant="caption">Duration</Typography>
                          <Typography variant="body2">{convertMsToTime(stepData)}</Typography>
                        </Grid>
                      ) : null}
                    </Grid>
                  </Box>
                </div>

                <div className={styles.footerSection}>
                  {isStepValid && !isEditing ? (
                    <>
                      <Button variant="outlined" size="small" onClick={handleClose} color="primary">
                        Close
                      </Button>
                      <Button variant="contained" size="small" onClick={() => setEditing(true)} color="primary">
                        Edit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outlined" size="small" onClick={() => setEditing(false)} color="primary">
                        Cancel
                      </Button>
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
              </>
            )}
          </Formik>
        ) : null}
      </div>
    </>
  );
};

export default StepFieldsDialog;

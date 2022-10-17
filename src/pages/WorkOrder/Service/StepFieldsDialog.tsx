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

const StepFieldsDialog = ({ handleClose, handleSubmit, fieldData, step, isOpen, stepData }) => {
  const [fullScreen, setFullScreen] = React.useState(isMobile || isTablet);

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
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {fieldData?.formsData.length > 0 &&
                      fieldData?.formsData?.map((form, index1) => {
                        return form?.name ? (
                          <div key={index1}>
                            <div className={`detail-box ${styles.formHead}`} style={{ color: 'gray', padding: '8px 0' }}>
                              <FaDiceOne size={16} color={'inherit'} style={{ marginRight: '5px', float: 'left' }} />
                              <h2>{form?.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
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
                  <Box>
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
                          <Typography variant="body2">{`${moment(stepData?.endDate).diff(moment(stepData?.startDate), 'hours')} hours`}</Typography>
                        </Grid>
                      ) : null}
                    </Grid>
                  </Box>
                </div>

                <div className={styles.footerSection}>
                  <Button variant="outlined" size="small" onClick={handleClose} color="primary">
                    Cancel
                  </Button>
                  <Button variant="contained" size="small" onClick={submitForm} color="primary">
                    Save
                  </Button>
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

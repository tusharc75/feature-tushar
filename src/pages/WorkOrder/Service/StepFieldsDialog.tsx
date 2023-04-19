import React, { useContext } from 'react';
import { Dialog, Box, Grid, Button, Typography, IconButton } from '@material-ui/core';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
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
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { RenderPassFailChip } from './Steps';
import { MdKeyboardArrowDown } from 'react-icons/md';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    stepTags: {
      minHeight: '26px',
      paddingInline: '5px',
      fontWeight: 500
    },
    sectionContainer: {
      padding: '0 25px 18px',
      marginTop: '20px'
    },
    sectionHead: {
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#5B5B5B',
      '& span': {
        background: '#DBDBDBE5',
        color: '#5B5B5B',
        fontWeight: 600,
        width: '19px',
        height: '19px',
        fontSize: '16px',
        borderRadius: '3px',
        display: 'inline-grid',
        placeItems: 'center',
        marginRight: '6px',
        verticalAlign: 'text-top'
      }
    },
    sectionRow: {
      '& > div': {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBlock: '11px',
        gap: '23px'
      }
    },
    sectionColTItle: {
      flexBasis: '125px',
      fontWeight: 500,
      fontSize: '12px',
      lineHeight: '1.5',
      color: '#8A8A8A'
    },
    sectionColDetail: {
      fontWeight: 400,
      fontSize: '12px',
      lineHeight: 1.5,
      color: '#5B5B5B',
      textTransform: 'capitalize'
    },
    centerText: {
      textAlign: 'center',
      marginBlock: '30px'
    }
  })
);

const StepFieldsDialog = ({
  handleClose,
  handleSubmit,
  fieldData,
  step,
  workOrderId,
  stepData,
  referencType,
  allowedToEdit,
  selectedService = null,
  eidtable = true
}) => {
  const classes = useStyles();
  const {
    state: {
      user: { user }
    }
  } = useData();

  const [isEditing, setEditing] = React.useState(eidtable);
  const [viewStep, setViewStep] = React.useState(false);
  const toastConfig = useContext(CustomToastContext);

  const steps = selectedService?.steps || [];

  const RenderStepData = () => {
    const [time, setTime] = React.useState(
      user?.brandPolicy?.workOrderTimer
        ? convertMsToTime(
            stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start
              ? (stepData?.duration || 0) + (new Date().getTime() - new Date(stepData?.pauseDate || stepData?.startDate).getTime())
              : stepData?.duration || 0
          )
        : null
    );

    React.useEffect(() => {
      if (stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start && user?.brandPolicy?.workOrderTimer) {
        const interval = setInterval(() => {
          setTime(
            convertMsToTime((stepData?.duration || 0) + (new Date().getTime() - new Date(stepData?.pauseDate || stepData?.startDate).getTime()))
          );
        }, 1000);
        return () => {
          clearInterval(interval);
        };
      }
    }, [stepData]);

    return (
      <div className={classes.sectionContainer}>
        <h6 className={classes.sectionHead}>
          <span>
            <MdKeyboardArrowDown />
          </span>
          Extra Details
        </h6>
        <div className={classes.sectionRow}>
          {stepData.passFailStatus ? (
            <div>
              <p className={classes.sectionColTItle}>Status :</p>
              <p className={classes.sectionColDetail}>
                <RenderPassFailChip status={stepData.passFailStatus} className={classes.stepTags} />
              </p>
            </div>
          ) : null}
          {stepData.duration && user?.brandPolicy?.workOrderTimer ? (
            <div>
              <p className={classes.sectionColTItle}>Duration:</p>
              <p className={classes.sectionColDetail} style={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon style={{ marginRight: '3px', color: 'gray', fontSize: '1rem' }} />({time})
              </p>
            </div>
          ) : null}
          {stepData.startedBy && (
            <div>
              <p className={classes.sectionColTItle}>Started By:</p>
              <p className={classes.sectionColDetail}>{stepData.startedBy?.optionLabel}</p>
            </div>
          )}
          {stepData.endedBy && (
            <div>
              <p className={classes.sectionColTItle}>Ended By:</p>
              <p className={classes.sectionColDetail}>{stepData.endedBy?.optionLabel}</p>
            </div>
          )}
          {stepData.startDate ? (
            <div>
              <p className={classes.sectionColTItle}>Start Date:</p>
              <p className={classes.sectionColDetail}>{moment(stepData.startDate).format(dateTimeFormat)}</p>
            </div>
          ) : null}

          {stepData.endDate ? (
            <div>
              <p className={classes.sectionColTItle}>End Date:</p>
              <p className={classes.sectionColDetail}>{moment(stepData.endDate).format(dateTimeFormat)}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const handleUpdateStep = (values: any) => {
    values.order = step?.order;
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/update-step`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setViewStep(false);
        handleClose();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
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
                {fieldData?.fields?.length ? (
                  !isEditing ? (
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
                  )
                ) : (
                  <div className={classes.centerText}>
                    <Typography variant={'body1'} style={{ color: 'var(--new_theme_color)' }}>
                      No Fields...
                    </Typography>
                  </div>
                )}
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
                {allowedToEdit ? (
                  <IconButton
                    aria-label="close"
                    onClick={() => {
                      setViewStep(true);
                    }}
                    size="small"
                    color="inherit"
                  >
                    <SettingsIcon color="inherit" />
                  </IconButton>
                ) : (
                  <div />
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'right'
                  }}
                >
                  {!isEditing ? (
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
            handleUpdateStep(data);
          }}
          stepId={''}
          stepData={step}
          notEditable={referencType === 'workOrderTechnician' ? true : step?.customStep === true ? false : true}
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

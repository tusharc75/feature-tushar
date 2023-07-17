import React, { useContext, useEffect } from 'react';
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
import DetailsPage from 'src/components/Shared/DetailsPage';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import SettingsIcon from '@material-ui/icons/Settings';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { RenderPassFailChip } from './Steps';
import { MdKeyboardArrowDown } from 'react-icons/md';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { AddField } from 'src/components/FormBuilder/AddField';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    stepTags: {
      minHeight: '26px',
      paddingInline: '5px',
      fontWeight: 500
    },
    sectionContainer: {
      padding: '0 15px 18px',
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
        verticalAlign: 'text-top',
        cursor: 'pointer'
      }
    },
    sectionRow: {
      overflow: 'hidden',
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
    },
    transition: {
      overflow: 'hidden',
      transition: 'height .3s'
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
  const containerRef = React.useRef(null);
  const [height, setHeight] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(true);
  const [isAddField, setIsAddField] = React.useState(false);
  const [sectionName, setSectionName] = React.useState("");

  const steps = selectedService?.steps || [];

  const RenderStepData = () => {
    const [time, setTime] = React.useState(user?.brandPolicy?.workOrderTimer ? convertMsToTime(
      stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start
        ? (stepData?.duration || 0) + (new Date().getTime() - new Date(stepData?.pauseDate || stepData?.startDate).getTime())
        : stepData?.duration || 0) : 0
    );

    React.useEffect(() => {
      if (user?.brandPolicy?.workOrderTimer) {
        if (stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start) {
          const interval = setInterval(() => {
            setTime(
              convertMsToTime((stepData?.duration || 0) + (new Date().getTime() - new Date(stepData?.pauseDate || stepData?.startDate).getTime()))
            );
          }, 1000);
          return () => {
            clearInterval(interval);
          };
        }
      }
    }, [stepData]);

    useEffect(() => {
      if (containerRef.current) {
        const target = containerRef.current as HTMLDialogElement;
        setHeight(isVisible ? target.clientHeight : 0);
      }
    }, []);

    return (
      <div className={classes.sectionContainer}>
        <h6 className={classes.sectionHead} onClick={() => setIsVisible((prev) => !prev)}>
          <span style={{ transform: isVisible ? 'rotate(180deg)' : 'rotate(0)' }}>
            <MdKeyboardArrowDown />
          </span>
          Extra Details
        </h6>
        <div className={classes.transition} style={{ height: height }}>
          <div className={classes.sectionRow} ref={containerRef}>
            {stepData.passFailStatus ? (
              <div>
                <p className={classes.sectionColTItle}>Status :</p>
                <p className={classes.sectionColDetail}>
                  <RenderPassFailChip status={stepData.passFailStatus} className={classes.stepTags} />
                </p>
              </div>
            ) : null}
            {user?.brandPolicy?.workOrderTimer ? (
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

  const handleOpenAddField = (event, name) => {
    event.stopPropagation()
    setSectionName(name)
    setIsAddField(true)
  }

  const handleCloseAddField = () => {
    setSectionName("")
    setIsAddField(false)

  }

  const handleAddField = (field: any) => {
    field.sectionName = sectionName;
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/${step?._id}/add-field`, field)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        handleCloseAddField();
        handleClose()
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        handleClose()
      });
  }


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
                    <DetailsPage
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
                              <div className={`detail-box-content ${styles.formHead}`} style={{ color: 'white', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex' }}>
                                  <FaDiceOne size={16} color={'inherit'} style={{ marginRight: '5px', float: 'left' }} />
                                  <h2>{form?.name}</h2>
                                </div>
                                <IconButton style={{ padding: "0px", marginTop: "-5px" }} color="primary" size="small" onClick={(e) => handleOpenAddField(e, form.name)} >
                                  <ControlPointIcon style={{ paddingTop: "2px", color: "white" }} />
                                </IconButton>
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
                      {allowedToEdit &&
                        <Button variant="contained" size="small" onClick={() => setEditing(true)} color="primary">
                          Edit
                        </Button>}
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

      {isAddField && <AddField refrence="formAdd" fieldData={null} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={fieldData.fields} />}

    </>
  );
};

export default StepFieldsDialog;

import { useState, useEffect, useContext, useRef } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, CircularProgress, Grid, IconButton, TextField, Tooltip, Typography } from '@material-ui/core';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import FormTypes from '../../components/Helpers/FormTypes';
import CustomButton from '../../components/Helpers/CustomButton';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  setFieldsInAscendingOrder,
  yupSchema,
  leadTimeMaster
} from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import Skeleton from '@material-ui/lab/Skeleton/Skeleton';
import { useHistory } from 'react-router-dom';
import { FaDiceOne } from 'react-icons/fa';
import { useData } from '../../StateProvider/Provider';
import { isEqual } from 'lodash';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';

const ManageLeadTimeMaster = ({ isClone = false, leadTimeMasterId = null, onClose, onSuccess, refrenceType = null, refrenceData = null }) => {
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allFields, setAllFields] = useState([]);
  const [title, setTitle] = useState('');
  const [leadTimeMasterSteps, setLeadTimeMasterSteps] = useState([]);
  const [totalDays, setTotalDays] = useState(0);

  const ref = useRef(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Lead Time Master')
      .then(({ data: { data } }) => {
        data = data.filter((obj) => obj?.fieldData?.fieldName !== 'leadTimeMasterName');

        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (leadTimeMasterId) {
          axiosInstance()
            .get(`${leadTimeMaster.api}/` + leadTimeMasterId)
            .then(({ data: { data } }) => {
              setLeadTimeMasterSteps(data?.steps || []);
              if (isClone) {
                const { _id, brand, createdBy, history, leadTimeMasterName, updatedBy, ...rest } = data;
                setTitle(`Clone - ${leadTimeMasterName}`);
                rest.status = `New`;
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                  values: { ...getObjKeysWithValues(rest, fieldsDataForCreate) }
                });
                setAllFields(fieldsDataForCreate);
                setLoading(false);
              } else {
                setTitle(`Editing - ${data?.leadTimeName}`);
                setInitialData({
                  fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
                setAllFields(fieldsDataForUpdate);
                setLoading(false);
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          setTitle('Create Lead Time Master');
          let initialData = { ...getObjKeys('', fieldsDataForCreate) };

          setAllFields(fieldsDataForCreate);
          setInitialData({
            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
            values: initialData
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [leadTimeMasterId]);

  const handleSubmit = (values) => {
    handleUpdateLeadTimeMaster(values);
  };

  const handleUpdateLeadTimeMaster = (values) => {
    setSubmitting(true);
    // values._id = leadTimeMasterId;
    if (!leadTimeMasterId) {
      values.steps = leadTimeMasterSteps;
      axiosInstance()
        .post(`${leadTimeMaster.api}`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      values._id = leadTimeMasterId;
      values.steps = leadTimeMasterSteps;
      axiosInstance()
        .put(`${leadTimeMaster.api}`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  const handleAddLTMSteps = () => {
    setLeadTimeMasterSteps([...leadTimeMasterSteps, { leadTimeStatus: '', days: '' }]);
  };

  const handleRemoveLTMSteps = (index) => {
    const data = leadTimeMasterSteps?.filter((e, i) => i !== index);
    setLeadTimeMasterSteps(data);
    setTotalDays(data?.reduce((acc, curr) => acc + parseInt(curr.days), 0));
  };
  const handleOnDaysChangeValue = (index, value) => {
    const data = [...leadTimeMasterSteps];
    data[index].days = parseInt(value) ?? 0;
    setLeadTimeMasterSteps(data);
    setTotalDays(data?.reduce((acc, curr) => acc + parseInt(curr.days), 0));
  };
  const handleOnLTMStatusChangeValue = (index, value) => {
    const data = [...leadTimeMasterSteps];
    data[index].leadTimeStatus = value;
    setLeadTimeMasterSteps(data);
  };

  const dummyDropDown = "Hello World, This is only for testing purpose!! Don't offend ;)".split(' ');

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      open={true}
    >
      {loading || !initialData.fields.length ? (
        <>
          <CustomDialogContent>
            <Skeleton width="100%" height="70px" />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                <Grid key={i} item xs={12} sm={6} md={6}>
                  <Skeleton width="100%" height="60px" />
                </Grid>
              ))}
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="outlined" size="small" color="primary" disabled>
              Cancel
            </Button>
            <Button variant="contained" size="small" color="primary" disabled>
              Submit
            </Button>
          </CustomDialogFooter>
        </>
      ) : (
        <Formik innerRef={ref} initialValues={initialData.values} validationSchema={yupSchema(allFields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues, submitForm }) => (
            <>
              <CustomDialogHeader
                title={title}
                onClose={(e, reason) => {
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form>
                  {initialData.fields.length > 0 &&
                    initialData.fields.map((form, i) => {
                      return (
                        form.name && (
                          <div key={i}>
                            <div className={'detail-box-content'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    <FormTypes
                                      isNew={Boolean(leadTimeMasterId)}
                                      {...field}
                                      fieldData={field}
                                      disabled={Boolean(leadTimeMasterId) && field.disableOnEdit && !isClone}
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
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </div>
                        )
                      );
                    })}
                  <div className={'detail-box-content'}>
                    <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                    <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Lead Time Master Steps</h2>
                  </div>
                  <Grid container>
                    <Grid item xs={12}>
                      <Box
                        style={{ maxHeight: '350px', overflow: 'auto' }}
                        bgcolor="white"
                        border={1}
                        mt={2}
                        mb={1}
                        borderColor="grey.300"
                        width={'100%'}
                      >
                        <Box p={1} bgcolor="grey.200">
                          <Grid container xs={12}>
                            <Grid item xs={6}>
                              <Typography variant="body2">Lead Time Status</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2">{leadTimeMasterSteps?.length && totalDays ? `${totalDays} Days` : 'Days'}</Typography>
                            </Grid>
                            <Grid item xs={2}>
                              <Grid container justifyContent="flex-end">
                                <IconButton
                                  size="small"
                                  aria-label="setting"
                                  onClick={() => {
                                    handleAddLTMSteps();
                                  }}
                                >
                                  <AddCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Box>
                        {leadTimeMasterSteps?.map((steps, index) => (
                          <Box key={index} bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Autocomplete
                                  options={dummyDropDown || []}
                                  getOptionLabel={(option) => option}
                                  value={steps?.leadTimeStatus || ''}
                                  onChange={(event: any, value) => {
                                    handleOnLTMStatusChangeValue(index, value);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Lead Time Status"
                                      variant="outlined"
                                      size="small"
                                      fullWidth
                                      InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                          <React.Fragment>
                                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                          </React.Fragment>
                                        )
                                      }}
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  id="Days-Field"
                                  variant="outlined"
                                  margin="dense"
                                  name="Days"
                                  label="Days"
                                  type="number"
                                  fullWidth
                                  style={{ margin: 0 }}
                                  value={steps?.days || ''}
                                  onChange={(event) => handleOnDaysChangeValue(index, event.target.value)}
                                />
                              </Grid>
                              <Grid item xs={2}>
                                <Grid container justifyContent="flex-end">
                                  <IconButton size="small" aria-label="setting" onClick={() => handleRemoveLTMSteps(index)}>
                                    <RemoveCircleOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  disabled={submitting}
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  color="primary"
                  startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                  disabled={submitting}
                  onClick={(e) => {
                    submitForm();
                    onClose();
                    // e.preventDefault();
                    // handleScroll(errors);
                    // handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
                    submitForm();
                    // handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
            </>
          )}
        </Formik>
      )}
    </Dialog>
  );
};

export default ManageLeadTimeMaster;

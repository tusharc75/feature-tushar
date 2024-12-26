import { useAccount, useMsal } from '@azure/msal-react';
import { Box, Button, CircularProgress, Grid, TextField, Typography, useMediaQuery } from '@mui/material';
import { ArrowRightAlt } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import axios, { CancelTokenSource } from 'axios';
import { Form, Formik } from 'formik';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { Fragment, useContext, useEffect, useState } from 'react';
import { object, string } from 'yup';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { displayDateTime, sidebarResource } from '../../../constants/helpers';
import getAzureAcessToken from '../../Azure/getAzureAccessToken';
import Loader from '../../Loader';
import { RelatedToDispay } from '../Helpers/RelatedToDispay';
import { UserDropdown } from '../Helpers/userDropdown';
import { get_activity_resource } from '../Helpers/utils';
import CustomDateTimePicker from 'src/components/CustomDateTimePicker';
import CustomDatePicker from 'src/components/CustomDatePicker';
import dayjs from 'dayjs';

const CreateNewEvent = async (inputData) => {
  const { data } = await axiosInstance().post('/event', inputData);
  return data;
};

const EventSchema = object().shape({
  name: string().required('Please enter event name').min(3, 'Too Short'),
  startTime: string().required('Please enter start time').nullable(),
  startDate: string().required('Please enter start date').nullable(),
  endTime: string().required('Please enter end time').nullable(),
  endDate: string().required('Please enter end date').nullable()
});

export const CreateEvent = ({ relatedTo, eventId, handleClose, email, isMinimized, onMinimizeMaximize, showManimizeMaximize }) => {
  const {
    state: {
      user: { user },
      permissions,
      resources
    }
  } = useData();

  const isMobile = useMediaQuery('(max-width:599px)');
  const [initialValues, setInitialValues] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const { instance, accounts } = useMsal();
  const azureAccount = useAccount(accounts[0] || {});
  const [isSubmitting, setSubmitting] = useState(false);
  const [resource, setResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);

  useEffect(() => {
    setResourceOptions(get_activity_resource(permissions, resources));
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchEventDetail(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEventDetail = async (cancelTokenSource?: CancelTokenSource) => {
    if (eventId) {
      axiosInstance()
        .get(`/event/${eventId}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          setInitialValues(data);
        })
        .catch((err) => {});
    } else {
      setInitialValues({
        name: '',
        description: '',
        location: '',
        participant: [{ userId: user._id }],
        startDate: new Date(),
        endDate: new Date(),
        startTime: getTime(new Date()),
        endTime: new Date(getTime(new Date()).getTime() + 30 * 60000)
      });
    }
  };

  const getTime = (date) => {
    let diff = 60 - new Date().getMinutes();
    const currentTime = date;

    if (diff > 30) {
      diff = diff - 30;
    }

    return new Date(currentTime.getTime() + diff * 60000);
  };

  // Data for Autocomplete
  useEffect(() => {
    if (resource && resource?.optionValue) {
      setLoadingResources(true);
      const lookupResource = sidebarResource[resource?.optionValue === 'quote' ? 'quoteBuilder' : resource?.optionValue];
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
        .then(({ data: { data } }) => {
          setResourceData(data[lookupResource] || []);
          setLoadingResources(false);
        })
        .catch((error) => {
          setLoadingResources(false);
        });

      return () => {
        setSelectedResourceData(null);
        setResourceData(null);
      };
    }
  }, [resource]);

  const handleSave = async (values) => {
    setSubmitting(true);
    values.relatedTo = relatedTo;
    if (!isEmpty(azureAccount)) {
      values.azureId = azureAccount.homeAccountId;
      values.graphToken = await getAzureAcessToken(instance);
    }
    if (eventId) {
      axiosInstance()
        .put(`/event/${eventId}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          handleClose();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      if (relatedTo) {
        CreateNewEvent(values)
          .then((data) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            setSubmitting(false);
            handleClose();
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setSubmitting(false);
          });
      } else {
        if (resource && selectedResourceData) {
          values.relatedTo = [
            {
              type: resource?.optionValue,
              referenceId: selectedResourceData.optionValue,
              access: true
            }
          ];
        } else {
          values.relatedTo = [
            {
              type: 'user',
              referenceId: user._id,
              access: true
            }
          ];
        }
        CreateNewEvent(values)
          .then((data) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            handleClose();
            setSubmitting(false);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setSubmitting(false);
          });
      }
    }
  };

  function validate(values) {
    const startDate = new Date(values?.startDate);
    const endDate = new Date(values?.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const errors = {};
    if (startDate > endDate) {
      errors['endDate'] = 'End date should be greater then start date';
      return errors;
    }
    if (dayjs(startDate)?.format('MM-DD-YYYY') === dayjs(endDate)?.format('MM-DD-YYYY')) {
      if (new Date(values?.startTime)?.getTime() > new Date(values?.endTime).getTime()) {
        errors['endTime'] = 'End time should be greater then start time';
      }
    }
    if (new Date(values.startTime)?.toString() === 'Invalid Date') {
      errors['startTime'] = 'Invalid Time';
    }
    if (new Date(values.endTime)?.toString() === 'Invalid Date') {
      errors['endTime'] = 'Invalid Time';
    }
    return errors;
  }

  return (
    <>
      <CustomDialogHeader
        title={`${eventId ? 'Edit' : 'New'} Event`}
        onClose={handleClose}
        isMinimized={isMinimized}
        onMinimizeMaximize={onMinimizeMaximize}
        showManimizeMaximize={showManimizeMaximize}
      ></CustomDialogHeader>
      {initialValues ? (
        <Formik initialValues={initialValues} validationSchema={EventSchema} onSubmit={handleSave} validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box padding={1}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Event Name"
                      required={true}
                      name="name"
                      fullWidth
                      margin="dense"
                      size="small"
                      value={values['name']}
                      error={touched['name'] && Boolean(errors['name'])}
                      helperText={touched['name'] && errors['name']}
                      onChange={(e) => setFieldValue('name', e.target.value.trimStart())}
                    />
                    <Box pt={1}>
                      <UserDropdown
                        name="participant"
                        label="Participant"
                        errors={errors}
                        touched={touched}
                        required={false}
                        setFieldValue={setFieldValue}
                        multiple={true}
                        value={values['participant']}
                        email={email ? email.map((e) => ({ userId: e, name: e })) : []}
                      />
                    </Box>
                    {!eventId && !relatedTo && (
                      <Box mt={2}>
                        <Autocomplete
                          options={resourceOptions}
                          getOptionLabel={(option) => option.optionLabel || ''}
                          value={resource}
                          fullWidth
                          onChange={(event, newValue) => {
                            setResource(newValue);
                          }}
                          size="small"
                          renderInput={(params) => <TextField {...params} label="Resource" variant="outlined" />}
                        />
                        <Box mt={2} />
                        {resource && resourceData && (
                          <Autocomplete
                            disabled={loadingResources}
                            options={resourceData}
                            getOptionLabel={(option: any) => option.optionLabel || ''}
                            isOptionEqualToValue={(option: any, value: any) => option.optionLabel === value.optionLabel}
                            fullWidth
                            value={selectedResourceData}
                            onChange={(event, newValue) => {
                              setSelectedResourceData(newValue);
                            }}
                            size="small"
                            renderInput={(params) => (
                              <TextField {...params} label={`Select ${resource.optionValue}`} variant="outlined" required={Boolean(resource)} />
                            )}
                          />
                        )}
                      </Box>
                    )}
                    <Box pt={1} display="flex" flexDirection={isMobile ? 'column' : 'row'}>
                      <Grid container spacing={2}>
                        <Grid item xs={7}>
                          <CustomDatePicker
                            size="small"
                            disablePast={true}
                            value={values.startDate}
                            name="startDate"
                            label="Start Date"
                            onChange={(date: any) => {
                              setFieldValue('startDate', date ? date : null);
                              setFieldValue('startTime', date ? getTime(date._d) : null);
                            }}
                            error={Boolean(touched['startDate']) && Boolean(errors['startDate'])}
                            helperText={Boolean(touched['startDate']) && errors['startDate']}
                            margin="dense"
                          />
                        </Grid>

                        <Grid item xs={5}>
                          <CustomDateTimePicker
                            size="small"
                            label="Start Time"
                            name="startTime"
                            placeholder="08:00"
                            inputFormat="HH:mm"
                            value={values.startTime}
                            onChange={(date: any) => {
                              setFieldValue('startTime', date || null);
                              if (date && new Date(date._d).getHours() < 23) {
                                setFieldValue('endTime', new Date(new Date(date._d).getTime() + 30 * 60000));
                              }
                            }}
                            error={Boolean(touched['startTime']) && Boolean(errors['startTime'])}
                            helperText={Boolean(touched['startTime']) && errors['startTime']}
                            margin="dense"
                          />
                        </Grid>
                      </Grid>

                      {!isMobile && (
                        <Box mt={2} px={1}>
                          <ArrowRightAlt color="disabled" />
                        </Box>
                      )}

                      <Grid container spacing={2}>
                        <Grid item xs={7}>
                          <CustomDatePicker
                            size="small"
                            disablePast={true}
                            minDateTime={values.startDate}
                            value={values.endDate}
                            name="endDate"
                            label="End Date"
                            onChange={(date: any) => {
                              setFieldValue('endDate', date);
                              setFieldValue('endTime', new Date(getTime(date ? date._d : new Date()).getTime() + 30 * 60000));
                            }}
                            error={Boolean(touched['endDate']) && Boolean(errors['endDate'])}
                            helperText={Boolean(touched['endDate']) && errors['endDate']}
                            margin="dense"
                          />
                        </Grid>
                        <Grid item xs={5}>
                          <CustomDateTimePicker
                            size="small"
                            label="End Time"
                            name="endTime"
                            placeholder="08:00"
                            inputFormat="HH:mm"
                            value={values.endTime}
                            onChange={(date: any) => {
                              const nDate = new Date(values.startTime).toISOString().split('T')[0];
                              let nTime = '';
                              if (date) {
                                if ((date._d + '').includes('Invalid Date')) {
                                  setFieldValue('endTime', `${date._i}`);
                                } else {
                                  nTime = new Date(date._d).toISOString().split('T')[1];
                                  setFieldValue('endTime', new Date(`${nDate}T${nTime}`));
                                }
                              }
                            }}
                            error={Boolean(touched['endTime']) && Boolean(errors['endTime'])}
                            helperText={Boolean(touched['endTime']) && errors['endTime']}
                            margin="dense"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                    <TextField
                      fullWidth
                      margin="dense"
                      size="small"
                      type="text"
                      label="Location"
                      value={values['location']}
                      name="location"
                      variant="outlined"
                      onChange={(e) => setFieldValue('location', e.target.value.trimStart())}
                    />
                    <TextField
                      fullWidth
                      margin="dense"
                      type="text"
                      size="small"
                      multiline
                      rows={3}
                      label="Description"
                      value={values['description']}
                      name="description"
                      variant="outlined"
                      onChange={(e) => setFieldValue('description', e.target.value.trimStart())}
                    />
                    {eventId && (
                      <Fragment>
                        {initialValues.createdBy && initialValues.createdBy.date && (
                          <Box mt={1} color="text.secondary">
                            <Typography variant="body2">Created {displayDateTime(initialValues.createdBy.date, 'MMM DD YYYY hh:mm A')}</Typography>
                          </Box>
                        )}
                        {initialValues.updatedBy && initialValues.updatedBy.date && (
                          <Box mt={1} color="text.secondary">
                            <Typography variant="body2">Updated {displayDateTime(initialValues.updatedBy.date, 'MMM DD YYYY hh:mm A')}</Typography>
                          </Box>
                        )}
                      </Fragment>
                    )}

                    {eventId && initialValues?.relatedTo && initialValues.relatedTo.length ? (
                      <Fragment>
                        <Box mt={2}>
                          <RelatedToDispay relatedTo={initialValues.relatedTo} />
                        </Box>
                      </Fragment>
                    ) : null}
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button disabled={isSubmitting} color="primary" size="small" onClick={handleClose}>
                  Cancel
                </Button>
                <Button disabled={isSubmitting} type="button" color="primary" variant="contained" size="small" onClick={submitForm}>
                  {isSubmitting ? <CircularProgress size={22} /> : 'Save'}
                </Button>
                {eventId && (
                  <Button
                    disabled={isSubmitting}
                    variant="outlined"
                    size="small"
                    style={{ color: 'red', borderColor: 'red' }}
                    onClick={() =>
                      axiosInstance()
                        .delete(`/event/${eventId}`)
                        .then(({ data }) => {
                          toastConfig.setToastConfig({
                            open: true,
                            type: 'success',
                            message: data.message
                          });
                          handleClose();
                        })
                        .catch((error) => {
                          toastConfig.setToastConfig(error);
                        })
                    }
                  >
                    Delete
                  </Button>
                )}
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      ) : (
        <CustomDialogContent isFooterPresent={false}>
          <Loader minHeight="500px" text="Loading..." />
        </CustomDialogContent>
      )}
    </>
  );
};

CreateEvent.propTypes = {
  relatedTo: PropTypes.any,
  taskId: PropTypes.any,
  handleClose: PropTypes.any,
  email: PropTypes.array
  // isMinimized: PropTypes.bool,
  // onMinimizeMaximize: PropTypes.func,
  // showManimizeMaximize: PropTypes.bool
};

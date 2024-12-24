import { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel, Grid, IconButton, TextField } from '@mui/material';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { FieldArray, Form, Formik } from 'formik';
import { Autocomplete } from '@mui/material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import axiosInstance from 'src/axios/axiosInstance';
import { isArray } from 'lodash';

export default function Notifications({ onClose, onSuccess, resource, resourceData }) {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({ notifications: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([]);
  const [notificationUserField, setNotificationUserField] = useState([]);
  const RULE = [
    {
      optionLabel: 'Less Then Current Date',
      optionValue: 'lessThenCurrentDate'
    }
  ];

  useEffect(() => {
    setInitialValues({ notifications: [...(resourceData?.notifications || [])] });
  }, [resourceData]);

  const addRemove = (values, type, index) => {
    let data = values?.notifications || [];
    if (type === 'add') {
      data.splice(index, 0, {
        field: '',
        rule: '',
        sendMail: true,
        sendNotification: true,
        notificationUserField: '',
        message: ''
      });
    } else {
      data.splice(index, 1);
    }
    setInitialValues({ notifications: [...data] });
  };

  useEffect(() => {
    getFieldList(resource);
  }, []);

  const getFieldList = async (resource) => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/field?resource=${resource}&view=${true}`);
      setFields(
        data
          ?.filter((d) => d?.fieldData?.type === 'date')
          ?.map((e) => {
            return { fieldName: e.fieldData.fieldName, fieldLabel: e.fieldData.fieldLabel };
          })
      );
      setNotificationUserField(
        data
          ?.filter((d) => d?.fieldData?.lookup && d?.fieldData?.lookupResource === 'User')
          ?.map((e) => {
            return { fieldName: e.fieldData.fieldName, fieldLabel: e.fieldData.fieldLabel };
          })
      );
    } catch (e) {}
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`/sa-formbuilder/tabs/notifications/${resource}`, values?.notifications || [])
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
  };

  const validate = (values) => {
    const errors: any = {};
    if (values?.notifications?.length > 0) {
      values?.notifications?.forEach((d, i) => {
        if (!d.field) {
          if (!errors?.notifications) {
            errors['notifications'] = [];
          }
          errors.notifications[i] = { field: 'Field is required' };
        }
        if (!d.rule) {
          if (!errors?.notifications) {
            errors['notifications'] = [];
          }
          errors.notifications[i] = { ...errors.notifications[i], rule: 'Rule is required' };
        }
        if (!d.notificationUserField) {
          if (!errors?.notifications) {
            errors['notifications'] = [];
          }
          errors.notifications[i] = { ...errors.notifications[i], notificationUserField: 'Notification User Field is required' };
        }
        if (!d.message) {
          if (!errors?.notifications) {
            errors['notifications'] = [];
          }
          errors.notifications[i] = { ...errors.notifications[i], message: 'Message is required' };
        }
      });
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <Formik initialValues={initialValues} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
        {({ values, submitForm, touched, errors }) => (
          <>
            <CustomDialogHeader
              onClose={onClose}
              title={'Notifications'}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              showRequiredLabel={false}
            />
            <CustomDialogContent>
              <Box>
                <Box mb={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    type="submit"
                    onClick={() => {
                      addRemove(values, 'add', values?.notifications?.length);
                    }}
                  >
                    Add
                  </Button>
                </Box>
                <Form>
                  <FieldArray
                    name="notifications"
                    render={(arrayHelpers) => (
                      <>
                        {values?.notifications?.map((data, index) => (
                          <Box mb={2} border={1} borderColor="var(--common-border-color)">
                            <Box textAlign={'right'} p={1}>
                              <HtmlTooltip title="Remove">
                                <IconButton size="small" aria-label="remove" onClick={() => addRemove(values, 'remove', index)}>
                                  <RemoveCircleOutlineIcon fontSize="small" color="primary" />
                                </IconButton>
                              </HtmlTooltip>
                            </Box>
                            <Box p={2} pt={1}>
                              <Grid container spacing={2}>
                                <Grid item md={4} lg={4} sm={6} xs={12}>
                                  <Autocomplete
                                    id="field"
                                    options={fields}
                                    getOptionLabel={(option: any) => (option ? option?.fieldLabel : '')}
                                    getOptionSelected={(option: any, val) => option?.fieldName === val}
                                    value={
                                      fields && fields.filter((f) => f?.fieldName === data?.field).length
                                        ? fields && fields.filter((f) => f?.fieldName === data?.field)[0]
                                        : ''
                                    }
                                    onChange={(e, val) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.notifications[index],
                                        ['field']: val && val?.fieldName ? val?.fieldName : ''
                                      });
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        margin="dense"
                                        variant="outlined"
                                        label="Field"
                                        placeholder="Field"
                                        name="field"
                                        required
                                        error={
                                          touched?.notifications &&
                                          touched?.notifications[index]?.field &&
                                          errors?.notifications &&
                                          Boolean(errors?.notifications[index]?.field)
                                        }
                                        helperText={
                                          touched?.notifications &&
                                          touched?.notifications[index]?.field &&
                                          errors?.notifications &&
                                          errors?.notifications[index]?.field
                                        }
                                      />
                                    )}
                                  />
                                </Grid>
                                <Grid item md={4} lg={4} sm={6} xs={12}>
                                  <Autocomplete
                                    id="rule"
                                    options={RULE}
                                    getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                    getOptionSelected={(option: any, val) => option.optionValue === val}
                                    value={
                                      RULE && RULE?.filter((d) => d?.optionValue === data?.rule)?.length
                                        ? RULE && RULE?.filter((d) => d?.optionValue === data?.rule)[0]
                                        : ''
                                    }
                                    onChange={(e: any, val) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.notifications[index],
                                        ['rule']: val && val?.optionValue ? val?.optionValue : ''
                                      });
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        margin="dense"
                                        variant="outlined"
                                        label="Rule"
                                        placeholder="Rule"
                                        name="rule"
                                        required
                                        error={
                                          touched?.notifications &&
                                          touched?.notifications[index]?.rule &&
                                          errors?.notifications &&
                                          Boolean(errors?.notifications[index]?.rule)
                                        }
                                        helperText={
                                          touched?.notifications &&
                                          touched?.notifications[index]?.rule &&
                                          errors?.notifications &&
                                          errors?.notifications[index]?.rule
                                        }
                                      />
                                    )}
                                  />
                                </Grid>
                                <Grid item md={4} lg={4} sm={6} xs={12}>
                                  <Autocomplete
                                    id="notificationUserField"
                                    options={notificationUserField}
                                    getOptionLabel={(option: any) => (option ? option?.fieldLabel : '')}
                                    getOptionSelected={(option: any, val) => option?.fieldName === val}
                                    value={
                                      notificationUserField &&
                                      notificationUserField.filter((f) => f?.fieldName === data?.notificationUserField).length
                                        ? notificationUserField &&
                                          notificationUserField.filter((f) => f?.fieldName === data?.notificationUserField)[0]
                                        : ''
                                    }
                                    onChange={(e, val) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.notifications[index],
                                        ['notificationUserField']: val && val?.fieldName ? val?.fieldName : ''
                                      });
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        margin="dense"
                                        variant="outlined"
                                        label="Notification User Field"
                                        placeholder="Notification User Field"
                                        name="notificationUserField"
                                        required
                                        error={
                                          touched?.notifications &&
                                          touched?.notifications[index]?.notificationUserField &&
                                          errors?.notifications &&
                                          Boolean(errors?.notifications[index]?.notificationUserField)
                                        }
                                        helperText={
                                          touched?.notifications &&
                                          touched?.notifications[index]?.notificationUserField &&
                                          errors?.notifications &&
                                          errors?.notifications[index]?.notificationUserField
                                        }
                                      />
                                    )}
                                  />
                                </Grid>
                                <Grid item md={12} lg={12} sm={12} xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Message"
                                    variant="outlined"
                                    type="text"
                                    size="small"
                                    name="message"
                                    placeholder="Message"
                                    value={data.message}
                                    onChange={(e) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.notifications[index],
                                        ['message']: e.target.value
                                      });
                                    }}
                                    error={
                                      touched?.notifications &&
                                      touched?.notifications[index]?.message &&
                                      errors?.notifications &&
                                      Boolean(errors?.notifications[index]?.message)
                                    }
                                    helperText={
                                      touched?.notifications &&
                                      touched?.notifications[index]?.message &&
                                      errors?.notifications &&
                                      errors?.notifications[index]?.message
                                    }
                                  />
                                </Grid>
                                <Grid item md={4} lg={4} sm={6} xs={12}>
                                  <Box pt={0.5}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          name="sendMail"
                                          checked={data?.sendMail}
                                          onChange={(e) => {
                                            arrayHelpers.replace(index, {
                                              ...values?.notifications[index],
                                              ['sendMail']: e.target.checked
                                            });
                                          }}
                                          color="primary"
                                        />
                                      }
                                      label="Send Mail"
                                    />
                                  </Box>
                                </Grid>
                                <Grid item md={4} lg={4} sm={6} xs={12}>
                                  <Box pt={0.5}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          name="sendNotification"
                                          checked={data?.sendNotification}
                                          onChange={(e) => {
                                            arrayHelpers.replace(index, {
                                              ...values?.notifications[index],
                                              ['sendNotification']: e.target.checked
                                            });
                                          }}
                                          color="primary"
                                        />
                                      }
                                      label="Send Notification"
                                    />
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        ))}
                      </>
                    )}
                  />
                </Form>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" color="primary" disabled={submitting} onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={submitting}
                variant="contained"
                color="primary"
                size="small"
                type="submit"
                onClick={submitForm}
                endIcon={submitting && <CircularProgress color="inherit" size={18} />}
              >
                Save
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
}

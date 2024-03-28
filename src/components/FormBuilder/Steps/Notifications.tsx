import { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel, Grid, IconButton, TextField } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { FieldArray, Form, Formik } from 'formik';
import { Autocomplete } from '@material-ui/lab';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import axiosInstance from 'src/axios/axiosInstance';

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
      .put(`/sa-formbuilder/steps/notifications/${resource}`, values)
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
    let errors: any = {};
    if (values.length > 0) {
      values.map((d) => {
        if (!d.field) {
          errors['field'] = 'Field is required';
        }
        if (!d.rule) {
          errors['rule'] = 'Rule is required';
        }
        if (!d.notificationUserField) {
          errors['notificationUserField'] = 'Notification User Field is required';
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
      <Formik initialValues={initialValues} enableReinitialize={true} onSubmit={() => {}}>
        {({ values }) => (
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
                            <Box textAlign={'right'}>
                              <HtmlTooltip title="Remove">
                                <IconButton size="small" aria-label="remove" onClick={() => addRemove(values, 'remove', index)}>
                                  <RemoveCircleOutlineIcon fontSize="small" />
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
                                        error={validate([data])?.field}
                                        helperText={validate([data])?.field ? 'Field is required' : ''}
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
                                        label="rule"
                                        placeholder="Rule"
                                        name="rule"
                                        required
                                        error={validate([data])?.rule}
                                        helperText={validate([data])?.rule ? 'Rule is required' : ''}
                                      />
                                    )}
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
                                        label="NotificationUserField"
                                        placeholder="NotificationUserField"
                                        name="notificationUserField"
                                        required
                                        error={validate([data])?.notificationUserField}
                                        helperText={validate([data])?.notificationUserField ? 'Notification User Field is required' : ''}
                                      />
                                    )}
                                  />
                                </Grid>
                                <Grid item md={4} lg={4} sm={6} xs={12}>
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
                                  />
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
                onClick={() => {
                  if (
                    !validate(values.notifications).field &&
                    !validate(values.notifications).rule &&
                    !validate(values.notifications).notificationUserField
                  ) {
                    handleSubmit(values?.notifications);
                  }
                }}
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

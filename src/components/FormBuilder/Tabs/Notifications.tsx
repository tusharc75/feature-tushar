import { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, Dialog, FormControlLabel, IconButton, TextField } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { FieldArray, Form, Formik } from 'formik';
import Autocomplete from '@mui/material/Autocomplete';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import axiosInstance from 'src/axios/axiosInstance';

export default function Notifications({ onClose, onSuccess, resource, resourceData }) {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({ notifications: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([]);
  const [notificationUserField, setNotificationUserField] = useState([]);
  const [users, setUsers] = useState([]);

  const [createRecordNotifications, setCreateRecordNotifications] = useState({
    users: [],
    message: '',
    sendMail: true,
    sendNotification: true
  });

  const [updateRecordNotifications, setUpdateRecordNotifications] = useState({
    users: [],
    message: '',
    sendMail: true,
    sendNotification: true
  });

  const RULE = [
    {
      optionLabel: 'Less Then Current Date',
      optionValue: 'lessThenCurrentDate'
    }
  ];

  const [editDialog, setEditDialog] = useState({ open: false, type: null });


  const handleEditClick = (type) => {
    setEditDialog({ open: true, type });
  };

  useEffect(() => {
    setInitialValues({ notifications: [...(resourceData?.conditionNotifications || [])] });
    if (resourceData?.createRecordNotifications) {
      setCreateRecordNotifications(resourceData.createRecordNotifications[0]);
    }
    if (resourceData?.updateRecordNotifications) {
      setUpdateRecordNotifications(resourceData.updateRecordNotifications[0]);
    }
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
    getUserList();
  }, []);

  const getUserList = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/user`);
      setUsers(
        data?.map((user) => ({
          value: user._id,
          label: user.name || user.email,
          ...user
        })) || []
      );
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

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
    } catch (e) { }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    const submitData = {
      notifications: editDialog.type === 'createRecordNotifications' ? [createRecordNotifications] :
        editDialog.type === 'updateRecordNotifications' ? [updateRecordNotifications] :
          values?.notifications || [],
      type: editDialog.type
    };

    axiosInstance()
      .put(`/sa-formbuilder/tabs/notifications/${resource}`, submitData)
      .then(({ data }) => {
        setSubmitting(false);
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        // setEditDialog({ open: false, type: null });
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
                {!editDialog.open && (
                  <Box>
                    <Box mb={2}>
                      <ThemeButton
                        buttonType="theme"
                        onClick={() => handleEditClick('createRecordNotifications')}
                        style={{ marginRight: '8px' }}
                      >
                        Create Record Notifications
                      </ThemeButton>
                      <ThemeButton
                        buttonType="theme"
                        onClick={() => handleEditClick('updateRecordNotifications')}
                        style={{ marginRight: '8px' }}
                      >
                        Update Record Notifications
                      </ThemeButton>
                      <ThemeButton
                        buttonType="theme"
                        onClick={() => handleEditClick('conditionNotifications')}
                      >
                        Conditional Notifications
                      </ThemeButton>
                    </Box>
                  </Box>
                )}

                {/* Show Create/Update Record Notifications Form */}
                {editDialog.open && (editDialog.type === 'createRecordNotifications' || editDialog.type === 'updateRecordNotifications') && (
                  <Box>
                    <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                      <h3>{editDialog.type === 'createRecordNotifications' ? 'Create Record Notifications' : 'Update Record Notifications'}</h3>
                      <ThemeButton
                        buttonType="transparent"
                        onClick={() => setEditDialog({ open: false, type: null })}
                      >
                        Back
                      </ThemeButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Autocomplete
                          multiple
                          options={users}
                          getOptionLabel={(option) => option.label || ''}
                          value={users.filter(user =>
                          (editDialog.type === 'createRecordNotifications'
                            ? createRecordNotifications.users?.includes(user.value)
                            : updateRecordNotifications.users?.includes(user.value)
                          )) || []}
                          onChange={(e, newValue) => {
                            const setter = editDialog.type === 'createRecordNotifications'
                              ? setCreateRecordNotifications
                              : setUpdateRecordNotifications;
                            setter(prev => ({
                              ...prev,
                              users: newValue.map(user => user.value)
                            }));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Users"
                              placeholder="Choose users to notify"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Message"
                          variant="outlined"
                          multiline
                          rows={3}
                          value={editDialog.type === 'createRecordNotifications'
                            ? createRecordNotifications.message
                            : updateRecordNotifications.message}
                          onChange={(e) => {
                            const setter = editDialog.type === 'createRecordNotifications'
                              ? setCreateRecordNotifications
                              : setUpdateRecordNotifications;
                            setter(prev => ({
                              ...prev,
                              message: e.target.value
                            }));
                          }}
                          placeholder="Enter notification message"
                        />
                      </Grid>
                      <Grid size={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editDialog.type === 'createRecordNotifications'
                                ? createRecordNotifications.sendMail
                                : updateRecordNotifications.sendMail}
                              onChange={(e) => {
                                const setter = editDialog.type === 'createRecordNotifications'
                                  ? setCreateRecordNotifications
                                  : setUpdateRecordNotifications;
                                setter(prev => ({
                                  ...prev,
                                  sendMail: e.target.checked
                                }));
                              }}
                              color="primary"
                            />
                          }
                          label="Send Email"
                        />
                      </Grid>
                      <Grid size={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editDialog.type === 'createRecordNotifications'
                                ? createRecordNotifications.sendNotification
                                : updateRecordNotifications.sendNotification}
                              onChange={(e) => {
                                const setter = editDialog.type === 'createRecordNotifications'
                                  ? setCreateRecordNotifications
                                  : setUpdateRecordNotifications;
                                setter(prev => ({
                                  ...prev,
                                  sendNotification: e.target.checked
                                }));
                              }}
                              color="primary"
                            />
                          }
                          label="Send In-App Notification"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Show Conditional Notifications Form */}
                {editDialog.open && editDialog.type === 'conditionNotifications' && (
                  <Box>
                    <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                      <h3>Conditional Notifications</h3>
                      <ThemeButton
                        buttonType="transparent"
                        onClick={() => setEditDialog({ open: false, type: null })}
                      >
                        Back
                      </ThemeButton>
                    </Box>
                    <Box mb={2}>
                      <ThemeButton
                        buttonType="theme"
                        onClick={() => {
                          addRemove(values, 'add', values?.notifications?.length);
                        }}
                      >
                        Add
                      </ThemeButton>
                    </Box>
                    <Form>
                      <FieldArray
                        name="notifications"
                        render={(arrayHelpers) => (
                          <>
                            {values?.notifications?.map((data, index) => (
                              <Box mb={2} border={1} borderColor="var(--common-border-color)" key={index}>
                                <Box textAlign={'right'} p={1}>
                                  <HtmlTooltip title="Remove">
                                    <IconButton size="small" aria-label="remove" onClick={() => addRemove(values, 'remove', index)}>
                                      <RemoveCircleOutlineIcon fontSize="small" color="primary" />
                                    </IconButton>
                                  </HtmlTooltip>
                                </Box>
                                <Box p={2} pt={1}>
                                  <Grid container spacing={2}>
                                    <Grid size={{ md: 4, lg: 4, sm: 6, xs: 12 }}>
                                      <Autocomplete
                                        id="field"
                                        options={fields}
                                        getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                                        isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
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
                                            size="small"
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
                                    <Grid size={{ md: 4, lg: 4, sm: 6, xs: 12 }}>
                                      <Autocomplete
                                        id="rule"
                                        options={RULE}
                                        getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
                                        isOptionEqualToValue={(option: any, val) => option.optionValue === val}
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
                                            size="small"
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
                                    <Grid size={{ md: 4, lg: 4, sm: 6, xs: 12 }}>
                                      <Autocomplete
                                        id="notificationUserField"
                                        options={notificationUserField}
                                        getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                                        isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
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
                                            size="small"
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
                                    <Grid size={{ md: 12, lg: 12, sm: 12, xs: 12 }}>
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
                                    <Grid size={{ md: 4, lg: 4, sm: 6, xs: 12 }}>
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
                                    <Grid size={{ md: 4, lg: 4, sm: 6, xs: 12 }}>
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
                )}
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" onClick={onClose}>
                Cancel
              </ThemeButton>
              <ThemeButton
                disabled={submitting}
                buttonType="theme"
                onClick={submitForm}
                isLoading={submitting}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
}

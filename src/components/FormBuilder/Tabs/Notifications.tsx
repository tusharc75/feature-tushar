import { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, Dialog, FormControlLabel, IconButton, TextField, Divider, Typography, Card, CardContent } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { FieldArray, Formik } from 'formik';
import Autocomplete from '@mui/material/Autocomplete';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import axiosInstance from 'src/axios/axiosInstance';
import { CancelTokenSource } from 'axios';

export default function Notifications({ onClose, onSuccess, resource, resourceData, permissions }) {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({ notifications: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([]);
  const [notificationUserField, setNotificationUserField] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  const [createRecordNotifications, setCreateRecordNotifications] = useState({
    users: [],
    groups: [],
    message: '',
    email: true,
    portal: true
  });

  const [updateRecordNotifications, setUpdateRecordNotifications] = useState({
    users: [],
    groups: [],
    message: '',
    email: true,
    portal: true
  });

  const RULE = [
    {
      optionLabel: 'Less Then Current Date',
      optionValue: 'lessThenCurrentDate'
    }
  ];

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
        email: true,
        portal: true,
        notificationUserField: '',
        message: '',
        users: [],
        groups: []
      });
    } else {
      data.splice(index, 1);
    }
    setInitialValues({ notifications: [...data] });
  };

  useEffect(() => {
    getFieldList(resource);
    getUserList();
    getGroupList();
  }, []);

  const getUserList = async () => {
    try {
      const { data: { data } } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=User`);
      setUsers(data?.User || []);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const getGroupList = async () => {
    try {
      const { data: { data } } = await axiosInstance()
        .get(`dynamic-form`, {
          headers: {
            Resource: "User Group"
          },
          // cancelToken: cancelTokenSource?.token
        })
      setGroups(data || []);
    } catch (e) {
      console.error('Error fetching groups:', e);
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
      createRecordNotifications: [createRecordNotifications],
      updateRecordNotifications: [updateRecordNotifications],
      conditionNotifications: values?.notifications || [],
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Card 1: Create Record Notifications */}
                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                    >
                      Create Record
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid size={permissions?.userGroup?.isRead ? 6 : 12}>
                        <Autocomplete
                          multiple
                          options={users}
                          getOptionLabel={(option) => option.optionLabel || ''}
                          value={users.filter(user => createRecordNotifications.users?.includes(user.optionValue)) || []}
                          onChange={(e, newValue) => {
                            setCreateRecordNotifications(prev => ({
                              ...prev,
                              users: newValue.map(user => user.optionValue)
                            }));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Users"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      {permissions?.userGroup?.isRead && (
                        <Grid size={6}>
                          <Autocomplete
                            multiple
                            options={groups}
                            getOptionLabel={(option) => option.userGroupName || ''}
                            value={groups.filter(group => createRecordNotifications.groups?.includes(group._id)) || []}
                            onChange={(e, newValue) => {
                              setCreateRecordNotifications(prev => ({
                                ...prev,
                                groups: newValue.map(group => group._id)
                              }));
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Groups"
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                      )}

                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Message"
                          variant="outlined"
                          type="text"
                          size="small"
                          name="message"
                          placeholder="Message"
                          value={createRecordNotifications.message}
                          onChange={(e) => {
                            setCreateRecordNotifications(prev => ({
                              ...prev,
                              message: e.target.value
                            }));
                          }}
                        />
                      </Grid>
                      <Grid size={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={createRecordNotifications.email}
                              onChange={(e) => {
                                setCreateRecordNotifications(prev => ({
                                  ...prev,
                                  email: e.target.checked
                                }));
                              }}
                              color="primary"
                            />
                          }
                          label="Email"
                        />
                      </Grid>
                      <Grid size={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={createRecordNotifications.portal}
                              onChange={(e) => {
                                setCreateRecordNotifications(prev => ({
                                  ...prev,
                                  portal: e.target.checked
                                }));
                              }}
                              color="primary"
                            />
                          }
                          label="Portal"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Card 2: Update Record Notifications */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Update Record
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid size={permissions?.userGroup?.isRead ? 6 : 12}>
                        <Autocomplete
                          multiple
                          options={users}
                          getOptionLabel={(option) => option.optionLabel || ''}
                          value={users.filter(user => updateRecordNotifications.users?.includes(user.optionValue)) || []}
                          onChange={(e, newValue) => {
                            setUpdateRecordNotifications(prev => ({
                              ...prev,
                              users: newValue.map(user => user.optionValue)
                            }));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Users"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      {permissions?.userGroup?.isRead && (
                        <Grid size={6}>
                          <Autocomplete
                            multiple
                            options={groups}
                            getOptionLabel={(option) => option.userGroupName || ''}
                            value={groups.filter(group => updateRecordNotifications.groups?.includes(group._id)) || []}
                            onChange={(e, newValue) => {
                              setUpdateRecordNotifications(prev => ({
                                ...prev,
                                groups: newValue.map(group => group._id)
                              }));
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Groups"
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                      )}


                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Message"
                          variant="outlined"
                          type="text"
                          size="small"
                          name="message"
                          placeholder="Message"
                          value={updateRecordNotifications.message}
                          onChange={(e) => {
                            setUpdateRecordNotifications(prev => ({
                              ...prev,
                              message: e.target.value
                            }));
                          }}
                        />
                      </Grid>
                      <Grid size={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={updateRecordNotifications.email}
                              onChange={(e) => {
                                setUpdateRecordNotifications(prev => ({
                                  ...prev,
                                  email: e.target.checked
                                }));
                              }}
                              color="primary"
                            />
                          }
                          label="Email"
                        />
                      </Grid>
                      <Grid size={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={updateRecordNotifications.portal}
                              onChange={(e) => {
                                setUpdateRecordNotifications(prev => ({
                                  ...prev,
                                  portal: e.target.checked
                                }));
                              }}
                              color="primary"
                            />
                          }
                          label="Portal"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Card 3: Conditional Notifications */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Conditional
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

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

                    <FieldArray
                      name="notifications"
                      render={(arrayHelpers) => (
                        <>
                          {values?.notifications?.map((data, index) => (
                            <Card variant="outlined" sx={{ mb: 2 }} key={index}>
                              <CardContent>
                                <Box textAlign={'right'} sx={{ mb: 1 }}>
                                  <HtmlTooltip title="Remove">
                                    <IconButton size="small" aria-label="remove" onClick={() => addRemove(values, 'remove', index)}>
                                      <RemoveCircleOutlineIcon fontSize="small" color="primary" />
                                    </IconButton>
                                  </HtmlTooltip>
                                </Box>

                                <Grid container spacing={2}>
                                  <Grid size={permissions?.userGroup?.isRead ? 6 : 12}>
                                    <Autocomplete
                                      multiple
                                      options={users}
                                      getOptionLabel={(option) => option.optionLabel || ''}
                                      value={users.filter(user => data?.users?.includes(user.optionValue)) || []}
                                      onChange={(e, newValue) => {
                                        arrayHelpers.replace(index, {
                                          ...values?.notifications[index],
                                          ['users']: newValue.map(user => user.optionValue)
                                        });
                                      }}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          margin="dense"
                                          size="small"
                                          variant="outlined"
                                          label="Select Users"
                                          placeholder="Select Users"
                                        />
                                      )}
                                    />
                                  </Grid>
                                  {permissions?.userGroup?.isRead && (
                                    <Grid size={6}>
                                      <Autocomplete
                                        multiple
                                        options={groups}
                                        getOptionLabel={(option) => option.userGroupName || ''}
                                        value={groups.filter(group => data?.groups?.includes(group._id)) || []}
                                        onChange={(e, newValue) => {
                                          arrayHelpers.replace(index, {
                                            ...values?.notifications[index],
                                            ['groups']: newValue.map(group => group._id)
                                          });
                                        }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            margin="dense"
                                            size="small"
                                            variant="outlined"
                                            label="Select Groups"
                                            placeholder="Select Groups"
                                          />
                                        )}
                                      />
                                    </Grid>
                                  )}
                                  <Grid size={{ md: 4, lg: 4, sm: 6, xs: 12 }}>
                                    <Autocomplete
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
                                  <Grid size={12}>
                                    <TextField
                                      fullWidth
                                      label="Message"
                                      variant="outlined"
                                      size="small"
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
                                  <Grid size={6}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={data?.email}
                                          onChange={(e) => {
                                            arrayHelpers.replace(index, {
                                              ...values?.notifications[index],
                                              ['email']: e.target.checked
                                            });
                                          }}
                                          color="primary"
                                        />
                                      }
                                      label="Email"
                                    />
                                  </Grid>
                                  <Grid size={6}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={data?.portal}
                                          onChange={(e) => {
                                            arrayHelpers.replace(index, {
                                              ...values?.notifications[index],
                                              ['portal']: e.target.checked
                                            });
                                          }}
                                          color="primary"
                                        />
                                      }
                                      label="Portal"
                                    />
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}
                    />
                  </CardContent>
                </Card>
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

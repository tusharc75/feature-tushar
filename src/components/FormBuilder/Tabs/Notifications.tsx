import { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, Dialog, FormControlLabel, IconButton, TextField, Divider, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, getUniqueCurrencies, sidebarResource } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { FieldArray, Formik } from 'formik';
import Autocomplete from '@mui/material/Autocomplete';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import axiosInstance from 'src/axios/axiosInstance';
import { checkBoxOptions, getLookupOption } from 'src/components/FormBuilder/helper';
import { isEmpty, uniqBy } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import MuiPhoneInput from 'material-ui-phone-number';

export default function Notifications({ onClose, onSuccess, resource, resourceData, permissions, fields }) {
  const toastConfig = useContext(CustomToastContext);
  const [initialValues, setInitialValues] = useState({ notifications: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [fieldValueOptions, setFieldValueOptions] = useState({});
  const [selectedFields, setSelectedFields] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

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
        fieldValue: '',
        email: true,
        portal: true,
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
        })
      setGroups(data || []);
    } catch (e) {
      console.error('Error fetching groups:', e);
    }
  };

  useEffect(() => {
    try {
      let options = [];
      fields?.forEach((field) => {
        if (![
          'imageUpload',
          'currencyAmount',
          'converter',
          'multiImageUpload',
          'fileUpload',
          'multiFileUpload',
          'process',
          'colorPicker',
          'richTextEditor',
          'signature',
          'groupSignature',
          'counter',
          'description',
          'lookUpDisplay'
        ]?.includes(field?.type)) {
          options.push({ fieldLabel: field?.fieldLabel, fieldName: field?.fieldName });
        }
      });
      setFieldOptions(options);

    } catch (e) { }
  }, [fields]);

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
      });
    }
    return errors;
  };

  // Function to get field value options for a specific field
  const getFieldValueOptions = async (field) => {
    if (!field) return [];

    if ((field?.type === 'dropDown' || field?.type === 'multiSelect') && !field?.dataList) {
      if (field?.lookup) {
        const data = await getLookupOption('', field?.lookupResource);
        if (field?.lookupResource === sidebarResource.user) {
          return [{ optionLabel: 'Current User', optionValue: 'Current User' }, ...data];
        }
        return data;
      } else {
        return fields?.find((f) => f?.fieldName === field?.fieldName)?.option || [];
      }
    } else if (field?.type === 'checkBox' || field?.type === 'switch') {
      return checkBoxOptions;
    } else if (field?.type === 'currency') {
      const sortedArr = getUniqueCurrencies().sort((a, b) =>
        a?.name?.toUpperCase() < b?.name?.toUpperCase() ? -1 : a?.name?.toUpperCase() > b?.name?.toUpperCase() ? 1 : 0
      );
      return sortedArr
        ?.filter((d) => !isEmpty(d))
        ?.map((d: any) => ({
          optionLabel: `${d.currencyCode} - ${d.currencyName} - (${d.symbolNative})`,
          optionValue: d?.currencyCode
        }));
    } else if (field?.type === 'radio') {
      return field?.option ? field?.option : [];
    } else if (field?.dataList) {
      return [];
    }
    return [];
  };

  const fetchDataListOptions = async (field, searchKey = '', notificationIndex) => {
    if (!field?.dataList) return [];

    try {
      setLoadingStates(prev => ({ ...prev, [notificationIndex]: true }));

      const query = `${routes?.dataList?.path}/data-list-items/${field?.dataListId}?search=${encodeURIComponent(searchKey)}`;
      const { data: { data: { data } } } = await axiosInstance().get(query);
      const options = data?.map((d) => ({ optionLabel: d?.title, optionValue: d?._id }));

      setFieldValueOptions(prev => ({
        ...prev,
        [notificationIndex]: options
      }));

      setLoadingStates(prev => ({ ...prev, [notificationIndex]: false }));
      return options;
    } catch (error) {
      console.error('Error fetching dataList options:', error);
      setLoadingStates(prev => ({ ...prev, [notificationIndex]: false }));
      return [];
    }
  };

  useEffect(() => {
    const loadExistingFieldOptions = async () => {
      if (initialValues?.notifications?.length > 0) {
        const optionsMap = {};
        const fieldsMap = {};

        for (let i = 0; i < initialValues.notifications.length; i++) {
          const notification = initialValues.notifications[i];
          if (notification.field) {
            const field = fields?.find(f => f?.fieldName === notification.field);
            if (field) {
              fieldsMap[i] = field;
              const options = await getFieldValueOptions(field);
              optionsMap[i] = options;
            }
          }
        }

        setSelectedFields(fieldsMap);
        setFieldValueOptions(optionsMap);
      }
    };

    if (fields?.length > 0 && initialValues?.notifications?.length > 0) {
      loadExistingFieldOptions();
    }
  }, [fields, initialValues]);

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
                                          />
                                        )}
                                      />
                                    </Grid>
                                  )}
                                  <Grid size={{ md: 4, lg: 4, sm: 6, xs: 12 }}>
                                    <Autocomplete
                                      options={fieldOptions}
                                      getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                                      isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
                                      value={
                                        fieldOptions && fieldOptions.filter((f) => f?.fieldName === data?.field).length
                                          ? fieldOptions && fieldOptions.filter((f) => f?.fieldName === data?.field)[0]
                                          : ''
                                      }
                                      onChange={async (e, val) => {
                                        const field = fields?.filter((f) => f?.fieldName === val?.fieldName)[0];
                                        setSelectedFields(prev => ({
                                          ...prev,
                                          [index]: field
                                        }));

                                        if (field) {
                                          const options = await getFieldValueOptions(field);
                                          setFieldValueOptions(prev => ({
                                            ...prev,
                                            [index]: options
                                          }));
                                        }

                                        arrayHelpers.replace(index, {
                                          ...values?.notifications[index],
                                          ['field']: val && val?.fieldName ? val?.fieldName : '',
                                          ['fieldValue']: ''
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
                                  {/* field values field */}
                                  <Grid size={{ md: 4, lg: 4, sm: 6, xs: 12 }}>
                                    {(() => {
                                      const currentField = selectedFields[index];
                                      const fieldOptions = fieldValueOptions[index] || [];

                                      // For dataList fields
                                      if (currentField?.dataList) {
                                        return (
                                          <Autocomplete
                                            onOpen={() => {
                                              setLoadingStates(prev => ({ ...prev, [index]: true }));
                                              fetchDataListOptions(currentField, '', index);
                                            }}
                                            loading={loadingStates[index] || false}
                                            limitTags={2}
                                            multiple
                                            fullWidth
                                            disableCloseOnSelect={true}
                                            options={uniqBy(fieldOptions, 'optionValue')}
                                            getOptionLabel={(option: any) => option ? option?.optionLabel || '' : ''}
                                            value={
                                              data?.fieldValue
                                                ? uniqBy(fieldOptions, 'optionValue')?.filter((opt: any) =>
                                                  data?.fieldValue?.split(',')?.includes(opt.optionValue)
                                                )
                                                : []
                                            }
                                            isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                                            onChange={(e, val: any) => {
                                              const newValue = val ? val.map((v) => v?.optionValue)?.join(',') : '';
                                              arrayHelpers.replace(index, {
                                                ...values?.notifications[index],
                                                ['fieldValue']: newValue
                                              });
                                            }}
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                variant="outlined"
                                                margin="dense"
                                                size="small"
                                                label="Field Value"
                                                name="fieldValue"
                                                style={{ whiteSpace: 'nowrap' }}
                                                slotProps={{
                                                  input: {
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                      <>
                                                        {loadingStates[index] ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                      </>
                                                    )
                                                  }
                                                }}
                                                error={
                                                  touched?.notifications &&
                                                  touched?.notifications[index]?.fieldValue &&
                                                  errors?.notifications &&
                                                  Boolean(errors?.notifications[index]?.fieldValue)
                                                }
                                                helperText={
                                                  touched?.notifications &&
                                                  touched?.notifications[index]?.fieldValue &&
                                                  errors?.notifications &&
                                                  errors?.notifications[index]?.fieldValue
                                                }
                                              />
                                            )}
                                          />
                                        );
                                      }

                                      // For mobile number fields
                                      if (currentField?.type === 'mobileNumber') {
                                        return (
                                          <MuiPhoneInput
                                            defaultCountry={'us'}
                                            disableAreaCodes
                                            countryCodeEditable
                                            variant="outlined"
                                            fullWidth
                                            label={'Field Value'}
                                            name={'fieldValue'}
                                            margin="dense"
                                            size="small"
                                            value={data?.fieldValue || ''}
                                            onChange={(val) => {
                                              const value = val?.length < 5 ? '' : val;
                                              arrayHelpers.replace(index, {
                                                ...values?.notifications[index],
                                                ['fieldValue']: value
                                              });
                                            }}
                                            error={
                                              touched?.notifications &&
                                              touched?.notifications[index]?.fieldValue &&
                                              errors?.notifications &&
                                              Boolean(errors?.notifications[index]?.fieldValue)
                                            }
                                            helperText={
                                              touched?.notifications &&
                                              touched?.notifications[index]?.fieldValue &&
                                              errors?.notifications &&
                                              errors?.notifications[index]?.fieldValue
                                            }
                                          />
                                        );
                                      }

                                      // For fields with options (dropdown, multiSelect, checkBox, switch, currency, radio)
                                      if (['dropDown', 'multiSelect', 'checkBox', 'switch', 'currency', 'radio'].includes(currentField?.type)) {
                                        return (
                                          <Autocomplete
                                            id={`fieldValue-${index}`}
                                            options={fieldOptions}
                                            disableCloseOnSelect={true}
                                            getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
                                            multiple={true}
                                            value={
                                              data?.fieldValue
                                                ? fieldOptions?.filter((opt) => data?.fieldValue?.split(',')?.includes(opt?.optionValue)) || []
                                                : []
                                            }
                                            onChange={(e, val) => {
                                              const newValue = val?.map((v) => v?.optionValue)?.join(',') || '';
                                              arrayHelpers.replace(index, {
                                                ...values?.notifications[index],
                                                ['fieldValue']: newValue
                                              });
                                            }}
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                margin="dense"
                                                size="small"
                                                variant="outlined"
                                                label="Field Value"
                                                placeholder="Field Value"
                                                name="fieldValue"
                                                error={
                                                  touched?.notifications &&
                                                  touched?.notifications[index]?.fieldValue &&
                                                  errors?.notifications &&
                                                  Boolean(errors?.notifications[index]?.fieldValue)
                                                }
                                                helperText={
                                                  touched?.notifications &&
                                                  touched?.notifications[index]?.fieldValue &&
                                                  errors?.notifications &&
                                                  errors?.notifications[index]?.fieldValue
                                                }
                                              />
                                            )}
                                          />
                                        );
                                      }

                                      return (
                                        <TextField
                                          variant="outlined"
                                          type={
                                            ['number', 'decimal', 'percent', 'formula'].includes(currentField?.type)
                                              ? 'number'
                                              : currentField?.type === 'date'
                                                ? 'date'
                                                : 'text'
                                          }
                                          label="Field Value"
                                          name="fieldValue"
                                          fullWidth
                                          margin="dense"
                                          size="small"
                                          value={data?.fieldValue || ''}
                                          onChange={(e) => {
                                            arrayHelpers.replace(index, {
                                              ...values?.notifications[index],
                                              ['fieldValue']: e.target.value
                                            });
                                          }}
                                          error={
                                            touched?.notifications &&
                                            touched?.notifications[index]?.fieldValue &&
                                            errors?.notifications &&
                                            Boolean(errors?.notifications[index]?.fieldValue)
                                          }
                                          helperText={
                                            touched?.notifications &&
                                            touched?.notifications[index]?.fieldValue &&
                                            errors?.notifications &&
                                            errors?.notifications[index]?.fieldValue
                                          }
                                        />
                                      );
                                    })()}
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

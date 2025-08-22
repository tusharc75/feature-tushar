import { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, Dialog, FormControlLabel, IconButton, TextField, Divider, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, getUniqueCurrencies, sidebarResource, cn } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { FieldArray, Formik } from 'formik';
import Autocomplete from '@mui/material/Autocomplete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import axiosInstance from 'src/axios/axiosInstance';
import { checkBoxOptions, getLookupOption } from 'src/components/FormBuilder/helper';
import { isEmpty, uniqBy } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import MuiPhoneInput from 'material-ui-phone-number';

export default function Notifications({ onClose, onSuccess, resource, resourceData, permissions, fields }) {
  const OPERATOR = [
    {
      optionLabel: 'Less than',
      optionValue: 'lessThan'
    },
    {
      optionLabel: 'Less than or equals',
      optionValue: 'lessThanOrEquals'
    },
    {
      optionLabel: 'Equals To',
      optionValue: 'equalsTo'
    },
    {
      optionLabel: 'Greater than',
      optionValue: 'greaterThan'
    },
    {
      optionLabel: 'Greater than or equals',
      optionValue: 'greaterThanOrEquals'
    }
  ];

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
        checkFields: [{ fieldName: '', operator: '', value: '' }],
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

  // Helper function to check if a value is meaningful
  const hasValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  };

  // Helper function to remove empty fields from objects
  const cleanEmptyFields = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const cleaned = {};

    Object.entries(obj).forEach(([key, value]) => {
      if (hasValue(value)) {
        cleaned[key] = value;
      }
    });

    return cleaned;
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);

    const cleanedCreateRecord = cleanEmptyFields(createRecordNotifications);

    const cleanedUpdateRecord = cleanEmptyFields(updateRecordNotifications);

    const cleanedConditionNotifications = values?.notifications?.map(notification =>
      cleanEmptyFields(notification)
    ).filter(notification => Object.keys(notification).length > 0) || [];

    const submitData: any = {};

    submitData.createRecordNotifications = [cleanedCreateRecord];

    submitData.updateRecordNotifications = [cleanedUpdateRecord];

    submitData.conditionNotifications = cleanedConditionNotifications;


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
      values?.notifications?.forEach((notification, index) => {
        if (notification?.checkFields?.length > 0) {
          notification?.checkFields?.forEach((checkField, i) => {
            if (!checkField?.fieldName) {
              if (!errors.notifications) errors.notifications = [];
              if (!errors.notifications[index]) errors.notifications[index] = {};
              if (!errors.notifications[index].checkFields) errors.notifications[index].checkFields = [];
              if (!errors.notifications[index].checkFields[i]) errors.notifications[index].checkFields[i] = {};
              errors.notifications[index].checkFields[i].fieldName = 'Field name is required';
            }
            if (!checkField?.operator) {
              if (!errors.notifications) errors.notifications = [];
              if (!errors.notifications[index]) errors.notifications[index] = {};
              if (!errors.notifications[index].checkFields) errors.notifications[index].checkFields = [];
              if (!errors.notifications[index].checkFields[i]) errors.notifications[index].checkFields[i] = {};
              errors.notifications[index].checkFields[i].operator = 'Operator is required';
            }
            if (!checkField?.value || (Array.isArray(checkField.value) && !checkField?.value?.length)) {
              if (!errors.notifications) errors.notifications = [];
              if (!errors.notifications[index]) errors.notifications[index] = {};
              if (!errors.notifications[index].checkFields) errors.notifications[index].checkFields = [];
              if (!errors.notifications[index].checkFields[i]) errors.notifications[index].checkFields[i] = {};
              errors.notifications[index].checkFields[i].value = 'Value is required';
            }
          });
        }
      });
    }
    console.log('Validation Errors:', errors);
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

          // Handle new checkFields structure
          if (notification.checkFields?.length > 0) {
            for (let j = 0; j < notification.checkFields.length; j++) {
              const checkField = notification.checkFields[j];
              if (checkField.fieldName) {
                const field = fields?.find(f => f?.fieldName === checkField.fieldName);
                if (field) {
                  fieldsMap[`${i}-${j}`] = field;
                  const options = await getFieldValueOptions(field);
                  optionsMap[`${i}-${j}`] = options;
                }
              }
            }
          }

          // Handle old single field structure (backward compatibility)
          if (notification.fieldName) {
            const field = fields?.find(f => f?.fieldName === notification.fieldName);
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
                        <ul className="list-none space-y-4">
                          {values?.notifications?.map((data, index) => (
                            <li className="flex list-none items-center gap-2" key={index}>
                              <fieldset className="flex-grow space-y-2 rounded-md border px-3 pb-3">
                                <legend className="text-right">
                                  <HtmlTooltip title={'Remove'}>
                                    <IconButton size="small" aria-label="close" onClick={() => addRemove(values, 'remove', index)}>
                                      <RemoveCircleOutline fontSize="small" color={'error'} />
                                    </IconButton>
                                  </HtmlTooltip>
                                </legend>

                                {/* Conditions Section */}
                                <fieldset className="rounded-md border border-dashed border-gray-200 p-3 dark:border-gray-800">
                                  <legend className="px-1 text-sm font-semibold">Conditions</legend>
                                  <div className="space-y-4">
                                    <FieldArray name={`notifications.${index}.checkFields`}>
                                      {({ push, remove }) => (
                                        <>
                                          {data?.checkFields?.map((checkField, i, arr) => (
                                            <div
                                              key={i}
                                              className={cn(
                                                'grid grid-cols-1 gap-2',
                                                checkField?.fieldName
                                                  ? 'md:grid-cols-[1fr_1fr_1fr_auto]'
                                                  : 'md:grid-cols-[1fr_1fr_auto]'
                                              )}
                                            >
                                              {/* Field Name */}
                                              <Autocomplete
                                                options={fieldOptions}
                                                getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                                                isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
                                                value={
                                                  fieldOptions && fieldOptions.filter((f) => f?.fieldName === checkField?.fieldName).length
                                                    ? fieldOptions && fieldOptions.filter((f) => f?.fieldName === checkField?.fieldName)[0]
                                                    : ''
                                                }
                                                onChange={async (e, val) => {
                                                  const field = fields?.filter((f) => f?.fieldName === val?.fieldName)[0];
                                                  setSelectedFields(prev => ({
                                                    ...prev,
                                                    [`${index}-${i}`]: field
                                                  }));

                                                  if (field) {
                                                    const options = await getFieldValueOptions(field);
                                                    setFieldValueOptions(prev => ({
                                                      ...prev,
                                                      [`${index}-${i}`]: options
                                                    }));
                                                  }

                                                  arrayHelpers.replace(index, {
                                                    ...values?.notifications[index],
                                                    checkFields: values?.notifications[index]?.checkFields?.map((cf, cfIndex) =>
                                                      cfIndex === i
                                                        ? { ...cf, fieldName: val?.fieldName || '', value: '' }
                                                        : cf
                                                    )
                                                  });
                                                }}
                                                size="small"
                                                renderInput={(params) => (
                                                  <TextField
                                                    {...params}
                                                    label="Field Name"
                                                    margin="none"
                                                    size="small"
                                                    variant="outlined"
                                                    placeholder="Field"
                                                    name="fieldName"
                                                    required
                                                    error={
                                                      touched?.notifications &&
                                                      touched?.notifications[index]?.checkFields &&
                                                      touched?.notifications[index]?.checkFields[i]?.fieldName &&
                                                      errors?.notifications &&
                                                      errors?.notifications[index]?.checkFields &&
                                                      Boolean(errors?.notifications[index]?.checkFields[i]?.fieldName)
                                                    }
                                                    helperText={
                                                      touched?.notifications &&
                                                      touched?.notifications[index]?.checkFields &&
                                                      touched?.notifications[index]?.checkFields[i]?.fieldName &&
                                                      errors?.notifications &&
                                                      errors?.notifications[index]?.checkFields &&
                                                      errors?.notifications[index]?.checkFields[i]?.fieldName
                                                    }
                                                  />
                                                )}
                                              />

                                              {/* Operator */}
                                              <Autocomplete
                                                options={OPERATOR}
                                                getOptionLabel={(option) => option?.optionLabel || ''}
                                                value={
                                                  OPERATOR?.find((op) => op?.optionValue === checkField?.operator) ?? null
                                                }
                                                onChange={(event, newValue) => {
                                                  arrayHelpers.replace(index, {
                                                    ...values?.notifications[index],
                                                    checkFields: values?.notifications[index]?.checkFields?.map((cf, cfIndex) =>
                                                      cfIndex === i
                                                        ? { ...cf, operator: newValue?.optionValue || '' }
                                                        : cf
                                                    )
                                                  });
                                                }}
                                                size="small"
                                                renderInput={(params) => (
                                                  <TextField
                                                    {...params}
                                                    label="Operator"
                                                    margin="none"
                                                    size="small"
                                                    variant="outlined"
                                                    error={
                                                      touched?.notifications &&
                                                      touched?.notifications[index]?.checkFields &&
                                                      touched?.notifications[index]?.checkFields[i]?.operator &&
                                                      errors?.notifications &&
                                                      errors?.notifications[index]?.checkFields &&
                                                      Boolean(errors?.notifications[index]?.checkFields[i]?.operator)
                                                    }
                                                    helperText={
                                                      touched?.notifications &&
                                                      touched?.notifications[index]?.checkFields &&
                                                      touched?.notifications[index]?.checkFields[i]?.operator &&
                                                      errors?.notifications &&
                                                      errors?.notifications[index]?.checkFields &&
                                                      errors?.notifications[index]?.checkFields[i]?.operator
                                                    }
                                                  />
                                                )}
                                              />

                                              {/* Value - Dynamic based on field type */}
                                              {checkField?.fieldName ? (
                                                <DynamicValueField
                                                  currentField={selectedFields[`${index}-${i}`]}
                                                  fieldOptions={fieldValueOptions[`${index}-${i}`] || []}
                                                  value={checkField?.value}
                                                  index={index}
                                                  checkFieldIndex={i}
                                                  arrayHelpers={arrayHelpers}
                                                  values={values}
                                                  touched={touched}
                                                  errors={errors}
                                                  setLoadingStates={setLoadingStates}
                                                  loadingStates={loadingStates}
                                                  fetchDataListOptions={fetchDataListOptions}
                                                  uniqBy={uniqBy}
                                                />
                                              ) : null}

                                              {/* Add/Remove Buttons */}
                                              <div className="mt-1 flex">
                                                <HtmlTooltip title={'Remove'}>
                                                  <IconButton
                                                    size="small"
                                                    aria-label="close"
                                                    onClick={() => remove(i)}
                                                    disabled={arr.length === 1}
                                                  >
                                                    <RemoveCircleOutline fontSize="small" color={arr.length === 1 ? 'disabled' : 'error'} />
                                                  </IconButton>
                                                </HtmlTooltip>
                                                <HtmlTooltip title={'Add'}>
                                                  <IconButton
                                                    size="small"
                                                    aria-label="add"
                                                    onClick={() => push({ fieldName: '', operator: '', value: '' })}
                                                  >
                                                    <AddCircleOutline fontSize="small" color={'primary'} />
                                                  </IconButton>
                                                </HtmlTooltip>
                                              </div>
                                            </div>
                                          ))}
                                        </>
                                      )}
                                    </FieldArray>
                                  </div>
                                </fieldset>

                                {/* Actions Section */}
                                <fieldset className="rounded-md border border-dashed border-gray-200 p-3 dark:border-gray-800">
                                  <legend className="px-1 text-sm font-semibold">Actions</legend>
                                  <div className="space-y-2">
                                    {/* Users and Groups */}
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
                                          size="small"
                                          renderInput={(params) => (
                                            <TextField
                                              {...params}
                                              margin="none"
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
                                            size="small"
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                margin="none"
                                                size="small"
                                                variant="outlined"
                                                label="Select Groups"
                                              />
                                            )}
                                          />
                                        </Grid>
                                      )}
                                    </Grid>

                                    {/* Message */}
                                    <TextField
                                      fullWidth
                                      label="Message"
                                      variant="outlined"
                                      type="text"
                                      size="small"
                                      name="message"
                                      placeholder="Message"
                                      value={data?.message || ''}
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

                                    {/* Email and Portal Checkboxes */}
                                    <Grid container spacing={2}>
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
                                  </div>
                                </fieldset>
                              </fieldset>
                            </li>
                          ))}
                        </ul>
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

// Dynamic Value Field Component
const DynamicValueField = ({
  currentField,
  fieldOptions,
  value,
  index,
  checkFieldIndex,
  arrayHelpers,
  values,
  touched,
  errors,
  setLoadingStates,
  loadingStates,
  fetchDataListOptions,
  uniqBy
}) => {
  const updateValue = (newValue) => {
    if (checkFieldIndex !== undefined) {
      // For checkFields structure
      arrayHelpers.replace(index, {
        ...values?.notifications[index],
        checkFields: values?.notifications[index]?.checkFields?.map((cf, cfIndex) =>
          cfIndex === checkFieldIndex
            ? { ...cf, value: newValue }
            : cf
        )
      });
    } else {
      // For simple structure (backward compatibility)
      arrayHelpers.replace(index, {
        ...values?.notifications[index],
        ['value']: newValue
      });
    }
  };

  // For dataList fields
  if (currentField?.dataList) {
    return (
      <Autocomplete
        onOpen={() => {
          const loadingKey = checkFieldIndex !== undefined ? `${index}-${checkFieldIndex}` : index;
          setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
          fetchDataListOptions(currentField, '', loadingKey);
        }}
        loading={loadingStates[checkFieldIndex !== undefined ? `${index}-${checkFieldIndex}` : index] || false}
        limitTags={2}
        multiple
        fullWidth
        disableCloseOnSelect={true}
        options={uniqBy(fieldOptions, 'optionValue')}
        getOptionLabel={(option: any) => option ? option?.optionLabel || '' : ''}
        value={
          value
            ? uniqBy(fieldOptions, 'optionValue')?.filter((opt: any) =>
              value?.split(',')?.includes(opt.optionValue)
            )
            : []
        }
        isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
        onChange={(e, val: any) => {
          const newValue = val ? val.map((v) => v?.optionValue)?.join(',') : '';
          updateValue(newValue);
        }}
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            margin="none"
            size="small"
            label="Value"
            name="value"
            style={{ whiteSpace: 'nowrap' }}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingStates[checkFieldIndex !== undefined ? `${index}-${checkFieldIndex}` : index] ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }
            }}
            error={
              checkFieldIndex !== undefined
                ? touched?.notifications &&
                touched?.notifications[index]?.checkFields &&
                touched?.notifications[index]?.checkFields[checkFieldIndex]?.value &&
                errors?.notifications &&
                errors?.notifications[index]?.checkFields &&
                Boolean(errors?.notifications[index]?.checkFields[checkFieldIndex]?.value)
                : touched?.notifications &&
                touched?.notifications[index]?.value &&
                errors?.notifications &&
                Boolean(errors?.notifications[index]?.value)
            }
            helperText={
              checkFieldIndex !== undefined
                ? touched?.notifications &&
                touched?.notifications[index]?.checkFields &&
                touched?.notifications[index]?.checkFields[checkFieldIndex]?.value &&
                errors?.notifications &&
                errors?.notifications[index]?.checkFields &&
                errors?.notifications[index]?.checkFields[checkFieldIndex]?.value
                : touched?.notifications &&
                touched?.notifications[index]?.value &&
                errors?.notifications &&
                errors?.notifications[index]?.value
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
        value={value}
        onChange={(newValue) => {
          updateValue(newValue);
        }}
        variant="outlined"
        size="small"
        label="Value"
        fullWidth
        error={
          checkFieldIndex !== undefined
            ? touched?.notifications &&
            touched?.notifications[index]?.checkFields &&
            touched?.notifications[index]?.checkFields[checkFieldIndex]?.value &&
            errors?.notifications &&
            errors?.notifications[index]?.checkFields &&
            Boolean(errors?.notifications[index]?.checkFields[checkFieldIndex]?.value)
            : touched?.notifications &&
            touched?.notifications[index]?.value &&
            errors?.notifications &&
            Boolean(errors?.notifications[index]?.value)
        }
        helperText={
          checkFieldIndex !== undefined
            ? touched?.notifications &&
            touched?.notifications[index]?.checkFields &&
            touched?.notifications[index]?.checkFields[checkFieldIndex]?.value &&
            errors?.notifications &&
            errors?.notifications[index]?.checkFields &&
            errors?.notifications[index]?.checkFields[checkFieldIndex]?.value
            : touched?.notifications &&
            touched?.notifications[index]?.value &&
            errors?.notifications &&
            errors?.notifications[index]?.value
        }
      />
    );
  }

  // For other field types with options (dropdown, multiSelect, radio, checkbox, switch, currency)
  if (fieldOptions.length > 0) {
    return (
      <Autocomplete
        limitTags={2}
        multiple
        fullWidth
        disableCloseOnSelect={true}
        options={uniqBy(fieldOptions, 'optionValue')}
        getOptionLabel={(option: any) => option ? option?.optionLabel || '' : ''}
        value={
          value
            ? uniqBy(fieldOptions, 'optionValue')?.filter((opt: any) =>
              value?.split(',')?.includes(opt.optionValue)
            )
            : []
        }
        isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
        onChange={(e, val: any) => {
          const newValue = val ? val.map((v) => v?.optionValue)?.join(',') : '';
          updateValue(newValue);
        }}
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            margin="none"
            size="small"
            label="Value"
            name="value"
            style={{ whiteSpace: 'nowrap' }}
            error={
              checkFieldIndex !== undefined
                ? touched?.notifications &&
                touched?.notifications[index]?.checkFields &&
                touched?.notifications[index]?.checkFields[checkFieldIndex]?.value &&
                errors?.notifications &&
                errors?.notifications[index]?.checkFields &&
                Boolean(errors?.notifications[index]?.checkFields[checkFieldIndex]?.value)
                : touched?.notifications &&
                touched?.notifications[index]?.value &&
                errors?.notifications &&
                Boolean(errors?.notifications[index]?.value)
            }
            helperText={
              checkFieldIndex !== undefined
                ? touched?.notifications &&
                touched?.notifications[index]?.checkFields &&
                touched?.notifications[index]?.checkFields[checkFieldIndex]?.value &&
                errors?.notifications &&
                errors?.notifications[index]?.checkFields &&
                errors?.notifications[index]?.checkFields[checkFieldIndex]?.value
                : touched?.notifications &&
                touched?.notifications[index]?.value &&
                errors?.notifications &&
                errors?.notifications[index]?.value
            }
          />
        )}
      />
    );
  }

  // For text, number, date fields - simple text input
  return (
    <TextField
      fullWidth
      variant="outlined"
      margin="none"
      size="small"
      label="Value"
      name="value"
      type={currentField?.type === 'number' ? 'number' : currentField?.type === 'date' ? 'date' : 'text'}
      value={value || ''}
      onChange={(e) => {
        updateValue(e.target.value);
      }}
      error={
        checkFieldIndex !== undefined
          ? touched?.notifications &&
          touched?.notifications[index]?.checkFields &&
          touched?.notifications[index]?.checkFields[checkFieldIndex]?.value &&
          errors?.notifications &&
          errors?.notifications[index]?.checkFields &&
          Boolean(errors?.notifications[index]?.checkFields[checkFieldIndex]?.value)
          : touched?.notifications &&
          touched?.notifications[index]?.value &&
          errors?.notifications &&
          Boolean(errors?.notifications[index]?.value)
      }
      helperText={
        checkFieldIndex !== undefined
          ? touched?.notifications &&
          touched?.notifications[index]?.checkFields &&
          touched?.notifications[index]?.checkFields[checkFieldIndex]?.value &&
          errors?.notifications &&
          errors?.notifications[index]?.checkFields &&
          errors?.notifications[index]?.checkFields[checkFieldIndex]?.value
          : touched?.notifications &&
          touched?.notifications[index]?.value &&
          errors?.notifications &&
          errors?.notifications[index]?.value
      }
    />
  );
};

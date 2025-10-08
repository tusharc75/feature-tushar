import { useContext, useEffect, useState } from 'react';
import { Box, Checkbox, Dialog, FormControlLabel, IconButton, TextField, Divider, Typography, Card, CardContent } from '@mui/material';
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
import axiosInstance from 'src/axios/axiosInstance';
import { checkBoxOptions, getLookupOption } from 'src/components/FormBuilder/helper';
import { isEmpty } from 'lodash';
import FieldList from 'src/components/FormBuilder/FieldList';
import { DATE_VALUE } from 'src/components/FormBuilder/Tabs/helper';
import FormTypes from 'src/components/Helpers/FormTypes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

export default function Notifications({ onClose, onSuccess, resource, resourceData, permissions }) {
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
  const [selectedFields, setSelectedFields] = useState({});
  const [fields, setFields] = useState([]);

  const getResourceFieldList = async (resource) => {
    try {
      let {
        data: { data }
      } = await axiosInstance().get(`/field?resource=${resource}`);
      data = data?.filter((obj) => obj?.isCreate).map((d: any) => d.fieldData);
      setFields(data);
    } catch (e) { }
  };

  const [createRecordNotifications, setCreateRecordNotifications] = useState({
    users: [],
    groups: [],
    message: ''
  });

  const [updateRecordNotifications, setUpdateRecordNotifications] = useState({
    users: [],
    groups: [],
    message: ''
  });

  useEffect(() => {
    const initialConditionalNotifications = (resourceData?.conditionNotifications || []).map(notification => {
      const { users = [], groups = [], message = '', checkFields = [] } = notification;
      return { users, groups, message, checkFields };
    });

    setInitialValues({ notifications: [...initialConditionalNotifications] });

    if (resourceData?.createRecordNotifications) {
      const { users = [], groups = [], message = '' } = resourceData.createRecordNotifications[0] || {};
      setCreateRecordNotifications({ users, groups, message });
    }
    if (resourceData?.updateRecordNotifications) {
      const { users = [], groups = [], message = '' } = resourceData.updateRecordNotifications[0] || {};
      setUpdateRecordNotifications({ users, groups, message });
    }
  }, [resourceData]);

  const addRemove = (values, type, index) => {
    let data = values?.notifications || [];
    if (type === 'add') {
      data.splice(index, 0, {
        checkFields: [{ fieldName: '', operator: '', value: '' }],
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
    getResourceFieldList(resource);
    getUserList();
    if (permissions?.userGroup?.isRead) {
      getGroupList();
    }
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

  const hasValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  };

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

    const createRecord = cleanEmptyFields(createRecordNotifications);
    const updateRecord = cleanEmptyFields(updateRecordNotifications);
    const conditionNotifications = values?.notifications?.map(notification =>
      cleanEmptyFields(notification)
    ).filter(notification => Object.keys(notification).length > 0) || [];

    const submitData: any = {};
    submitData.createRecordNotifications = [createRecord];
    submitData.updateRecordNotifications = [updateRecord];
    submitData.conditionNotifications = conditionNotifications;


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
    return errors;
  };

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

  useEffect(() => {
    const loadExistingFieldOptions = async () => {
      if (initialValues?.notifications?.length > 0) {
        const optionsMap = {};
        const fieldsMap = {};

        for (let i = 0; i < initialValues.notifications.length; i++) {
          const notification = initialValues.notifications[i];

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
      {fields.length ? (<Formik initialValues={initialValues} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
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
                <Card>
                  <CardContent>
                    <div className='pb-4'>
                      <span className="text-base font-semibold">Create Record</span>
                    </div>
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
                    </Grid>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className='pb-4'>
                      <span className="text-base font-semibold">Update Record</span>
                    </div>
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
                    </Grid>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <div className='pb-4'>
                      <span className="text-base font-semibold">Conditional</span>
                    </div>
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

                                                  // if (field) {
                                                  //   const options = await getFieldValueOptions(field);
                                                  // }

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
                                                <DynamicFormField
                                                  field={selectedFields[`${index}-${i}`]}
                                                  fieldName={checkField?.fieldName}
                                                  value={checkField?.value}
                                                  setFieldValue={(formikField, newValue) => {
                                                    arrayHelpers.replace(index, {
                                                      ...values?.notifications[index],
                                                      checkFields: values?.notifications[index]?.checkFields?.map((cf, cfIndex) =>
                                                        cfIndex === i
                                                          ? { ...cf, value: newValue }
                                                          : cf
                                                      )
                                                    });
                                                  }}
                                                  formikField={`notifications.${index}.checkFields.${i}.value`}
                                                  error={
                                                    errors?.notifications &&
                                                    errors?.notifications[index]?.checkFields &&
                                                    errors?.notifications[index]?.checkFields[i]?.value
                                                  }
                                                  touched={
                                                    touched?.notifications &&
                                                    touched?.notifications[index]?.checkFields &&
                                                    touched?.notifications[index]?.checkFields[i]?.value
                                                  }
                                                  label="Value"
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
      </Formik>) :
        ((
          <Box height={'h-fit'} padding={2}>
            <CommonSkeleton lenArray={[...Array(6).keys()]} />
          </Box>
        ))}
    </Dialog>
  );
}

const DynamicFormField = ({ fieldName, value, field, setFieldValue, formikField, error, touched, label }) => {

  if (!field) {
    return (
      <TextField
        fullWidth
        variant="outlined"
        margin="none"
        size="small"
        label={label || "Value"}
        value={value || ''}
        onChange={(e) => {
          setFieldValue(formikField, e.target.value);
        }}
        error={Boolean(error)}
        helperText={error}
      />
    );
  }

  return (field?.type === FieldList.DATE.type ? (
    <>
      <Autocomplete
        options={Object.values(DATE_VALUE)}
        getOptionLabel={(option) => option || ''}
        value={value}
        fullWidth
        onChange={(event, newValue) => {
          setFieldValue(formikField, newValue);
        }}
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            label="Value"
            margin="none"
            size="small"
            variant="outlined"
          />
        )}
      />
      {value === DATE_VALUE.custom && (
        <FormTypes
          {...field}
          values={{ [fieldName]: value }}
          errors={{ [fieldName]: error }}
          touched={{ [fieldName]: touched }}
          fieldData={{ ...field, required: false, isUneditable: false, disableOnEdit: false }}
          label={label}
          name={field.fieldName}
          type={field.type}
          options={field.option || []}
          disabled={false}
          setFieldValue={(name, value) => {
            setFieldValue(formikField, value);
          }}
          required={false}
          fullWidth
          isTooltip={field?.isTooltip || false}
          tooltipMessage={field?.tooltipMessage || ''}
          size="small"
        />
      )}
    </>
  ) : ((['dropDown', 'multiSelect', 'checkBox', 'switch', 'currency', 'radio']?.includes(field?.type)) ?
    (<Autocomplete
      options={field.option || []}
      getOptionLabel={(option) => option.optionLabel || ''}
      multiple
      fullWidth
      value={
        Array.isArray(value)
          ? (field?.option || []).filter((opt: any) => value.includes(opt.optionValue))
          : []
      }
      onChange={(_event, selectedOptions: any[]) => {
        const newValue = selectedOptions.map((opt: any) => opt.optionValue);
        setFieldValue(formikField, newValue);
      }}
      size="small"
      renderInput={(params) => (
        <TextField
          {...params}
          label="Value"
          margin="none"
          name="fieldValue"
          size="small"
          variant="outlined"
        />
      )}
    />) : (
      <FormTypes
        {...field}
        values={{ [fieldName]: value }}
        errors={{ [fieldName]: error }}
        touched={{ [fieldName]: touched }}
        fieldData={{ ...field, required: false, isUneditable: false, disableOnEdit: false }}
        label={label}
        name={field.fieldName}
        type={field.type}
        options={field.option || []}
        disabled={false}
        setFieldValue={(name, value) => {
          setFieldValue(formikField, value);
        }}
        required={false}
        fullWidth
        isTooltip={field?.isTooltip || false}
        tooltipMessage={field?.tooltipMessage || ''}
        size="small"
      />
    )
  ))

};

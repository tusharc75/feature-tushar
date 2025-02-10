import { Fragment, useContext, useEffect, useState } from 'react';
import { Autocomplete, Box, Dialog, IconButton, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { isMobile, isTablet } from 'react-device-detect';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { FieldArray, Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FormTypes from 'src/components/Helpers/FormTypes';

export default function UpdateResourceActions({ onClose, onSuccess, resource, resourceData }) {
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

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ updateResourceActions: [] });
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    getResourceFieldList(resource);
  }, []);

  useEffect(() => {
    if (resourceData?.updateResourceActions?.length) {
      setInitialValues({ updateResourceActions: resourceData?.updateResourceActions });
    }
  }, [resourceData]);

  const handleSave = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`/sa-formbuilder/tabs/update-resource-action/${resource}`, { updateResourceActions: values?.updateResourceActions })
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

  const getResourceFieldList = async (resource) => {
    try {
      let {
        data: { data }
      } = await axiosInstance().get(`/field?resource=${resource}`);
      data = data?.filter((obj) => obj?.isCreate).map((d: any) => d.fieldData);
      setFields(data);
    } catch (e) {}
  };

  function validate(values) {
    const errors = {};
    if (values?.updateResourceActions?.length > 0) {
      values?.updateResourceActions?.forEach((cnd: any, index) => {
        if (!cnd?.updateField) {
          errors[`updateResourceActions.${index}.updateField`] = 'Update field is Required';
        }
        if (!cnd?.updateValue || (Array.isArray(cnd.updateValue) && !cnd?.updateValue?.length)) {
          errors[`updateResourceActions.${index}.updateValue`] = 'Update value is Required';
        }
        if (cnd?.checkFields?.length > 0) {
          cnd?.checkFields?.forEach((c, i) => {
            if (!c?.fieldName) {
              errors[`updateResourceActions.${index}.checkFields.${i}.fieldName`] = 'Field name is Required';
            }
            if (!c?.value || (Array.isArray(c.value) && !c?.value?.length)) {
              errors[`updateResourceActions.${index}.checkFields.${i}.value`] = 'Value is Required';
            }
            if (!c?.operator) {
              errors[`updateResourceActions.${index}.checkFields.${i}.operator`] = 'Operator is Required';
            }
          });
        }
      });
    }
    return errors;
  }

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
      {fields?.length ? (
        <Formik initialValues={initialValues} validateOnMount validate={validate} onSubmit={handleSave}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={onClose}
                title={'Actions'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
              />
              <CustomDialogContent className="pt-0">
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <FieldArray name="updateResourceActions">
                    {({ push, remove }) => (
                      <>
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-[var(--dark-primary,white)] py-3 pb-3">
                          <h6 className="text-sm font-semibold">Update Resource Actions</h6>
                          <ThemeButton
                            buttonType="theme"
                            onClick={() => push({ checkFields: [{ fieldName: '', value: '', operator: '' }], updateField: '', updateValue: '' })}
                          >
                            Add
                          </ThemeButton>
                        </div>
                        <ul className="list-none space-y-4">
                          {values?.updateResourceActions?.map((action, index) => (
                            <Card
                              values={values}
                              index={index}
                              parentRemove={remove}
                              setFieldValue={setFieldValue}
                              errors={errors}
                              touched={touched}
                              fields={fields}
                              operators={OPERATOR}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                  </FieldArray>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={onClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton disabled={submitting} buttonType="theme" onClick={submitForm} isLoading={submitting}>
                  Save
                </ThemeButton>
              </CustomDialogFooter>
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box height={'h-fit'} padding={2}>
          <CommonSkeleton lenArray={[...Array(6).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}

const Card = ({ values, index, parentRemove, setFieldValue, errors, touched, fields, operators }) => {
  return (
    <li className="flex list-none items-center gap-2">
      <fieldset className="flex-grow space-y-2 rounded-md border px-3 pb-3">
        <legend className=" text-right">
          <HtmlTooltip title={'Remove'}>
            <IconButton size="small" aria-label="close" onClick={() => parentRemove(index)}>
              <RemoveCircleOutline fontSize="small" color={'error'} />
            </IconButton>
          </HtmlTooltip>
        </legend>
        <fieldset className="rounded-md  p-3">
          <legend className="text-sm font-semibold">Conditions</legend>
          <div className="space-y-4">
            <FieldArray name={`updateResourceActions.${index}.checkFields`}>
              {({ push, remove }) => (
                <>
                  {values?.updateResourceActions[index]?.checkFields?.map((cnd, i, arr) => {
                    return (
                      <div
                        className={cn(
                          'grid grid-cols-1  gap-2',
                          values?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName
                            ? 'md:grid-cols-[1fr_1fr_1fr_auto]'
                            : 'md:grid-cols-[1fr_1fr_auto]'
                        )}
                      >
                        <Autocomplete
                          options={fields}
                          getOptionLabel={(option) => option?.fieldLabel || ''}
                          value={
                            fields?.find((data) => data?.fieldName === values?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName) || {}
                          }
                          fullWidth
                          onChange={(e, newValue) => {
                            setFieldValue(`updateResourceActions.${index}.checkFields.${i}.fieldName`, newValue?.fieldName);
                          }}
                          size="small"
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="FieldName"
                              margin="none"
                              size="small"
                              error={
                                touched?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName &&
                                Boolean(errors[`updateResourceActions.${index}.checkFields.${i}.fieldName`])
                              }
                              helperText={
                                touched?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName &&
                                errors[`updateResourceActions.${index}.checkFields.${i}.fieldName`]
                              }
                              variant="outlined"
                            />
                          )}
                        />
                        <Autocomplete
                          options={operators}
                          getOptionLabel={(option) => option?.optionLabel || ''}
                          value={
                            operators?.find((data) => data?.optionValue === values?.updateResourceActions?.[index]?.checkFields?.[i]?.operator) ??
                            null
                          }
                          fullWidth
                          onChange={(event, newValue) => {
                            setFieldValue(`updateResourceActions.${index}.checkFields.${i}.operator`, newValue?.optionValue || '');
                          }}
                          size="small"
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Operator"
                              margin="none"
                              size="small"
                              error={
                                touched?.updateResourceActions?.[index]?.checkFields?.[i]?.operator &&
                                Boolean(errors[`updateResourceActions.${index}.checkFields.${i}.operator`])
                              }
                              helperText={
                                touched?.updateResourceActions?.[index]?.checkFields?.[i]?.operator &&
                                errors[`updateResourceActions.${index}.checkFields.${i}.operator`]
                              }
                              variant="outlined"
                            />
                          )}
                        />
                        {values?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName ? (
                          <DynamicFormField
                            fieldName={values?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName}
                            value={values.updateResourceActions?.[index]?.checkFields?.[i]?.value}
                            error={errors[`updateResourceActions.${index}.checkFields.${i}.value`]}
                            touched={touched?.updateResourceActions?.[index]?.checkFields?.[i]?.value}
                            formikField={`updateResourceActions.${index}.checkFields.${i}.value`}
                            field={fields?.find((f) => f.fieldName === values?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName)}
                            setFieldValue={setFieldValue}
                            label={'Value'}
                          />
                        ) : null}
                        <div className="mt-1 flex">
                          <HtmlTooltip title={'Remove'}>
                            <IconButton size="small" aria-label="close" onClick={() => remove(i)} disabled={arr.length === 1}>
                              <RemoveCircleOutline fontSize="small" color={'error'} />
                            </IconButton>
                          </HtmlTooltip>
                          <HtmlTooltip title={'Add'}>
                            <IconButton size="small" aria-label="add" onClick={() => push({ fieldName: '', operator: '', value: '' })}>
                              <AddCircleOutline fontSize="small" color={'primary'} />
                            </IconButton>
                          </HtmlTooltip>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </FieldArray>
          </div>
        </fieldset>
        <fieldset className="rounded-md  p-3">
          <legend className="text-sm font-semibold">Actions</legend>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Autocomplete
              options={fields}
              getOptionLabel={(option) => option?.fieldLabel || ''}
              value={fields?.find((data) => data?.fieldName === values?.updateResourceActions?.[index]?.updateField)}
              fullWidth
              onChange={(e, newValue) => {
                setFieldValue(`updateResourceActions.${index}.updateField`, newValue?.fieldName || '');
              }}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Update Field"
                  margin="none"
                  size="small"
                  error={touched?.updateResourceActions?.[index]?.updateField && Boolean(errors[`updateResourceActions.${index}.updateField`])}
                  helperText={touched?.updateResourceActions?.[index]?.updateField && errors[`updateResourceActions.${index}.updateField`]}
                  variant="outlined"
                />
              )}
            />
            <div className="flex-grow">
              {values?.updateResourceActions?.[index]?.updateField ? (
                <DynamicFormField
                  fieldName={values?.updateResourceActions?.[index]?.updateField}
                  value={values.updateResourceActions?.[index]?.updateValue}
                  error={errors[`updateResourceActions.${index}.updateValue`]}
                  touched={touched?.updateResourceActions?.[index]?.updateValue}
                  formikField={`updateResourceActions.${index}.updateValue`}
                  field={fields?.find((f) => f.fieldName === values?.updateResourceActions?.[index]?.updateField)}
                  setFieldValue={setFieldValue}
                  label={'Update Value'}
                />
              ) : null}
            </div>
          </div>
        </fieldset>
      </fieldset>
    </li>
  );
};

const DynamicFormField = ({ fieldName, value, field, setFieldValue, formikField, error, touched, label }) => {
  return (
    <FormTypes
      {...field}
      values={{
        [fieldName]: value
      }}
      errors={{
        [fieldName]: error
      }}
      touched={{
        [fieldName]: touched
      }}
      fieldData={field}
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
  );
};

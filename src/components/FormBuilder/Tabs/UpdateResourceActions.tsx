import { Fragment, useContext, useEffect, useState } from 'react';
import { Autocomplete, Box, Dialog, IconButton, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { isMobile, isTablet } from 'react-device-detect';
import { cn, CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
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
import { useData } from 'src/StateProvider/Provider';
import FieldList from 'src/components/FormBuilder/FieldList';
import { startCase } from 'lodash';

const DATE_VALUE = {
  currentDate: 'Current Date',
  custom: 'Custom'
}

export default function UpdateResourceActions({ onClose, onSuccess, resource, resourceData, _key }) {
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

  const {
    state: { resources }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ [_key]: [] });
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([]);
  const [lookupResourceDataOptions, setLookupResourceDataOptions] = useState({})

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.product}`)
      .then(({ data: { data } }) => {
        setLookupResourceDataOptions(data)
      })
      .catch((err) => {
      });
  }, [])

  useEffect(() => {
    getResourceFieldList(resource);
  }, []);

  useEffect(() => {
    if (resourceData?.[_key]?.length) {
      setInitialValues({ [_key]: resourceData?.[_key] });
    }
  }, [resourceData]);

  const handleSave = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`/sa-formbuilder/tabs/update-resource-action-or-trigger/${resource}`, { data: values?.[_key], _key: _key })
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
    } catch (e) { }
  };

  function validate(values) {
    const errors = {};
    if (values?.[_key]?.length > 0) {
      values?.[_key]?.forEach((cnd: any, index) => {
        if (!cnd?.updateField) {
          errors[`${_key}.${index}.updateField`] = 'Update field is Required';
        }
        if (!cnd?.updateValue || (Array.isArray(cnd.updateValue) && !cnd?.updateValue?.length)) {
          errors[`${_key}.${index}.updateValue`] = 'Update value is Required';
        }
        if (cnd?.checkFields?.length > 0) {
          cnd?.checkFields?.forEach((c, i) => {
            if (!c?.fieldName) {
              errors[`${_key}.${index}.checkFields.${i}.fieldName`] = 'Field name is Required';
            }
            if (!c?.value || (Array.isArray(c.value) && !c?.value?.length)) {
              errors[`${_key}.${index}.checkFields.${i}.value`] = 'Value is Required';
            }
            if (!c?.operator) {
              errors[`${_key}.${index}.checkFields.${i}.operator`] = 'Operator is Required';
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
                title={startCase(_key)}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
              />
              <CustomDialogContent className="pt-0">
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <FieldArray name={_key}>
                    {({ push, remove }) => (
                      <>
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[var(--dark-primary,white)] py-3 pb-3">
                          <ThemeButton
                            buttonType='theme'
                            onClick={() => push({ checkFields: [{ fieldName: '', value: '', operator: '' }], products: [], updateField: '', updateValue: '' })}
                          >
                            Add
                          </ThemeButton>
                        </div>
                        <ul className="list-none space-y-4">
                          {values?.[_key]?.map((action, index) => (
                            <Card
                              values={values}
                              index={index}
                              parentRemove={remove}
                              setFieldValue={setFieldValue}
                              errors={errors}
                              touched={touched}
                              fields={fields}
                              operators={OPERATOR}
                              resources={resources}
                              lookupResourceDataOptions={lookupResourceDataOptions}
                              _key={_key}
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

const Card = ({ values, index, parentRemove, setFieldValue, errors, touched, fields, operators, resources, lookupResourceDataOptions, _key }) => {
  return (
    <li className="flex list-none items-center gap-2">
      <fieldset className="flex-grow space-y-2 rounded-md border px-3 pb-3">
        <legend className="text-right">
          <HtmlTooltip title={'Remove'}>
            <IconButton size="small" aria-label="close" onClick={() => parentRemove(index)}>
              <RemoveCircleOutline fontSize="small" color={'error'} />
            </IconButton>
          </HtmlTooltip>
        </legend>
        <fieldset className="rounded-md border border-dashed border-gray-200 p-3 dark:border-gray-800">
          <legend className="px-1 text-sm font-semibold">Conditions</legend>
          <div className="space-y-4">
            <FieldArray name={`${_key}.${index}.checkFields`}>
              {({ push, remove }) => (
                <>
                  {values?.[_key][index]?.checkFields?.map((cnd, i, arr) => {
                    return (
                      <div
                        className={cn(
                          'grid grid-cols-1  gap-2',
                          values?.[_key]?.[index]?.checkFields?.[i]?.fieldName
                            ? 'md:grid-cols-[1fr_1fr_1fr_auto]'
                            : 'md:grid-cols-[1fr_1fr_auto]'
                        )}
                      >
                        <Autocomplete
                          options={fields}
                          getOptionLabel={(option) => option?.fieldLabel || ''}
                          value={
                            fields?.find((data) => data?.fieldName === values?.[_key]?.[index]?.checkFields?.[i]?.fieldName) || {}
                          }
                          fullWidth
                          onChange={(e, newValue) => {
                            setFieldValue(`${_key}.${index}.checkFields.${i}.fieldName`, newValue?.fieldName);
                          }}
                          size="small"
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Field Name"
                              margin="none"
                              size="small"
                              error={
                                touched?.[_key]?.[index]?.checkFields?.[i]?.fieldName &&
                                Boolean(errors[`${_key}.${index}.checkFields.${i}.fieldName`])
                              }
                              helperText={
                                touched?.[_key]?.[index]?.checkFields?.[i]?.fieldName &&
                                errors[`${_key}.${index}.checkFields.${i}.fieldName`]
                              }
                              variant="outlined"
                            />
                          )}
                        />
                        <Autocomplete
                          options={operators}
                          getOptionLabel={(option) => option?.optionLabel || ''}
                          value={
                            operators?.find((data) => data?.optionValue === values?.[_key]?.[index]?.checkFields?.[i]?.operator) ??
                            null
                          }
                          fullWidth
                          onChange={(event, newValue) => {
                            setFieldValue(`${_key}.${index}.checkFields.${i}.operator`, newValue?.optionValue || '');
                          }}
                          size="small"
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Operator"
                              margin="none"
                              size="small"
                              error={
                                touched?.[_key]?.[index]?.checkFields?.[i]?.operator &&
                                Boolean(errors[`${_key}.${index}.checkFields.${i}.operator`])
                              }
                              helperText={
                                touched?.[_key]?.[index]?.checkFields?.[i]?.operator &&
                                errors[`${_key}.${index}.checkFields.${i}.operator`]
                              }
                              variant="outlined"
                            />
                          )}
                        />
                        {values?.[_key]?.[index]?.checkFields?.[i]?.fieldName ? (
                          <DynamicFormField
                            fieldName={values?.[_key]?.[index]?.checkFields?.[i]?.fieldName}
                            value={values?.[_key]?.[index]?.checkFields?.[i]?.value}
                            error={errors[`${_key}.${index}.checkFields.${i}.value`]}
                            touched={touched?.[_key]?.[index]?.checkFields?.[i]?.value}
                            formikField={`${_key}.${index}.checkFields.${i}.value`}
                            field={fields?.find((f) => f.fieldName === values?.[_key]?.[index]?.checkFields?.[i]?.fieldName)}
                            setFieldValue={setFieldValue}
                            label={'Value'}
                          />
                        ) : null}
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
          <div className='mt-4'>
            <Autocomplete
              options={lookupResourceDataOptions[sidebarResource.product] || []}
              getOptionLabel={(option: any) => option?.optionLabel || ''}
              fullWidth
              multiple
              value={[...lookupResourceDataOptions[sidebarResource.product] || []]?.filter(p => values?.[_key]?.[index]?.products?.includes(p?.optionValue))}
              onChange={(e, newValue) => {
                setFieldValue(`${_key}.${index}.products`, newValue?.map(v => v?.optionValue) || []);
              }}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={resources?.product?.titlePlural}
                  margin="none"
                  size="small"
                  variant="outlined"
                />
              )}
            />
          </div>
        </fieldset>
        <fieldset className="rounded-md  border border-dashed border-gray-200 p-3 dark:border-gray-800">
          <legend className="px-1 text-sm  font-semibold">Actions</legend>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Autocomplete
              options={fields}
              getOptionLabel={(option) => option?.fieldLabel || ''}
              value={fields?.find((data) => data?.fieldName === values?.[_key]?.[index]?.updateField)}
              fullWidth
              onChange={(e, newValue) => {
                setFieldValue(`${_key}.${index}.updateField`, newValue?.fieldName || '');
              }}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Update Field"
                  margin="none"
                  size="small"
                  error={touched?.[_key]?.[index]?.updateField && Boolean(errors[`${_key}.${index}.updateField`])}
                  helperText={touched?.[_key]?.[index]?.updateField && errors[`${_key}.${index}.updateField`]}
                  variant="outlined"
                />
              )}
            />
            <div className="flex-grow">
              {values?.[_key]?.[index]?.updateField ? (
                <DynamicFormField
                  fieldName={values?.[_key]?.[index]?.updateField}
                  value={values?.[_key]?.[index]?.updateValue}
                  error={errors[`${_key}.${index}.updateValue`]}
                  touched={touched?.[_key]?.[index]?.updateValue}
                  formikField={`${_key}.${index}.updateValue`}
                  field={fields?.find((f) => f.fieldName === values?.[_key]?.[index]?.updateField)}
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
    field?.type === FieldList.DATE.type ? (
      <>
        <Autocomplete
          options={Object.values(DATE_VALUE)}
          getOptionLabel={(option) => option || ''}
          value={value === DATE_VALUE.currentDate ? DATE_VALUE.currentDate : DATE_VALUE.custom}
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
        {value != DATE_VALUE.currentDate && (
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
    ) : (
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
  );
};

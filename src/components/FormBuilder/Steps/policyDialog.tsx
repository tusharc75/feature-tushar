import { useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, FormControlLabel, Checkbox, TextField, IconButton, Typography, Grid } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { FieldArray, Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { resourcePolicy } from './helper';
import { Autocomplete } from '@material-ui/lab';
import { AddCircleOutline, RemoveCircleOutline } from '@material-ui/icons';
import { isArray } from 'lodash';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const PolicyDialog = ({ resourceData, resource, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [initialValues, setInitialValues] = useState({ data: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let currentPolicy = resourceData?.policy || {};
    let defaultPolicy = resourcePolicy.find((e) => e.resource === resource);
    setInitialValues({
      data: defaultPolicy.policy.map((e) => {
        return {
          ...e,
          fieldName: e.fieldName,
          fieldLabel: e.fieldLabel,
          type: e.type,
          data: currentPolicy && currentPolicy?.hasOwnProperty(e.fieldName) ? currentPolicy[e.fieldName] : e.defaultValue,
          fields: e?.fields || [],
        };
      })
    });
  }, []);

  useEffect(() => {
    if (resource) {
      setLoading(true)
      axiosInstance().get(`/field?resource=${resource}`)
        .then(({ data: { data } }) => {
          setFields(data)
          setLoading(false)
        })
    }
  }, [resource])

  const updateData = (values) => {
    setIsSubmitting(true);
    let updatedPolicy = values.data.reduce((acc, { fieldName, data }) => {
      return { ...acc, [fieldName]: data };
    }, {});
    let data = {
      policy: { ...updatedPolicy }
    };
    axiosInstance()
      .put(`/sa-formbuilder/steps/policy/${resource}`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const validate = (values) => {
    const errors = {};
    if (resource === sidebarResource.serializedAsset) {
      const validationFields = initialValues[`data`]?.[0]?.fields?.filter((e) => e.required);
      values.data.forEach((value, index) => {
        value?.data?.forEach((ele, idx) => {
          validationFields?.forEach((e) => {
            if (!ele[e?.fieldName]) {
              errors[`data.${index}.data.${idx}.status`] = `${e?.fieldLabel} is required`;
            }
            else if (e?.type === 'multiSelect' && (!ele[e?.fieldName] || !ele[e?.fieldName].length)) {
              errors[`data.${index}.data.${idx}.fields`] = `${e?.fieldLabel} is required`;
            }
          })
        });
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
          onClose();
        }
      }}
    >
      {initialValues?.data?.length ? (
        <Formik initialValues={initialValues} onSubmit={updateData} validate={validate}>
          {({ values, submitForm, setFieldValue, errors, touched }) => (
            <>
              <CustomDialogHeader
                onClose={onClose}
                title={'Policy'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
              />
              <CustomDialogContent>
                <Form>
                  <div className="flex flex-col gap-1">
                    <FieldArray
                      name="data"
                      render={(arrayHelpers) =>
                        values.data?.map((data, index) => {
                          return (
                            <RenderFormFields
                              key={index}
                              data={data}
                              idx={index}
                              type={data.type}
                              errors={errors}
                              touched={touched}
                              resource={resource}
                              setFieldValue={setFieldValue}
                              onChange={(e, val) => {
                                arrayHelpers.replace(index, {
                                  ...values?.data[index],
                                  ['data']: val
                                });
                                const res = initialValues.data;
                                res.forEach((r) => {
                                  if (r.fieldName === data.fieldName) {
                                    r.data = val;
                                  }
                                });
                              }}
                              fields={fields}
                              loading={loading}
                            />
                          );
                        })
                      }
                    />
                  </div>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button size="small" color="primary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
                >
                  Save
                </Button>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default PolicyDialog;

const RenderFormFields = ({ data, type, onChange, idx, errors, touched, resource, setFieldValue, fields, loading }) => {

  if (type === 'checkBox') {
    return <CheckBoxField
      data={data}
      onChange={onChange}
    />;
  }
  else if (type === 'multipleFields') {
    return (
      <MultipleFormFields
        idx={idx}
        data={data}
        onChange={onChange}
        resource={resource}
        errors={errors}
        touched={touched}
        setFieldValue={setFieldValue}
        fields={fields}
      />
    );
  } else if (type === 'multiSelect') {
    const options = fields?.filter((ele) => !ele.fieldData?.primaryField)?.map((e) => {
      return {
        optionLabel: e?.fieldData?.fieldLabel,
        optionValue: e?.fieldData?.fieldName,
        order: e?.fieldData?.order
      };
    })
    return (
      <>
        {!loading ? (
          <Grid container spacing={2}>
            <Grid item lg={6} md={6} sm={6} xs={12}>
              <DropDownField
                options={options}
                error={null}
                touched={null}
                onChange={(e, val) => {
                  onChange(null, isArray(val) ? val?.map((ele) => ele.optionValue) : [])
                }}
                value={options?.filter((_f) => data?.data?.includes(_f?.optionValue))?.length > 0 ? options?.filter((opt) => data?.data?.includes(opt?.optionValue)) : []}
                multiple={type === 'multiSelect'}
                required={false}
                fieldLabel={data?.fieldLabel}
                fieldName={data?.fieldName}
              />
            </Grid>
          </Grid>
        ) : (
          <Box className="h-fit" p={2}>
            <CommonSkeleton lenArray={[...Array(5).keys()]} />
          </Box>
        )}
      </>
    )
  }
  else if (type === 'dropDown') {
    let options = []
    if (data?.fieldOption) {
      options = fields?.find((e) => e?.fieldData?.fieldName === data?.fieldOption)?.fieldData?.option || [];
    }
    return (
      <Grid container spacing={2}>
        <Grid item lg={6} md={6} sm={6} xs={12}>
          <Autocomplete
            fullWidth
            size="small"
            options={options}
            getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
            getOptionSelected={(option: any, val) => {
              return option?.optionValue === val?.optionValue;
            }}
            value={options?.find((e) => e.optionValue === data?.data) || {}}
            onChange={(e, val) => {
              onChange(null, val?.optionValue || '')
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label={data?.fieldLabel}
                name={data?.fieldName}
                variant="outlined"
                size="small"
              />
            )}
          />
        </Grid>
      </Grid>
    )
  }
  return null;
};

const CheckBoxField = ({ data, onChange }) => {
  return <FormControlLabel control={<Checkbox name={data?.fieldName} checked={data?.data} onChange={onChange} />} label={data?.fieldLabel} />;
};

const DropDownField = ({ onChange, value, options, multiple = false, error, touched, required = true, fieldLabel, fieldName }) => {
  return (
    <Autocomplete
      fullWidth
      size="small"
      multiple={multiple}
      disableCloseOnSelect={multiple}
      options={options}
      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
      getOptionSelected={(option: any, val) => {
        return option?.optionValue === val?.optionValue;
      }}
      value={value}
      onChange={onChange}
      limitTags={2}
      renderInput={(params) => (
        <TextField
          {...params}
          margin="dense"
          name={fieldName}
          label={fieldLabel}
          error={touched && Boolean(error)}
          helperText={touched && error}
          variant="outlined"
          required={required}
          size="small"
          style={{ whiteSpace: 'nowrap' }}
        />
      )}
    />
  );
};

const MultipleFormFields = ({ data: Data, idx, onChange, errors, touched, resource, setFieldValue, fields }) => {

  const [fieldOptions, setFieldOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [initialData, setInitialData] = useState({ fieldsData: [...Data?.data], fields: Data?.fields });

  useEffect(() => {
    fetchResourceFields();
  }, [])

  const fetchResourceFields = async () => {
    const updatedFields = [...Data.fields];
    const lookupResources = updatedFields.reduce((acc, ele) => {
      if (ele?.lookupResource) {
        acc.push(ele.lookupResource);
      }
      return acc;
    }, []);
    const lookupString = lookupResources?.join(',');
    const options = await fetchResourceOptions(lookupString);
    for (const ele of updatedFields) {
      if (ele?.lookupResource) {
        ele.option = options[ele.lookupResource];
      }
    }
    setInitialData((prevState) => ({ ...prevState, fields: updatedFields }));
  }

  useEffect(() => {
    let fieldsData = [...fields];
    let statusOptions = fieldsData?.find((ele) => ele?.fieldData?.fieldName === 'status')?.fieldData?.option;
    setStatusOptions(statusOptions);
    fieldsData = fieldsData?.filter((ele) => !ele.fieldData?.primaryField)?.map((e) => {
      return {
        optionLabel: e?.fieldData?.fieldLabel,
        optionValue: e?.fieldData?.fieldName,
        order: e?.fieldData?.order
      };
    });
    setFieldOptions(fieldsData);
  }, [fields]);

  const getStatusOptions = (data) => {
    const options = statusOptions?.filter((ele) => !data?.some((e) => e?.status === ele.optionValue));
    return options ? options : statusOptions;
  };

  return (
    <>
      {statusOptions?.length > 0 && fieldOptions?.length && initialData ? (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mx-2">
            <Typography variant="subtitle2">{Data.fieldLabel}</Typography>
            <HtmlTooltip title={'Add'}>
              <IconButton
                size="small"
                color="primary"
                aria-label="delete"
                onClick={() => {
                  const data = [...initialData?.fieldsData];
                  data.push({ status: '', fields: [] });
                  setInitialData((prevState) => ({ ...prevState, fieldsData: [...data] }));
                  onChange(null, data);
                }}
              >
                <AddCircleOutline fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </div>
          {initialData?.fieldsData?.map((value, index) => (
            <div className="flex items-center justify-between gap-1 p-2 border border-[var(--common-border-color)] mb-4 mt-4" key={index}>
              <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-2 w-[94%]">
                {initialData?.fields?.map((field) => (
                  field?.type === 'checkBox' ?
                    <FormControlLabel
                      control={<Checkbox name={field.fieldName} checked={value[field.fieldName]}
                        onChange={(e) => {
                          const updatedVal = e.target.checked;
                          setFieldValue(`data.${idx}.data.${index}.${field.fieldName}`, updatedVal);
                          let updatedData = [...initialData?.fieldsData];
                          updatedData[index][field.fieldName] = updatedVal;
                          setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                          onChange(null, updatedData);
                        }}
                      />} label={field?.fieldLabel} />
                    :
                    <DropDownField
                      key={field.fieldName}
                      options={field?.lookupResource ? field.option : field?.fieldName === 'status' ? getStatusOptions(initialData?.fieldsData) : fieldOptions}
                      error={errors[`data.${idx}.data.${index}.${field.fieldName}`]}
                      touched={touched?.data && touched.data[idx].data[index][field.fieldName]}
                      onChange={(e, val) => {
                        const updatedVal = isArray(val) ? val?.map((ele) => ele.optionValue) : val?.optionValue;
                        setFieldValue(`data.${idx}.data.${index}.${field.fieldName}`, updatedVal);
                        let updatedData = [...initialData?.fieldsData];
                        updatedData[index][field.fieldName] = updatedVal;
                        setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                        onChange(null, updatedData);
                      }}
                      value={
                        field?.type === 'multiSelect'
                          ? field?.lookupResource ? field?.option?.filter((opt) => value[`${field.fieldName}`]?.some((val) => val === opt.optionValue)) : fieldOptions.filter((opt) => value[`${field.fieldName}`]?.some((val) => val === opt.optionValue))
                          : statusOptions?.filter((ele) => ele?.optionValue === value[`${field.fieldName}`])[0]
                      }
                      multiple={field?.type === 'multiSelect'}
                      fieldLabel={field?.fieldLabel}
                      fieldName={field?.fieldLabel}
                      required={field?.required}
                    />
                ))}
              </div>
              <HtmlTooltip title='Remove'>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="delete"
                  onClick={() => {
                    const updatedData = [...initialData.fieldsData];
                    updatedData.splice(index, 1);
                    setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                    onChange(null, updatedData);
                  }}
                >
                  <RemoveCircleOutline fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </div>
          ))}
        </div>
      ) : (
        <Box className="h-fit" p={2}>
          <CommonSkeleton lenArray={[...Array(5).keys()]} />
        </Box>
      )}
    </>
  );
};

const fetchResourceOptions = async (resources) => {
  const {
    data: { data: lookupResourceOptions }
  } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${resources}`);
  return lookupResourceOptions
}

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, FormControlLabel, Checkbox, TextField, IconButton } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { FieldArray, Form, Formik, getIn } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { resourcePolicy } from './helper';
import { Autocomplete } from '@material-ui/lab';
import { AddCircleOutline, Clear } from '@material-ui/icons';
import { flatMap, isArray, isEmpty, map } from 'lodash';
import React from 'react';

const PolicyDialog = ({ resourceData, resource, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [initialValues, setInitialValues] = useState({ data: [] });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState({});

  useEffect(() => {
    let currentPolicy = resourceData?.policy || {};
    let defaultPolicy = resourcePolicy.find((e) => e.resource === resource);
    setInitialValues({
      data: defaultPolicy.policy.map((e) => {
        return {
          fieldName: e.fieldName,
          fieldLabel: e.fieldLabel,
          type: e.type,
          data: currentPolicy[e.fieldName] || [],
          fields: e?.fields || []
        };
      })
    });
  }, []);

  const updateData = (values) => {
    setIsSubmitting(true);
    console.log(values)
    let updatedPolicy = values.data.reduce((acc, { fieldName, data }) => {
      return { ...acc, [fieldName]: data };
    }, {});
    let data = {
      policy: { ...updatedPolicy }
    };
console.log(data)
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

  return (
    <Dialog
      maxWidth="sm"
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
        <Formik
          initialValues={initialValues}
          onSubmit={updateData}
          validate={() => {
            return error;
          }}
        >
          {({ values, submitForm }) => (
            <>
            {console.log(values)}
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
                              type={data.type}
                              setError={setError}
                              resource={resource}
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

const CheckBoxField = ({ data, onChange }) => {
  return <FormControlLabel control={<Checkbox name={data?.fieldName} checked={data?.checked} onChange={onChange} />} label={data?.fieldLabel} />;
};

const DropDownField = React.memo(({ onChange, value, options, multiple = false, error, required = true, fieldLabel, fieldName }: any) => {
  // if(multiple){
  //   console.log(options)
  //   console.log(options.filter((option) =>
  //     value.find((selectedOption) => selectedOption === option.optionValue)))
  // }
  return (
    <Autocomplete
      fullWidth
      className="max-w-[300px]"
      size="small"
      multiple={multiple}
      options={options}
      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
      getOptionSelected={(option: any, val) => {
        return option.optionValue === val.optionValue;
      }}
      value={value}
      onChange={onChange}
      renderInput={(params) => (
        <TextField
          {...params}
          margin="dense"
          name={fieldName}
          placeholder={`Enter ${fieldLabel}`}
          label={fieldLabel}
          error={Boolean(error)}
          helperText={error}
          variant="outlined"
          required={required}
          fullWidth
          className="m-0"
        />
      )}
    />
  );
});

const RenderFormFields = ({ data, type, onChange, setError, resource }: any) => {
  console.log(data)
  if (type === 'checkBox') {
    return <CheckBoxField data={data} onChange={onChange} />;
  } else if (type === 'multipleFields') {
    return <MultipleFormFields data={data} onChange={onChange} resource={resource} setError={setError} />;
  }
};

const MultipleFormFields = ({ data: Data, onChange, setError, resource }) => {
  const [fieldOptions, setFieldOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    fetchOptions();
  }, []);
  const fetchOptions = async () => {
    const fields = await axiosInstance().get(`/field?resource=${resource}`);
    let fieldsData = fields?.data?.data;
    let statusOptions = fieldsData?.find((ele) => ele?.fieldData?.fieldName === 'status')?.fieldData?.option;
    setStatusOptions(statusOptions);
    fieldsData = fieldsData
      ?.filter((ele) => ele.fieldData?.fieldName !== 'status')
      ?.map((e) => {
        return {
          optionLabel: e?.fieldData?.fieldLabel,
          optionValue: e?.fieldData?.fieldName,
          order: e?.fieldData?.order,
        };
      });
    setFieldOptions(fieldsData);
    let data = [...Data?.data] || []
    data = data?.map((ele)=> {
      let status = statusOptions?.find((e)=> e.optionValue===ele.status);
      let fields = fieldsData?.filter((e)=> ele?.fields?.some((field)=> field===e.optionValue))
      return {
        status,
        fields
      }
    })
    console.log(statusOptions)
    console.log(fieldsData)
    setInitialData({ fieldsData: ([...data] || []) });
  };

  const getStatusOptions = (data) => {
    const options = statusOptions?.filter((ele) => !data?.some((e) => e?.status?.optionValue === ele.optionValue));
    return options ?? statusOptions;
  };
  const getFieldOptions = (data) => {
    const options = fieldOptions.filter((ele) => !data?.some((e) => e?.optionValue === ele.optionValue));
    return options ?? fieldOptions;
  };

  const validate = (values) => {
    const errors: any = {};
    const touched: any = {};
    values.fieldsData.forEach((value, index) => {
      if (!value.status) {
        errors[`fieldsData.${index}.status`] = 'Status is required';
      }

      if (!value.fields.length) {
        errors[`fieldsData.${index}.fields`] = 'Fields is required';
      }
    });
    if (!isEmpty(errors)) {
      setError({ [Data?.fieldName]: `${Data?.fieldLabel} is required` });
    } else {
      setError({});
    }

    return errors;
  };
console.log(initialData)
  return (
    <>
      {statusOptions?.length > 0 && fieldOptions?.length && initialData ? (
        <Formik initialValues={initialData} validateOnMount onSubmit={() => {}} validate={validate}>
          {({ values, setFieldValue, errors }) => (
            <div className="flex flex-col gap-2">
              {console.log(values)}
              <Form>
                <FieldArray
                  name="fieldsData"
                  render={(arrayHelpers) => (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-end">
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label="delete"
                            onClick={() => {
                              arrayHelpers.push({ status: '', fields: [] });
                            }}
                          >
                            <AddCircleOutline fontSize="small" />
                          </IconButton>
                        </div>

                        {values?.fieldsData?.map((value, index) => (
                          <div className="flex items-center justify-center gap-1 p-2" key={index}>
                            {Data?.fields?.map((field) => (
                              <DropDownField
                                options={field?.fieldName === 'status' ? getStatusOptions(values?.fieldsData) : getFieldOptions(value?.fields)}
                                error={errors[`fieldsData.${index}.${field.fieldName}`]}
                                onChange={(e, val) => {
                                  setFieldValue(`fieldsData.${index}.${field.fieldName}`, val);
                                  console.log(values?.fieldsData);
                                  let updatedData = [...values?.fieldsData];
                                  updatedData[index][field.fieldName] = val;
                                  updatedData = updatedData?.map((ele) => {
                                    const status = ele?.status?.optionValue;
                                    const fields = ele?.fields?.map((e) => e.optionValue);
                                    return {
                                      status,
                                      fields
                                    };
                                  });
                                  console.log(updatedData);
                                  onChange(null, updatedData);
                                }}
                                value={value[`${field.fieldName}`]}
                                multiple={field?.type === 'multiselect'}
                                fieldLabel={field?.fieldLabel}
                                fieldName={field?.fieldName}
                              />
                            ))}

                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="delete"
                              onClick={() => {
                                arrayHelpers.remove(index);
                              }}
                            >
                              <Clear fontSize="small" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                />
              </Form>
            </div>
          )}
        </Formik>
      ) : (
        <Box p={2} height={100}>
          <CommonSkeleton lenArray={[...Array(5).keys()]} />
        </Box>
      )}
    </>
  );
};

import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { Autocomplete, Box, Checkbox, FormControlLabel, IconButton, TextField, Typography } from '@mui/material';
import { isArray } from 'lodash';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Grid from '@mui/material/Grid2';
import { FieldArray } from 'formik';

const Policy = ({ values, setFieldValue, errors, touched, resource, initialValues }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resource) {
      setLoading(true);
      axiosInstance()
        .get(`/field?resource=${resource}`)
        .then(({ data: { data } }) => {
          setFields(data);
          setLoading(false);
        });
    }
  }, [resource]);

  return (
    <div className="flex flex-col gap-1">
      <FieldArray
        name="policies"
        render={(arrayHelpers) =>
          values.policies?.map((data, index) => {
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
                    ...values?.policies[index],
                    ['data']: val
                  });
                  const res = initialValues.policies;
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
  );
};

export default Policy;

const RenderFormFields = ({ data, type, onChange, idx, errors, touched, resource, setFieldValue, fields, loading }) => {
  if (type === 'checkBox') {
    return <CheckBoxField data={data} onChange={onChange} />;
  } else if (type === 'multipleFields') {
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
    const options =
      data?.option && data?.option?.length
        ? data?.option
        : fields
            ?.filter((ele) => !ele.fieldData?.primaryField)
            ?.map((e) => {
              return {
                optionLabel: e?.fieldData?.fieldLabel,
                optionValue: e?.fieldData?.fieldName,
                order: e?.fieldData?.order
              };
            });
    return (
      <>
        {!loading ? (
          <Grid container spacing={2}>
            <Grid size={{ lg: 6, md: 6, sm: 6, xs: 12 }}>
              <DropDownField
                options={options}
                error={null}
                touched={null}
                onChange={(e, val) => {
                  onChange(null, isArray(val) ? val?.map((ele) => ele.optionValue) : []);
                }}
                value={
                  options?.filter((_f) => data?.data?.includes(_f?.optionValue))?.length > 0
                    ? options?.filter((opt) => data?.data?.includes(opt?.optionValue))
                    : []
                }
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
    );
  } else if (type === 'dropDown') {
    let options = data?.option && data?.option?.length ? data?.option : [];
    if (data?.fieldOption) {
      options = fields?.find((e) => e?.fieldData?.fieldName === data?.fieldOption)?.fieldData?.option || [];
    }
    return (
      <Grid container spacing={2}>
        <Grid size={{ lg: 6, md: 6, sm: 6, xs: 12 }}>
          <Autocomplete
            fullWidth
            size="small"
            options={options}
            getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
            isOptionEqualToValue={(option: any, val) => {
              return option?.optionValue === val?.optionValue;
            }}
            value={options?.find((e) => e.optionValue === data?.data) || {}}
            onChange={(e, val) => {
              onChange(null, val?.optionValue || '');
            }}
            renderInput={(params) => (
              <TextField {...params} margin="dense" label={data?.fieldLabel} name={data?.fieldName} variant="outlined" size="small" />
            )}
          />
        </Grid>
      </Grid>
    );
  } else if (type === 'number') {
    return (
      <Grid container spacing={2}>
        <Grid size={{ lg: 6, md: 6, sm: 6, xs: 12 }}>
          <TextField
            name={data?.fieldName}
            variant="outlined"
            value={data?.data}
            label={data?.fieldLabel}
            size="small"
            fullWidth
            type="number"
            onChange={(event: any) => {
              onChange(null, parseFloat(event.target.value));
            }}
          />
        </Grid>
      </Grid>
    );
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
      getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
      isOptionEqualToValue={(option: any, val) => {
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
  const [optionLoading, setOptionLoading] = useState(false);

  useEffect(() => {
    fetchResourceFields();
  }, []);

  const fetchResourceFields = async () => {
    setOptionLoading(true);
    const updatedFields = [...Data.fields];
    const lookupResources = updatedFields.reduce((acc, ele) => {
      if (ele?.lookupResource) {
        acc.push(ele.lookupResource);
      }
      return acc;
    }, []);
    const lookupString = lookupResources?.join(',');
    if (lookupString) {
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${lookupString}`)
        .then(({ data: { data: options } }) => {
          for (const ele of updatedFields) {
            if (ele?.lookupResource) {
              ele.option = options[ele.lookupResource];
            }
          }
          setInitialData((prevState) => ({ ...prevState, fields: updatedFields }));
          setOptionLoading(false);
        })
        .catch((err) => {
          setOptionLoading(false);
        });
    } else {
      setOptionLoading(false);
    }
  };

  useEffect(() => {
    let fieldsData = [...fields];
    let statusOptions = fieldsData?.find((ele) => ele?.fieldData?.fieldName === 'status')?.fieldData?.option;
    setStatusOptions(statusOptions);
    fieldsData = fieldsData
      ?.filter((ele) => !ele.fieldData?.primaryField)
      ?.map((e) => {
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
      {statusOptions?.length > 0 && fieldOptions?.length && initialData && !optionLoading ? (
        <div className="flex flex-col gap-2">
          <div className="mx-2 flex items-center justify-between">
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
            <div className="my-2 flex items-center justify-between gap-1 rounded-md border border-[var(--common-border-color)] p-2" key={index}>
              <div className="grid w-[94%] gap-2 sm:grid-cols-1 md:grid-cols-3">
                {initialData?.fields?.map((field) =>
                  field?.type === 'checkBox' ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          name={field.fieldName}
                          checked={value[field.fieldName]}
                          onChange={(e) => {
                            const updatedVal = e.target.checked;
                            setFieldValue(`policies.${idx}.data.${index}.${field.fieldName}`, updatedVal);
                            let updatedData = [...initialData?.fieldsData];
                            updatedData[index][field.fieldName] = updatedVal;
                            setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                            onChange(null, updatedData);
                          }}
                        />
                      }
                      label={field?.fieldLabel}
                    />
                  ) : field?.type === 'colorPicker' ? (
                    <>
                      <Box display="flex" alignItems="center">
                        <Typography color="textSecondary">{field.fieldLabel}</Typography>
                        <Box ml={2} display="flex" alignContent="center">
                          <input
                            type="color"
                            name={field.fieldName}
                            value={value[field.fieldName]}
                            onChange={(e) => {
                              const updatedVal = e.target.value;
                              setFieldValue(`policies.${idx}.data.${index}.${field.fieldName}`, updatedVal);
                              let updatedData = [...initialData?.fieldsData];
                              updatedData[index][field.fieldName] = updatedVal;
                              setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                              onChange(null, updatedData);
                            }}
                          />
                        </Box>
                      </Box>
                    </>
                  ) : field?.type === 'singleLine' ? (
                    <TextField
                      size="small"
                      margin="dense"
                      variant="outlined"
                      required={true}
                      label={field.fieldLabel}
                      name={field.fieldName}
                      value={value[field.fieldName]}
                      onChange={(e) => {
                        const updatedVal = e.target.value;
                        setFieldValue(`policies.${idx}.data.${index}.${field.fieldName}`, updatedVal);
                        let updatedData = [...initialData?.fieldsData];
                        updatedData[index][field.fieldName] = updatedVal;
                        setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                        onChange(null, updatedData);
                      }}
                    />
                  ) : (
                    <DropDownField
                      key={field.fieldName}
                      options={
                        field?.lookupResource
                          ? field.option
                          : field?.fieldName === 'status'
                            ? getStatusOptions(initialData?.fieldsData)
                            : fieldOptions
                      }
                      error={errors[`policies.${idx}.data.${index}.${field.fieldName}`]}
                      touched={touched?.policies && touched.policies[idx].data[index][field.fieldName]}
                      onChange={(e, val) => {
                        const updatedVal = isArray(val) ? val?.map((ele) => ele.optionValue) : val?.optionValue;
                        setFieldValue(`policies.${idx}.data.${index}.${field.fieldName}`, updatedVal);
                        let updatedData = [...initialData?.fieldsData];
                        updatedData[index][field.fieldName] = updatedVal;
                        setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                        onChange(null, updatedData);
                      }}
                      value={
                        field?.type === 'multiSelect'
                          ? field?.lookupResource
                            ? field?.option?.filter((opt) => value[`${field.fieldName}`]?.some((val) => val === opt.optionValue))
                            : field?.fieldName === 'status'
                              ? statusOptions?.filter((ele) => value[`${field.fieldName}`].includes(ele?.optionValue))
                              : fieldOptions.filter((opt) => value[`${field.fieldName}`]?.some((val) => val === opt.optionValue))
                          : statusOptions?.filter((ele) => ele?.optionValue === value[`${field.fieldName}`])[0]
                      }
                      multiple={field?.type === 'multiSelect'}
                      fieldLabel={field?.fieldLabel}
                      fieldName={field?.fieldLabel}
                      required={field?.required}
                    />
                  )
                )}
              </div>
              <HtmlTooltip title="Remove">
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
                  <RemoveCircleOutline fontSize="small" color={'error'} />
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

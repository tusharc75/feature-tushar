import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { Autocomplete, Box, Checkbox, Chip, FormControlLabel, IconButton, TextField, Typography } from '@mui/material';
import { isArray } from 'lodash';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Grid from '@mui/material/Grid2';
import { FieldArray } from 'formik';
import { getLabel } from 'src/components/Helpers/FormTypes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const OPERATOR_OPTIONS = [
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

const Policy = ({ values, setFieldValue, errors, touched, resource, initialValues }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lookupCache, setLookupCache] = useState({});

  const toastConfig = useContext(CustomToastContext);

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

  const lookupResources = useMemo(() => {
    return (
      values?.policies?.reduce((acc, policy) => {
        if (policy?.lookupResource) {
          acc.push(policy.lookupResource);
        }
        return acc;
      }, []) || []
    );
  }, [values?.policies]);

  const lookupString = useMemo(() => {
    return lookupResources.length > 0 ? lookupResources.join(',') : '';
  }, [lookupResources]);

  const fetchLookupData = useCallback(
    async (lookupStr) => {
      if (lookupCache?.[lookupStr]) {
        return lookupCache[lookupStr];
      }

      try {
        const {
          data: { data }
        } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${lookupStr}`);
        setLookupCache((prev) => ({ ...prev, [lookupStr]: data }));
        return data;
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    },
    [lookupCache, toastConfig]
  );

  const policies = useMemo(() => {
    if (!values?.policies) return null;

    if (lookupString && lookupCache?.[lookupString]) {
      const lookupData = lookupCache[lookupString];
      return values.policies.map((policy) => {
        if (policy.lookupResource && lookupData[policy.lookupResource]) {
          return {
            ...policy,
            option: lookupData[policy.lookupResource]
          };
        }
        return policy;
      });
    }

    return values.policies;
  }, [values?.policies, lookupString, lookupCache]);

  useEffect(() => {
    if (lookupString && !lookupCache[lookupString]) {
      fetchLookupData(lookupString);
    }
  }, [lookupString, lookupCache, fetchLookupData]);

  return (
    <div className="flex flex-col gap-1">
      {Array.isArray(policies) ? (
        <FieldArray
          name="policies"
          render={(arrayHelpers) =>
            policies?.map((data, index) => {
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
      ) : (
        <Box className="h-fit" p={2}>
          <CommonSkeleton lenArray={[...Array(2).keys()]} />
        </Box>
      )}
    </div>
  );
};

export default Policy;

const RenderFormFields = ({ data, type, onChange, idx, errors, touched, resource, setFieldValue, fields, loading }) => {
  if (type === 'checkBox') {
    return <CheckBoxField data={data} onChange={onChange} />;
  } else if (type === 'fieldColorMultiple') {
    return (
      <FieldColorMultipleFormFields
        idx={idx}
        data={data}
        onChange={onChange}
        errors={errors}
        touched={touched}
        fields={fields}
      />
    );
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
        : data?.fieldOption
          ? fields?.find((e) => e?.fieldData?.fieldName === data?.fieldOption)?.fieldData?.option || []
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
  } else if (type === 'singleLine') {
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
            type="text"
            onChange={(event: any) => {
              onChange(null, event.target.value);
            }}
          />
        </Grid>
      </Grid>
    );
  } else if (type === 'freeStyleMultiSelect') {
    return (
      <Grid container spacing={2}>
        <Grid size={{ lg: 6, md: 6, sm: 6, xs: 12 }}>
          <Autocomplete
            limitTags={2}
            multiple
            disableCloseOnSelect={true}
            freeSolo
            options={[]}
            renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                margin="dense"
                size="small"
                helperText='Type and press Enter to add'
                label={getLabel(data?.fieldLabel)}
                name={data?.fieldName}
                required={false}
              />
            )}
            value={data?.data}
            onBlur={(e: any) => {
              if (e.target.value && e.target.value.trim() !== '') {
                onChange(null, [...data?.data, e.target.value]);
              }
            }}
            onChange={(e, value: any) => {
              let valuesToInsert = [];
              for (var val of value) {
                if (val && val.trim() !== '') {
                  valuesToInsert.push(val);
                }
              }
              onChange(null, valuesToInsert);
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
  const [subStatusOptions, setSubStatusOptions] = useState([]);

  const [initialData, setInitialData] = useState({ fieldsData: [...Data?.data], fields: Data?.fields });
  const [optionLoading, setOptionLoading] = useState(false);

  const [fieldColorFieldNameOptions, setFieldColorFieldNameOptions] = useState([]);

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
    const statusOptions = fieldsData?.find((ele) => ele?.fieldData?.fieldName === 'status')?.fieldData?.option || [];
    const subStatusOptions = fieldsData?.find((ele) => ele?.fieldData?.fieldName === 'subStatus')?.fieldData?.option || [];
    setStatusOptions(statusOptions);
    setSubStatusOptions(subStatusOptions);
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
    if (Data?.fieldName === 'fieldColor') {
      setFieldColorFieldNameOptions(fields?.filter(f =>
        ['dropDown', 'multiSelect'].includes(f?.fieldData?.type) && !f?.fieldData?.lookup)?.map(e => ({ optionLabel: e?.fieldData?.fieldLabel, optionValue: e?.fieldData?.fieldName })))
    }
  }, [fields]);

  const getStatusOptions = (data) => {
    const statusTemp = [...statusOptions];
    return statusTemp;
  };

  const getSubStatusOptions = (data) => {
    const options = subStatusOptions?.filter((ele) => !data?.some((e) => e?.status === ele.optionValue));
    return options ? options : subStatusOptions;
  };

  const getValueOptions = (value) => {
    return fields?.find(f => f?.fieldData?.fieldName === value?.fieldName)?.fieldData?.option || []
  }

  return (
    <>
      {(statusOptions?.length > 0 || fieldColorFieldNameOptions?.length > 0) && fieldOptions?.length && initialData && !optionLoading ? (
        <div className="flex flex-col gap-2 border border-[var(--common-border-color)] mt-2 mb-2">
          <div className="p-2 bg-[var(--dark-secondary)] flex items-center justify-between">
            <Typography variant="subtitle2">{Data.fieldLabel}</Typography>
            <HtmlTooltip title={'Add'}>
              <IconButton
                size="small"
                color="primary"
                aria-label="delete"
                onClick={() => {
                  const data = [...initialData?.fieldsData];
                  const obj: any = {}
                  initialData?.fields?.forEach(f => {
                    obj[f?.fieldName] = f?.type === 'multiSelect' ? [] : f?.type === 'colorPicker' ? '#000000' : ''
                  });
                  data.push(obj);
                  setInitialData((prevState) => ({ ...prevState, fieldsData: [...data] }));
                  onChange(null, data);
                }}
              >
                <AddCircleOutline fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </div>
          {initialData?.fieldsData?.map((value, index) => (
            <div className="my-2 flex items-center justify-between gap-1 border-b last:border-b-0 rounded-md p-2" key={index}>
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
                            : field?.fieldName === 'subStatus'
                              ? getSubStatusOptions(initialData?.fieldsData)
                              : field?.fieldName === 'fieldName'
                                ? fieldColorFieldNameOptions
                                : field?.fieldName === 'operator'
                                  ? OPERATOR_OPTIONS
                                  : field?.fieldName === 'value'
                                    ? getValueOptions(value)
                                    : fieldOptions
                      }
                      error={errors[`policies.${idx}.data.${index}.${field.fieldName}`]}
                      touched={touched?.policies && touched?.policies?.[idx]?.data[index]?.[field.fieldName]}
                      onChange={(e, val) => {
                        const updatedVal = isArray(val) ? val?.map((ele) => ele.optionValue) : val?.optionValue;
                        setFieldValue(`policies.${idx}.data.${index}.${field.fieldName}`, updatedVal);
                        let updatedData = [...initialData?.fieldsData];
                        updatedData[index][field.fieldName] = updatedVal;
                        setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                        onChange(null, updatedData);
                        if (field?.fieldName === 'fieldName') {
                          setFieldValue(`policies.${idx}.data.${index}.value`, []);
                          let updatedData = [...initialData?.fieldsData];
                          updatedData[index].value = updatedVal;
                          setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                          onChange(null, updatedData);
                        }
                      }}
                      value={
                        field?.type === 'multiSelect'
                          ? field?.lookupResource
                            ? field?.option?.filter((opt) => value[`${field.fieldName}`]?.some((val) => val === opt.optionValue))
                            : field?.fieldName === 'status'
                              ? getStatusOptions(initialData?.fieldsData)?.filter((ele) => value[`${field.fieldName}`]?.includes(ele?.optionValue))
                              : field?.fieldName === 'subStatus'
                                ? subStatusOptions?.filter((ele) => value[`${field.fieldName}`]?.includes(ele?.optionValue))
                                : field?.fieldName === 'value'
                                  ? getValueOptions(value)?.filter(ele => value[`${field.fieldName}`]?.includes(ele?.optionValue))
                                  : fieldOptions.filter((opt) => value[`${field.fieldName}`]?.some((val) => val === opt.optionValue))
                          : field?.fieldName === 'subStatus'
                            ? subStatusOptions?.filter((ele) => value[`${field.fieldName}`]?.includes(ele?.optionValue))[0]
                            : field?.fieldName === 'status' ?
                              getStatusOptions(initialData?.fieldsData)?.filter((ele) => ele?.optionValue === value[`${field.fieldName}`])[0]
                              : field?.fieldName === 'fieldName'
                                ? fieldColorFieldNameOptions?.filter(ele => ele?.optionValue === value[`${field.fieldName}`])[0]
                                : field?.fieldName === 'operator'
                                  ? OPERATOR_OPTIONS?.filter(ele => ele?.optionValue === value[`${field.fieldName}`])[0]
                                  : fieldOptions?.filter(ele => ele?.optionValue === value[`${field.fieldName}`])[0]
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
        <Box className="h-fit" p={2}>p
          <CommonSkeleton lenArray={[...Array(5).keys()]} />
        </Box>
      )}
    </>
  );
};

const FieldColorMultipleFormFields = ({ data: Data, idx, onChange, errors, touched, fields }) => {
  const [fieldOptions, setFieldOptions] = useState([]);
  const [initialData, setInitialData] = useState({ fieldsData: [...(Data?.data || [])], fields: Data?.fields });
  const [optionLoading, setOptionLoading] = useState(false);
  const [fieldColorFieldNameOptions, setFieldColorFieldNameOptions] = useState([]);

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
    if (Data?.fieldName === 'fieldColor') {
      setFieldColorFieldNameOptions(fields?.filter(f =>
        ['dropDown', 'decimal', 'number'].includes(f?.fieldData?.type) && !f?.fieldData?.lookup)?.map(e => ({ optionLabel: e?.fieldData?.fieldLabel, optionValue: e?.fieldData?.fieldName })))
    }
  }, [fields]);

  return (
    <>
      {fieldColorFieldNameOptions?.length > 0 && fieldOptions?.length && !optionLoading ? (
        <div className="flex flex-col gap-2 border border-[var(--common-border-color)] mt-2 mb-2">
          <div className="p-2 bg-[var(--dark-secondary)] flex items-center justify-between">
            <Typography variant="subtitle2">{Data.fieldLabel}</Typography>
            <HtmlTooltip title={'Add'}>
              <IconButton
                size="small"
                color="primary"
                aria-label="add"
                onClick={() => {
                  const data = [...initialData?.fieldsData];
                  const obj = {
                    fields: [
                      {
                        fieldName: '',
                        operator: '',
                        value: []
                      }
                    ],
                    colorCode: '#000000'
                  };
                  data.push(obj);
                  setInitialData((prevState) => ({ ...prevState, fieldsData: [...data] }));
                  onChange(null, data);
                }}
              >
                <AddCircleOutline fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </div>

          {initialData?.fieldsData?.map((colorItem, colorIndex) => (
            <div key={colorIndex} className="border-b last:border-b-0 p-2">
              <fieldset className="rounded-md border border-dashed border-gray-200 p-3 dark:border-gray-800 mb-3">
                <legend className="px-1 text-sm font-semibold flex items-center justify-between w-full">
                  <span>Fields</span>
                  <div className="flex gap-1">
                    <HtmlTooltip title={'Remove Color Group'}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const updatedData = [...initialData.fieldsData];
                          updatedData.splice(colorIndex, 1);
                          setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                          onChange(null, updatedData);
                        }}
                      >
                        <RemoveCircleOutline fontSize="small" color={'error'} />
                      </IconButton>
                    </HtmlTooltip>
                  </div>
                </legend>

                <div className="space-y-2">
                  {(colorItem.fields || []).map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex items-center justify-between gap-1 rounded-md">
                      <div className="grid w-[94%] gap-2 sm:grid-cols-1 md:grid-cols-3">
                        <DropDownField
                          options={fieldColorFieldNameOptions}
                          error={errors[`policies.${idx}.data.${colorIndex}.fields.${fieldIndex}.fieldName`]}
                          touched={touched?.policies?.[idx]?.data?.[colorIndex]?.fields?.[fieldIndex]?.fieldName}
                          onChange={(e, val) => {
                            const updatedData = [...initialData.fieldsData];
                            updatedData[colorIndex].fields[fieldIndex].fieldName = val?.optionValue || '';
                            updatedData[colorIndex].fields[fieldIndex].value = [];
                            setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                            onChange(null, updatedData);
                          }}
                          value={fieldColorFieldNameOptions?.filter(ele => ele?.optionValue === field.fieldName)[0]}
                          multiple={false}
                          fieldLabel="Field Name"
                          fieldName="fieldName"
                          required={true}
                        />

                        <DropDownField
                          options={OPERATOR_OPTIONS}
                          error={errors[`policies.${idx}.data.${colorIndex}.fields.${fieldIndex}.operator`]}
                          touched={touched?.policies?.[idx]?.data?.[colorIndex]?.fields?.[fieldIndex]?.operator}
                          onChange={(e, val) => {
                            const updatedData = [...initialData.fieldsData];
                            updatedData[colorIndex].fields[fieldIndex].operator = val?.optionValue || '';
                            setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                            onChange(null, updatedData);
                          }}
                          value={OPERATOR_OPTIONS?.filter(ele => ele?.optionValue === field.operator)[0]}
                          multiple={false}
                          fieldLabel="Operator"
                          fieldName="operator"
                          required={true}
                        />

                        {field.fieldName && (
                          <DynamicFormField
                            fieldName={field.fieldName}
                            value={field.value}
                            error={errors[`policies.${idx}.data.${colorIndex}.fields.${fieldIndex}.value`]}
                            touched={touched?.policies?.[idx]?.data?.[colorIndex]?.fields?.[fieldIndex]?.value}
                            formikField={`policies.${idx}.data.${colorIndex}.fields.${fieldIndex}.value`}
                            field={fields?.find(f => f?.fieldData?.fieldName === field.fieldName)?.fieldData}
                            setFieldValue={(fieldPath, value) => {
                              const updatedData = [...initialData.fieldsData];
                              updatedData[colorIndex].fields[fieldIndex].value = value;
                              setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                              onChange(null, updatedData);
                            }}
                            label="Value"
                          />
                        )}
                      </div>

                      <div className="flex gap-1 items-center">
                        <HtmlTooltip title="Remove Field">
                          <IconButton
                            size="small"
                            disabled={colorItem.fields?.length === 1}
                            onClick={() => {
                              const updatedData = [...initialData.fieldsData];
                              updatedData[colorIndex].fields.splice(fieldIndex, 1);
                              setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                              onChange(null, updatedData);
                            }}
                          >
                            <RemoveCircleOutline fontSize="small" color={colorItem.fields?.length === 1 ? 'disabled' : 'error'} />
                          </IconButton>
                        </HtmlTooltip>
                        <HtmlTooltip title="Add Field">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              const updatedData = [...initialData.fieldsData];
                              if (!updatedData[colorIndex].fields) {
                                updatedData[colorIndex].fields = [];
                              }
                              updatedData[colorIndex].fields.splice(fieldIndex + 1, 0, {
                                fieldName: '',
                                operator: '',
                                value: []
                              });
                              setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                              onChange(null, updatedData);
                            }}
                          >
                            <AddCircleOutline fontSize="small" />
                          </IconButton>
                        </HtmlTooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="flex items-center justify-between gap-1 rounded-md">
                <div className="grid w-[94%] gap-2 sm:grid-cols-1 md:grid-cols-3">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2">Color Code</Typography>
                    <input
                      type="color"
                      value={colorItem?.colorCode || '#000000'}
                      onChange={(e) => {
                        const updatedData = [...initialData.fieldsData];
                        updatedData[colorIndex].colorCode = e.target.value;
                        setInitialData((prevState) => ({ ...prevState, fieldsData: updatedData }));
                        onChange(null, updatedData);
                      }}
                      style={{
                        width: '56px',
                        height: '28px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                </div>
              </div>
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

const DynamicFormField = ({ fieldName, value, field, setFieldValue, formikField, error, touched, label }) => {
  if (field.type === 'dropDown') {
    return (
      <DropDownField
        options={field.option || []}
        error={error}
        touched={touched}
        onChange={(e, val) => {
          const newValue = Array.isArray(val) ? val?.map((ele) => ele.optionValue) : [val?.optionValue].filter(Boolean);
          setFieldValue(formikField, newValue);
        }}
        value={(field.option || []).filter(ele => (value || []).includes(ele?.optionValue)) || []}
        multiple={true}
        fieldLabel={label}
        fieldName="value"
        required={true}
      />
    );
  }

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value || ''}
      onChange={(e) => setFieldValue(formikField, e.target.value)}
      error={touched && Boolean(error)}
      helperText={touched && error}
      variant="outlined"
      required={true}
      type={field.type === 'number' || field.type === 'decimal' ? 'number' : 'text'}
      margin="dense"
    />
  );
};

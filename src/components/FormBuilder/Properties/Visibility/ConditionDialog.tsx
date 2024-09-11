import { Box, Button, CircularProgress, Dialog, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, getUniqueCurrencies, sidebarResource } from 'src/constants/helpers';
import { getLookupOption } from '../../helper';
import { isEmpty, uniqBy } from 'lodash';
import { Form, Formik } from 'formik';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import MuiPhoneInput from 'material-ui-phone-number';

const ConditionDialog = ({ onClose, group, data, fieldValue, setValue, fields, fieldsToExclude }) => {
  const [initialValues, setInitialValues] = useState(null);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValues, setInputValues] = useState('');

  useEffect(() => {
    const options: any = [];
    if (data) {
      const field = fields?.find((f) => f?.fieldName === data?.fieldName);
      if (field) {
        options.push({
          optionLabel: field?.fieldLabel,
          optionValue: field?.fieldName
        });
      }
    } else {
      fields?.forEach((field) => {
        if (
          ![
            'imageUpload',
            'currencyAmount',
            'converter',
            'imageUpload',
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
          ]?.includes(field?.type) &&
          !fieldsToExclude?.includes(field?.fieldName) &&
          !fieldValue?.visibilityCondition
            ?.find((_f) => _f?.index === group)
            ?.fields?.map((d) => d?.fieldName)
            ?.includes(field?.fieldName)
        ) {
          options.push({
            optionLabel: field?.fieldLabel,
            optionValue: field?.fieldName
          });
        }
      });
    }
    setFieldOptions(options);
  }, [fields]);

  useEffect(() => {
    const value: any = { fieldName: '', value: '' };
    if (data) {
      if (fields?.find((f) => f?.fieldName === data?.fieldName)?.dataList) {
        fetchFieldvalue();
      }
      value.fieldName = data?.fieldName;
      value.value = data?.value;
      setSelectedField(
        fields?.filter((f) => f?.fieldName === data?.fieldName)?.length > 0 ? fields?.filter((f) => f?.fieldName === data?.fieldName)[0] : null
      );
    }
    setInitialValues(value);
  }, [data]);

  const fetchFieldvalue = async () => {
    const query: any = [
      {
        resource: fields?.find((f) => f?.fieldName === data?.fieldName)?.dataListId,
        fieldName: data?.fieldName,
        _id: data?.value?.split(','),
        dataList: true
      }
    ];
    const response = await axiosInstance().get(`/sa-formbuilder/resource/fieldLabel?data=${JSON.stringify(query)}`);
    setDefaultOptions(response?.data?.data[data?.fieldName]);
  };

  useEffect(() => {
    if (selectedField?.fieldName && (selectedField?.type === 'dropDown' || selectedField?.type === 'multiSelect') && !selectedField?.dataList) {
      if (selectedField?.lookup) {
        getData();
      } else {
        setOptions(fields?.find((f) => f?.fieldName === selectedField?.fieldName)?.option || []);
      }
    } else if (selectedField?.type === 'checkBox' || selectedField?.type === 'switch') {
      setOptions([
        { optionLabel: 'YES', optionValue: 'yes' },
        { optionLabel: 'NO', optionValue: 'no' }
      ]);
    } else if (selectedField?.type === 'currency') {
      const sortedArr = getUniqueCurrencies().sort((a, b) =>
        a?.name?.toUpperCase() < b?.name?.toUpperCase() ? -1 : a?.name?.toUpperCase() > b?.name?.toUpperCase() ? 1 : 0
      );
      setOptions(
        sortedArr
          ?.filter((d) => !isEmpty(d))
          ?.map((d: any) => ({
            optionLabel: `${d.currencyCode} - ${d.currencyName} - (${d.symbolNative})`,
            optionValue: d?.currencyCode
          }))
      );
    } else if (selectedField?.type === 'radio') {
      setOptions(selectedField?.option ? selectedField?.option : []);
    }
  }, [selectedField]);

  const getData = async () => {
    var data = await getLookupOption('', selectedField?.lookupResource);
    if (selectedField?.lookupResource === sidebarResource.user) {
      data = [{ optionLabel: 'Current User', optionValue: 'Current User' }, ...data];
    }
    setOptions(data);
  };

  const fetchOptions = async (searchKey: string = '', page: number = 0) => {
    setTimeout(async () => {
      try {
        if (searchKey !== '') {
          page = 0;
          setCurrentPage(0);
        }
        if (page === 0) {
          setCurrentPage(0);
          setOptions([]);
        }
        let query = `${routes?.dataList?.path}/data-list-items/${selectedField?.dataListId}?limit=25&page=${page}&search=${encodeURIComponent(
          searchKey
        )}`;
        const {
          data: {
            data: { data }
          }
        } = await axiosInstance().get(query);
        const option = data?.map((d) => ({ optionLabel: d?.title, optionValue: d?._id }));
        setOptions((currentOptions) => {
          return page === 0 ? [...option] : [...currentOptions, ...option];
        });
        if (page > 0 && option?.length > 0) {
          setCurrentPage(page);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }, 1000);
  };

  const handleInputChangeMulti = (event, value, reason) => {
    if (reason === 'input') {
      setInputValues(event.target.value);
      fetchOptions(event.target.value);
    }
  };

  const handleSubmit = (value) => {
    let visibilityCondition = fieldValue?.visibilityCondition || [];
    visibilityCondition = visibilityCondition?.map((v) => {
      if (v?.index === group) {
        if (v?.fields?.some((_f) => _f?.fieldName === value?.fieldName)) {
          v?.fields?.map((f) => {
            if (f?.fieldName === value?.fieldName) {
              f.value = value?.value;
            }
            return f;
          });
        } else {
          v.fields = [...v?.fields, value];
        }
      }
      return v;
    });
    setValue('visibilityCondition', visibilityCondition);
    onClose();
  };

  const validate = (values: any) => {
    const errors: any = {};
    if (!values?.fieldName) {
      errors['fieldName'] = 'Required Field';
    }
    if (!values?.value) {
      errors['value'] = 'Required Field';
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={false}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      className="properties_dialog_height"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      {initialValues ? (
        <Formik initialValues={initialValues} onSubmit={handleSubmit} validate={validate} enableReinitialize={true}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogHeader title={'Condition'} onClose={onClose} />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box>
                    <Autocomplete
                      id="fields"
                      disabled={data ? true : false}
                      options={fieldOptions}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={
                        fieldOptions?.filter((f) => f?.optionValue === values?.fieldName)?.length > 0
                          ? fieldOptions?.filter((f) => f?.optionValue === values?.fieldName)[0]
                          : ''
                      }
                      onChange={(e: any, value) => {
                        setFieldValue('fieldName', value && value?.optionValue ? value.optionValue : '');
                        setSelectedField(fields?.filter((f) => f?.fieldName === value.optionValue)[0]);
                        setFieldValue('value', '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          variant="outlined"
                          label="Fields"
                          placeholder="Select Field"
                          name="fieldName"
                          required
                          error={touched['fieldName'] && Boolean(errors['fieldName'])}
                          helperText={touched['fieldName'] && errors['fieldName']}
                        />
                      )}
                    />
                    {values?.fieldName &&
                      (['dropDown', 'multiSelect', 'checkBox', 'switch', 'currency', 'radio']?.includes(selectedField?.type) ? (
                        selectedField?.dataList ? (
                          <Autocomplete
                            onOpen={() => {
                              setLoading(true);
                              fetchOptions();
                            }}
                            inputValue={inputValues}
                            onInputChange={handleInputChangeMulti}
                            loading={loading}
                            limitTags={2}
                            multiple
                            fullWidth
                            disableCloseOnSelect={true}
                            options={uniqBy([...options, ...defaultOptions], 'optionValue')}
                            getOptionLabel={(option: any) => {
                              return option ? option?.optionLabel : '';
                            }}
                            value={
                              values?.value
                                ? uniqBy([...options, ...defaultOptions], 'optionValue')?.filter((data: any) =>
                                    values?.value?.split(',')?.includes(data.optionValue)
                                  )
                                : []
                            }
                            getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                            onChange={(e, val: any) => {
                              setFieldValue('value', val ? val.map((val) => val?.optionValue)?.join(',') : '');
                              setInputValues('');
                            }}
                            forcePopupIcon={true}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                margin="dense"
                                label="Value"
                                name="value"
                                error={touched['value'] && Boolean(errors['value'])}
                                helperText={touched['value'] && errors['value']}
                                required
                                style={{ whiteSpace: 'nowrap' }}
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  )
                                }}
                              />
                            )}
                            ListboxProps={{
                              onScroll: (e) => {
                                if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight) {
                                  setLoading(true);
                                  fetchOptions('', currentPage + 1);
                                }
                              }
                            }}
                          />
                        ) : (
                          <Autocomplete
                            id="value"
                            options={options}
                            disableCloseOnSelect={['checkBox', 'switch', 'radio']?.includes(selectedField?.type) ? false : true}
                            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                            multiple={['checkBox', 'switch', 'radio']?.includes(selectedField?.type) ? false : true}
                            value={
                              values?.value && ['checkBox', 'switch', 'radio']?.includes(selectedField?.type)
                                ? options?.filter((data) => data?.optionValue === values?.value)?.length > 0
                                  ? options?.filter((data) => data?.optionValue === values?.value)[0]
                                  : ''
                                : options?.filter((data) => values?.value?.split(',')?.includes(data?.optionValue))?.length > 0
                                  ? options?.filter((data) => values?.value?.split(',')?.includes(data?.optionValue))
                                  : []
                            }
                            onChange={(e, val) => {
                              if (['checkBox', 'switch', 'radio']?.includes(selectedField?.type)) {
                                setFieldValue('value', val && val?.optionValue ? val?.optionValue : '');
                              } else {
                                setFieldValue('value', val?.map((v) => v?.optionValue)?.join(',') || '');
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                margin="dense"
                                variant="outlined"
                                label="Value"
                                name="value"
                                placeholder="Value"
                                error={touched['value'] && Boolean(errors['value'])}
                                helperText={touched['value'] && errors['value']}
                              />
                            )}
                          />
                        )
                      ) : selectedField?.type === 'mobileNumber' ? (
                        <MuiPhoneInput
                          defaultCountry={'us'}
                          disableAreaCodes
                          countryCodeEditable
                          variant="outlined"
                          fullWidth
                          label={'Value'}
                          name={'value'}
                          required
                          margin="dense"
                          value={values?.value}
                          onChange={(val) => {
                            if (val?.length < 5) {
                              setFieldValue('value', '');
                            } else {
                              setFieldValue('value', val);
                            }
                          }}
                          error={touched['value'] && Boolean(errors['value'])}
                          helperText={touched['value'] && errors['value']}
                        />
                      ) : (
                        <TextField
                          variant="outlined"
                          type={['number', 'decimal', 'percent', 'formula']?.includes(selectedField?.type) ? 'number' : 'text'}
                          label="Value"
                          name="value"
                          rows={4}
                          fullWidth
                          margin="dense"
                          value={values?.value}
                          onChange={(e) => {
                            setFieldValue('value', e.target.value.trimStart());
                          }}
                          error={touched['value'] && Boolean(errors['value'])}
                          helperText={touched['value'] && errors['value']}
                        />
                      ))}
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button size="small" onClick={onClose} color="primary">
                  Cancel
                </Button>
                <Button size="small" type="submit" color="primary" variant="contained" onClick={submitForm}>
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

export default ConditionDialog;

import { useEffect, useState, useContext, useRef } from 'react';
import { Dialog, Grid, Box, Button, TextField, Typography, CircularProgress } from '@material-ui/core';
import { Autocomplete, ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { Formik, FormikProps } from 'formik';
import { KeyboardTimePicker } from '@material-ui/pickers';
import { REPORT_LIST, SCHEDULE_FREQUENCY, FREQUENCY_WEEKS } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import Filters from './Filters';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import Loader from 'src/components/Loader';

type ValueTypes = {
  scheduleName: string;
  filters: any[];
  resource: any;
  column: any[];
  subscribeUsers: any[];
  frequency: string;
  time: any;
  week: string;
  day: any;
};

const ManageScheduleReport = ({ handleClose, onSuccess, id }) => {
  const formikRef = useRef<FormikProps<ValueTypes>>(null);

  const { setToastConfig } = useContext(CustomToastContext);
  const [filterValues, setFilterValues] = useState({});
  const [scheduleData, setScheduleData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [resourceColumns, setResourceColumns] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [filterOptions, setFilterOptions] = useState([]);
  const [resourceOptions, setResourceOptions] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [statusTimeFrame, setStatusTimeFrame] = useState('custom');
  const [statusPeriod, setStatusPeriod] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [betweenDate, setBetweenDate] = useState(null);
  const [statusPeriodDate, setStatusPeriodDate] = useState(null);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          let {
            data: { data }
          } = await axiosInstance().get(`/schedule-report/${id}`);
          let resource: any = REPORT_LIST.find((item) => item.title === data.resource);
          resource = { title: resource.title, key: resource.key };
          await fetchGridColumns(resource);
          let newData: any = {
            scheduleName: data?.scheduleName,
            resource,
            frequency: data?.frequency,
            day: data?.day,
            time: data?.time,
            week: data?.week,
            filters: data?.filters,
            column: data?.column,
            subscribeUsers: data?.subscribeUsers
          };
          setScheduleData(newData);
        } catch (err) {
          setToastConfig(err);
        }
      })();
    } else {
      setFormData({
        scheduleName: '',
        resource: null,
        filters: [],
        column: [],
        subscribeUsers: [],
        frequency: 'Daily',
        time: new Date(),
        week: '',
        day: new Date().getDay().toString()
      });
    }
  }, [id]);

  useEffect(() => {
    if (!scheduleData) return;

    const initializeData = () => {
      let newData: any = { ...scheduleData };

      if (newData?.filters.length > 0) {
        const filters = filterOptions.filter((filter) => newData.filters.findIndex((item) => item.term === filter.fieldName) > -1);

        const dateFields = filterOptions.filter((filter) => newData.filters.findIndex((item) => item.term.split('_')[1] === filter.fieldName) > -1);

        const filterData = newData.filters.reduce(
          (acc, val) => ({
            ...acc,
            [val.term]: val.value
          }),
          {}
        );

        const selectedFiltersData = filters.reduce(
          (acc, val) => ({
            ...acc,
            [val.fieldName]: {
              type: val.type,
              lookup: val.lookup,
              value: val.option.filter((option) => filterData[val.fieldName].includes(option.optionValue))
            }
          }),
          {}
        );

        setSelectedData(selectedFiltersData);
        const dateFilterData = {};
        newData.filters
          .filter((item) => item.term.includes('from_') || item.term.includes('to_'))
          .forEach(({ term, value }) => {
            dateFilterData[term] = value;
          });

        newData.filters = [...filters, ...dateFields];
        setBetweenDate(dateFilterData);
        setFilterValues(filterData);
      }
      if (newData?.column.length > 0) {
        const column = resourceColumns.filter((filter) => newData.column.includes(filter.fieldData.fieldName));
        newData.column = column.map(({ fieldData }) => fieldData);
      }

      const users = newData.subscribeUsers.map((item) => ({
        name: `${item.firstName} ${item.lastName}`,
        userId: item._id
      }));

      newData.subscribeUsers = users;

      setFormData(newData);
    };

    let timeout = setTimeout(initializeData, 500);

    return () => clearTimeout(timeout);
  }, [scheduleData, filterOptions, resourceColumns]);

  useEffect(() => {
    axiosInstance()
      .get('/activity/user')
      .then(({ data: { data } }) => {
        let userData = data.map((_user) => ({
          userId: _user._id,
          name: _user.firstName + ' ' + _user.lastName
        }));
        setUsersList(userData);
      });
  }, []);

  useEffect(() => {
    // if (!formikRef.current || !formikRef.current?.values?.resource) return;
    if (!resourceColumns && resourceColumns.length === 0) return;

    const optionsData: any = {};
    const filteredData = [...resourceColumns]
      .filter((d: any) => d.isRead && (d.fieldData.type === 'dropDown' || d.fieldData.type === 'date'))
      .map((d: any) => {
        if (d.fieldData.type === 'dropDown') {
          optionsData[d.fieldData.fieldName] = {
            options: d.fieldData.option,
            type: d.fieldData.type,
            lookup: Boolean(d?.fieldData.lookup)
          };
        }
        if (d.fieldData.type === 'date') {
          d['timeFrame'] = 'custom';
        }
        return d.fieldData;
      });
    setResourceOptions(optionsData);
    // setFormValues(null);
    if (id || formikRef.current?.values?.resource) {
      setFilterOptions([{ fieldLabel: 'All', fieldName: 'all', _id: '0' }, ...filteredData]);
    }
  }, [resourceColumns, formikRef.current?.values?.resource]);

  const fetchGridColumns = async (resource: any) => {
    if (resource.key === 'purchaseOrderType') {
      let resourceFieldData = [];
      if (resource.title === 'Purchase Order Product') {
        let {
          data: { data: POFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order`);
        let {
          data: { data: POProductFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order Product`);
        let {
          data: { data: productFields }
        } = await axiosInstance().get(`/field?resource=Product`);
        let {
          data: { data: productOption }
        } = await axiosInstance().get(`sa-formbuilder/lookup?lookupResource=Product`);

        POFields.filter((field) =>
          ['purchaseOrderNumber', 'purchaseOrderDate', 'supplierAccount', 'warehouse'].includes(field?.fieldData.fieldName)
        ).forEach((field: any) => {
          resourceFieldData.push(field);
        });

        productFields
          .filter((field) => ['productName'].includes(field?.fieldData.fieldName))
          .forEach((field: any) => {
            resourceFieldData.push({
              ...field,
              fieldData: { ...field.fieldData, fieldName: 'productId', type: 'dropDown', lookup: true, option: productOption?.Product || [] }
            });
          });

        POProductFields.forEach((f) => {
          if (['expectedDelivery', 'unit', 'taxSchedule'].includes(f.fieldData.fieldName)) {
            f = {
              ...f,
              fieldData: {
                ...f.fieldData,
                type: ''
              }
            };
          }

          resourceFieldData.push(f);
        });

        resourceFieldData.push({
          fieldData: {
            fieldName: 'soldQty',
            fieldLabel: 'Sold Qty',
            type: 'text'
          }
        });
      } else if (resource.title === 'Product Average Costing') {
        let {
          data: { data: productFields }
        } = await axiosInstance().get(`/field?resource=Product`);
        let {
          data: { data: POFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order`);

        POFields.filter((field) => ['purchaseOrderDate', 'warehouse'].includes(field?.fieldData.fieldName)).forEach((field) => {
          if (field?.fieldData.fieldName === 'warehouse') {
            resourceFieldData.push(field);
          }
          if (field?.fieldData.fieldName === 'purchaseOrderDate') {
            resourceFieldData.push({
              ...field,
              fieldData: { ...field.fieldData, fieldLabel: 'Date', fieldName: 'date', type: 'date' }
            });
          }
        });

        productFields.forEach((o: any) => {
          resourceFieldData.push(o);
        });

        resourceFieldData.push(
          {
            fieldData: {
              fieldName: 'qty',
              fieldLabel: 'Qty',
              type: 'text'
            }
          },
          {
            fieldData: {
              fieldName: 'unitPrice',
              fieldLabel: 'Unit Price',
              type: 'text'
            }
          },
          {
            fieldData: {
              fieldName: 'total',
              fieldLabel: 'Total',
              type: 'text'
            }
          }
        );
        if (productFields?.filter((e) => e.fieldData.fieldName === 'listPrice')?.length) {
          resourceFieldData.push({
            fieldData: {
              fieldName: 'margin',
              fieldLabel: 'Margin',
              type: 'text'
            }
          });
        }
      }

      setResourceColumns(resourceFieldData);
    } else {
      const {
        data: { data }
      }: any = await axiosInstance().get(`/field?resource=${resource.title}`);
      if (resource.title === 'Serialized Asset') {
        const {
          data: { data: lookupResource }
        } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Customer Account,Supplier Account`);
        if (lookupResource) {
          data?.forEach((e) => {
            if (e?.fieldData?.fieldName === 'currentOwner') {
              e.fieldData.option = [...lookupResource?.[`Customer Account`], ...lookupResource?.[`Supplier Account`]];
            }
          });
        }
      }
      setResourceColumns(data);
    }
  };

  const handleSelectFilter = (name: string, value: any) => {
    let fieldProps: any = {};
    if (!name?.includes('Date')) {
      fieldProps.type = resourceOptions[name].type;
      fieldProps.lookup = resourceOptions[name].lookup;
    } else {
      fieldProps.type = 'date';
      fieldProps.lookup = false;
    }

    const newData: any = {
      type: fieldProps.type,
      lookup: fieldProps.lookup
    };

    if (Array.isArray(value)) {
      newData.value = resourceOptions[name].options?.filter((d) => value?.includes(d.optionValue));
      setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    } else {
      newData.value = value;
      setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    }
    setFilterValues((prevState) => ({ ...prevState, [name]: value }));
  };

  const formikValidator = (values: ValueTypes) => {
    let errors = {};

    if (!values.scheduleName) {
      errors['scheduleName'] = 'Schedule name is required';
    } else {
      errors['scheduleName'] = '';
    }
    if (!values.resource) {
      errors['resource'] = 'Resource is required';
    } else {
      errors['resource'] = null;
    }
    if (values.subscribeUsers.length === 0) {
      errors['subscribeUsers'] = 'Subscribe users is required';
    } else {
      errors['subscribeUsers'] = '';
    }

    if (!values.frequency) {
      errors['frequency'] = 'Frequency is required';
    } else {
      errors['frequency'] = '';
      if (values.frequency === 'Daily' && !values.time) {
        errors['time'] = 'Time is required';
      } else if (values.time) {
        errors['time'] = '';
      }

      if (values.frequency === 'Weekly' && !values.week) {
        errors['week'] = 'Day is required';
      } else if (values.week) {
        errors['week'] = '';
      }

      if (values.frequency === 'Monthly' && !values.day) {
        errors['day'] = 'Date is required';
      } else {
        errors['day'] = '';
      }
    }

    return errors;
  };

  const handleChange = (name: string, value: any) => {
    if (!formikRef.current) return;
    formikRef.current.setFieldValue(name, value);
    formikRef.current.setFieldTouched(name, true);
    formikRef.current.validateForm(formikRef.current.values);
  };

  const handleSubmit = (values: ValueTypes) => {
    const filters = [];
    if (selectedData) {
      const filterKeys = Object.keys(selectedData);
      filterKeys.forEach((key) => {
        if (selectedData[key] && selectedData[key]?.value?.length) {
          let obj = {
            term: key,
            value: selectedData[key]?.value.map((item) => item.optionValue)
          };

          filters.push(obj);
        }
      });
    }

    if (betweenDate) {
      const filterKeys = Object.keys(betweenDate);
      filterKeys.forEach((key) => {
        if (betweenDate[key] && betweenDate[key]) {
          let obj = {
            term: key,
            value: betweenDate[key]
          };

          filters.push(obj);
        }
      });
    }

    const newValues = {
      ...values,
      filters,
      resource: values.resource?.title,
      column: values.column.length > 0 ? values.column.map((field) => field.fieldName) : [],
      time: new Date(values.time),
      subscribeUsers: values.subscribeUsers.map((user) => user.userId)
    };

    setSubmitting(true);
    if (id) {
      let newData = { _id: id, ...newValues };
      axiosInstance()
        .put(`/schedule-report`, newData)
        .then(({ data }) => {
          setToastConfig({
            type: 'success',
            message: data.message,
            open: true
          });
          onSuccess();
          setSubmitting(false);
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    } else {
      axiosInstance()
        .post(`/schedule-report`, newValues)
        .then(({ data }) => {
          setToastConfig({
            type: 'success',
            message: data.message,
            open: true
          });
          onSuccess();
          setSubmitting(false);
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    }
  };

  return (
    <Dialog
      open
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      <CustomDialogHeader
        title={`${id ? 'Edit' : 'Add'} Schedule Report`}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        onClose={handleClose}
      />
      {!formData && (
        <CustomDialogContent>
          <Loader minHeight={350} />
        </CustomDialogContent>
      )}
      {formData && (
        <Formik
          innerRef={(ref) => {
            if (ref) {
              formikRef.current = ref;
            }
          }}
          initialValues={formData}
          onSubmit={handleSubmit}
          validate={formikValidator}
          validateOnBlur
        >
          {({ values, errors, submitForm, setFieldValue, touched }) => (
            <>
              <CustomDialogContent>
                <div className={'detail-box-content'}>
                  <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                  <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Schedule Information</h2>
                </div>
                <Box my={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        value={values.scheduleName}
                        required
                        onChange={(e) => handleChange('scheduleName', e.target.value)}
                        fullWidth
                        name="scheduleName"
                        size="small"
                        label="Schedule Name"
                        variant="outlined"
                        error={touched['scheduleName'] && Boolean(errors['scheduleName'])}
                        helperText={touched['scheduleName'] && errors['scheduleName']}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={REPORT_LIST.map((item) => {
                          let obj: { title: string; key: string } = {
                            title: item.title,
                            key: item.key
                          };

                          return obj;
                        })}
                        fullWidth
                        size="small"
                        getOptionLabel={(option) => option.title}
                        getOptionSelected={(option, value) => option.title === value.title}
                        value={values.resource}
                        onChange={(_, newVal) => {
                          handleChange('resource', newVal);
                          if (newVal) {
                            fetchGridColumns(newVal);
                          } else {
                            setResourceColumns([]);
                          }
                          setFieldValue('filters', []);
                          setFieldValue('column', []);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            required
                            error={touched['resource'] && Boolean(errors['resource'])}
                            helperText={touched['resource'] && errors['resource']}
                            label="Resource"
                            variant="outlined"
                            name="resource"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>
                <div className={'detail-box-content'}>
                  <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                  <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Filters</h2>
                </div>
                <Box my={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={filterOptions}
                        fullWidth
                        multiple
                        size="small"
                        value={values.filters}
                        getOptionSelected={(option, val) => option.fieldName === val.fieldName}
                        getOptionLabel={(option) => option.fieldLabel}
                        onChange={(_, newVal) => {
                          handleChange('filters', newVal);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={touched['filters'] && Boolean(errors['filters'])}
                            helperText={touched['filters'] && errors['filters']}
                            label="Filters"
                            name="filters"
                            variant="outlined"
                          />
                        )}
                      />
                    </Grid>

                    <Filters
                      selectedResources={values.filters}
                      handleSelectFilter={handleSelectFilter}
                      resource={formikRef.current?.values.resource?.title}
                      formValues={filterValues}
                      betweenDate={betweenDate}
                      setBetweenDate={setBetweenDate}
                      statusPeriod={statusPeriod}
                      statusTimeFrame={statusTimeFrame}
                      statusPeriodDate={statusPeriodDate}
                      setStatusPeriod={setStatusPeriod}
                      setStatusPeriodDate={setStatusPeriodDate}
                      setStatusTimeFrame={setStatusTimeFrame}
                    />

                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={resourceColumns.map((item) => item.fieldData)}
                        fullWidth
                        multiple
                        size="small"
                        getOptionSelected={(option, val) => option.fieldName === val.fieldName}
                        getOptionLabel={(option) => option.fieldLabel}
                        value={values.column}
                        onChange={(_, newVal) => handleChange('column', newVal)}
                        renderInput={(params) => (
                          <TextField
                            error={touched['column'] && Boolean(errors['column'])}
                            helperText={touched['column'] && errors['column']}
                            {...params}
                            label="Columns"
                            name="columns"
                            variant="outlined"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>
                <div className={'detail-box-content'}>
                  <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                  <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Others</h2>
                </div>
                <Box my={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={usersList}
                        fullWidth
                        multiple
                        size="small"
                        getOptionLabel={(option) => option.name}
                        getOptionSelected={(option, value) => option.userId === value.userId}
                        value={values.subscribeUsers}
                        onChange={(_, newVal) => handleChange('subscribeUsers', newVal)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            error={touched['subscribeUsers'] && Boolean(errors['subscribeUsers'])}
                            helperText={touched['subscribeUsers'] && errors['subscribeUsers']}
                            label="Subscibe User"
                            name="subscribeUsers"
                            required
                            variant="outlined"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <KeyboardTimePicker
                        inputVariant="outlined"
                        size="small"
                        id="time-picker"
                        name="time"
                        label="Time"
                        autoOk
                        fullWidth
                        required={Boolean(values.frequency)}
                        value={values.time}
                        error={touched['time'] && Boolean(errors['time'])}
                        helperText={touched['time'] && errors['time']}
                        onChange={(date) => handleChange('time', date)}
                        KeyboardButtonProps={{
                          'aria-label': 'change time'
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box mt={2}>
                        <Typography color="textPrimary">Schedule Frequency</Typography>
                        <Box mt={1} />
                        <ToggleButtonGroup
                          size="small"
                          value={values?.frequency ?? 'Daily'}
                          exclusive
                          onChange={(_, val) => handleChange('frequency', val)}
                        >
                          {SCHEDULE_FREQUENCY.map((freq) => (
                            <ToggleButton key={freq} value={freq}>
                              {freq}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>

                        {values?.frequency === 'Weekly' && (
                          <Box mt={2}>
                            <Typography color="textPrimary">Days</Typography>
                            <Box mt={1} />
                            <ToggleButtonGroup size="small" value={values.week} exclusive onChange={(_, val) => handleChange('week', val)}>
                              {FREQUENCY_WEEKS.map((week) => (
                                <ToggleButton key={week} value={week}>
                                  {week}
                                </ToggleButton>
                              ))}
                            </ToggleButtonGroup>
                          </Box>
                        )}
                        {values?.frequency === 'Monthly' && (
                          <Box mt={2}>
                            <Autocomplete
                              options={[...new Array(31).keys()].map((_, index) => `${index + 1}`)}
                              style={{ width: 200 }}
                              size="small"
                              onChange={(_, newVal) => {
                                handleChange('day', newVal);
                              }}
                              value={values['day']}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Day"
                                  name="day"
                                  variant="outlined"
                                  error={touched['day'] && Boolean(errors['day'])}
                                  helperText={touched['day'] && errors['day']}
                                />
                              )}
                            />
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button disabled={isSubmitting} color="primary" size="small" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
                  disabled={isSubmitting}
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={submitForm}
                >
                  {id ? 'Update' : 'Save'}
                </Button>
              </CustomDialogFooter>
            </>
          )}
        </Formik>
      )}
      {!formData && (
        <CustomDialogFooter>
          <Button disabled={true} color="primary" variant="outlined" size="small">
            Cancel
          </Button>
          <Button disabled={true} type="submit" variant="contained" color="primary" size="small">
            {id ? 'Update' : 'Save'}
          </Button>
        </CustomDialogFooter>
      )}
    </Dialog>
  );
};

export default ManageScheduleReport;

import React, { useContext } from 'react';
import { Dialog, Grid, Box, Button, TextField, Typography, CircularProgress } from '@material-ui/core';
import { Autocomplete, ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { Formik, FormikProps } from 'formik';
import { KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';

import { dateFormatForInputControl, REPORT_LIST, SCHEDULE_FREQUENCY, FREQUENCY_WEEKS } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import Filters from './Filters';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

type ValueTypes = {
  scheduleName: string;
  filters: any[];
  resource: any;
  column: any[];
  subscribeUsers: any[];
  frequency: string;
  time: any;
  day: string;
  date: any;
};

const ManageScheduleReport = ({ handleClose, onSuccess }) => {
  const formikRef = React.useRef<FormikProps<ValueTypes>>(null);
  const { setToastConfig } = useContext(CustomToastContext);
  const [filterValues, setFilterValues] = React.useState({});
  const [resourceColumns, setResourceColumns] = React.useState([]);
  const [usersList, setUsersList] = React.useState([]);
  const [filterOptions, setFilterOptions] = React.useState([]);
  const [resourceOptions, setResourceOptions] = React.useState(null);
  const [selectedData, setSelectedData] = React.useState(null);
  const [statusTimeFrame, setStatusTimeFrame] = React.useState('custom');
  const [statusPeriod, setStatusPeriod] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [betweenDate, setBetweenDate] = React.useState(null);
  const [statusPeriodDate, setStatusPeriodDate] = React.useState(null);

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!formikRef.current || !formikRef.current?.values?.resource) return;
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
    setFilterOptions([{ fieldLabel: 'All', fieldName: 'all', _id: '0' }, ...filteredData]);
  }, [resourceColumns, formikRef.current?.values?.resource]);

  const fetchGridColumns = async (resource: any) => {
    console.log(resource);
    if (resource.key === 'purchaseOrderType') {
      let resourceFieldData = [];
      if (resource.title === 'Purchase Order Product') {
        let {
          data: { data: POFields }
        } = await axiosInstance().get(`/field?resource=Purchase Order`);
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
          if (o?.fieldData.fieldName === 'productCategory') {
            resourceFieldData.push(o);
          }
        });
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
    }
    if (!values.resource) {
      errors['resource'] = 'Resource is required';
    }
    if (values.subscribeUsers.length === 0) {
      errors['subscribeUsers'] = 'Subscribe users is required';
    }

    if (!values.frequency) {
      errors['frequency'] = 'Frequency is required';
    } else {
      if (values.frequency === 'Daily' && !values.time) {
        errors['time'] = 'Time is required';
      }

      if (values.frequency === 'Weekly' && !values.day) {
        errors['day'] = 'Day is required';
      }

      if (values.frequency === 'Monthly' && !values.date) {
        errors['date'] = 'Date is required';
      }
    }

    return errors;
  };

  const handleChange = (name: string, value: any) => {
    if (!formikRef.current) return;
    formikRef.current.setFieldValue(name, value);
  };

  const handleSubmit = (values: ValueTypes) => {
    setSubmitting(true);
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
        if (betweenDate[key] && betweenDate[key]?.value?.length) {
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
      resource: values.resource?.key,
      column: values.column.length > 0 ? values.column.map((field) => field.fieldName) : [],
      time: new Date(values.time).toLocaleTimeString(),
      date: new Date(values.date).getDate().toLocaleString(),
      subscribeUsers: values.subscribeUsers.map((user) => user.userId)
    };

    axiosInstance()
      .post(`/schedule-report`, newValues)
      .then(() => {
        onSuccess();
        setSubmitting(false);
      })
      .catch((err) => {
        setSubmitting(false);
        setToastConfig(err);
      });
  };

  return (
    <Dialog open onClose={handleClose} fullWidth maxWidth="sm">
      <CustomDialogHeader title="Add Schedule Report" onClose={handleClose} />
      <Formik
        innerRef={(ref) => {
          if (ref) {
            formikRef.current = ref;
          }
        }}
        initialValues={{
          scheduleName: '',
          resource: null,
          filters: [],
          column: [],
          subscribeUsers: [],
          frequency: 'Daily',
          time: new Date(),
          day: 'Monday',
          date: new Date()
        }}
        onSubmit={handleSubmit}
        validate={formikValidator}
        validateOnBlur
      >
        {({ values, errors, submitForm }) => (
          <>
            <CustomDialogContent>
              <div className={'detail-box-content'}>
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
                      error={Boolean(errors['scheduleName'])}
                      helperText={errors['scheduleName']}
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
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          error={Boolean(errors['resource'])}
                          helperText={errors['resource']}
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
                          error={Boolean(errors['filters'])}
                          helperText={errors['filters']}
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
                          error={Boolean(errors['column'])}
                          helperText={errors['column']}
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
                          error={Boolean(errors['subscribeUsers'])}
                          helperText={errors['subscribeUsers']}
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
                      error={Boolean(errors['time'])}
                      helperText={errors['time']}
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
                          <ToggleButtonGroup size="small" value={values.day} exclusive onChange={(_, val) => handleChange('day', val)}>
                            {FREQUENCY_WEEKS.map((week) => (
                              <ToggleButton key={week} value={week}>
                                {week.substring(0, 3)}
                              </ToggleButton>
                            ))}
                          </ToggleButtonGroup>
                        </Box>
                      )}
                      {values?.frequency === 'Monthly' && (
                        <Box mt={2}>
                          <KeyboardDatePicker
                            views={['date']}
                            openTo="date"
                            autoOk
                            size="small"
                            variant="inline"
                            inputVariant="outlined"
                            label="Date"
                            name="date"
                            required={values.frequency === 'Monthly'}
                            format={dateFormatForInputControl}
                            value={values.date}
                            error={!Boolean(errors['date'])}
                            helperText={errors['date']}
                            onChange={(date) => handleChange('date', date)}
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button disabled={isSubmitting} variant="contained" color="primary" size="small" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
                disabled={isSubmitting}
                type="submit"
                variant="outlined"
                color="primary"
                size="small"
                onClick={submitForm}
              >
                Save
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageScheduleReport;

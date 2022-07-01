import React, { useContext } from 'react';
import { Dialog, Grid, Box, Button, TextField, Typography, CircularProgress } from '@material-ui/core';
import { Autocomplete, ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { Formik, FormikProps } from 'formik';
import { KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';

import { dateFormatForInputControl, REPORT_LIST } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import Filters from './Filters';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

type ValueTypes = {
  scheduleName: string;
  reportName: string;
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

  const fetchGridColumns = async (resource: string) => {
    const {
      data: { data }
    }: any = await axiosInstance().get(`/field?resource=${resource}`);
    if (resource === 'Serialized Asset') {
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
  };

  const handleSelectFilter = (name, value) => {
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
    if (!values.reportName) {
      errors['reportName'] = 'Report name is required';
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
      column: values.column.map((field) => field.fieldName),
      time: new Date(values.time).toLocaleTimeString(),
      date: new Date(values.date).getDate().toLocaleString(),
      subscribeUsers: values.subscribeUsers.map((user) => user.userId)
    };

    axiosInstance()
      .post(`/schedule-report`, newValues)
      .then(() => {
        onSuccess();
      })
      .catch((err) => {
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
          reportName: '',
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
                    options={REPORT_LIST.filter((item) => item.type === 'dynamic').map((item) => {
                      return {
                        title: item.title,
                        key: item.permission
                      };
                    })}
                    fullWidth
                    size="small"
                    getOptionLabel={(option) => option.title}
                    getOptionSelected={(option, value) => option.key === value.key}
                    value={values.resource}
                    onChange={(_, newVal) => {
                      handleChange('resource', newVal);
                      if (newVal) {
                        fetchGridColumns(newVal.title);
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    value={values.reportName}
                    onChange={(e) => handleChange('reportName', e.target.value)}
                    fullWidth
                    name="reportName"
                    size="small"
                    label="Report Name"
                    required
                    variant="outlined"
                    error={Boolean(errors['reportName'])}
                    helperText={errors['reportName']}
                  />
                </Grid>
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
                    onChange={(_, newVal) => handleChange('columns', newVal)}
                    renderInput={(params) => (
                      <TextField
                        error={Boolean(errors['columns'])}
                        helperText={errors['columns']}
                        {...params}
                        label="Columns"
                        name="columns"
                        variant="outlined"
                      />
                    )}
                  />
                </Grid>
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
                <Grid item xs={12}>
                  <Typography color="textPrimary" style={{ fontSize: 18 }}>
                    Schedule
                  </Typography>
                  <Box mt={2}>
                    <Typography color="textPrimary">Frequency</Typography>
                    <Box mt={1} />
                    <ToggleButtonGroup
                      size="small"
                      value={values?.frequency ?? 'Daily'}
                      exclusive
                      onChange={(_, val) => handleChange('frequency', val)}
                    >
                      <ToggleButton value="Daily">Daily</ToggleButton>
                      <ToggleButton value="Weekly">Weekly</ToggleButton>
                      <ToggleButton value="Monthly">Monthly</ToggleButton>
                    </ToggleButtonGroup>

                    {values?.frequency === 'Weekly' && (
                      <Box mt={2}>
                        <Typography color="textPrimary">Days</Typography>
                        <ToggleButtonGroup size="small" value={values.day} exclusive onChange={(_, val) => handleChange('day', val)}>
                          <ToggleButton value="Sunday">Sun</ToggleButton>
                          <ToggleButton value="Monday">Mon</ToggleButton>
                          <ToggleButton value="Tuesday">Tue</ToggleButton>
                          <ToggleButton value="Wednesday">Wed</ToggleButton>
                          <ToggleButton value="Thursday">Thu</ToggleButton>
                          <ToggleButton value="Friday">Fri</ToggleButton>
                          <ToggleButton value="Saturday">Sat</ToggleButton>
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

                    <Box mt={2}>
                      <KeyboardTimePicker
                        margin="normal"
                        inputVariant="outlined"
                        size="small"
                        id="time-picker"
                        name="time"
                        label="Time"
                        autoOk
                        required={Boolean(values.frequency)}
                        value={values.time}
                        error={Boolean(errors['time'])}
                        helperText={errors['time']}
                        onChange={(date) => handleChange('time', date)}
                        KeyboardButtonProps={{
                          'aria-label': 'change time'
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
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

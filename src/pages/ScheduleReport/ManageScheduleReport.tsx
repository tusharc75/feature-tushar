import React from 'react';
import { Dialog, Grid, Box, Button, TextField, Typography } from '@material-ui/core';
import { Autocomplete, ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { Formik, FormikProps } from 'formik';
import { KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';

import { dateFormatForInputControl, REPORT_LIST } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import Filters from './Filters';

type ValueTypes = {
  scheduleName: string;
  reportName: string;
  filters: any[];
  resource: any;
  columns: any[];
  subscribeUsers: any[];
  frequency: string;
  time: any;
  day: string;
  date: any;
};

const ManageScheduleReport = ({ handleClose }) => {
  const formikRef = React.useRef<FormikProps<ValueTypes>>(null);
  const [filterValues, setFilterValues] = React.useState({});
  const [resourceColumns, setResourceColumns] = React.useState([]);
  const [usersList, setUsersList] = React.useState([]);
  const [filterOptions, setFilterOptions] = React.useState([]);
  const [resourceOptions, setResourceOptions] = React.useState(null);
  const [selectedData, setSelectedData] = React.useState(null);
  const [statusTimeFrame, setStatusTimeFrame] = React.useState<any>('custom');
  const [statusPeriod, setStatusPeriod] = React.useState(false);
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
    if (!values.subscribeUsers) {
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

  const handleSubmit = (values: ValueTypes) => {
    console.log(values);
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
          columns: [],
          subscribeUsers: [],
          frequency: 'Daily',
          time: new Date(),
          day: 'monday',
          date: new Date()
        }}
        onSubmit={handleSubmit}
        validate={formikValidator}
      >
        {({ values, errors, touched, setFieldValue }) => (
          <>
            <CustomDialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    value={values.scheduleName}
                    required
                    onChange={(e) => setFieldValue('scheduleName', e.target.value)}
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
                    value={values.resource}
                    onChange={(_, newVal) => {
                      setFieldValue('resource', newVal);
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
                    onChange={(e) => setFieldValue('reportName', e.target.value)}
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
                      setFieldValue('filters', newVal);
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
                    value={values.columns}
                    onChange={(_, newVal) => setFieldValue('columns', newVal)}
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
                    size="small"
                    getOptionLabel={(option) => option.name}
                    getOptionSelected={(option, value) => option.userId === value.userId}
                    value={values.subscribeUsers}
                    onChange={(_, newVal) => setFieldValue('subscribeUsers', newVal)}
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
                      onChange={(_, val) => setFieldValue('frequency', val)}
                    >
                      <ToggleButton value="Daily">Daily</ToggleButton>
                      <ToggleButton value="Weekly">Weekly</ToggleButton>
                      <ToggleButton value="Monthly">Monthly</ToggleButton>
                    </ToggleButtonGroup>

                    {values?.frequency === 'Weekly' && (
                      <Box mt={2}>
                        <Typography color="textPrimary">Days</Typography>
                        <ToggleButtonGroup size="small" value={values.day} exclusive onChange={(_, val) => setFieldValue('day', val)}>
                          <ToggleButton value="sunday">Sun</ToggleButton>
                          <ToggleButton value="monday">Mon</ToggleButton>
                          <ToggleButton value="tuesday">Tue</ToggleButton>
                          <ToggleButton value="wednesday">Wed</ToggleButton>
                          <ToggleButton value="thursday">Thu</ToggleButton>
                          <ToggleButton value="friday">Fri</ToggleButton>
                          <ToggleButton value="saturday">Sat</ToggleButton>
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
                          onChange={(date) => setFieldValue('date', date)}
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
                        onChange={(date) => setFieldValue('time', date)}
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
              <Button variant="contained" color="primary" size="small" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="outlined" color="primary" size="small">
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

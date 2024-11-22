import { useEffect, useState, useContext, useRef } from 'react';
import { Dialog, Grid, Box, Button, TextField, Typography, CircularProgress } from '@material-ui/core';
import { Autocomplete, ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { Form, Formik, FormikProps } from 'formik';
import { REPORT_LIST, SCHEDULE_FREQUENCY, FREQUENCY_WEEKS, CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import Filters from './Filters';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import Loader from 'src/components/Loader';
import routes from './../../components/Helpers/Routes';
import { useData } from '../../StateProvider/Provider';
import { camelCase, isEmpty, kebabCase } from 'lodash';
import React from 'react';

type ValueTypes = {
  scheduleName: string;
  filters: any[];
  resource: any;
  column: any[];
  subscribeUsers?: any[];
  frequency: string;
  time: any;
  week: string;
  day: any;
  hour: any;
  reportAction: string;
  sharepointTenantId?: string;
  sharepointSite?: string;
  sharepointclientId?: string;
  sharepointclientSecret?: string;
  fileType?: string;
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
  const [selectedData, setSelectedData] = useState(null);
  const [statusTimeFrame, setStatusTimeFrame] = useState('custom');
  const [statusPeriod, setStatusPeriod] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [betweenDate, setBetweenDate] = useState(null);
  const [statusPeriodDate, setStatusPeriodDate] = useState(null);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const [resourceOption, setResourceOption] = useState(null);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [sharepointOptions, setSharepointOptions] = useState(null);

  useEffect(() => {
    const options = [];
    REPORT_LIST?.forEach((item) => {
      if (permissions[item.permission] && permissions[item.permission]?.isRead === true) {
        options.push({ title: item.type === 'dynamic' ? routes[item.key]?.title : item.title, value: item.title, key: item.key, type: item?.type });
      }
    });
    setResourceOption(options);
  }, []);

  useEffect(()=>{
    fetchSharepointSiteData();
  },[])

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          let {
            data: { data }
          } = await axiosInstance().get(`/schedule-report/${id}`);

          let resource: any = REPORT_LIST.find((item) => item.title === data.resource);
          resource = {
            title: resource.type === 'dynamic' ? routes[resource.key]?.title : resource.title,
            value: resource.title,
            key: resource.key,
            type: resource.type
          };

          await fetchGridColumns(resource);
          let newData: any = {
            scheduleName: data?.scheduleName,
            resource,
            frequency: data?.frequency,
            day: data?.day,
            hour: data?.hour,
            time: data?.time,
            week: data?.week,
            filters: data?.filters,
            column: data?.column,
            subscribeUsers: data?.subscribeUsers,
            reportAction: data?.reportAction,
            sharepointSite: data?.sharepointSite,
            fileType: data?.fileType
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
        reportAction: 'Email',
        sharepointSite: '',
        frequency: 'Daily',
        time: '',
        week: '',
        day: new Date().getDay().toString(),
        hour: '',
        fileType: ''
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
            [val.term]: val.value ?? []
          }),
          {}
        );

        const selectedFiltersData = filters.reduce(
          (acc, val) => ({
            ...acc,
            [val.fieldName]: {
              type: val.type,
              // lookup: val.lookup,
              value: val.option?.filter((option) => filterData[val.fieldName]?.includes(option.optionValue))?.map((v) => v?.optionValue)
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

  const fetchGridColumns = async (resource: any) => {
    setLoadingColumns(true);
    try {
      let filterOptions;
      if (resource.key === 'standardReport') {
        let {
          data: {
            data: { columnFields, filterFields }
          }
        } = await axiosInstance().get(`/report/${kebabCase(resource.type)}/column`);

        filterOptions = filterFields;
        setResourceColumns(columnFields);
      } else {
        const {
          data: { data }
        }: any = await axiosInstance().get(`/field?resource=${resource.value}`);
        if (resource.value === 'Serialized Asset') {
          const {
            data: { data: lookupResource }
          } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Customer Account,Supplier Account`);
          if (lookupResource) {
            data?.forEach((e) => {
              if (e?.fieldData?.fieldName === 'currentOwner') {
                e.fieldData.lookup = true;
                e.fieldData.option = [...lookupResource?.[`Customer Account`], ...lookupResource?.[`Supplier Account`]];
              }
            });
          }
        }
        filterOptions = data;
        setResourceColumns(data);
      }
      setFilterOptions([
        { fieldLabel: 'All', fieldName: 'all', _id: '0' },
        ...filterOptions
          ?.filter((d) => d?.isRead && ['dropDown', 'multiSelect', 'date', 'checkBox', 'singleLine']?.includes(d?.fieldData?.type))
          ?.map((f) => f?.fieldData)
      ]);
      setLoadingColumns(false);
    } catch (err) {
      setLoadingColumns(false);
      setToastConfig(err);
    }
  };

  const handleSelectFilter = (type: string, name: string, value: any) => {
    setSelectedData((prevState) => ({ ...prevState, [name]: { type, value } }));
    setFilterValues((prevState) => ({ ...prevState, [name]: value }));
  };

  const fetchSharepointSiteData = ()=>{
    axiosInstance()
      .get(`/sharepoint-configuration/share-point-site`)
      .then(({ data: { data } }) => {
        if(data?.sharepointConfiguration){
          setSharepointOptions(data?.sharepointSites)
        }
      })
      .catch((err) => {
        setToastConfig(err);
      });
  }

  const validate = (values: ValueTypes) => {
    let errors = {};
    if (!values.scheduleName || values.scheduleName === '') {
      errors['scheduleName'] = 'Schedule name is required';
    }
    if (!values.resource) {
      errors['resource'] = 'Report is required';
    }
    if(!values.reportAction){
      errors['reportAction'] = 'Report Action is required';
    }
    if(!values.fileType){
      errors['fileType'] = 'File Type is required';
    }
    if(values.reportAction){
      if(values.reportAction==='Email'){
        if (values?.subscribeUsers?.length === 0) {
          errors['subscribeUsers'] = 'Users is required';
        }
      }

      if(values.reportAction==='Sharepoint Upload'){
         if(!values.sharepointSite || values.sharepointSite===''){
          errors['sharepointSite'] = 'Sharepoint Site is required';
         }
      }
    }
    
    if (!values.frequency) {
      errors['frequency'] = 'Frequency is required';
    } else {
      if (values.frequency === 'Daily' && !values.time) {
        errors['time'] = 'Time is required';
      }
      if (values.frequency === 'Weekly' && !values.week) {
        errors['week'] = 'Day is required';
      }
      if (values.frequency === 'Monthly' && !values.day) {
        errors['day'] = 'Date is required';
      }
      if (values.frequency === 'Hourly' && !values.hour) {
        errors['hour'] = 'Hour is required';
      }
    }
    return errors;
  };

  const handleSubmit = (values: ValueTypes) => {
    const filters = [];
    const data = {};
    values?.filters?.forEach((v) => {
      if (selectedData && Object.keys(selectedData)?.includes(v?.fieldName)) {
        data[v?.fieldName] = selectedData[v?.fieldName];
      }else {
        data[v?.fieldName] = [];
      }
    });

    if (!isEmpty(data)) {
      const filterKeys = Object.keys(data);
      filterKeys.forEach((key) => {
        if (data[key]?.type === 'checkBox') {
          let obj = {
            term: key,
            value: data[key]?.value
          };
          filters.push(obj);
        } else {
          if (data[key] && data[key]?.value?.length) {
            let obj = {
              term: key,
              value: data[key]?.value.map((item) => item)
            };
            filters.push(obj);
          } else {
            let obj = {
              term: key,
              value: []
            };
            filters.push(obj);
          }
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
      resource: values.resource?.value,
      column: values.column.length > 0 ? values.column.map((field) => field.fieldName) : [],
      // time: new Date(values.time),
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

  const getTimeOption = () => {
    const option: any = [];
    for (let i = 0; i < 24; i++) {
      option.push(`${i}:00`);
    }
    return option;
  };

  return (
    <Dialog
      open
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
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
          validate={validate}
          validateOnMount
        >
          {({ values, errors, submitForm, setFieldValue, setValues, touched }) => (
            <>
              <Form autoComplete="off" autoCorrect="off" noValidate>
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
                          onChange={(e) => setFieldValue('scheduleName', e.target.value)}
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
                          options={resourceOption}
                          fullWidth
                          size="small"
                          getOptionLabel={(option) => option.title}
                          getOptionSelected={(option, value) => option.value === value.value}
                          value={values.resource}
                          onChange={(_, newVal) => {
                            const result = { resource: newVal, filters: [], column: [] };
                            setValues({ ...values, ...result });
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
                              error={touched['resource'] && Boolean(errors['resource'])}
                              helperText={touched['resource'] && errors['resource']}
                              label="Report"
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
                            setFieldValue('filters', newVal);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={touched['filters'] && Boolean(errors['filters'])}
                              helperText={touched['filters'] && errors['filters']}
                              label="Filters"
                              name="filters"
                              variant="outlined"
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {loadingColumns ? <CircularProgress size={18} color="inherit" /> : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                )
                              }}
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
                          onChange={(_, newVal) => setFieldValue('column', newVal)}
                          renderInput={(params) => (
                            <TextField
                              error={touched['column'] && Boolean(errors['column'])}
                              helperText={touched['column'] && errors['column']}
                              {...params}
                              label="Columns"
                              name="columns"
                              variant="outlined"
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {loadingColumns ? <CircularProgress size={18} color="inherit" /> : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                )
                              }}
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
                          options={sharepointOptions ? ['Email', 'Sharepoint Upload'] : ['Email']}
                          fullWidth
                          size="small"
                          getOptionLabel={(option) => option}
                          getOptionSelected={(option, value) => option === value}
                          value={values.reportAction}
                          onChange={(_, newVal) => setFieldValue('reportAction', newVal)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={touched['reportAction'] && Boolean(errors['reportAction'])}
                              helperText={touched['reportAction'] && errors['reportAction']}
                              label="Report Action"
                              name="reportAction"
                              required
                              variant="outlined"
                            />
                          )}
                        />
                      </Grid> 
                      <Grid item xs={12} sm={6}>
                      <Autocomplete
                          options={['xslx', 'csv']}
                          fullWidth
                          size="small"
                          getOptionLabel={(option) => option}
                          getOptionSelected={(option, value) => option === value}
                          value={values.fileType}
                          onChange={(_, newVal) => setFieldValue('fileType', newVal)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={touched['fileType'] && Boolean(errors['fileType'])}
                              helperText={touched['fileType'] && errors['fileType']}
                              label="File type"
                              name="fileType"
                              required
                              variant="outlined"
                            />
                          )}
                        />
                      </Grid>     
                    </Grid>
                  </Box>
                  <Box my={2}>
                    <Grid container spacing={2}>
                    {values?.reportAction==='Email' && (
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          options={usersList}
                          fullWidth
                          multiple
                          size="small"
                          getOptionLabel={(option) => option.name}
                          getOptionSelected={(option, value) => option.userId === value.userId}
                          value={values.subscribeUsers}
                          onChange={(_, newVal) => setFieldValue('subscribeUsers', newVal)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={touched['subscribeUsers'] && Boolean(errors['subscribeUsers'])}
                              helperText={touched['subscribeUsers'] && errors['subscribeUsers']}
                              label="Users"
                              name="subscribeUsers"
                              required
                              variant="outlined"
                            />
                          )}
                        />
                      </Grid>
                    )}
                    {values?.reportAction==='Sharepoint Upload' && sharepointOptions && (
                    <Grid item xs={12} sm={6}>  
                     <Autocomplete
                          options={sharepointOptions}
                          fullWidth
                          size="small"
                          getOptionLabel={(option) => option.optionLabel}
                          getOptionSelected={(option, value) => option.optionValue == value}
                          value={sharepointOptions?.find((ops)=> ops?.optionValue===values?.sharepointSite) || {}}
                          onChange={(_, newVal) => 
                            setFieldValue('sharepointSite', newVal?.optionValue || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={touched['sharepointSite'] && Boolean(errors['sharepointSite'])}
                              helperText={touched['sharepointSite'] && errors['sharepointSite']}
                              label="Sharepoint Site"
                              name="sharepointSite"
                              required
                              variant="outlined"
                            />
                          )}
                        />
                  </Grid>
                  )}
                  </Grid>
                  </Box>
                  <Box my={2}>
                  <Grid container spacing={2}>
                  <Grid item xs={12}>
                        <Box>
                          <Typography color="textPrimary">Schedule Frequency</Typography>
                          <Box mt={1} />
                          <ToggleButtonGroup
                            size="small"
                            value={values?.frequency ?? 'Daily'}
                            exclusive
                            onChange={(_, val) => setFieldValue('frequency', val)}
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
                              <ToggleButtonGroup size="small" value={values.week} exclusive onChange={(_, val) => setFieldValue('week', val)}>
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
                                  setFieldValue('day', newVal);
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
                          {values?.frequency === 'Hourly' && (
                            <Box mt={2}>
                              <Autocomplete
                                options={[...new Array(12).keys()].map((_, index) => `${index + 1}`)}
                                style={{ width: 200 }}
                                size="small"
                                onChange={(_, newVal) => {
                                  setFieldValue('hour', newVal);
                                }}
                                value={values['hour']}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Hour"
                                    name="hour"
                                    variant="outlined"
                                    error={touched['hour'] && Boolean(errors['hour'])}
                                    helperText={touched['hour'] && errors['hour']}
                                  />
                                )}
                              />
                            </Box>
                          )}
                        </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                        <Autocomplete
                          options={getTimeOption()}
                          fullWidth
                          size="small"
                          getOptionSelected={(option, val) => option === val}
                          getOptionLabel={(option) => option ?? ''}
                          value={values.time}
                          onChange={(_, newVal) => {
                            setFieldValue('time', newVal);
                          }}
                          renderInput={(params) => (
                            <TextField
                              required={Boolean(values.frequency)}
                              error={touched['time'] && Boolean(errors['time'])}
                              helperText={touched['time'] && errors['time']}
                              {...params}
                              label="Time"
                              name="time"
                              variant="outlined"
                            />
                          )}
                        />
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
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={submitForm}
                  >
                    {id ? 'Update' : 'Save'}
                  </Button>
                </CustomDialogFooter>
              </Form>
            </>
          )}
        </Formik>
      )}
    </Dialog>
  );
};

export default ManageScheduleReport;

import { useEffect, useState, useContext, useRef, Fragment } from 'react';
import { Dialog, Box, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Autocomplete, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import { REPORT_LIST, SCHEDULE_FREQUENCY, FREQUENCY_WEEKS, CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import { useData } from '../../StateProvider/Provider';
import { kebabCase } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Filters from 'src/components/Filter/Filters';
import dayjs from 'dayjs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

type ValueTypes = {
  scheduleName: string;
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
  const [scheduleData, setScheduleData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [resourceColumns, setResourceColumns] = useState([]);
  const [filterColumns, setFilterColumns] = useState([]);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const {
    state: { permissions, resources }
  }: any = useData();
  const [resourceOption, setResourceOption] = useState(null);
  const [sharepointOptions, setSharepointOptions] = useState(null);

  useEffect(() => {
    const options = [];
    REPORT_LIST?.forEach((item) => {
      if (permissions[item.permission] && permissions[item.permission]?.isRead === true) {
        options.push({
          title: item.type === 'dynamic' ? resources[item.key]?.titleSingular : item.title,
          value: item.title,
          key: item.key,
          type: item?.type
        });
      }
    });
    setResourceOption(options);
  }, []);

  useEffect(() => {
    fetchSharepointSiteData();
  }, []);

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          let {
            data: { data }
          } = await axiosInstance().get(`/schedule-report/${id}`);

          let resource: any = REPORT_LIST.find((item) => item.title === data.resource);
          resource = {
            title: resource.type === 'dynamic' ? resources[resource.key]?.titleSingular : resource.title,
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
            subscribeUsers: data?.subscribeUsers || [],
            reportAction: data?.reportAction,
            sharepointSite: data?.sharepointSite,
            fileType: data?.fileType || 'xslx'
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
        column: [],
        subscribeUsers: [],
        reportAction: 'Email',
        sharepointSite: '',
        frequency: 'Daily',
        time: '',
        week: '',
        day: new Date().getDay().toString(),
        hour: '',
        fileType: 'xslx'
      });
    }
  }, [id]);

  useEffect(() => {
    if (scheduleData && filterColumns?.length > 0 && resourceColumns?.length > 0) {
      const filterById: any = [];
      const deepFilter: any = [];

      const column: any = [];
      scheduleData?.filters?.forEach((_f) => {
        const col = filterColumns?.find((c) => c?.fieldData?.fieldName === _f?.term)?.fieldData;
        if (col?.lookup) {
          filterById.push({
            field: _f?.term,
            term: _f?.value
          });
        } else {
          deepFilter.push({
            ..._f,
            field: _f?.term,
            term: _f?.value
          });
        }
      });

      if (scheduleData?.column?.length > 0) {
        scheduleData?.column?.map((c) => {
          const fieldData = resourceColumns?.find((r) => r?.fieldData?.fieldName === c)?.fieldData;
          if (fieldData) {
            column.push(fieldData);
          }
        });
      }

      const users = scheduleData?.subscribeUsers?.map((item) => ({
        name: `${item.firstName} ${item.lastName}`,
        userId: item._id
      }));

      setFilterByIds(filterById);
      setDeepFilters(deepFilter);
      setFormData({
        ...scheduleData,
        column: column,
        subscribeUsers: users
      });
    }
  }, [scheduleData, filterColumns, resourceColumns]);

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
    setFilterColumns([]);
    try {
      let filterColumns;
      if (resource.key === 'standardReport') {
        let {
          data: {
            data: { columnFields, filterFields }
          }
        } = await axiosInstance().get(`/report/${kebabCase(resource.type)}/column`);

        filterColumns = filterFields;
        setResourceColumns(columnFields);
      } else {
        const {
          data: { data }
        }: any = await axiosInstance().get(`/field?resource=${resource.value}`);

        if (resource.value === sidebarResource.serializedAsset) {
          const currentOwner: any = data?.find((e) => e?.fieldData?.fieldName === 'currentOwner');
          if (currentOwner) {
            const {
              data: { data: lookupResource }
            } = await axiosInstance().get(
              `/sa-formbuilder/lookup?lookupResource=${sidebarResource.customerAccount},${sidebarResource.supplierAccount}`
            );
            if (lookupResource) {
              currentOwner.fieldData.lookup = true;
              currentOwner.fieldData.lookupResource = sidebarResource.customerAccount;
              currentOwner.fieldData.customOptions = [
                ...lookupResource?.[sidebarResource.customerAccount],
                ...lookupResource?.[sidebarResource.supplierAccount]
              ];
            }
          }
          if (data?.some((r) => r?.fieldData?.fieldName === 'status')) {
            const index = data?.findIndex((r) => r?.fieldData?.fieldName === 'status');
            if (index !== -1) {
              data?.splice(index + 1, 0, {
                fieldData: {
                  _id: '630dz2429ec44869056955b1',
                  fieldLabel: 'Status Period',
                  type: 'date',
                  option: [],
                  required: false,
                  isTooltip: false,
                  tooltipMessage: '',
                  editAble: true,
                  deletAble: true,
                  order: 71,
                  fieldName: 'statusPeriod',
                  sectionName: 'Filter Section',
                  resource: 'Serialized Asset',
                  brand: data[0]?.fieldData?.brand,
                  timeFrame: 'custom'
                },
                isCreate: true,
                isRead: true,
                isUpdate: true
              });
            }
          }
        }

        filterColumns = data;
        setResourceColumns(data);
      }
      setFilterColumns([...filterColumns]);
    } catch (err) {
      setToastConfig(err);
    }
  };

  const fetchSharepointSiteData = () => {
    axiosInstance()
      .get(`/sharepoint-configuration/share-point-site`)
      .then(({ data: { data } }) => {
        if (data?.sharepointConfiguration) {
          setSharepointOptions(data?.sharepointSites);
        }
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const validate = (values: ValueTypes) => {
    let errors = {};
    if (!values.scheduleName || values.scheduleName === '') {
      errors['scheduleName'] = 'Schedule name is required';
    }
    if (!values.resource) {
      errors['resource'] = 'Report is required';
    }
    if (!values.reportAction) {
      errors['reportAction'] = 'Report Action is required';
    }
    if (!values.fileType) {
      errors['fileType'] = 'File Type is required';
    }
    if (values.reportAction) {
      if (values.reportAction === 'Email') {
        if (values?.subscribeUsers?.length === 0) {
          errors['subscribeUsers'] = 'Users is required';
        }
      }

      if (values.reportAction === 'Sharepoint Upload') {
        if (!values.sharepointSite || values.sharepointSite === '') {
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

    filterByIds?.forEach((d) => {
      if (d?.field && d?.term?.length > 0) {
        let obj = {
          type: 'multiSelect',
          term: d?.field,
          value: d?.term?.map((t) => t?.optionValue),
          lookup: true,
          lookupResource: filterColumns?.find((c) => c?.fieldData?.fieldName === d?.field)?.fieldData?.lookupResource
        };
        filters.push(obj);
      }
    });

    deepFilters?.forEach((d) => {
      if (d?.type === 'date') {
        if (dayjs(d?.term?.from).isValid() && d?.term?.from instanceof Date && dayjs(d?.term?.to).isValid() && d?.term?.to instanceof Date) {
          filters.push({
            term: d?.field,
            value: d?.term,
            duration: d?.duration,
            type: d?.type
          });
        }
      } else if (d?.field && d?.term?.length > 0) {
        let obj = {
          type: 'multiSelect',
          term: d?.field,
          value: d?.term
        };
        filters.push(obj);
      }
    });

    const newValues = {
      ...values,
      filters,
      resource: values.resource?.value,
      column: values.column.length > 0 ? values.column.map((field) => field.fieldName) : [],
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
      {formData ? (
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
            <Fragment>
              <CustomDialogHeader
                title={`${id ? 'Edit' : 'Add'} Schedule Report`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                onClose={handleClose}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <div className={'detail-box-content'}>
                    <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                    <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Schedule Information</h2>
                  </div>
                  <Box my={2}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
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
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                          options={resourceOption}
                          fullWidth
                          size="small"
                          getOptionLabel={(option) => option.title}
                          isOptionEqualToValue={(option, value) => option.value === value.value}
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
                  {values?.resource ? (
                    filterColumns?.length > 0 ? (
                      <div className="relative mt-2 !px-[--px] !py-[--py] !pt-0 [--container-max-h:300px] [--content-max-h:230px] [--sidebar-width:285px]">
                        <Filters
                          columns={filterColumns}
                          deepFilters={deepFilters}
                          setDeepFilters={setDeepFilters}
                          filterByIds={filterByIds}
                          setFilterByIds={setFilterByIds}
                        />
                      </div>
                    ) : (
                      <div className="m-2">Loading ..</div>
                    )
                  ) : null}
                  <Box my={2}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                          options={resourceColumns.map((item) => item.fieldData)}
                          fullWidth
                          multiple
                          size="small"
                          isOptionEqualToValue={(option, val) => option.fieldName === val.fieldName}
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
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                          options={sharepointOptions ? ['Email', 'Sharepoint Upload'] : ['Email']}
                          fullWidth
                          size="small"
                          getOptionLabel={(option) => option}
                          isOptionEqualToValue={(option, value) => option === value}
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
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                          options={['xslx', 'csv']}
                          fullWidth
                          size="small"
                          getOptionLabel={(option) => option}
                          isOptionEqualToValue={(option, value) => option === value}
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
                      {values?.reportAction === 'Email' && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Autocomplete
                            options={usersList}
                            fullWidth
                            multiple
                            size="small"
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.userId === value.userId}
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
                      {values?.reportAction === 'Sharepoint Upload' && sharepointOptions && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Autocomplete
                            options={sharepointOptions}
                            fullWidth
                            size="small"
                            getOptionLabel={(option) => option.optionLabel}
                            isOptionEqualToValue={(option, value) => option.optionValue == value}
                            value={sharepointOptions?.find((ops) => ops?.optionValue === values?.sharepointSite) || {}}
                            onChange={(_, newVal) => setFieldValue('sharepointSite', newVal?.optionValue || '')}
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
                      <Grid size={{ xs: 12 }}>
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
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                          options={getTimeOption()}
                          fullWidth
                          size="small"
                          isOptionEqualToValue={(option, val) => option === val}
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
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={handleClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton buttonType="theme" disabled={isSubmitting} onClick={submitForm} isLoading={isSubmitting}>
                  {'Save'}
                </ThemeButton>
              </CustomDialogFooter>
            </Fragment>
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

export default ManageScheduleReport;

import { useEffect, useState, useContext, useRef, Fragment } from 'react';
import { Dialog, Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
import { Form, Formik, FormikProps } from 'formik';
import { cn, CustomDialogTransition, REPORT_LIST, sidebarResource } from 'src/constants/helpers';
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
  customReportName: string;
  resource: any;
  column: any[];
};

const ManageCustomReport = ({ handleClose, onSuccess, id }) => {
  const formikRef = useRef<FormikProps<ValueTypes>>(null);

  const { setToastConfig } = useContext(CustomToastContext);
  const [scheduleData, setScheduleData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [resourceColumns, setResourceColumns] = useState([]);
  const [filterColumns, setFilterColumns] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const {
    state: { permissions, resources }
  }: any = useData();

  const [resourceOption, setResourceOption] = useState(null);

  useEffect(() => {
    const options = [];
    REPORT_LIST?.forEach((item) => {
      if (permissions[item.permission] && permissions[item.permission]?.isRead === true) {
        options.push({
          title: item.type === 'dynamic' ? resources[item.key]?.titleSingular : item.title,
          value: item.title,
          key: item.key,
          type: item.type
        });
      }
    });
    setResourceOption(options);
  }, []);

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          let {
            data: { data }
          } = await axiosInstance().get(`/custom-report/${id}`);

          let resource: any = REPORT_LIST?.find((item) => item.title === data.resource);
          resource = {
            title: resource.type === 'dynamic' ? resources[resource.key]?.titleSingular : resource.title,
            value: resource.title,
            key: resource.key,
            type: resource.type
          };

          await fetchGridColumns(resource);

          setScheduleData({
            customReportName: data?.customReportName,
            resource,
            filters: data?.filters,
            column: data?.column
          });
        } catch (err) {
          setToastConfig(err);
        }
      })();
    } else {
      setFormData({
        customReportName: '',
        resource: null,
        column: []
      });
    }
  }, [id]);

  const fetchGridColumns = async (resource: any) => {
    setFilterColumns([]);
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
                _id: '630dc2429ec41869056955b1',
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
  };

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
      setFilterByIds(filterById);
      setDeepFilters(deepFilter);
      setFormData({
        ...scheduleData,
        column: column
      });
    }
  }, [scheduleData, filterColumns, resourceColumns]);

  const validate = (values: ValueTypes) => {
    let errors = {};
    if (!values.customReportName || values.customReportName === '') {
      errors['customReportName'] = 'Custom report name is required';
    }
    if (!values.resource) {
      errors['resource'] = 'Report is required';
    }
    return errors;
  };

  const handleSubmit = (values: ValueTypes) => {
    const filters = [];
    const dateFields: any = ['from_statusPeriod', 'to_statusPeriod'];
    filterColumns
      ?.filter((c) => c?.fieldData?.type === 'date')
      ?.map((c) => {
        dateFields.push(`from_${c?.fieldData?.fieldName}`);
        dateFields.push(`to_${c?.fieldData?.fieldName}`);
      });

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
      if (dateFields?.includes(d?.field) && dayjs(d?.term).isValid()) {
        filters.push({
          term: d?.field,
          value: d?.term
        });
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
      column: values.column.length > 0 ? values.column.map((field) => field.fieldName) : []
    };

    setSubmitting(true);
    if (id) {
      let newData = { _id: id, ...newValues };
      axiosInstance()
        .put(`/custom-report`, newData)
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
        .post(`/custom-report`, newValues)
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

  const isFullScreen = fullScreen || isMobile || isTablet;

  return (
    <Dialog
      open
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullScreen={isFullScreen}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      {formData && resourceOption ? (
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
                title={`${id ? 'Edit' : 'Add'} Custom Report`}
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
                    <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>Report Information</h2>
                  </div>
                  <Box my={2}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          value={values.customReportName}
                          required
                          onChange={(e) => setFieldValue('customReportName', e.target.value)}
                          fullWidth
                          name="customReportName"
                          size="small"
                          label="Custom Report Name"
                          variant="outlined"
                          error={touched['customReportName'] && Boolean(errors['customReportName'])}
                          helperText={touched['customReportName'] && errors['customReportName']}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                          options={resourceOption}
                          fullWidth
                          size="small"
                          getOptionLabel={(option) => option?.title || ''}
                          isOptionEqualToValue={(option, value) => option?.value === value?.value}
                          value={values.resource}
                          onChange={(_, newVal) => {
                            const result = { resource: newVal, column: [] };
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
                  {values?.resource ? (
                    filterColumns?.length > 0 ? (
                      <div
                        className={cn(
                          'relative mt-2 !px-[--px] !py-[--py] !pt-0  [--sidebar-width:285px]',
                          isFullScreen
                            ? '[--container-max-h:calc(100vh-300px)] [--content-max-h:calc(100vh-380px)]'
                            : '[--container-max-h:300px] [--content-max-h:230px]'
                        )}
                      >
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
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={handleClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton buttonType="theme" disabled={isSubmitting} onClick={submitForm} isLoading={isSubmitting}>
                  Save
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

export default ManageCustomReport;

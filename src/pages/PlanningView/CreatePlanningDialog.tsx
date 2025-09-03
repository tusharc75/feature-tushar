import { DateSelectArg } from '@fullcalendar/core';
import { Autocomplete, Box, Dialog, IconButton, TextField } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FieldArray, Form, Formik } from 'formik';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition, customerContact, getObjKeys, sidebarResource, yupSchema } from 'src/constants/helpers';
import { fetch_resource_fields } from 'src/components/ResourceFields';
import { useData } from 'src/StateProvider/Provider';
import CustomDateTimePicker from 'src/components/CustomDateTimePicker';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Add, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import { getResourcePolicy } from 'src/pages/DynamicForm/helper';

type CreatePlanningDialogProps = {
  onClose: (event: {}, reason?: 'backdropClick' | 'escapeKeyDown' | ('' & {})) => void;
  selectedRange: DateSelectArg;
  productIDs: string[];
};

const CreatePlanningDialog = ({ onClose, selectedRange, productIDs }: CreatePlanningDialogProps) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [dates, setDates] = useState([{ startDate: selectedRange.start, endDate: selectedRange.end, subStatus: '' }]);
  const [subStatusOptions, setSubStatusOptions] = useState([]);

  const fetchFields = async () => {
    try {
      const { fieldsDataForCreate } = await fetch_resource_fields(sidebarResource.planning, ['rentalJob', 'salesOrder', 'fieldServiceOrder']);

      const tempInitialData: any = getObjKeys('', fieldsDataForCreate);
      const filteredFields = fieldsDataForCreate.filter(field => {
        const isRequiredAndEmpty = field.required && !tempInitialData[field.fieldName];
        return isRequiredAndEmpty;
      });

      setInitialData({
        fields: filteredFields,
        values: tempInitialData
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  const fetchPolicy = async () => {
    const data = await getResourcePolicy(user, permissions, sidebarResource.serializedAsset);
    setSubStatusOptions(data?.policy?.inUseSubStatus || []);
  };

  useEffect(() => {
    fetchFields();
    fetchPolicy();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const transformedValues = {
        ...values,
        currency: user.user?.brandCurrency,
        startDate: selectedRange.start,
        endDate: selectedRange.end,
        material: productIDs.map((materialId) => ({
          materialId,
          type: "product",
          unit: "Piece",
          qty: 1,
          parentId: null,
          dates: values.dates.map(date => ({
            startDate: date.startDate,
            endDate: date.endDate,
            subStatus: date.subStatus
          }))
        }))
      };

      delete transformedValues.dates;

      const { data } = await axiosInstance().post(`${routes.planning?.path}`, transformedValues);

      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });

      if (data?.data?._id) {
        history.push(`${routes.planningDetail.path}/${data.data._id}`);
      }

      onClose({}, '');
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const addRemove = (values, type, index) => {
    let newDates = [...values];
    if (type === 'add') {
      newDates.splice(index, 0, {
        startDate: null,
        endDate: null,
        subStatus: ''
      });
    } else {
      newDates.splice(index, 1);
    }
    setDates([...newDates]);
  };

  function validate(values) {
    const errors: any = {};
    if (values?.dates?.length > 0) {
      values.dates.forEach((d, i) => {
        if (!d.startDate) {
          if (!errors?.dates) {
            errors['dates'] = [];
          }
          errors.dates[i] = { startDate: 'Start Date-Time is required' };
        }
        if (!d.endDate) {
          if (!errors?.dates) {
            errors['dates'] = [];
          }
          errors.dates[i] = { ...errors.dates[i], endDate: 'End Date-Time is required' };
        }
        if (!d.subStatus) {
          if (!errors?.dates) {
            errors['dates'] = [];
          }
          errors.dates[i] = { ...errors.dates[i], subStatus: 'Status is required' };
        }

        if (d.startDate && d.endDate) {
          const start = dayjs.tz(new Date(d.startDate));
          const end = dayjs.tz(new Date(d.endDate));

          if (start.isAfter(end)) {
            if (!errors?.dates) {
              errors['dates'] = [];
            }
            errors.dates[i] = { ...errors.dates[i], endDate: 'End Date must be after Start Date' };
          }
        }

        if (i > 0 && d?.startDate && values?.dates[i - 1]?.endDate) {
          const currentStart = dayjs.tz(new Date(d.startDate));
          const prevEnd = dayjs.tz(new Date(values?.dates[i - 1].endDate));
          if (currentStart.isSameOrBefore(prevEnd)) {
            if (!errors?.dates) {
              errors['dates'] = [];
            }
            errors.dates[i] = { ...errors.dates[i], startDate: 'Start Date overlaps with the previous range' };
          }
        }
      });
    }
    return errors;
  }

  return (
    <Dialog
      open={true}
      slotProps={{
        transition: CustomDialogTransition
      }}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
    >
      <CustomDialogHeader
        onClose={() => onClose({}, '')}
        title={`Create Planning`}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      {initialData && initialData.fields.length ? (
        <Formik
          enableReinitialize={true}
          initialValues={{
            ...initialData.values,
            dates
          }}
          validationSchema={yupSchema(initialData.fields)}
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogContent >
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                  <FieldArray
                    name="dates"
                    render={(arrayHelpers) => (
                      <div className="space-y-4">
                        {values?.dates?.length
                          ? values?.dates?.map((_date, index) => (
                            <div
                              key={index}
                              className={
                                'grid grid-cols-[1fr_30px] flex-wrap items-center gap-2 rounded-md border bg-gray-50 p-4 dark:bg-gray-800 sm:grid-cols-[1fr_1fr_1fr_30px]'
                              }
                            >
                              <div className="max-sm:col-start-1">
                                <CustomDateTimePicker
                                  fullWidth
                                  size="small"
                                  margin="dense"
                                  required
                                  value={_date?.startDate}
                                  name="startDate"
                                  placeholder={`Start Date-Time`}
                                  label={`Start Date-Time`}
                                  onChange={(value) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.dates[index],
                                      startDate: value || null
                                    });
                                  }}
                                  error={
                                    touched?.dates &&
                                    touched?.dates[index]?.startDate &&
                                    errors?.dates &&
                                    Boolean(errors?.dates[index]?.startDate)
                                  }
                                  helperText={
                                    touched?.dates && touched?.dates[index]?.startDate && errors?.dates && errors?.dates[index]?.startDate
                                  }
                                />
                              </div>
                              <div className="max-sm:col-start-1">
                                <CustomDateTimePicker
                                  fullWidth
                                  size="small"
                                  margin="dense"
                                  required
                                  value={_date?.endDate}
                                  name="endDate"
                                  placeholder={`End Date-Time`}
                                  label={`End Date-Time`}
                                  onChange={(value) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.dates[index],
                                      ['endDate']: value || null
                                    });
                                  }}
                                  {...(_date?.startDate ? { minDateTime: _date?.startDate } : {})}
                                  error={
                                    touched?.dates && touched?.dates[index]?.endDate && errors?.dates && Boolean(errors?.dates[index]?.endDate)
                                  }
                                  helperText={
                                    touched?.dates && touched?.dates[index]?.endDate && errors?.dates && errors?.dates[index]?.endDate
                                  }
                                />
                              </div>
                              <div className="max-sm:col-start-1">
                                <Autocomplete
                                  options={subStatusOptions}
                                  fullWidth
                                  getOptionLabel={(option: any) => (option ? option : '')}
                                  value={_date?.subStatus}
                                  onChange={(e, val) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.dates[index],
                                      subStatus: val || ''
                                    });
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      margin="dense"
                                      size="small"
                                      name="subStatus"
                                      label="Sub Status"
                                      variant="outlined"
                                      fullWidth
                                      required
                                      error={
                                        touched?.dates &&
                                        touched?.dates[index]?.subStatus &&
                                        errors?.dates &&
                                        Boolean(errors?.dates[index]?.subStatus)
                                      }
                                      helperText={
                                        touched?.dates && touched?.dates[index]?.subStatus && errors?.dates && errors?.dates[index]?.subStatus
                                      }
                                    />
                                  )}
                                />
                              </div>

                              <div className="max-sm:col-start-2 max-sm:row-start-2">
                                <HtmlTooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      addRemove(values?.dates, 'remove', index);
                                    }}
                                    aria-label="Remove"
                                    color={'error'}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </HtmlTooltip>
                              </div>
                            </div>
                          ))
                          : null}
                      </div>
                    )}
                  />
                  <div className="mt-4">
                    <ThemeButton
                      buttonType="themeBorder"
                      startIcon={<Add />}
                      onClick={() => {
                        addRemove(values?.dates, 'add', values?.dates?.length);
                      }}
                    >
                      Add Date
                    </ThemeButton>
                  </div>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={() => onClose({}, '')}>
                  Cancel
                </ThemeButton>
                <ThemeButton
                  buttonType="theme"
                  onClick={submitForm}
                >
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

export default CreatePlanningDialog;

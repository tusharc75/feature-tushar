import { Add, Delete, Remove } from '@mui/icons-material';
import { Autocomplete, Dialog, IconButton, TextField } from '@mui/material';
import dayjs from 'dayjs';
import { FieldArray, Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDatePicker from 'src/components/CustomDatePicker';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition, dateFormat, rentalManagement } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const SubStatusDatesDialog = ({ handleClose, options, onSuccess, submitting, rentalId, assets, showDates = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [dates, setDates] = useState([{ startDate: null, endDate: null, subStatus: '' }]);
  const [minDate, setMinDate] = useState(null);

  const addRemove = (values, type, index) => {
    let dates = [...values];
    if (type === 'add') {
      dates.splice(index, 0, {
        startDate: null,
        endDate: null,
        subStatus: ''
      });
    } else {
      dates.splice(index, 1);
    }
    setDates([...dates]);
  };

  useEffect(() => {
    if (showDates) {
      fetchLogs();
    }
  }, [showDates]);

  const fetchLogs = () => {
    axiosInstance()
      .get(`${rentalManagement.api}/${rentalId}/inventory/asset-min-log-date?assets=${JSON.stringify(assets)}`)
      .then(({ data: { data } }) => {
        if (data?.minDate) {
          const newDate = dayjs.utc(data?.minDate).add(1, 'day');
          setMinDate(newDate);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = (values) => {
    onSuccess(values?.dates);
  };

  const validate = (values) => {
    const errors: any = {};

    if (values?.dates?.length > 0) {
      values?.dates?.forEach((d, i) => {
        if (showDates) {
          if (!d.startDate) {
            if (!errors?.dates) {
              errors['dates'] = [];
            }
            errors.dates[i] = { startDate: 'Start Date is required' };
          }
          if (!d.endDate) {
            if (!errors?.dates) {
              errors['dates'] = [];
            }
            errors.dates[i] = { endDate: 'End Date is required' };
          }

          if (d.startDate && d.endDate) {
            const start = dayjs.tz(new Date(d.startDate));
            const end = dayjs.tz(new Date(d.endDate));

            if (start.isAfter(end)) {
              if (!errors?.dates) {
                errors['dates'] = [];
              }
              errors.dates[i] = { endDate: 'End Date must be after Start Date' };
            }
          }

          if (i === 0 && minDate && d?.startDate) {
            const start = dayjs.tz(new Date(d?.startDate)).startOf('day');
            const min = dayjs.tz(new Date(minDate)).startOf('day');

            if (start.isBefore(min)) {
              if (!errors?.dates) {
                errors['dates'] = [];
              }
              errors.dates[i] = { startDate: `Start Date cannot be before ${min.format(dateFormat)}` };
            }
          }

          if (i > 0 && d?.startDate && values?.dates[i - 1]?.endDate) {
            const currentStart = dayjs.tz(new Date(d.startDate));
            const prevEnd = dayjs.tz(new Date(values?.dates[i - 1].endDate));

            if (currentStart.isSameOrBefore(prevEnd)) {
              if (!errors?.dates) {
                errors['dates'] = [];
              }
              errors.dates[i] = { startDate: 'Start Date overlaps with the previous range' };
            }
          }
        }

        if (!d.subStatus) {
          if (!errors?.dates) {
            errors['dates'] = [];
          }
          errors.dates[i] = { ...errors.dates[i], subStatus: 'Status is required' };
        }
      });
    }

    return errors;
  };

  return (
    <Dialog
      open={true}
      fullWidth
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullScreen={fullScreen || isMobile || isTablet}>
      <Formik initialValues={{ dates }} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
        {({ values, submitForm, touched, errors }) => (
          <>
            <CustomDialogHeader
              title={`Change Sub Status`}
              onClose={handleClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <div className="mt-2">
                <Form>
                  <FieldArray
                    name="dates"
                    render={(arrayHelpers) => (
                      <div className="space-y-4">
                        {values?.dates?.length
                          ? values?.dates?.map((_date, index) => {
                            return (
                              <div
                                key={index}
                                className="grid grid-cols-[1fr_30px] flex-wrap items-center gap-2 rounded-md border bg-gray-50 p-4 dark:bg-gray-800 sm:grid-cols-[1fr_1fr_1fr_30px]"
                              >
                                {showDates && (
                                  <>
                                    <div className="max-sm:col-start-1">
                                      <CustomDatePicker
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        required
                                        value={_date?.startDate}
                                        name="startDate"
                                        placeholder={`Start Date`}
                                        label={`Start Date`}
                                        onChange={(value) => {
                                          arrayHelpers.replace(index, {
                                            ...values?.dates[index],
                                            startDate: value || null
                                          });
                                        }}
                                        {...(minDate ? { minDate: minDate } : {})}
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
                                      <CustomDatePicker
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        required
                                        value={_date?.endDate}
                                        name="endDate"
                                        placeholder={`End Date`}
                                        label={`End Date`}
                                        onChange={(value) => {
                                          arrayHelpers.replace(index, {
                                            ...values?.dates[index],
                                            ['endDate']: value || null
                                          });
                                        }}
                                        {...(_date?.startDate ? { minDate: _date?.startDate } : {})}
                                        error={
                                          touched?.dates &&
                                          touched?.dates[index]?.endDate &&
                                          errors?.dates &&
                                          Boolean(errors?.dates[index]?.endDate)
                                        }
                                        helperText={
                                          touched?.dates && touched?.dates[index]?.endDate && errors?.dates && errors?.dates[index]?.endDate
                                        }
                                      />
                                    </div>
                                  </>
                                )}
                                <div className="max-sm:col-start-1">
                                  <Autocomplete
                                    options={options}
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
                                      disabled={index === 0}
                                      aria-label="Remove"
                                      color={'error'}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </HtmlTooltip>
                                </div>
                              </div>
                            );
                          })
                          : null}
                      </div>
                    )}
                  />
                </Form>
                <div className="mt-4">
                  <ThemeButton
                    buttonType="themeBorder"
                    disabled={!showDates}
                    startIcon={<Add />}
                    onClick={() => {
                      addRemove(values?.dates, 'add', values?.dates?.length);
                    }}
                  >
                    Add Date
                  </ThemeButton>
                </div>
              </div>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton disabled={submitting} buttonType="transparent" onClick={handleClose}>
                Cancel
              </ThemeButton>
              <ThemeButton isLoading={submitting} buttonType="theme" disabled={submitting} onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default SubStatusDatesDialog;

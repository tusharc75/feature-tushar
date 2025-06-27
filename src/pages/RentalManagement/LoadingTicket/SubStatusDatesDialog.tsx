import { Remove } from "@mui/icons-material";
import { Autocomplete, Dialog, IconButton, TextField } from "@mui/material";
import dayjs from "dayjs";
import { FieldArray, Form, Formik } from "formik";
import { useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import CustomDatePicker from "src/components/CustomDatePicker";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { ThemeButton } from "src/components/Helpers/Buttons";
import { CustomDialogTransition } from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";

const SubStatusDatesDialog = ({ handleClose, subStatus, options, onSuccess, submitting }) => {

  const {
    state: { resources }
  }: any = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [dates, setDates] = useState([{ startDate: null, endDate: null, subStatus: subStatus }])

  const addRemove = (values, type, index) => {
    let dates = [...values];
    if (type === 'add') {
      dates.splice(index, 0, {
        startDate: null,
        endDate: null,
        subStatus: '',
      });
    } else {
      dates.splice(index, 1);
    }
    setDates([...dates]);
  };

  const handleSubmit = (values) => {
    onSuccess(values?.dates)
  }

  const validate = (values) => {
    const errors: any = {};

    if (values?.dates?.length > 0) {
      values?.dates?.forEach((d, i) => {
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

        if (i > 0 && d?.startDate && values?.dates[i - 1]?.endDate) {
          const currentStart = dayjs.tz(new Date(d.startDate));
          const prevEnd = dayjs.tz(new Date(values?.dates[i - 1].endDate));

          if (currentStart.isBefore(prevEnd)) {
            if (!errors?.dates) {
              errors['dates'] = [];
            }
            errors.dates[i] = { startDate: 'Start Date overlaps with the previous range' };
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
    <Dialog open={true} fullWidth maxWidth="sm" TransitionComponent={CustomDialogTransition} fullScreen={fullScreen || isMobile || isTablet}>
      <Formik initialValues={{ dates }} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
        {({ values, submitForm, touched, errors }) => (
          <>
            <CustomDialogHeader
              title={`${resources?.serializedAsset?.titlePlural} Sub Status`}
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
                      <>
                        {values?.dates?.length
                          ? values?.dates?.map((_date, index) => {
                            return (
                              <div className="flex items-center gap-2">
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
                                      ['startDate']: value || null
                                    });
                                  }}
                                  error={touched?.dates && touched?.dates[index]?.startDate && errors?.dates && Boolean(errors?.dates[index]?.startDate)}
                                  helperText={touched?.dates && touched?.dates[index]?.startDate && errors?.dates && errors?.dates[index]?.startDate}
                                />
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
                                  error={touched?.dates && touched?.dates[index]?.endDate && errors?.dates && Boolean(errors?.dates[index]?.endDate)}
                                  helperText={touched?.dates && touched?.dates[index]?.endDate && errors?.dates && errors?.dates[index]?.endDate}
                                />
                                <Autocomplete
                                  options={options}
                                  fullWidth
                                  getOptionLabel={(option: any) => (option ? option : '')}
                                  value={_date?.subStatus}
                                  disabled={index === 0}
                                  onChange={(e, val) => {
                                    arrayHelpers.replace(index, {
                                      ...values?.dates[index],
                                      ['subStatus']: val || ''
                                    });
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      margin="dense"
                                      size="small"
                                      name="subStatus"
                                      label="Status"
                                      variant="outlined"
                                      fullWidth
                                      required
                                      error={touched?.dates && touched?.dates[index]?.subStatus && errors?.dates && Boolean(errors?.dates[index]?.subStatus)}
                                      helperText={touched?.dates && touched?.dates[index]?.subStatus && errors?.dates && errors?.dates[index]?.subStatus} />
                                  )}
                                />
                                <HtmlTooltip title='Remove'>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      addRemove(values?.dates, 'remove', index)
                                    }}
                                    disabled={index === 0}
                                    aria-label="Remove"
                                  >
                                    <Remove fontSize="small" color={index === 0 ? 'disabled' : 'error'} />
                                  </IconButton>
                                </HtmlTooltip>
                              </div>
                            );
                          })
                          : null}
                      </>
                    )}
                  />
                </Form>
                <div className="mt-2 text-end">
                  <ThemeButton
                    buttonType="themeBorder"
                    onClick={() => {
                      addRemove(values?.dates, 'add', values?.dates?.length)
                    }}
                  >
                    Add More Dates
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
  )
}

export default SubStatusDatesDialog;

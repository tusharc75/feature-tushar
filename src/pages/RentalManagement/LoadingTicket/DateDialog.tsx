import { useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box, Typography, FormControl, RadioGroup, FormControlLabel, Radio } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ASSET_STATUS, CustomDialogTransition, convertDateInDateTime, dateFormatForInputControl } from 'src/constants/helpers';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateUtils from '@date-io/date-fns';

const DateDialog = ({ title, type, status, onClose, handleSubmit, loading, assets = [] }) => {

  const [minDate, setMinDate] = useState(new Date())

  useEffect(() => {
    findValidationDate()
  }, [assets])

  const findValidationDate = async () => {
    const last = type === 'changeStatus' ? 1 : 2
    const { data: { data } } = await axiosInstance().put(`/rental-management/assets-last-date`, { assets, last })
    setMinDate(new Date(data?.date))
  }


  function validate(values) {
    const errors = {};
    if (!moment(values['date']).isSameOrAfter(moment(minDate))) {
      errors['date'] = `Please select valid date`;
    }
    if (moment(values['date']).isAfter(moment())) {
      errors['date'] = `Please select valid date`;
    }
    return errors;
  }

  return (
    <Dialog
      open={true}
      TransitionComponent={CustomDialogTransition}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth>
      <Formik
        initialValues={{ date: new Date() }}
        validate={validate}
        onSubmit={(values) => {
          handleSubmit(moment(values.date).format('MM/DD/YYYY'), values?.status);
        }}>
        {({ values, errors, touched, setFieldValue }) => (
          <Form >
            <CustomDialogHeader title={title} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  <MuiPickersUtilsProvider utils={DateUtils}>
                    <KeyboardDatePicker
                      fullWidth
                      size="small"
                      margin="dense"
                      autoOk
                      required
                      variant="inline"
                      inputVariant="outlined"
                      value={values.date}
                      name="date"
                      placeholder={'Date'}
                      label="Date"
                      format={dateFormatForInputControl}
                      maxDate={new Date()}
                      minDate={minDate}
                      error={touched['date'] && Boolean(errors['date'])}
                      helperText={touched['date'] && errors['date']}
                      onChange={(value) => {
                        setFieldValue('date', convertDateInDateTime(value));
                      }}
                    />
                    {status === ASSET_STATUS.delivered &&
                      <Box pt={2}>
                        <Typography>Would you like to change status ?</Typography>
                        <Box pt={1}>
                          <FormControl component="fieldset">
                            <RadioGroup row aria-label="status" name="status" value={values['status']} onChange={(e) => {
                              setFieldValue('status', e.target.value);
                            }}>
                              <FormControlLabel value={ASSET_STATUS.inUse} control={<Radio />} label={ASSET_STATUS.inUse} />
                              <FormControlLabel value={ASSET_STATUS.standBy} control={<Radio />} label={ASSET_STATUS.standBy} />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      </Box>
                    }
                  </MuiPickersUtilsProvider>
                </Grid>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button disabled={loading} size="small" variant="outlined" color="primary" onClick={onClose}>
                Close
              </Button>
              <Button
                disabled={loading}
                startIcon={loading && <CircularProgress size={18} color="inherit" />}
                size="small"
                variant="contained"
                color="primary"
                type="submit"
              >
                Save
              </Button>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default DateDialog;

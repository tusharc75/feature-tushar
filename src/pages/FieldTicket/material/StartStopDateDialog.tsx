import { Box, Button, CircularProgress, Dialog, Grid, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import moment from 'moment';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, displayDate, normalizeDate } from 'src/constants/helpers';
import CustomDatePicker from 'src/components/CustomDatePicker';

export default function StartStopDate({ onClose, type, loading, handleSubmit, data = null, minStartDate = null, maxEndDate = null }) {
  const [initialValues, setInitialValues] = useState({ startDate: new Date(), endDate: new Date() });

  useEffect(() => {
    if (data) {
      setInitialValues({
        startDate: new Date(data.startDate),
        ...(data.endDate && { endDate: new Date(data.endDate) })
      });
    } else {
      if (minStartDate) {
        let date = moment(new Date(minStartDate));
        const currentTime = moment();
        date = date.set('hour', currentTime.hour()).set('minute', currentTime.minute());
        setInitialValues({ startDate: date.toDate(), endDate: date.toDate() });
      }
    }
  }, [data, type]);

  const onSubmit = (values) => {
    handleSubmit(values, data?._id);
  };

  const validate = (values) => {
    const errors = {};
    if (values?.endDate && normalizeDate(values?.startDate) > normalizeDate(values.endDate)) {
      errors['endDate'] = `Please enter valid end date`;
    }
    if (minStartDate && normalizeDate(values?.startDate) < normalizeDate(minStartDate)) {
      errors['startDate'] = `Start Date can't be less than ${displayDate(minStartDate)}`;
    }
    if (maxEndDate && normalizeDate(values?.endDate) > normalizeDate(maxEndDate)) {
      errors['endDate'] = `End Date can't be greater than ${displayDate(maxEndDate)}`;
    }
    return errors;
  };

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
      fullWidth
    >
      <Formik
        initialValues={initialValues}
        onSubmit={(val) => {
          onSubmit(val);
        }}
        enableReinitialize={true}
        validate={validate}
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form>
            <CustomDialogHeader title={`Set ${type === 'start' ? 'Start' : type === 'stop' ? 'End' : 'Start/End'} Date`} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  {type !== 'stop' && (
                    <Grid item xs={12} sm={12}>
                      <CustomDatePicker
                        fullWidth
                        size="small"
                        margin="none"
                        {...(minStartDate ? { minDate: minStartDate } : {})}
                        label={`Start Date`}
                        value={values.startDate}
                        onChange={(date) => {
                          setFieldValue('startDate', date);
                        }}
                        error={touched['startDate'] && Boolean(errors['startDate'])}
                        helperText={touched['startDate'] && errors['startDate']}
                      />
                    </Grid>
                  )}
                  {(type === 'startStop' || type === 'stop') && (
                    <Grid item xs={12} sm={12}>
                      <CustomDatePicker
                        fullWidth
                        size="small"
                        margin="none"
                        minDate={values.startDate}
                        label={`'End' Date`}
                        value={values.endDate}
                        onChange={(date) => {
                          setFieldValue('endDate', date);
                        }}
                        {...(maxEndDate ? { maxDate: maxEndDate } : {})}
                        error={touched['endDate'] && Boolean(errors['endDate'])}
                        helperText={touched['endDate'] && errors['endDate']}
                      />
                    </Grid>
                  )}
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
}

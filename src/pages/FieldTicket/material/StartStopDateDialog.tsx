import DateFnsUtils from '@date-io/date-fns';
import { Box, Button, CircularProgress, Dialog, Grid, TextField } from '@material-ui/core';
import { KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Form, Formik } from 'formik';
import moment from 'moment';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, dateFormatForInputControl } from 'src/constants/helpers';

export default function StartStopDate({ onClose, type, loading, handleSubmit, minDate }) {
  const [initialValues, setInitialValues] = useState({ startDate: new Date(), endDate: new Date() });

  useEffect(() => {
    if (minDate) {
      let date = moment(new Date(minDate));
      const currentTime = moment();

      date = date.set('hour', currentTime.hour()).set('minute', currentTime.minute());
      setInitialValues({ startDate: date.toDate(), endDate: date.toDate() });
    }
  }, [minDate]);

  const onSubmit = (values) => {
    handleSubmit(values);
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
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form>
            <CustomDialogHeader title={`Set ${type === 'start' ? 'Start' : type === 'stop' ? 'End' : 'Start/End'} Date`} onClose={onClose} />
            <CustomDialogContent>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Box p={2}>
                  <Grid container spacing={2}>
                    {type !== 'stop' && (
                      <Grid item xs={12} sm={12}>
                        <KeyboardDateTimePicker
                          inputVariant="outlined"
                          variant="inline"
                          fullWidth
                          size="small"
                          margin="none"
                          autoOk
                          format={dateFormatForInputControl + ' HH:mm'}
                          minDate={minDate ? minDate : new Date()}
                          label={`Start Date`}
                          views={['year', 'month', 'date']}
                          value={values.startDate}
                          onChange={(date) => {
                            setFieldValue('startDate', date);
                          }}
                        />
                      </Grid>
                    )}
                    {(type === 'startStop' || type === 'stop') && (
                      <Grid item xs={12} sm={12}>
                        <KeyboardDateTimePicker
                          inputVariant="outlined"
                          variant="inline"
                          fullWidth
                          size="small"
                          margin="none"
                          autoOk
                          format={dateFormatForInputControl + ' HH:mm'}
                          minDate={values.startDate}
                          label={`'End' Date`}
                          views={['year', 'month', 'date']}
                          value={values.endDate}
                          onChange={(date) => {
                            setFieldValue('endDate', date);
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </MuiPickersUtilsProvider>
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

import { Box, Dialog, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, displayDateTime } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDateTimePicker from 'src/components/CustomDateTimePicker';

export default function StartStopDate({ onClose, type, loading, handleSubmit, data = null, minStartDateTime = null, maxEndDateTime = null }) {
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (data) {
      setInitialValues({
        startDate: new Date(data.startDate),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        notes: data.notes || ''
      });
    } else {
      if (minStartDateTime) {
        const date = new Date(minStartDateTime);
        setInitialValues({
          startDate: date,
          ...(type !== 'startStop' && type !== 'stop' ? {} : { endDate: date.setMinutes(date.getMinutes() + 1) }),
          notes: ''
        });
      } else {
        setInitialValues({ startDate: new Date(), ...(type !== 'startStop' && type !== 'stop' ? {} : { endDate: new Date() }), notes: '' });
      }
    }
  }, [data, type]);

  const onSubmit = (values) => {
    handleSubmit(values, data?._id);
  };

  const validate = (values) => {
    const errors = {};
    if (values?.endDate && values?.startDate > values.endDate) {
      errors['endDate'] = `Please enter valid end date`;
    }
    if (minStartDateTime && values?.startDate < minStartDateTime) {
      errors['startDate'] = `Start Date can't be less than ${displayDateTime(minStartDateTime)}`;
    }
    if (maxEndDateTime && values?.endDate > maxEndDateTime) {
      errors['endDate'] = `End Date can't be greater than ${displayDateTime(maxEndDateTime)}`;
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
      <Formik initialValues={initialValues} onSubmit={onSubmit} enableReinitialize={true} validate={validate}>
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <Form>
            <CustomDialogHeader title={`Set ${type === 'start' ? 'Start' : type === 'stop' ? 'End' : 'Start/End'} Date`} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  {type !== 'stop' && (
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <CustomDateTimePicker
                        fullWidth
                        size="small"
                        margin="none"
                        {...(minStartDateTime ? { minDateTime: minStartDateTime } : {})}
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
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <CustomDateTimePicker
                        fullWidth
                        size="small"
                        margin="none"
                        minDateTime={values.startDate}
                        label={`End Date`}
                        value={values.endDate}
                        onChange={(date) => {
                          setFieldValue('endDate', date);
                        }}
                        {...(maxEndDateTime ? { maxDateTime: maxEndDateTime } : {})}
                        error={touched['endDate'] && Boolean(errors['endDate'])}
                        helperText={touched['endDate'] && errors['endDate']}
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: 12 }}>
                    <TextField
                      id="outlined-multiline-static"
                      label="Notes"
                      multiline
                      fullWidth
                      rows={4}
                      value={values.notes}
                      variant="outlined"
                      error={touched['notes'] && Boolean(errors['notes'])}
                      helperText={touched['notes'] && errors['notes']}
                      onChange={(e) => {
                        setFieldValue('notes', e.target.value);
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton onClick={onClose} buttonType="transparent">
                Close
              </ThemeButton>
              <ThemeButton
                disabled={loading}
                isLoading={loading}
                buttonType="theme"
                onClick={(e) => {
                  e.preventDefault();
                  submitForm();
                }}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

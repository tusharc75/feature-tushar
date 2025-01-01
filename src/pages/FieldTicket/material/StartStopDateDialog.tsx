import { Box, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, displayDate, normalizeDate } from 'src/constants/helpers';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
        let date = new Date(minStartDate);
        setInitialValues({ startDate: date, endDate: date });
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
                    <Grid size={{ xs: 12, sm: 12 }}>
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
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <CustomDatePicker
                        fullWidth
                        size="small"
                        margin="none"
                        minDate={values.startDate}
                        label={`End Date`}
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
              <ThemeButton
                onClick={onClose}
                buttonType='transparent'
              >
                Close
              </ThemeButton>
              <ThemeButton
                disabled={loading}
                isLoading={loading}
                buttonType='theme'
                type='submit'
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

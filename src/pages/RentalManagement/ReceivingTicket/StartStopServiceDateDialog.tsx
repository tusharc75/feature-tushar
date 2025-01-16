import { Form, Formik } from 'formik';
import { Dialog, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, displayDate, normalizeDate } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const StartStopServiceDateDialog = ({ data, type, open, onClose, handleSubmit, loading, minStartDate = null, maxEndDate = null }) => {
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (data) {
      setInitialValues({
        startDate: new Date(data.startDate),
        ...(data?.endDate && { endDate: new Date(data.endDate) })
      });
    } else {
      setInitialValues({
        startDate: minStartDate ? new Date(minStartDate) : new Date(),
        ...(type !== 'start' ? { endDate: minStartDate ? new Date(minStartDate) : new Date() } : {})
      });
    }
  }, [data, type]);

  const validate = (values) => {
    const errors = {};
    if (values?.endDate && normalizeDate(values?.startDate) > normalizeDate(values.endDate)) {
      errors['endDate'] = `Please enter valid end date`;
    }
    if (minStartDate && normalizeDate(values?.startDate) < normalizeDate(minStartDate)) {
      errors['startDate'] = `Actual Start Date can't be less than ${displayDate(minStartDate)}`;
    }
    if (maxEndDate && normalizeDate(values?.endDate) > normalizeDate(maxEndDate)) {
      errors['endDate'] = `Actual End Date can't be greater than ${displayDate(maxEndDate)}`;
    }
    return errors;
  };

  return (
    <Dialog
      open={open}
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
          handleSubmit(val);
        }}
        enableReinitialize={true}
        validate={validate}
      >
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <Form>
            <CustomDialogHeader
              title={`Set Actual ${type === 'start' ? 'Start' : type === 'startStop' ? 'Start/End' : 'End'} Date`}
              onClose={onClose}
            />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  {type !== 'stop' && (
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <FormTypes
                        size="small"
                        fullWidth
                        required={true}
                        values={values}
                        errors={errors}
                        touched={touched}
                        type="date"
                        label={`Actual Start Date`}
                        name="startDate"
                        onChange={(date) => {
                          setFieldValue('startDate', date);
                        }}
                        {...(minStartDate ? { minDate: minStartDate } : {})}
                      />
                    </Grid>
                  )}
                  {(type === 'startStop' || type === 'stop') && (
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <FormTypes
                        size="small"
                        fullWidth
                        required={true}
                        values={values}
                        errors={errors}
                        touched={touched}
                        type="date"
                        label={`Actual End Date`}
                        name="endDate"
                        onChange={(date) => {
                          setFieldValue('endDate', date);
                        }}
                        minDate={values.startDate}
                        {...(maxEndDate ? { maxDate: maxEndDate } : {})}
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
                onClick={submitForm}
                disabled={loading}
                buttonType='theme'
                isLoading={loading}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default StartStopServiceDateDialog;

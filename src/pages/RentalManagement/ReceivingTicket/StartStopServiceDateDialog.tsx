import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, displayDate, normalizeDate } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import { useEffect, useState } from 'react';

const StartStopServiceDateDialog = ({ data, type, open, onClose, handleSubmit, loading, minStartDate = null, maxEndDate = null }) => {

  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (type) {
      setInitialValues({
        startDate: minStartDate ? new Date(minStartDate) : new Date(),
        ...(type !== 'start' ? { endDate: minStartDate ? new Date(minStartDate) : new Date() } : {})
      })
    } else {
      setInitialValues({
        startDate: new Date(data.startDate),
        ...(data?.endDate && { endDate: new Date(data.endDate) })
      })
    }
  }, [data, type]);

  const onSubmit = (values) => {
    handleSubmit({
      ...values,
      startDate: new Date(values.startDate)?.toISOString(),
      ...(values.endDate && { endDate: new Date(values.endDate).toISOString() })
    });
  };

  const validate = (values) => {
    const errors = {};
    if (values?.endDate && normalizeDate(values?.startDate) > normalizeDate(values.endDate)) {
      errors['endDate'] = `End Date can't be less than Start Date`;
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
      open={open}
      TransitionComponent={CustomDialogTransition}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth>
      <Formik initialValues={initialValues} onSubmit={(val) => { onSubmit(val) }} enableReinitialize={true} validate={validate}>
        {({ values, errors, touched, setFieldValue }) => (
          <Form >
            <CustomDialogHeader title={`Set Start/End Date`} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  {type !== 'stop' && (
                    <Grid item xs={12} sm={12}>
                      <FormTypes
                        size="small"
                        fullWidth
                        required={true}
                        values={values}
                        errors={errors}
                        touched={touched}
                        type="date"
                        label={`Start Date`}
                        name="startDate"
                        onChange={(date) => {
                          setFieldValue('startDate', date);
                        }}
                        {...(minStartDate ? { minDate: minStartDate } : {})}
                        {...(values.endDate ? { maxDate: values.endDate } : {})}
                      />
                    </Grid>
                  )}
                  {(data?.endDate || type === 'startStop' || type === 'stop') &&
                    (
                      <Grid item xs={12} sm={12}>
                        <FormTypes
                          size="small"
                          fullWidth
                          required={true}
                          values={values}
                          errors={errors}
                          touched={touched}
                          type="date"
                          label={`End Date`}
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

export default StartStopServiceDateDialog;

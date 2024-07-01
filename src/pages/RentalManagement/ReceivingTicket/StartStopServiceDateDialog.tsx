import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import { useEffect, useState } from 'react';
import moment from 'moment';

const StartStopServiceDateDialog = ({ data, type, open, onClose, handleSubmit, loading, minStartDate = null, maxEndDate = null }) => {

  const [minDate, setMinDate] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    const dates = [];
    if (type === 'stop') {
      data?.forEach((d: any) => {
        const log = d?.serviceLog?.find(l => !l.endDate);
        dates.push(new Date(log.startDate));
      })
    } else if (type === 'start') {
      data?.forEach((d: any) => {
        d?.serviceLog?.forEach((l: any) => {
          dates.push(new Date(l.endDate));
        })
      })
    }
    let date;
    if (dates?.length) {
      date = new Date(Math.max(...dates));
      setMinDate(date);
    }
    if (type) {
      setInitialValues({
        type: type,
        date: date ? date : new Date()
      })
    } else {
      setInitialValues({
        startDate: new Date(data.startDate),
        ...(data?.endDate && { endDate: new Date(data.endDate) })
      })
    }

  }, [data, type]);

  const onSubmit = (values) => {
    if (type) handleSubmit({ ...values, date: new Date(values.date)?.toISOString() })
    else handleSubmit({ ...values, startDate: new Date(values.startDate)?.toISOString(), ...(values.endDate && { endDate: new Date(values.endDate).toISOString() }) })
  };

  const validate = (values) => {
    const errors = {};
    if (type) {
      if (minDate && values?.date < minDate) {
        errors['date'] = `${type === 'start' ? 'Start' : 'End'} Date can't be less than ${moment(minDate).format('DD/MM/YYYY')}`;
      }
    } else {
      if (values?.endDate && values?.startDate > values.endDate) {
        errors['endDate'] = `End Date can't be less than Start Date`;
      }
      if (minStartDate && values?.startDate < minStartDate) {
        errors['startDate'] = `Start Date can't be less than ${moment(minStartDate).format('DD/MM/YYYY')}`;
      }
      if (maxEndDate && values?.endDate > maxEndDate) {
        errors['endDate'] = `End Date can't be greater than ${moment(maxEndDate).format('DD/MM/YYYY')}`;
      }
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
            <CustomDialogHeader title={`Set ${!type ? 'Start/End' : type === 'start' ? 'Start' : 'End'} Date`} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  {
                    type ? (
                      <Grid item xs={12} sm={12}>
                        <FormTypes
                          size="small"
                          fullWidth
                          required={true}
                          values={values}
                          errors={errors}
                          touched={touched}
                          type="date"
                          label={`${type === 'start' ? 'Start' : 'End'} Date`}
                          name="date"
                          onChange={(date) => {
                            setFieldValue('date', date);
                          }}
                          {...(minDate ? { minDate: minDate } : {})}
                        />
                      </Grid>
                    ) : (
                      <>
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
                        {data?.endDate &&
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
                      </>
                    )
                  }
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

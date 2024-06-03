import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import { useEffect, useState } from 'react';

const StartStopServiceDateDialog = ({ data, type, open, onClose, handleSubmit, loading }) => {

  const [minDate, setMinDate] = useState(null);

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
    if(dates?.length) setMinDate(new Date(Math.max(...dates)));
  }, [data, type]);

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
      <Formik initialValues={{type: type, date: minDate? minDate : new Date()}} onSubmit={(values) => { handleSubmit({...values, date: new Date(values.date)?.toISOString()})}}>
        {({ values, errors, touched, setFieldValue }) => (
          <Form >
            <CustomDialogHeader title={`Set ${type === 'start' ? 'Start' : 'End'} Date`} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
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

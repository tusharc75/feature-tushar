import { useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';

const ChangeActualDateDialog = ({ data, open, onClose, handleSubmit, loading }) => {

  const [initialValues, setInitialValues] = useState({
    actualStartDate: '',
    actualEndDate: ''
  });

  useEffect(() => {
    if (!data) return;
    setInitialValues({
      actualStartDate: data?.startDate,
      actualEndDate: data?.endDate || new Date(),
    });
  }, []);

  return (
    <Dialog
      open={open}
      TransitionComponent={CustomDialogTransition}
      onClose={onClose}
      maxWidth="sm"
      fullWidth>
      <Formik initialValues={initialValues} onSubmit={(values) => {}}>
        {({ values, errors, touched, setFieldValue }) => (
          <Form>
            <CustomDialogHeader title={data?.assetNumber || ''} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12}>
                    <FormTypes
                      size="small"
                      fullWidth
                      values={values}
                      maxDate={values.actualEndDate}
                      error={errors}
                      touched={touched}
                      type="date"
                      label="Actual Start Date"
                      name="actualStartDate"
                      onChange={(date) => {
                        setFieldValue('actualStartDate', date);
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <FormTypes
                      size="small"
                      fullWidth
                      minDate={values.actualStartDate}
                      values={values}
                      error={errors}
                      touched={touched}
                      type="date"
                      label="Actual End Date"
                      name="actualEndDate"
                      onChange={(date) => {
                        setFieldValue('actualEndDate', date);
                      }}
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
                onClick={() => {
                  const newValues = {
                    actualStartDate: new Date(values.actualStartDate).toISOString(),
                    actualEndDate: new Date(values.actualEndDate).toISOString()
                  }
                  handleSubmit(newValues);
                }}
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

export default ChangeActualDateDialog;

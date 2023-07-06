import { useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import moment from 'moment';

const DateDialog = ({ title, onClose, handleSubmit, loading }) => {

  function validate(values) {
    const errors = {};

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
          handleSubmit(moment(values.date).format('MM/DD/YYYY'));
        }}>
        {({ values, errors, touched, setFieldValue }) => (
          <Form >
            <CustomDialogHeader title={title} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  <FormTypes
                    size="small"
                    fullWidth
                    values={values}
                    maxDate={new Date()}
                    errors={errors}
                    touched={touched}
                    type="date"
                    label="Date"
                    name="date"
                    onChange={(date) => {
                      setFieldValue('date', date);
                    }}
                  />
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

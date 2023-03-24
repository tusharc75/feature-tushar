import { useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import moment from 'moment';

const ChangeActualDateDialog = ({ data, open, onClose, handleSubmit, loading }) => {


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
      <Formik
        initialValues={data?.isAllowedStartDate && data?.isAllowedEndDate ? {
          manualStartDate: new Date(data?.manualStartDate),
          manualEndDate: new Date(data?.manualEndDate),
        } :
          data?.isAllowedStartDate ? { manualStartDate: new Date(data?.manualStartDate) } :
            data?.isAllowedEndDate ? { manualEndDate: new Date(data?.manualEndDate) } : {}}
        onSubmit={(values) => { }}>
        {({ values, errors, touched, setFieldValue }) => (
          <Form >
            <CustomDialogHeader title={data?.assetNumber || ''} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  {data?.isAllowedStartDate &&
                    <Grid item xs={12} sm={12}>
                      <FormTypes
                        size="small"
                        fullWidth
                        values={values}
                        maxDate={values.manualEndDate || moment().add(5, 'years')}
                        errors={errors}
                        touched={touched}
                        type="date"
                        label="Start Date"
                        name="manualStartDate"
                        onChange={(date) => {
                          setFieldValue('manualStartDate', date);
                        }}
                      />
                    </Grid>}
                  {data?.isAllowedEndDate &&
                    <Grid item xs={12} sm={12}>
                      <FormTypes
                        size="small"
                        fullWidth
                        minDate={data?.minEndDate || values.manualStartDate}
                        values={values}
                        errors={errors}
                        touched={touched}
                        type="date"
                        label="End Date"
                        name="manualEndDate"
                        onChange={(date) => {
                          setFieldValue('manualEndDate', date);
                        }}
                      />
                    </Grid>
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
                onClick={() => {
                  const newValues: any = {};
                  if (data.isAllowedStartDate) {
                    newValues.manualStartDate = new Date(values.manualStartDate)?.toISOString()
                  }
                  if (data.isAllowedEndDate) {
                    newValues.manualEndDate = new Date(values.manualEndDate)?.toISOString()
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

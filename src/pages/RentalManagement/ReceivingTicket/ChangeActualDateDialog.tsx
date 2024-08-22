import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import moment from 'moment';

const ChangeActualDateDialog = ({ data, onClose, handleSubmit, loading, bulkUpdate }) => {

  function validate(values) {
    const errors = {};
    if (data?.isAllowedStartDate && data?.isAllowedEndDate) {
      let manualStartDate = moment(values?.manualStartDate);
      let manualEndDate = moment(values?.manualEndDate);
      if (manualEndDate.diff(manualStartDate, 'days') < 0) {
        errors['manualEndDate'] = 'Please enter valid end date';
      }
    }
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
        initialValues={data?.isAllowedStartDate && data?.isAllowedEndDate ? {
          manualStartDate: new Date(data?.manualStartDate),
          manualEndDate: new Date(data?.manualEndDate),
        } :
          data?.isAllowedStartDate ? { manualStartDate: new Date(data?.manualStartDate) } :
            data?.isAllowedEndDate ? { manualEndDate: new Date(data?.manualEndDate) } : {}}
        validate={validate}
        onSubmit={(values) => {
          const newValues: any = {};
          if (data.isAllowedStartDate) {
            newValues.manualStartDate = new Date(values.manualStartDate)?.toISOString()
          }
          if (data.isAllowedEndDate) {
            newValues.manualEndDate = new Date(values.manualEndDate)?.toISOString()
          }
          handleSubmit(newValues);
        }}>
        {({ values, errors, touched, setFieldValue }) => (
          <Form >
            <CustomDialogHeader title={bulkUpdate ? 'Update Start Date/End Date' : data?.assetNumber ? data?.assetNumber : ''} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  {data?.isAllowedStartDate &&
                    <Grid item xs={12} sm={12}>
                      <FormTypes
                        size="small"
                        fullWidth
                        values={values}
                        errors={errors}
                        touched={touched}
                        type="date"
                        label="Start Date"
                        name="manualStartDate"
                        onChange={(date) => {
                          setFieldValue('manualStartDate', date);
                        }}
                        {...(values.manualEndDate ? { maxDate: values.manualEndDate } : {})}
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

export default ChangeActualDateDialog;

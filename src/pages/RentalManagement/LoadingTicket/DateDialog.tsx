import { useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { Button, CircularProgress, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import FormTypes from 'src/components/Helpers/FormTypes';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import { object, date } from 'yup';

const DateDialog = ({ title, onClose, handleSubmit, loading, assets = [] }) => {

  const [minDate, setMinDate] = useState(new Date())

  const DateTemplateSchema = object().shape({
    date: date().required('Date is required').min(minDate, 'Date must be in the future').max(new Date(), 'Date must be till today or before today'),
  });

  function validate(values) {
    const errors = {};

    return errors;
  }

  const findLastDate = async () => {
    const { data: { data } } = await axiosInstance().put(`/rental-management/assets-last-date`, { assets })
    setMinDate(new Date(data?.date))
  }

  useEffect(() => {
    findLastDate()
  }, [assets])

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
        validationSchema={DateTemplateSchema}
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
                    minDate={minDate}
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

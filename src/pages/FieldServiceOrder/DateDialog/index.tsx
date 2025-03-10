import { Box, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDatePicker from 'src/components/CustomDatePicker';

export default function DispatchReceiveDateDialog({ onClose, title, loading, handleSubmit, minDate = null }) {
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (minDate) {
      let date = new Date(minDate);
      setInitialValues({ date: date });
    } else {
      setInitialValues({ date: new Date() });
    }
  }, []);

  const onSubmit = (values) => {
    handleSubmit(values?.date);
  };

  const validate = (values) => {
    const errors = {};
    if (values?.minDate && values?.date > values.minDate) {
      errors['endDate'] = `Please enter valid date`;
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
        onSubmit={onSubmit}
        enableReinitialize={true}
        validate={validate}
      >
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <Form>
            <CustomDialogHeader title={title} onClose={onClose} />
            <CustomDialogContent>
              <Box p={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 12 }}>
                    <CustomDatePicker
                      fullWidth
                      required
                      size="small"
                      margin="none"
                      {...(minDate ? { minDate: minDate } : {})}
                      label={`Date`}
                      value={values.date}
                      onChange={(date) => {
                        setFieldValue('date', date);
                      }}
                      error={touched['date'] && Boolean(errors['date'])}
                      helperText={touched['date'] && errors['date']}
                    />
                  </Grid>
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
                onClick={(e) => {
                  e.preventDefault();
                  submitForm();
                }}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog >
  );
}

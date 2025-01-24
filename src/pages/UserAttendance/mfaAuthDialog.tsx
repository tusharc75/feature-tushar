import { Dialog, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useContext, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const schema = object().shape({
  employeeNumber: string().required('Please enter employee number'),
  otp: string().required('Please enter otp')
});

function MfaAuthDialog({ onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingOutModal, setGettingOutModal] = useState({ open: false, text: '' });
  const toastConfig = useContext(CustomToastContext);

  const handleSave = (values) => {
    setIsSubmitting(true);
    axiosInstance()
      .post('/user-attendance/mfa-attendance', values)
      .then(({ data: { data } }) => {
        if (data && data.gettingOut) {
          setGettingOutModal({ open: true, text: 'You are getting out!' });
        } else {
          setGettingOutModal({ open: true, text: 'You are getting in!' });
        }
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      open={true}
    >
      <CustomDialogHeader title="MFA Verification" onClose={onClose} />
      <Formik initialValues={{ employeeNumber: '', otp: '' }} validationSchema={schema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <div>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Employee Number"
                      name="employeeNumber"
                      variant="outlined"
                      size="small"
                      fullWidth
                      required
                      onChange={(e) => {
                        setFieldValue('employeeNumber', e.target.value);
                      }}
                      error={Boolean(touched.employeeNumber && errors.employeeNumber)}
                      helperText={touched.employeeNumber && errors.employeeNumber}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="OTP"
                      name="otp"
                      variant="outlined"
                      size="small"
                      required
                      fullWidth
                      onChange={(e) => {
                        setFieldValue('otp', e.target.value);
                      }}
                      error={Boolean(touched.otp && errors.otp)}
                      helperText={touched.otp && errors.otp}
                    />
                  </Grid>
                </Grid>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>


              <ThemeButton
                buttonType='transparent'
                onClick={onClose}
              >
                Cancel
              </ThemeButton>
              <ThemeButton
                buttonType='theme'
                disabled={isSubmitting}
                onClick={submitForm}
                isLoading={isSubmitting}
              >
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </div>
        )}
      </Formik>
      {gettingOutModal.open && (
        <ConfirmationDialog
          open={gettingOutModal.open}
          message={gettingOutModal.text}
          onClose={() => {
            setGettingOutModal({ open: false, text: '' });
            onClose();
          }}
          onOk={() => {
            setGettingOutModal({ open: false, text: '' });
            onClose();
          }}
        />
      )}
    </Dialog>
  );
}

export default MfaAuthDialog;

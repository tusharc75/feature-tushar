import { useContext, useState } from 'react';
import { Box, CssBaseline, Link as MuiLink, TextField, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { object, string } from 'yup';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { BsArrowLeft } from 'react-icons/bs';

import styles from './index.module.scss';
import { ForgetPasswordImage, Logo } from 'src/assets/authenticationAssets';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const emailValidationSchema = object().shape({
  email: string().email().required()
});

const ForgetPassword = () => {
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`/user/forget-password`, {
        email: values.email
      })
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          message: data.message,
          type: 'success',
          open: true
        });
      })
      .catch((err) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      <CssBaseline />
      <div className={styles.main}>
        <div className={styles.bg}>
          <div className={styles.contentContainer}>
            <div className={styles.left}>
              <div className={styles.logo}>
                <Logo />
              </div>
              <Formik
                initialValues={{
                  email: ''
                }}
                validationSchema={emailValidationSchema}
                onSubmit={handleSubmit}
              >
                {({ submitForm, values, touched, errors, setFieldValue }) => (
                  <Form>
                    <div className={styles.fields}>
                      <div className={styles.input}>
                        <TextField
                          name="email"
                          type="email"
                          size="medium"
                          label="Email"
                          variant="outlined"
                          value={values['email']}
                          error={touched['email'] && Boolean(errors['email'])}
                          helperText={touched['email'] && errors['email']}
                          fullWidth
                          onChange={(e) => {
                            setFieldValue('email', e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    <ThemeButton
                      disabled={isSubmitting}
                      onClick={submitForm}
                      isLoading={isSubmitting}
                      buttonType='theme'
                    >
                      Submit
                    </ThemeButton>

                    <Box className={styles.formBottomTextleft}>
                      <MuiLink component={Link} to="/login">
                        <BsArrowLeft />
                        Go To Login
                      </MuiLink>
                    </Box>
                  </Form>
                )}
              </Formik>
            </div>
            <div className={styles.right} style={{ '--right-padding': '71px 85px 83px 59px' } as React.CSSProperties}>
              <div className={styles.illustration}>
                <ForgetPasswordImage />
              </div>
              <Typography component="h2">Forgot Your Password ?</Typography>
              <Typography component="p">Forgot your password? Don’t worry, we are here to help you</Typography>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgetPassword;

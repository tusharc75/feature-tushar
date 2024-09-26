import { Box, Button, CircularProgress, CssBaseline, Link as MuiLink, TextField, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import queryString from 'query-string';
import React, { useContext, useState } from 'react';
import { Redirect, useHistory, Link } from 'react-router-dom';
import { Logo } from 'src/assets/authenticationAssets';
import styles from './index.module.scss';

import demoImg from '../../assets/clip-hardworking-man.png';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { BsArrowLeft } from 'react-icons/bs';

const PasswordSetup = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { email, token } = queryString.parse(window.location.search);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    axiosInstance(null, { Authorization: `Bearer ${token}` })
      .post(`/user/create-password`, {
        password: values.password
      })
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        history.push('/login');
      })
      .catch((err) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const validateForm = (values) => {
    const errors: any = {};
    if (!values.password) {
      errors.password = 'Required field';
    } else if (!values.confirmPassword) {
      errors.confirmPassword = 'Required field';
    } else if (!/^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/.test(values.password)) {
      errors.password = 'Minimum eight characters, at least one uppercase, one lowercase, one number and one special character';
    } else if (!/^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/.test(values.confirmPassword)) {
      errors.confirmPassword = 'Minimum eight characters, at least one uppercase, one lowercase, one number and one special character';
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Password and confirm Password does not match';
    }
    return errors;
  };

  return !email && !token ? (
    <Redirect to="/login" />
  ) : (
    <React.Fragment>
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
                  email,
                  password: '',
                  confirmPassword: ''
                }}
                validate={validateForm}
                onSubmit={handleSubmit}
              >
                {({ submitForm, values, touched, errors, setFieldValue }) => (
                  <Form>
                    <div className={styles.fields}>
                      <div className={styles.input}>
                        <TextField
                          name="email"
                          type="email"
                          label="Email"
                          fullWidth
                          // size="small"
                          disabled
                          variant="outlined"
                          required
                          value={values['email']}
                          error={touched['email'] && Boolean(errors['email'])}
                          helperText={touched['email'] && errors['email']}
                          onChange={(e) => {
                            setFieldValue('email', e.target.value);
                          }}
                        />
                      </div>
                      <div className={styles.input}>
                        <TextField
                          type="password"
                          label="New Password"
                          name="password"
                          // size="small"
                          fullWidth
                          variant="outlined"
                          required
                          value={values['password']}
                          error={touched['password'] && Boolean(errors['password'])}
                          helperText={touched['password'] && errors['password']}
                          onChange={(e) => {
                            setFieldValue('password', e.target.value);
                          }}
                        />
                      </div>
                      <div className={styles.input}>
                        <TextField
                          type="password"
                          label="Confirm Password"
                          name="confirmPassword"
                          variant="outlined"
                          // size="small"
                          fullWidth
                          required
                          value={values['confirmPassword']}
                          error={touched['confirmPassword'] && Boolean(errors['confirmPassword'])}
                          helperText={touched['confirmPassword'] && errors['confirmPassword']}
                          onChange={(e) => {
                            setFieldValue('confirmPassword', e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      fullWidth
                      className={styles.submitButton}
                      disabled={isSubmitting}
                      onClick={submitForm}
                      startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
                    >
                      Submit
                    </Button>
                  </Form>
                )}
              </Formik>
              <Box className={styles.formBottomTextleft}>
                <MuiLink component={Link} to="/login">
                  <BsArrowLeft />
                  Go To Login
                </MuiLink>
              </Box>
            </div>
            <div className={styles.right} style={{ '--right-padding': '10px 44px 86px 14px' } as React.CSSProperties}>
              <div className={styles.illustration}>
                <img src={demoImg} alt="illustration" style={{ width: '100%' }} />
              </div>
              <Typography component="h2">Create A New Password</Typography>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default PasswordSetup;

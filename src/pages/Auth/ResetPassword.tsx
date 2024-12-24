import React, { useState, useContext, useEffect } from 'react';
import { CssBaseline, Button, Box, Link as MuiLink, CircularProgress, TextField, Typography } from '@mui/material';
import { Formik, Form } from 'formik';
import queryString from 'query-string';
import { Redirect, Link } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { SET_USER, USER_LOADING } from '../../StateProvider/actionTypes';
import { useData } from '../../StateProvider/Provider';

import { BsArrowLeft } from 'react-icons/bs';
import styles from './index.module.scss';
import { CreatePasswordImage, Logo } from 'src/assets/authenticationAssets';

const ResetPassword = () => {
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(false);
  const { email, token } = queryString.parse(window.location.search);
  const { dispatch }: any = useData();

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    setTokenChecking(true);
    axiosInstance(null, { Authorization: `Bearer ${token}` })
      .get(`/user/check-token`)
      .then(({ data }) => {
        data.data
          ? setIsTokenValid(data.data)
          : toastConfig.setToastConfig({
              message: 'Token is invalid',
              type: 'error',
              open: true
            });
      })
      .catch((error) => {
        console.error(error);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    axiosInstance(null, { Authorization: `Bearer ${token}` })
      .post(`/user/reset-password`, {
        password: values.password
      })
      .then(({ data }) => {
        setIsSubmitting(false);
        setIsSubmitting(false);
        localStorage.setItem('token', data.data.token);
        dispatch({ type: USER_LOADING, payload: true });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        axiosInstance()
          .get(`/user/me`)
          .then(({ data }) => {
            dispatch({ type: SET_USER, payload: data.data });
            dispatch({ type: USER_LOADING, payload: false });
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
          })
          .catch((error) => {
            localStorage.setItem('token', '');
            dispatch({ type: USER_LOADING, payload: false });
            toastConfig.setToastConfig(error);
          });
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
                          disabled
                          variant="outlined"
                          required
                          value={values['email']}
                          fullWidth
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
                          fullWidth
                          disabled={!isTokenValid || !tokenChecking}
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
                          disabled={!isTokenValid || !tokenChecking}
                          variant="outlined"
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
                      className={styles.submitButton}
                      fullWidth
                      disabled={isSubmitting || !isTokenValid || !tokenChecking}
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
            <div className={styles.right} style={{ '--right-padding': '70px 44px 86px 44px' } as React.CSSProperties}>
              <div className={styles.illustration}>
                <CreatePasswordImage />
              </div>
              <Typography component="h2">Create New Password</Typography>
              <Typography component="p">Easily create new password in just a few clicks without any hassle.</Typography>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ResetPassword;

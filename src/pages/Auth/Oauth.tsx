import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CssBaseline, Button, Box, TextField, CircularProgress, Link as MuiLink } from '@mui/material';
import { Formik, Form } from 'formik';
import axiosInstance from './../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Logo } from 'src/assets/authenticationAssets';
import AuthSlider from './AuthSlider';

import styles from './index.module.scss';
export const userManual = {
  description: 'View our user manual in just a click.',
  link: 'https://docs.equip-t.com/auth/login'
};

const Oauth = () => {
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const data = {
      email: values.email,
      password: values.password
    };
    axiosInstance()
      .post('/user/auth', data)
      .then(async ({ data: response }) => {
        setSubmitting(false);
        const { data } = response;
        window.location.href = `${userManual.link}`;
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const validateForm = (values) => {
    const errors: any = {};
    if (!values.email) {
      errors.email = 'Email is required';
    }
    if (!values.password) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  return (
    <>
      <CssBaseline />
      <div className={styles.main} style={{ '--custom-grid-cols': '1fr 1fr' } as React.CSSProperties}>
        <div className={styles.bg}>
          <div className={styles.contentContainer}>
            <div className={styles.left}>
              <div className={styles.logo}>
                <Logo />
              </div>
              <Formik
                initialValues={{
                  email: '',
                  password: ''
                }}
                validate={validateForm}
                onSubmit={handleSubmit}
              >
                {({ submitForm, values, errors, touched, setFieldValue }) => (
                  <Form>
                    <div className={styles.fields}>
                      <div className={styles.input}>
                        <TextField
                          data-testid="email"
                          variant="outlined"
                          type="email"
                          size="medium"
                          label="Email"
                          name="email"
                          value={values['email']}
                          error={touched['email'] && Boolean(errors['email'])}
                          helperText={touched['email'] && errors['email']}
                          fullWidth
                          onChange={(e) => setFieldValue('email', e.target.value)}
                        />
                      </div>
                      <div className={styles.input}>
                        <TextField
                          data-testid="password"
                          variant="outlined"
                          type={showPassword ? 'text' : 'password'}
                          size="medium"
                          label="Password"
                          name="password"
                          value={values['password']}
                          error={touched['password'] && Boolean(errors['password'])}
                          helperText={touched['password'] && errors['password']}
                          onChange={(e) => setFieldValue('password', e.target.value)}
                          fullWidth
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton className="p-0" onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </div>
                    </div>
                    <Box className={styles.formBottomText}>
                      <MuiLink component={Link} to="/forget-password">
                        Forgot Password?
                      </MuiLink>
                    </Box>

                    <Box>
                      <Button
                        disabled={isSubmitting}
                        fullWidth
                        variant="contained"
                        color="primary"
                        type="submit"
                        className={styles.submitButton}
                        onClick={submitForm}
                        startIcon={isSubmitting && <CircularProgress color="inherit" size={20} />}
                      >
                        Sign In
                      </Button>
                    </Box>
                  </Form>
                )}
              </Formik>
            </div>
            <div className={styles.rightSlider}>
              <AuthSlider style={{ minHeight: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Oauth;

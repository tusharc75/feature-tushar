import React, { useState, useContext, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { CssBaseline, Button, Box, TextField, CircularProgress, Link as MuiLink, Typography } from '@material-ui/core';
import { Formik, Form } from 'formik';
import { useData } from '../../StateProvider/Provider';
import { SET_USER, SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import axiosInstance from './../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomNotificationCountContext } from '../../StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomChatNotificationCountContext } from '../../StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useAccount, useMsal } from '@azure/msal-react';
import { camelCase, isEmpty } from 'lodash';
import getAzureAcessToken from '../../components/Azure/getAzureAccessToken';
import { AzureLogin } from '../../components/Azure/Azure';
import { SiMicrosoftoffice } from 'react-icons/si';
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';
import { entity } from '../../constants/helpers';
import routes from 'src/components/Helpers/Routes';
import { Logo, LoginImage } from 'src/assets/authenticationAssets';
import AuthSlider from './AuthSlider';

import styles from './index.module.scss';

const Login = () => {
  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);

  const toastConfig = useContext(CustomToastContext);
  const { dispatch }: any = useData();
  const [isSubmitting, setSubmitting] = useState(false);
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [counter, setCounter] = useState(0);
  const [invalidAzureLogin, setInvalidAzureLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();

  const { entityApi } = entity;

  useEffect(() => {
    if (!isEmpty(account)) {
      (async () => {
        try {
          const graphToken = await getAzureAcessToken(instance);
          const res = await axiosInstance().post('/user/login/azure', {
            'graph-token': graphToken
          });
          const { data } = res.data;
          localStorage.setItem('token', data.token);
          const gridRequest = await axiosInstance().get(`user/meta-grid/${data.user?._id}`);

          let tempMetaData = JSON.stringify(gridRequest.data.data?.gridMetaData);
          localStorage.setItem('gridMetaData', tempMetaData);
          dispatch({ type: SET_GRID_METADATA, payload: gridRequest.data.data?.gridMetaData });

          dispatch({ type: SET_USER, payload: data });
          if (data?.role?.selectedEntity?._id) {
            dispatch({
              type: SET_SELECTED_ENTITY,
              payload: data.role.selectedEntity._id
            });
          }
        } catch (e) {
          setCounter(18);
          setInvalidAzureLogin(true);
          toastConfig.setToastConfig(e);
        }
      })();
    }
  }, [account]);

  useEffect(() => {
    if (invalidAzureLogin) {
      if (invalidAzureLogin && counter) {
        setTimeout(() => setCounter(counter - 1), 1000);
      } else {
        instance.logout();
        setInvalidAzureLogin(false);
      }
    }
  }, [invalidAzureLogin, counter]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const data = {
      email: values.email,
      password: values.password
    };
    axiosInstance()
      .post('/user/login', data)
      .then(async ({ data: response }) => {
        setSubmitting(false);
        const { data } = response;
        localStorage.setItem('token', data.token);

        dispatch({ type: SET_USER, payload: data });
        if (data?.role?.selectedEntity?._id) {
          dispatch({
            type: SET_SELECTED_ENTITY,
            payload: data.role.selectedEntity._id
          });
        }

        if (data?.user?.defaultResource) {
          if (routes[camelCase(data?.user?.defaultResource)]?.path) {
            history.push({ pathname: routes[camelCase(data?.user?.defaultResource)]?.path });
          }
        }

        axiosInstance()
          .get(`/user/notification/unseen`)
          .then(({ data: { count } }) => {
            notification.setCount(count);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });

        axiosInstance()
          .get(`/user/user-notification/unseen`)
          .then(({ data: { count } }) => {
            chatNotification.setCount(count);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });

        axiosInstance()
          .get(`user/meta-grid/${data?.user?._id}`)
          .then(({ data: { data } }) => {
            let tempMetaData = JSON.stringify(data?.gridMetaData);
            localStorage.setItem('gridMetaData', tempMetaData);
            dispatch({ type: SET_GRID_METADATA, payload: data?.gridMetaData });
          });
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
                  email: ['local'].includes(import.meta.env.VITE_APP_ENV) ? 'gagan@test.com' : '',
                  password: ['local'].includes(import.meta.env.VITE_APP_ENV) ? 'soR$Tw83n92ghs2' : ''
                }}
                validate={validateForm}
                onSubmit={handleSubmit}
              >
                {({ submitForm, values, errors, touched, setFieldValue }) => (
                  <Form>
                    <UnauthenticatedTemplate>
                      <AzureLogin />
                    </UnauthenticatedTemplate>
                    <Box className={styles.or}>
                      <Typography>or sign in with</Typography>
                    </Box>
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

                      <AuthenticatedTemplate>
                        {invalidAzureLogin ? (
                          <span>Not authorized loging out in {counter}</span>
                        ) : (
                          <Button
                            className="logo-bg-color"
                            variant="contained"
                            fullWidth
                            startIcon={<SiMicrosoftoffice />}
                            disabled={isSubmitting}
                            onClick={() => instance.logoutPopup()}
                          >
                            Office 365 Log Out
                          </Button>
                        )}
                      </AuthenticatedTemplate>
                    </Box>
                  </Form>
                )}
              </Formik>
            </div>
            <div className={styles.rightSlider}>
              <AuthSlider />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

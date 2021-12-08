import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Button, Box, TextField, CircularProgress, Link as MuiLink } from '@material-ui/core';
import { Formik, Form } from 'formik';
import { useData } from '../../StateProvider/Provider';
import { SET_USER, SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import axiosInstance from './../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomNotificationCountContext } from '../../StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomChatNotificationCountContext } from '../../StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';

import { AuthenticatedTemplate, UnauthenticatedTemplate, useAccount, useMsal } from '@azure/msal-react';
import { isEmpty } from 'lodash';
import getAzureAcessToken from '../../components/Azure/getAzureAccessToken';
import { AzureLogin } from '../../components/Azure/Azure';
import { SiMicrosoftoffice } from 'react-icons/si';
import { SVG } from '../../assets';
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';
import { entity } from '../../constants/helpers';
import axios from 'axios';

const useStyles = makeStyles(() => ({
  container: {
    height: '90vh',
    width: '90vw',
    overflow: 'hidden'
  },
  grid: {
    height: '100%'
  },
  formSide: {
    height: '100%',
    width: '100%',
    padding: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: '150px',
    height: '100%'
  }
}));

const Login = () => {
  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);

  const toastConfig = useContext(CustomToastContext);
  const { dispatch }: any = useData();
  const classes = useStyles();
  const [isSubmitting, setSubmitting] = useState(false);
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [counter, setCounter] = useState(0);
  const [invalidAzureLogin, setInvalidAzureLogin] = useState(false);
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

          const entityRequest = await axiosInstance().get(`${entityApi}`);

          let mappedEntities = [];
          if (entityRequest.data.data && entityRequest.data.data.length) {
            entityRequest.data.data.forEach((o) => {
              mappedEntities = [...mappedEntities, { optionLabel: o?.entityName, optionValue: o?._id }];
            });
          }
          localStorage.setItem('mappedEntities', JSON.stringify(mappedEntities));

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

        axiosInstance()
          .get(`${entityApi}`)
          .then(({ data: { data } }) => {
            let mappedEntities = [];
            if (data && data.length) {
              data.forEach((o) => {
                mappedEntities = [...mappedEntities, { optionLabel: o?.entityName, optionValue: o?._id }];
              });
            }
            localStorage.setItem('mappedEntities', JSON.stringify(mappedEntities));
          });

        dispatch({ type: SET_USER, payload: data });
        if (data?.role?.selectedEntity?._id) {
          dispatch({
            type: SET_SELECTED_ENTITY,
            payload: data.role.selectedEntity._id
          });
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
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
      errors.email = 'Invalid email address';
    }

    if (!values.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  return (
    <div className="login-bg">
      <Paper elevation={10} className={classes.container}>
        <Grid container className={classes.grid}>
          <Grid item sm={6} md={5} className="loginSidebar">
            <Box display={{ xs: 'none', sm: 'block', md: 'block' }}>
              <img className="imgLogin" src={SVG('imgComputer')}></img>
            </Box>
          </Grid>
          <Grid item sm={6} md={7} xs={12} className={classes.formSide}>
            <Box textAlign="center">
              <img className={classes.logo} src={SVG('LogoPng')} alt="equip logo" title="eQuipt Logo" />
              <Box my={4} />
              <Formik
                initialValues={{
                  email: ['local'].includes(process.env.REACT_APP_ENV) ? 'gagan@test.com' : '',
                  password: ['local'].includes(process.env.REACT_APP_ENV) ? 'soR$Tw83n92ghs2' : ''
                }}
                validate={validateForm}
                onSubmit={handleSubmit}
              >
                {({ submitForm, values, errors, touched, setFieldValue }) => (
                  <Form>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Box mb={3}>
                        <TextField
                          data-testid="email"
                          style={{ width: 260 }}
                          variant="outlined"
                          type="email"
                          size="small"
                          label="Email"
                          name="email"
                          value={values['email']}
                          error={touched['email'] && Boolean(errors['email'])}
                          helperText={touched['email'] && errors['email']}
                          onChange={(e) => setFieldValue('email', e.target.value)}
                        />
                      </Box>
                      <Box>
                        <TextField
                          data-testid="password"
                          style={{ width: 260 }}
                          variant="outlined"
                          type="password"
                          size="small"
                          label="Password"
                          name="password"
                          value={values['password']}
                          error={touched['password'] && Boolean(errors['password'])}
                          helperText={touched['password'] && errors['password']}
                          onChange={(e) => setFieldValue('password', e.target.value)}
                        />
                      </Box>
                      <Box width={260} mt={1}>
                        <Box textAlign="right">
                          <MuiLink component={Link} to="/forget-password">
                            Forgot Password?
                          </MuiLink>
                        </Box>
                      </Box>
                      <Box width={260} className="mt-2">
                        <Button disabled={isSubmitting} fullWidth variant="contained" color="secondary" type="submit" onClick={submitForm}>
                          {isSubmitting ? <CircularProgress size={22} /> : 'Login'}
                        </Button>

                        <Box className="mt-2">
                          <AuthenticatedTemplate>
                            {invalidAzureLogin ? (
                              <span>Not authorized loging out in {counter}</span>
                            ) : (
                              <Button
                                variant="contained"
                                fullWidth
                                color="secondary"
                                startIcon={<SiMicrosoftoffice />}
                                disabled={isSubmitting}
                                onClick={() => instance.logoutPopup()}
                              >
                                Office 365 Log Out
                              </Button>
                            )}
                          </AuthenticatedTemplate>
                          <UnauthenticatedTemplate>
                            <AzureLogin></AzureLogin>
                          </UnauthenticatedTemplate>
                        </Box>
                      </Box>
                    </Box>
                  </Form>
                )}
              </Formik>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default Login;

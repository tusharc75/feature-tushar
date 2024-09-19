import React, { useState, useContext, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { CssBaseline, Button, Box, TextField, CircularProgress, Link as MuiLink, Typography } from '@material-ui/core';
import { Formik, Form } from 'formik';
import axiosInstance from './../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useAccount, useMsal } from '@azure/msal-react';
import { isEmpty } from 'lodash';
import getAzureAcessToken from '../../components/Azure/getAzureAccessToken';
import { AzureLogin } from '../../components/Azure/Azure';
import { SiMicrosoftoffice } from 'react-icons/si';
import { Logo } from 'src/assets/authenticationAssets';
import AuthSlider from './AuthSlider';
import FacialLogin from 'src/components/FacialLogin';

export type BrandData = {
  companyName: string;
  companyLogo: string;
  subDomain: string;
};

import styles from './index.module.scss';

const MAIN_SUB_DOMAIN = ['portal', 'master.portal', 'uat.portal', 'staging.portal'];

const Login = () => {
  const toastConfig = useContext(CustomToastContext);

  const [isSubmitting, setSubmitting] = useState(false);
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [counter, setCounter] = useState(0);
  const [invalidAzureLogin, setInvalidAzureLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [brandData, setBrandData] = useState<BrandData>(null);
  const [brandNotFound, setBrandNotFound] = useState(false);

  const history = useHistory();

  function getSubdomain(url) {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const parts = hostname.split('.');

    // Handle localhost with subdomains (e.g., http://developer.localhost)
    if (hostname === 'localhost' || parts.includes('localhost')) {
      if (parts.length > 1) {
        return parts.slice(0, parts.indexOf('localhost')).join('.');
      }
      return null;
    }

    if (parts.length > 2) {
      return parts.slice(0, -2).join('.');
    }
    return null;
  }

  useEffect(() => {
    const subdomain = getSubdomain(window.location);
    if (subdomain && !MAIN_SUB_DOMAIN.includes(subdomain?.toLowerCase())) {
      axiosInstance()
        .get(`/brand/check-sub-domain/${subdomain?.toLowerCase()}`)
        .then(({ data: { data } }) => {
          setBrandData(data);
        })
        .catch((error) => {
          setBrandNotFound(true);
        });
    }
  }, []);

  useEffect(() => {
    if (!isEmpty(account)) {
      (async () => {
        try {
          const graphToken = await getAzureAcessToken(instance);
          const res = await axiosInstance().post('/user/auth/azure', {
            'graph-token': graphToken
          });
          const { data } = res.data;
          setSubmitting(false);
          history.push({ pathname: '/login/mfa', search: '?token=' + data?.token });
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
    const data: any = {
      email: values.email,
      password: values.password
    };
    if (brandData) {
      data.subDomain = brandData?.subDomain;
    }
    axiosInstance()
      .post('/user/auth', data)
      .then(async ({ data: response }) => {
        const { data } = response;
        setSubmitting(false);
        history.push({ pathname: '/login/mfa', search: '?token=' + data?.token });
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
              <div className="mb-[31px] flex items-center justify-between gap-2">
                <Logo className="max-h-[35px] !max-w-[129px]" />
                {brandData?.companyLogo && <img src={brandData.companyLogo} alt={brandData.companyName} className="max-h-[35px] !max-w-[129px]" />}
              </div>
              {brandData?.companyName && <h4 className="mb-4 mt-1 text-center text-[18px] font-semibold">{brandData.companyName}</h4>}
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
                      {/* <FacialLogin
                        dispatch={dispatch}
                        notification={notification}
                        chatNotification={chatNotification} /> */}
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
              <AuthSlider className="relative flex" style={{ minHeight: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

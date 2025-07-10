import { AuthenticatedTemplate, UnauthenticatedTemplate, useAccount, useMsal } from '@azure/msal-react';
import { Box, CssBaseline, Link as MuiLink, TextField, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Form, Formik } from 'formik';
import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { TbBrandOffice } from 'react-icons/tb';
import { Link, useHistory } from 'react-router-dom';
import { Logo } from 'src/assets/authenticationAssets';
import axiosInstance from 'src/axios/axiosInstance';
import { AzureLogin } from 'src/components/Azure/Azure';
import getAzureAcessToken from 'src/components/Azure/getAzureAccessToken';
import { getDeviceFingerprint, getSubdomain } from 'src/constants/helpers';
import BrandNotFound from 'src/pages/Auth/Login/BrandNotFound';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { SET_USER, SET_SELECTED_ENTITY } from 'src/StateProvider/actionTypes';
import AuthSlider from '../AuthSlider';
import styles from '../index.module.scss';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { backendApi } from 'src/config';
import routes from 'src/components/Helpers/Routes';
import { camelCase } from 'lodash';
import { CustomNotificationCountContext } from 'src/StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomChatNotificationCountContext } from 'src/StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';

export type BrandData = {
  companyName: string;
  companyLogo: string;
  subDomain: string;
};

const MAIN_SUB_DOMAIN = ['portal', 'am-portal', 'master.portal', 'uat.portal', 'staging.portal', 'uat', 'prod'];

const Login = () => {
  const toastConfig = useContext(CustomToastContext);
  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);
  const { dispatch }: any = useData();

  const [isSubmitting, setSubmitting] = useState(false);
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [counter, setCounter] = useState(0);
  const [invalidAzureLogin, setInvalidAzureLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [brandData, setBrandData] = useState<BrandData>(null);
  const [brandNotFound, setBrandNotFound] = useState(false);

  const history = useHistory();

  useEffect(() => {
    const subdomain = getSubdomain();
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

    try {
      const deviceFingerprint = await getDeviceFingerprint();

      const data: any = {
        email: values.email,
        password: values.password,
        deviceFingerprint: deviceFingerprint
      };

      if (brandData) {
        data.subDomain = brandData?.subDomain;
      }

      const response = await axiosInstance().post('/user/auth', data);
      const { data: responseData } = response.data;

      if (responseData?.skipMFA && responseData?.token) {
        localStorage.setItem('token', responseData.token);

        if (responseData?.hasExistingSession) {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: responseData.existingSessionMessage
          });
        }
        const res = await axiosInstance().get(`/user/me`);
        const {
          data: { data: meData }
        } = res;

        dispatch({ type: SET_USER, payload: meData });
        if (meData?.role?.selectedEntity?._id) {
          dispatch({
            type: SET_SELECTED_ENTITY,
            payload: responseData?.role?.selectedEntity?._id
          });
        }
        if (responseData?.user?.defaultResource) {
          if (routes[camelCase(responseData?.user?.defaultResource)]?.path) {
            history.push({ pathname: routes[camelCase(responseData?.user?.defaultResource)]?.path });
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
      } else {
        history.push({ pathname: '/login/mfa', search: `?token=${responseData?.token}` });
      }
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      toastConfig.setToastConfig(error);
    }
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

  // Early return brand not found
  if (brandNotFound) {
    return <BrandNotFound />;
  }

  return (
    <>
      <CssBaseline />
      <div className={styles.main} style={{ '--custom-grid-cols': '1fr 1fr' } as React.CSSProperties}>
        <div className={styles.bg}>
          <div className={styles.contentContainer}>
            <div className={styles.left}>
              <div className="mb-[31px] flex items-center justify-between gap-2">
                <Logo className="max-h-[35px] !max-w-[129px]" />
                {brandData?.companyLogo && (
                  <img loading="eager" src={brandData.companyLogo} alt={brandData.companyName} className="max-h-[35px] !max-w-[129px]" />
                )}
              </div>
              {brandData?.companyName && <h4 className="mb-4 mt-1 text-center text-[18px] font-semibold">{brandData.companyName}</h4>}
              <Formik
                initialValues={{
                  email: '',
                  password: '',
                  rememberDevice: false
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
                          value={values['email'] || null}
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
                          value={values['password'] || null}
                          error={touched['password'] && Boolean(errors['password'])}
                          helperText={touched['password'] && errors['password']}
                          onChange={(e) => setFieldValue('password', e.target.value)}
                          fullWidth
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton className="p-0" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <Visibility /> : <VisibilityOff />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }
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
                      <ThemeButton fullWidth buttonType="theme" type="submit" disabled={isSubmitting} isLoading={isSubmitting} sx={{ height: 40 }}>
                        Sign In
                      </ThemeButton>
                      <AuthenticatedTemplate>
                        {invalidAzureLogin ? (
                          <span>Not authorized loging out in {counter}</span>
                        ) : (
                          <ThemeButton onClick={() => instance.logoutPopup()} buttonType="theme">
                            Office 365 Log Out
                          </ThemeButton>
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

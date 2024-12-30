import { Box, Button, CircularProgress, CssBaseline, FormControl, MenuItem, Select } from '@mui/material';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomChatNotificationCountContext } from 'src/StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import { CustomNotificationCountContext } from 'src/StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { SET_SELECTED_ENTITY, SET_USER } from 'src/StateProvider/actionTypes';
import { SVG } from 'src/assets';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import OtpInput from 'src/components/OtpInput';
import { MFA_METHOD } from 'src/constants/helpers';

const LoginMFA = () => {
  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);

  const [selectedMethod, setSelectedMethod] = useState<any>(MFA_METHOD.emailOtp);
  const [otp, setOtp] = useState('');

  const [tokenData, settokenData] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isCodeSending, setIsCodeSending] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const { dispatch }: any = useData();

  const history = useHistory();
  let { token }: any = queryString.parse(history.location.search);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  useEffect(() => {
    if (timeLeft === 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((timeLeft) => timeLeft - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleResendCode = () => {
    setIsCodeSending(true);
    axiosInstance()
      .post('/user/mfa-auth/resend-otp', { token: token })
      .then(({ data: { data } }) => {
        setIsCodeSending(false);
        setTimeLeft(60);
        history.push({ pathname: '/login/mfa', search: '?token=' + data?.token });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Sent Successfully'
        });
      })
      .catch((error) => {
        setTimeLeft(0);
        setIsCodeSending(false);
        toastConfig.setToastConfig(error);
      });
  };

  const verifyToken = () => {
    axiosInstance()
      .post('/user/mfa-auth/verify-token', { token: token })
      .then(({ data: { data } }) => {
        settokenData(data);
        setSelectedMethod(data?.authenticationMethod);
      })
      .catch((error) => {
        settokenData(null);
        history.push({ pathname: '/login' });
      });
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    axiosInstance()
      .post('/user/mfa-auth/verify-otp', {
        otp: otp,
        token: token,
        method: selectedMethod
      })
      .then(async ({ data: { data } }) => {
        localStorage.setItem('token', data.token);
        if (data?.hasExistingSession) {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.existingSessionMessage
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
        setIsSubmitting(false);
      })
      .catch((error) => {
        setOtp('');
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  }, [chatNotification, dispatch, history, notification, otp, selectedMethod, toastConfig, token]);

  useEffect(() => {
    if (otp.length === 6) {
      handleSubmit();
    }
  }, [otp, handleSubmit]);

  return (
    <>
      <CssBaseline />
      {tokenData ? (
        <>
          <div className="flex min-h-screen items-center justify-center bg-[var(--dark-secondary,white)] px-3 py-3">
            <div className="w-full max-w-[500px] rounded-2xl bg-[var(--dark-primary,white)] p-5 text-center shadow-lg [border:1px_solid_var(--common-border-color)]">
              <div className="logo-container mx-auto mb-3 max-w-[150px]">
                <img src={SVG('LogoNew')} alt="equipt logo" className="max-w-full" />
              </div>
              <h4 className="mb-3 mt-3 text-2xl font-semibold">Verify Your Identity</h4>
              <p className="mb-3 mt-7  font-semibold text-gray-500">Authentication Method</p>
              <FormControl style={{ minWidth: 'min(100%, 300px)' }} size="small" className="mb-3">
                <Select
                  variant="outlined"
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  size="small"
                >
                  <MenuItem value={MFA_METHOD.emailOtp}>Email Code</MenuItem>
                  {tokenData?.isMFASetup && <MenuItem value={MFA_METHOD.totp}>Authenticator App</MenuItem>}
                </Select>
              </FormControl>
              {selectedMethod === MFA_METHOD.emailOtp && tokenData?.authenticationMethod === MFA_METHOD.totp ? (
                <Box mt={2} mb={2}>
                  <Button disableElevation variant="contained" color="primary" onClick={handleResendCode}>
                    Send Code
                  </Button>
                </Box>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <p className="info mx-auto mb-7 mt-7 max-w-[400px] text-[13px] font-normal leading-[1.5] text-gray-500">
                    A verification code has been sent to your {selectedMethod === 'totp' ? 'device' : 'email'}. Please enter the code below to
                    proceed.
                  </p>
                  <div className="mb-6 md:px-5">
                    <OtpInput
                      validateChar={(character, index) => /^[0-9]$/.test(character)}
                      value={otp}
                      onChange={(value) => {
                        setOtp(value);
                        if (otp.length === 6) {
                          handleSubmit();
                        }
                      }}
                      TextFieldsProps={{ size: 'small', inputProps: { pattern: '[0-9]*', autoComplete: 'one-time-code', inputMode: 'numeric' } }}
                      autoFocus
                    />
                  </div>
                  {selectedMethod === 'emailOtp' && (
                    <div className="mb-2 flex justify-end px-3 text-[13px] font-normal text-gray-500">
                      <span
                        className={`mr-2 ${timeLeft === 0 && !isCodeSending ? 'cursor-pointer font-semibold' : ''}`}
                        onClick={() => {
                          if (timeLeft === 0) {
                            handleResendCode();
                          }
                        }}
                      >
                        Resend Code
                      </span>
                      {timeLeft ? <span>{formatTime(timeLeft)}</span> : null}
                    </div>
                  )}
                  <ThemeButton
                    disableElevation
                    buttonType="theme"
                    type="submit"
                    fullWidth
                    sx={{ paddingBlock: 10, height: 40 }}
                    disabled={otp.length < 6 || isSubmitting}
                    onClick={handleSubmit}
                    startIcon={isSubmitting && <CircularProgress color="inherit" size={20} />}
                  >
                    Submit
                  </ThemeButton>
                </form>
              )}
            </div>
          </div>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default LoginMFA;

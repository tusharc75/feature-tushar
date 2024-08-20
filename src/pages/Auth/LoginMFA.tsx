import { Button, CssBaseline, FormControl, MenuItem, Select } from '@material-ui/core';
import { useContext, useState } from 'react';
import { SVG } from 'src/assets';
import axiosInstance from 'src/axios/axiosInstance';
import OtpInput from 'src/components/OtpInput';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import queryString from 'query-string';
import { useHistory } from 'react-router-dom';
import { useData } from 'src/StateProvider/Provider';
import { SET_SELECTED_ENTITY, SET_USER } from 'src/StateProvider/actionTypes';
import routes from 'src/components/Helpers/Routes';
import { camelCase } from 'lodash';
import { CustomNotificationCountContext } from 'src/StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomChatNotificationCountContext } from 'src/StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';

type AuthenticationMethods = 'authenticatorApp' | 'emailOtp';

const LoginMFA = () => {

  const notification = useContext(CustomNotificationCountContext);
  const chatNotification = useContext(CustomChatNotificationCountContext);

  const [selectedMethod, setSelectedMethod] = useState<AuthenticationMethods>('emailOtp');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const { dispatch }: any = useData();

  const history = useHistory();
  let { token }: any = queryString.parse(history.location.search);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    axiosInstance().post('/user/mfa-auth/verify-otp', {
      otp: otp,
      token: token,
      method: selectedMethod
    }).then(async ({ data: { data } }) => {
      localStorage.setItem('token', data.token);
      if (data?.hasExistingSession) {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.existingSessionMessage
        });
      }
      const res = await axiosInstance().get(`/user/me`)
      const { data: { data: meData } } = res;

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
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <CssBaseline />
      <div className="flex min-h-screen items-center justify-center bg-[var(--dark-secondary,white)] px-3 py-3">
        <div className="w-full max-w-[500px] rounded-2xl bg-[var(--dark-primary,white)] p-5 text-center shadow-lg [border:1px_solid_var(--common-border-color)]">
          <div className="logo-container mx-auto mb-2 max-w-[150px]">
            <img src={SVG('LogoNew')} alt="equipt logo" className="max-w-full" />
          </div>
          <h4 className="mb-3 text-2xl font-semibold">Verify Your Identity</h4>
          <p className="mb-2 font-semibold text-gray-500">Authentication Method</p>
          <FormControl style={{ minWidth: 'min(100%, 300px)' }} size="small" className="mb-3">
            <Select
              variant="outlined"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedMethod}
              label="Age"
              onChange={(e) => setSelectedMethod(e.target.value as AuthenticationMethods)}
            >
              <MenuItem value={'authenticatorApp'}>Authenticator App</MenuItem>
              <MenuItem value={'emailOtp'}>Email Code</MenuItem>
            </Select>
          </FormControl>
          <p className="info mx-auto mb-7 max-w-[400px] text-[13px] font-normal leading-[1.5] text-gray-500">
            An authentication code has been sent to your {selectedMethod === 'authenticatorApp' ? 'device' : 'email'}. Enter the code to continue and
            be redirected.
          </p>
          <div className="mb-6 px-5">
            <OtpInput
              validateChar={(character, index) => /^[0-9]$/.test(character)}
              value={otp}
              onChange={(value) => setOtp(value)}
              TextFieldsProps={{ size: 'small' }}
            />
          </div>
          <Button
            disableElevation
            variant="contained"
            color="primary"
            fullWidth
            style={{ paddingBlock: 10, borderRadius: 9 }}
            disabled={otp.length < 6 || isSubmitting}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    </>
  );
};

export default LoginMFA;

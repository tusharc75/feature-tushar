import { useContext, useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Typography } from '@mui/material';
import { SVG } from 'src/assets';
import OtpInput from 'src/components/OtpInput';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { SET_SELECTED_ENTITY, SET_USER } from '../../StateProvider/actionTypes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import { camelCase } from 'lodash';

export default function QrAuthPage() {
  const { qrLoginId } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [pin, setPin] = useState('');
  const toastConfig = useContext(CustomToastContext);
  const { dispatch }: any = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!qrLoginId) return;
    setLoading(true);
    axiosInstance()
      .post(`/user/qr-auth`, { _id: qrLoginId })
      .then(({ data }) => {
        setValid(data?.data?.valid === true);
        setLoading(false);
      })
      .catch(() => {
        setValid(false);
        setLoading(false);
      });
  }, [qrLoginId]);

  const handleSubmit = async (qrPin = pin) => {
    setIsSubmitting(true);
    axiosInstance()
      .post('/user/qr-auth', { _id: qrLoginId, pin: Number(qrPin) })
      .then(({ data: { data } }) => {
        setIsSubmitting(false);
        if (data?.valid) {
          const userData = data.userData;
          localStorage.setItem('token', userData.token);
          dispatch({ type: SET_USER, payload: userData });
          let prevSelectedEntity = localStorage.getItem('selectedEntity');
          if (prevSelectedEntity && prevSelectedEntity !== 'null') {
            dispatch({
              type: SET_SELECTED_ENTITY,
              payload: prevSelectedEntity
            });
          } else if (userData?.role?.selectedEntity?._id) {
            dispatch({
              type: SET_SELECTED_ENTITY,
              payload: userData.role.selectedEntity._id
            });
          }
          if (userData?.user?.defaultResource) {
            if (routes[camelCase(userData?.user?.defaultResource)]?.path) {
              history.push({ pathname: routes[camelCase(userData?.user?.defaultResource)]?.path });
            }
          } else {
            history.push('/');
          }
        } else {
          toastConfig.setToastConfig({
            open: true,
            type: 'error',
            message: 'Please enter a valid PIN',
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Please enter a valid PIN'
        });
        setIsSubmitting(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--dark-secondary,white)] px-3 py-3">
      {loading ? (
        <CommonSkeleton lenArray={[...Array(6).keys()]} />
      ) : !valid ? (
        <div className="w-full max-w-[500px] rounded-2xl bg-[var(--dark-primary,white)] p-5 text-center shadow-lg [border:1px_solid_var(--common-border-color)]">
          <div className="logo-container mx-auto my-5 max-w-[150px]">
            <img src={SVG('LogoNew')} alt="equipt logo" className="max-w-full" />
          </div>
          <Typography color="error" variant="h6" mb={2}>QR code is invalid or has expired.</Typography>
          <ThemeButton sx={{ paddingBlock: 1.25, height: 40, marginY: 2 }} buttonType="theme" fullWidth onClick={() => history.push('/login')}>
            Go to Login
          </ThemeButton>
        </div>
      ) : (
        <div className="w-full max-w-[500px] rounded-2xl bg-[var(--dark-primary,white)] p-5 text-center shadow-lg [border:1px_solid_var(--common-border-color)]">
          <div className="logo-container mx-auto my-3 max-w-[150px]">
            <img src={SVG('LogoNew')} alt="equipt logo" className="max-w-full" />
          </div>
          <Typography variant="h5" fontWeight={600} mt={3} mb={3}>Verify Your Identity</Typography>
          <Typography variant="body2" fontWeight={500} color="textSecondary" mb={2} mt={7}>Enter your 4-digit PIN</Typography>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (pin.length === 4) handleSubmit();
            }}
          >
            <div className="mb-6 md:px-5 max-w-xs mx-auto">
              <OtpInput
                validateChar={(character, index) => /^[0-9]$/.test(character)}
                value={pin}
                onChange={value => {
                  setPin(value);
                  if (value.length === 4) {
                    handleSubmit(value);
                  }
                }}
                TextFieldsProps={{ size: 'small', type: 'password' }}
                autoFocus
                length={4}
              />
            </div>
            <ThemeButton
              buttonType="theme"
              type="submit"
              fullWidth
              sx={{ paddingBlock: 1.25, height: 40 }}
              disabled={pin.length < 4 || isSubmitting}
              isLoading={isSubmitting}
              className="mt-4"
            >
              Submit
            </ThemeButton>
          </form>
        </div>
      )}
    </div>
  );
}

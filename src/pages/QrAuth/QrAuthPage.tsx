import { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import OtpInput from 'src/components/OtpInput';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { SET_SELECTED_ENTITY, SET_USER } from '../../StateProvider/actionTypes';

export default function QrAuthPage() {
  const { qrLoginId } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { dispatch }: any = useData();

  useEffect(() => {
    if (!qrLoginId) return;
    setLoading(true);
    axiosInstance()
      .get(`/user/qr-auth/${qrLoginId}`)
      .then(({ data }) => {
        setValid(data?.data?.valid === true);
        setLoading(false);
      })
      .catch(() => {
        setValid(false);
        setLoading(false);
      });
  }, [qrLoginId]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    axiosInstance()
      .post('/user/qr-auth', { _id: qrLoginId, pin: Number(pin) })
      .then(({ data: { data } }) => {
        setLoading(false);
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
          history.push('/');
        } else {
          setError('Invalid PIN');
        }
      })
      .catch((error) => {
        console.log("QR Auth Error:", error);
        setLoading(false);
        setError(error.message || 'Invalid PIN');
      });
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      {loading ? (
        <CommonSkeleton lenArray={[...Array(4).keys()]} />
      ) : !valid ? (
        <Typography color="error" variant="h6">Invalid or expired QR code.</Typography>
      ) : (
        <Box maxWidth={320} width="100%" p={3} boxShadow={2} borderRadius={2} bgcolor="background.paper">
          <Typography variant="h5" align="center" mb={2}>QR Login</Typography>
          <Typography variant="body2" align="center" mb={2}>Enter your 4-digit PIN</Typography>
          <OtpInput
            validateChar={(character, index) => /^[0-9]$/.test(character)}
            value={pin}
            onChange={(value) => setPin(value)}
            TextFieldsProps={{ size: 'small' }}
            length={4}
          />
          {error && <Typography color="error" align="center" mb={2}>{error}</Typography>}
          <ThemeButton
            buttonType="theme"
            fullWidth
            disabled={pin.length !== 4 || loading}
            onClick={handleSubmit}
            className='mt-4'
          >
            Login
          </ThemeButton>
        </Box>
      )}
    </Box>
  );
}

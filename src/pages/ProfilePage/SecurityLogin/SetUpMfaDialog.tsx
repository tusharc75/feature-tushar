import { Box, Dialog, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CopyToClipboardButton from 'src/components/CopyToClipboardButton';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import OtpInput from 'src/components/OtpInput';
import { CustomDialogTransition } from 'src/constants/helpers';

function SetUpMfaDialog({ onClose }) {
  const [data, setData] = useState({ secret: '', qrCode: '' });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    generate();
  }, []);

  const generate = async () => {
    setLoading(true);
    axiosInstance()
      .get('/user/mfa-setup/generate')
      .then(({ data: { data } }) => {
        setData({
          secret: data?.secret,
          qrCode: data.qrCode
        });
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const validate = async (secretKey, token) => {
    axiosInstance()
      .put('/user/mfa-setup/verify', { secretKey, token })
      .then(({ data: { data } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'MFA enabled successfully'
        });
        onClose();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      maxWidth={'sm'}
      onClose={onClose}
      fullWidth
    >
      <CustomDialogHeader title="MFA Setup" showRequiredLabel={false} onClose={onClose} />
      <CustomDialogContent>
        {loading ? (
          <Box p={2} height={300}>
            <CommonSkeleton lenArray={[...Array(6).keys()]} />
          </Box>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" align="center">
              Scan the QR code below to configure your MFA app
            </Typography>
            <Box p={3} pb={1}>
              <img src={data?.qrCode} alt={data?.secret} />
            </Box>
            <Typography variant="body1" className="flex items-center gap-2">
              Secret Key: {data?.secret}
              <CopyToClipboardButton text={data.secret} />
            </Typography>
            <Box mt={3} />
            <Box m={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <div className="mx-auto max-w-[400px] text-center">
                    <Typography variant="body2" className="mb-2">
                      Enter Code
                    </Typography>
                    <OtpInput
                      validateChar={(character, index) => /^[0-9]$/.test(character)}
                      value={token}
                      onChange={(value) => setToken(value)}
                      TextFieldsProps={{ size: 'small' }}
                    />
                  </div>
                </Grid>
              </Grid>
            </Box>
          </div>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton onClick={onClose} buttonType='transparent'>
          Cancel
        </ThemeButton>
        <ThemeButton
          buttonType='theme'
          disabled={token.length < 6}
          onClick={() => {
            validate(data.secret, token);
          }}
        >
          Submit
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default SetUpMfaDialog;

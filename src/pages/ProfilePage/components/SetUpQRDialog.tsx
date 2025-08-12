
import React, { useContext, useState } from 'react';
import { Box, Dialog, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import OtpInput from 'src/components/OtpInput';
import { CustomDialogTransition } from 'src/constants/helpers';

const SetUpQRDialog = ({ onClose, mode = 'setup', qrLoginId = null }) => {
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const toastConfig = useContext(CustomToastContext);

  const handleSubmit = async () => {
    setLoading(true);
    const pinNumber = Number(pin);
    let apiCall;
    if (mode === 'change' && qrLoginId) {
      apiCall = axiosInstance().put('/user/qr-setup', { pin: pinNumber, _id: qrLoginId });
    } else {
      apiCall = axiosInstance().post('/user/qr-setup', { pin: pinNumber });
    }
    apiCall
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: mode === 'change' ? 'QR PIN changed successfully' : 'QR setup successful'
        });
        setLoading(false);
        onClose();
      })
      .catch((error) => {
        setLoading(false);
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
      <CustomDialogHeader title={mode === 'change' ? 'Change QR PIN' : 'QR Setup'} showRequiredLabel={false} onClose={onClose} />
      <CustomDialogContent>
        {loading ? (
          <Box p={2} height={200}>
            <CommonSkeleton lenArray={[...Array(4).keys()]} />
          </Box>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" align="center">
              {mode === 'change' ? 'Change 4-digit PIN for QR login' : 'Enter a 4-digit PIN to setup QR login'}
            </Typography>
            <Box mt={3} />
            <Box m={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <div className="mx-auto max-w-[200px] text-center">
                    <Typography variant="body2" className="mb-2">
                      Enter PIN
                    </Typography>
                    <OtpInput
                      validateChar={(character, index) => /^[0-9]$/.test(character)}
                      value={pin}
                      onChange={(value) => setPin(value)}
                      TextFieldsProps={{ size: 'small' }}
                      length={4}
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
          disabled={pin.length < 4}
          onClick={handleSubmit}
        >
          Submit
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default SetUpQRDialog;

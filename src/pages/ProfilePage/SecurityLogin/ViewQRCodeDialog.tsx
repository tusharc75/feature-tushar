
import React, { useEffect, useState, useContext } from 'react';
import { Dialog, Box, Typography } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

export default function ViewQRCodeDialog({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ userName: '', qrCode: '' });
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get(`/user/qr-setup`)
      .then(({ data }) => {
        setData({
          userName: data?.data?.userName || '',
          qrCode: data?.data?.qrCode || ''
        });
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  }, []);

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
      <CustomDialogHeader title="QR Code" showRequiredLabel={false} onClose={onClose} />
      <CustomDialogContent>
        {loading ? (
          <Box p={2} height={200}>
            <CommonSkeleton lenArray={[...Array(4).keys()]} />
          </Box>
        ) : data.qrCode ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <Typography variant="h6" align="center" mb={2}>
              Scan this QR code to login
            </Typography>
            <Box p={3} pb={1}>
              <img id="qrCodeImg" src={data.qrCode} alt="QR Code" style={{ maxWidth: 240, maxHeight: 240 }} />
            </Box>
            <ThemeButton
              buttonType="theme"
              style={{ marginBottom: 12 }}
              onClick={() => {
                const link = document.createElement('a');
                link.href = data.qrCode;
                link.download = `qrLogin-${data.userName}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              disabled={!data.qrCode}
            >
              Download QR Code
            </ThemeButton>
          </Box>
        ) : (
          <Typography align="center">QR code not available.</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton onClick={onClose} buttonType='transparent'>
          Close
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
}

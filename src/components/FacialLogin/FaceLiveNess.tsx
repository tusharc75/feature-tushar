import { useState, useEffect, useContext } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import Dialog from '@mui/material/Dialog';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { Box } from '@mui/material';
import FaceLiveNess from '../FaceLiveness/AWS';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const FaceLogin = ({ onClose, onComplete }) => {
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<any>(null);
  useEffect(() => {
    fetchCreateLiveness();
  }, []);

  const fetchCreateLiveness = () => {
    setLoading(true);
    axiosInstance()
      .get('/user/face/liveness-session')
      .then(({ data: { data } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSessionId(data.SessionId);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  return (
    <Dialog
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={onClose}
      open={true}
      fullScreen
    >
      <CustomDialogHeader
        title={'Face'}
        onClose={() => {
          onClose();
        }}
        showRequiredLabel={false}
      ></CustomDialogHeader>
      <CustomDialogContent isFooterPresent={false}>
        {loading || !sessionId ? (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        ) : (
          <FaceLiveNess sessionId={sessionId} onUserCancel={onClose} onComplete={onComplete} onError={() => {}} />
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default FaceLogin;

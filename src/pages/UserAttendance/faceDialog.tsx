import { useContext, useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { Box, Dialog } from '@mui/material';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FaceLiveNess from 'src/components/FaceLiveness/AWS';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function FaceDialog({ onClose }) {
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<any>(null);
  const [gettingOutModal, setGettingOutModal] = useState({ open: false, text: '' });
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

  const onCompleteScan = async (sessionId) => {
    const complete = await axiosInstance().get(`/face-attendance/attend/${sessionId}`);
    const data = complete.data.data;
    if (data && data.gettingOut) {
      setGettingOutModal({ open: true, text: 'You are getting out!' });
    } else {
      setGettingOutModal({ open: true, text: 'You are getting in!' });
    }
  };

  const onError = (error) => {
    setTimeout(() => {
      onClose();
    }, 1000);
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
      <CustomDialogContent isFooterPresent={false}>
        {loading ? (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        ) : (
          <FaceLiveNess sessionId={sessionId} onComplete={onCompleteScan} onUserCancel={onClose} onError={onError} autoStart={true} />
        )}
        {gettingOutModal.open && (
          <ConfirmationDialog
            open={gettingOutModal.open}
            message={gettingOutModal.text}
            onClose={() => {
              setGettingOutModal({ open: false, text: '' });
              onClose();
            }}
            onOk={() => {
              setGettingOutModal({ open: false, text: '' });
              onClose();
            }}
          />
        )}
      </CustomDialogContent>
    </Dialog>
  );
}

export default FaceDialog;

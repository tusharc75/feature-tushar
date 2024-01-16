import { useState, useEffect } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { Box } from '@material-ui/core';
import FaceLiveNess from '../FaceLiveness/AWS';

const FaceLogin = ({ onClose, onComplete }) => {

  const [loading, setLoading] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<any>(null);
  useEffect(() => {
    fetchCreateLiveness();
  }, []);

  const fetchCreateLiveness: () => Promise<void> = async () => {
    setLoading(true);
    const res = await axiosInstance().get('/user/liveness-session');
    const data = res.data.data;
    setSessionId(data.SessionId);
    setLoading(false);
  };

  return (<Dialog
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
    <CustomDialogContent>
      {loading || !sessionId ? (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      ) : (
        <FaceLiveNess sessionId={sessionId} onUserCancel={onClose} onComplete={onComplete} onError={() => { }} />
      )}
    </CustomDialogContent>
  </Dialog>

  );
};

export default FaceLogin;

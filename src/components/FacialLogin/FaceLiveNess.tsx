import { useState, useRef, useEffect } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from 'src/axios/axiosInstance';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider, View } from '@aws-amplify/ui-react';
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from 'aws-amplify';
import awsexports from '../../amplifyconfiguration.json';
import "./faceLiveness.scss"
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import { Box } from '@material-ui/core';

Amplify.configure(awsexports);

const FaceLiveNess = ({ onClose, onComplete }) => {
  const [cameraPermission, setCameraPermission] = useState('prompt');

  const [loading, setLoading] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<any>(null);
  const videoStream = useRef(null);

  useEffect(() => {
    if (cameraPermission === 'granted' || cameraPermission === 'prompt') {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        .then((stream) => {
          setCameraPermission('granted');
          videoStream.current = stream;
          stream.getTracks().forEach((track) => track.stop());
        })
        .catch((err) => {
          console.error('Camera access denied:', err);
          setCameraPermission('denied');
        });
    }

    return () => {
      if (videoStream.current) {
        videoStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraPermission]);

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

  const handleCancel = () => {
    if (videoStream.current) {
      videoStream.current.getTracks().forEach((track) => track.stop());
    }
    onClose();
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
        <ThemeProvider>
          <View as="div" width={'calc(100vh - 100px)'} margin={'auto'} >
            <FaceLivenessDetector
              sessionId={sessionId}
              region={"us-east-1"}
              onAnalysisComplete={() => onComplete(sessionId)}
              onUserCancel={handleCancel}
              onError={(error) => {
                console.error('err', error);
              }}
              components={{
                PhotosensitiveWarning: (): JSX.Element => {
                  return null;
                }
              }}
            />
          </View>
        </ThemeProvider>
      )}
    </CustomDialogContent>
  </Dialog>

  );
};

export default FaceLiveNess;

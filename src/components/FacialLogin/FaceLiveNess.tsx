import { useState, useRef, useEffect } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from 'src/axios/axiosInstance';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import {
  Loader, ThemeProvider, Theme, useTheme, View,
} from '@aws-amplify/ui-react';
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from 'aws-amplify';
import awsexports from '../../amplifyconfiguration.json';
import "./faceLiveness.scss"

Amplify.configure(awsexports);

const FaceLiveNess = ({ open, onClose, onComplete }) => {
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
          videoStream.current = stream; // Store the stream
          stream.getTracks().forEach((track) => track.stop()); // Stop the stream initially
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

  const { tokens } = useTheme();
  const theme: Theme = {
    name: 'Face Liveness Example Theme',
    tokens: {
      colors: {
        overlay: {
          value: tokens.colors.black['90'],
        },
        background: {
          value: tokens.colors.transparent.value,
        },
        font: {
          primary: {
            value: tokens.colors.white.value,
          },
        },
        brand: {
          outline: {
            color: {
              value: tokens.colors.teal['100'],

            }
          },
          color: { value: tokens.colors.teal['100'] },
          primary: {
            '10': tokens.colors.teal['100'],
            '80': tokens.colors.teal['40'],
            '90': tokens.colors.teal['20'],
            '100': tokens.colors.teal['10'],
          },
        },
      },
    },
  };



  const handleCancel = () => {
    if (videoStream.current) {
      videoStream.current.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={onClose}
        open={open}

      >
        <ThemeProvider >
          {loading || !sessionId ? (
            <Loader />
          ) : (
            <View
              as="div"
              maxHeight="100%"
              height="100%"
              width="100%"
              maxWidth="100%"
            >
              <FaceLivenessDetector
                sessionId={sessionId}
                region={"us-east-1"}
                onAnalysisComplete={() => onComplete(sessionId)}
                onUserCancel={handleCancel}
                onError={(error) => {
                  console.error('err', error);
                }}
              />
            </View>
          )}
        </ThemeProvider>
      </Dialog>
    </>
  );
};

export default FaceLiveNess;

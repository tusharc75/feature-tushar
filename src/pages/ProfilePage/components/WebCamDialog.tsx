import { useState, useRef, useContext, useEffect } from 'react';
import { Button } from '@mui/material';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from '../../../constants/helpers';
import Dialog from '@mui/material/Dialog';
import CustomButton from 'src/components/Helpers/CustomButton';
import Webcam from 'react-webcam';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CircularProgress } from '@mui/material';

const WebCamDialog = ({ open, onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const webcamRef = useRef(null);
  const [picture, setPicture] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt');

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      .then((stream) => {
        setCameraPermission('granted');
        stream.getTracks().forEach((track) => track.stop());
      })
      .catch((err) => {
        setCameraPermission('denied');
      });
  }, [cameraPermission]);

  const captureImageFromStream = () => {
    const video = webcamRef.current.video;
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  const handleCapture = () => {
    const imageSrc = captureImageFromStream();
    setPicture(imageSrc);
    setIsScanning(true);

    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);

        return axiosInstance().post('user/face/add', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        onClose();
      });
  };

  const videoStreamContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'relative'
  };

  const videoStreamStyle: React.CSSProperties = {
    maskImage: 'radial-gradient(circle, black 50%, rgba(0, 0, 0, 0.5) 50%)',
    objectFit: 'cover',
    maxWidth: '600px',
    maxHeight: '600px',
    position: 'absolute'
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
        open={open}
      >
        <CustomDialogHeader title={`Add Face`} onClose={onClose} showRequiredLabel={false} />
        <CustomDialogContent>
          {cameraPermission === 'denied' && (
            <div>
              <p>Error: Please allow camera permissions to use this feature.</p>
            </div>
          )}
          {cameraPermission !== 'denied' &&
            (picture == '' ? (
              <>
                <div style={videoStreamContainerStyle}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    style={videoStreamStyle}
                    screenshotQuality={1}
                    width="100%"
                    height="100%"
                    videoConstraints={{ facingMode: 'user', width: 1920, height: 1080 }}
                  />
                </div>
              </>
            ) : (
              <div style={videoStreamContainerStyle}>
                <img src={picture} style={videoStreamStyle} width="100%" height="100%" />
              </div>
            ))}
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button type="button" disabled={isScanning} color="primary" size="small" onClick={onClose}>
            Cancel
          </Button>
          <CustomButton
            variant="contained"
            color="primary"
            onClick={handleCapture}
            size="small"
            disabled={isScanning}
            startIcon={isScanning && <CircularProgress size={15} />}
          >
            {isScanning ? 'Scanning...' : 'Capture'}
          </CustomButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};

export default WebCamDialog;

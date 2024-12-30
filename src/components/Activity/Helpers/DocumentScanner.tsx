import { useState, useRef, useContext, useEffect } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from '../../../constants/helpers';
import Dialog from '@mui/material/Dialog';
import Webcam from 'react-webcam';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CircularProgress } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import SwitchCameraIcon from '@mui/icons-material/SwitchCamera';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const DocumentScanner = ({ open, onClose, setFieldValue, onUploadFile }) => {
  const toastConfig = useContext(CustomToastContext);
  const webcamRef = useRef(null);
  const [picture, setPicture] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraCount, setCameraCount] = useState(0);
  const [cameraPermission, setCameraPermission] = useState('prompt');

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setCameraCount(videoDevices.length);
    });

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
    axiosInstance()
      .post('/attachment/upload-scan-document', {
        image: imageSrc
      })
      .then(({ data }) => {
        setIsScanning(false);
        const file = data.fileName;
        setFieldValue('fileUrl', file);
        onUploadFile(file);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onClose();
      })
      .catch((error) => {
        setIsScanning(false);
        toastConfig.setToastConfig(error);
      });
  };

  const switchCamera = () => {
    facingMode === 'user' ? setFacingMode('environment') : setFacingMode('user');
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
        <CustomDialogHeader title={`Scan Document`} onClose={onClose} showRequiredLabel={false} />
        <CustomDialogContent>
          {cameraPermission === 'denied' && (
            <div>
              <p>Error: Please allow camera permissions to use this feature.</p>
            </div>
          )}
          {cameraPermission !== 'denied' &&
            (picture == '' ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={1}
                width="100%"
                height="100%"
                videoConstraints={{ facingMode: facingMode, width: 1920, height: 1080 }}
              />
            ) : (
              <img src={picture} width="100%" height="100%" />
            ))}
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton buttonType="transparent" onClick={onClose}>
            Cancel
          </ThemeButton>
          <HtmlTooltip title="Switch Camera">
            <IconButton size="small" onClick={switchCamera} disabled={cameraCount < 2}>
              <SwitchCameraIcon color="primary" />
            </IconButton>
          </HtmlTooltip>
          <ThemeButton
            buttonType="theme"
            onClick={handleCapture}
            size="small"
            disabled={isScanning}
            startIcon={isScanning && <CircularProgress size={15} />}
          >
            {isScanning ? 'Scanning...' : 'Capture'}
          </ThemeButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};

export default DocumentScanner;

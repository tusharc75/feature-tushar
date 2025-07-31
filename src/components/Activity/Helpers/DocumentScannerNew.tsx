import { useState, useRef, useEffect } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from '../../../constants/helpers';
import Dialog from '@mui/material/Dialog';
import Webcam from 'react-webcam';
import IconButton from '@mui/material/IconButton';
import SwitchCameraIcon from '@mui/icons-material/SwitchCamera';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const DocumentScannerNew = ({ open, onClose, values, setFieldValue, name }) => {
  const webcamRef = useRef(null);
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

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const fileName = `webcam-capture-${Date.now()}.jpg`;
    const imageFile = base64StringtoFile(imageSrc, fileName);

    const files = Array.isArray(values[name]) ? [...values[name]] : [];

    files.push(imageFile)
    setFieldValue(name, files);
    onClose()
  };

  const base64StringtoFile = (base64String, filename) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
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
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={1}
              width="100%"
              height="100%"
              videoConstraints={{ facingMode: facingMode, width: 1920, height: 1080 }}
            />
          }
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
            disabled={!webcamRef?.current?.video}
          >
            Capture
          </ThemeButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};

export default DocumentScannerNew;

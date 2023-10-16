import { useState, useRef, useContext } from 'react';
import { Button } from '@material-ui/core';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from '../../../constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import CustomButton from 'src/components/Helpers/CustomButton';
import Webcam from 'react-webcam';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CircularProgress } from '@material-ui/core';

const DocumentScanner = ({ open, onClose, setFieldValue, onUploadFile }) => {
  const toastConfig = useContext(CustomToastContext);
  const webcamRef = useRef(null);
  const [picture, setPicture] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPicture(imageSrc);
  };

  const handleUpload = () => {
    setIsScanning(true);
    axiosInstance()
      .post('/attachment/upload-scan-document', {
        image: picture
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
          {picture == '' ? (
            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" height="100%" />
          ) : (
            <img src={picture} width="100%" height="100%" />
          )}
        </CustomDialogContent>
        <CustomDialogFooter>
          <CustomButton variant="contained" color="primary" onClick={handleCapture} size="small">
            Caputre
          </CustomButton>
          <CustomButton variant="contained" disabled={picture ? false : true} color="primary" onClick={() => setPicture('')} size="small">
            Reset
          </CustomButton>
          <CustomButton
            variant="contained"
            disabled={picture ? isScanning : true}
            color="primary"
            onClick={handleUpload}
            size="small"
            startIcon={isScanning && <CircularProgress size={15} />}
          >
            {isScanning ? 'Scanning...' : 'Scan'}
          </CustomButton>
          <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
            Cancel
          </Button>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};

export default DocumentScanner;

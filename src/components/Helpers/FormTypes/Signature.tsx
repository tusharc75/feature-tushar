import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Typography, Box, Button, IconButton, Dialog } from '@mui/material';
import { AddCircle, CameraAlt, Delete, Info, Publish } from '@mui/icons-material';
import SignaturePad from 'react-signature-canvas';
import { FaSignature } from 'react-icons/fa';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import Webcam from 'react-webcam';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ErrorType, useDropZone } from 'src/hooks';

const UseCamera = ({ handleToggleMode, usePad, setPicture, picture, isFullScreen }) => {
  const [cameraCount, setCameraCount] = useState(0);
  const [facingMode, setFacingMode] = useState(isMobile || isTablet ? 'environment' : 'user');
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
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
        setCameraPermission('granted');
      })
      .catch((err) => {
        setCameraPermission('denied');
      });
  }, []);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setCameraCount(videoDevices.length);
    });
  }, [cameraPermission]);

  const webcamRef = React.useRef(null);
  const capture = () => {
    const pictureSrc = webcamRef.current.getScreenshot();
    setPicture(pictureSrc);
  };

  const switchCamera = () => {
    facingMode === 'user' ? setFacingMode('environment') : setFacingMode('user');
  };

  return (
    <div>
      {cameraPermission === 'denied' ? (
        <Box p={2} style={{ width: isFullScreen ? window.innerWidth - 30 : 500, height: 400 }}>
          <p>Please allow camera permissions to use this feature.</p>
        </Box>
      ) : cameraPermission === 'granted' ? (
        <>
          <Box mb={1} style={{ float: 'right' }}>
            {picture === '' && cameraCount > 1 && (
              <Button size="small" variant="contained" color="primary" onClick={switchCamera} style={{ marginRight: '10px' }}>
                Switch Camera
              </Button>
            )}
            <Button size="small" variant="contained" color="primary" onClick={handleToggleMode}>
              Close Camera
            </Button>
          </Box>
          <div>
            {picture === '' ? (
              <Webcam
                audio={false}
                width={isFullScreen ? window.innerWidth - 30 : 500}
                height={400}
                ref={webcamRef}
                minScreenshotWidth={isFullScreen ? window.innerWidth - 30 : 500}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: facingMode }}
              />
            ) : (
              <img src={picture} className="max-w-full" alt="signature" />
            )}
          </div>
          <div
            style={{
              alignItems: 'center',
              marginTop: '3px'
            }}
          >
            {picture !== '' ? (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setPicture('');
                }}
                size="small"
                variant="contained"
                color="primary"
              >
                Retake
              </Button>
            ) : (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  capture();
                }}
                size="small"
                variant="contained"
                color="primary"
              >
                Capture
              </Button>
            )}
          </div>
        </>
      ) : (
        <Box p={2} width={isFullScreen ? window.innerWidth - 30 : 500} height={400}>
          <CommonSkeleton lenArray={[...Array(3).keys()]} />
        </Box>
      )}
    </div>
  );
};

const SignatureDialog = ({ onSave, open, close }) => {
  const signCanvas = React.useRef<SignaturePad>(null);
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [picture, setPicture] = useState('');
  const [usePad, setUsePad] = useState(true);
  const [fullScreen, setFullScreen] = useState(isMobile && !isTablet ? true : false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleShowDropDownError = (error: ErrorType) => {
    const fileNames = Object.keys(error);
    for (let index = 0; index < fileNames.length; index++) {
      const fileName = fileNames[index];
      const errorMessage = error[fileName].message;
      setToastConfig({ open: true, type: 'error', message: `${fileName} : ${errorMessage}` });
    }
  };

  const { rootProps, isHovering } = useDropZone({
    accept: 'image/*',
    multiple: false,
    onError: handleShowDropDownError,
    onDrop(e, files) {
      handleDrop(files);
    }
  });

  const handleEnd = () => {
    if (!signCanvas.current?.isEmpty()) {
      const picture = signCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
      setPicture(picture);
    } else {
      setToastConfig({ open: true, type: 'warning', message: 'Signature cannot be empty!' });
    }
  };

  const handleDrop = (files: File[]) => {
    if (!files || !files.length) return;
    const reader = new FileReader();
    reader.readAsDataURL(files[0]);
    reader.onload = () => {
      const image = reader.result as string;
      setPicture(image);
      setUploadedFile(image);
    };
    reader.onerror = (error) => {
      setToastConfig({ open: true, type: 'warning', message: 'Something went wrong' });
    };
  };

  const handleToggleMode = () => {
    clearAllData();
    setUsePad((prev) => !prev);
  };
  const clearAllData = () => {
    setPicture('');
    setUploadedFile(null);
    signCanvas.current?.clear();
  };

  return (
    <Dialog TransitionComponent={CustomDialogTransition} fullScreen={fullScreen} open={open} onClose={close}>
      <CustomDialogHeader
        title="Signature Pad"
        onClose={close}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={false}
        showRequiredLabel={false}
      />
      <CustomDialogContent className="px-[15px]">
        <input
          type="file"
          className="sr-only"
          title="Upload signature"
          name="signature"
          accept="image/*"
          onChange={(e) => {
            e.target.files && handleDrop(Array.from(e.target.files));
            e.target.value = '';
          }}
          id={'signature-pad-file-input'}
          ref={inputRef}
          multiple={false}
        />
        <div
          {...rootProps}
          className={cn('relative', isHovering ? 'rounded-16px outline-dashed outline-4 outline-[var(--common-border-color)]' : '')}
        >
          {isHovering && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <p className="text-[40px] font-bold text-gray-400">Drop here</p>
            </div>
          )}
          {uploadedFile ? (
            <div
              className="flex items-center justify-center"
              style={{ width: fullScreen ? window.innerWidth - 30 : 500, height: fullScreen ? window.innerHeight - 118 : 400 }}
            >
              <div className="max-w-fit">
                <img src={uploadedFile} className="h-auto w-full" alt="Signature" />
              </div>
            </div>
          ) : (
            <>
              {usePad ? (
                <div className="flex min-h-full items-center justify-center bg-white">
                  <SignaturePad
                    onEnd={handleEnd}
                    ref={signCanvas}
                    canvasProps={{ width: fullScreen ? window.innerWidth - 30 : 500, height: fullScreen ? window.innerHeight - 118 : 400 }}
                  />
                </div>
              ) : (
                <UseCamera isFullScreen={fullScreen} handleToggleMode={handleToggleMode} usePad={usePad} setPicture={setPicture} picture={picture} />
              )}
            </>
          )}
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
        <HtmlTooltip title={'Upload Signature'}>
          <Button variant="contained" size="small" color="primary" onClick={() => inputRef?.current.click()} startIcon={<Publish />}>
            Upload
          </Button>
        </HtmlTooltip>
        <Button variant="contained" size="small" color="primary" onClick={handleToggleMode} startIcon={usePad ? <CameraAlt /> : <FaSignature />}>
          {usePad ? 'Use Camera' : 'Use Sign Pad'}
        </Button>
        <Button variant="contained" size="small" color="primary" onClick={close}>
          Close
        </Button>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={() => {
            if (picture !== '') {
              onSave(picture);
            } else {
              setToastConfig({ open: true, type: 'warning', message: 'Signature cannot be empty' });
            }
          }}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

const Signature = ({ label, values, name, touched, errors, isTooltip, tooltipMessage, setFieldValue, required, disable = false }) => {
  const [openDialog, setOpenDialog] = React.useState(false);

  const handleSaveImage = (dataURL: string) => {
    setFieldValue(name, dataURL);
    setOpenDialog(false);
  };

  return (
    <Fragment>
      <Typography style={{ color: '#656565', marginBottom: '12px', fontWeight: '500' }}>{`${label}${required ? ' *' : ''}`}</Typography>
      <Box display="flex" flexDirection="row" mt={1} alignItems="center">
        <Box
          position="relative"
          sx={{
            width: 76,
            height: 76,
            border: '2px solid #a0a0a0',
            borderRadius: '8px',
            marginRight: '10px',
            padding: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="bg-white"
        >
          {values[name] ? (
            <img src={values[name]} className="" style={{ maxWidth: 70, maxHeight: 70, width: '100%', height: 'auto' }} alt="Signature" />
          ) : (
            <FaSignature style={{ width: 70, height: 70, color: '#5b5b5b' }} />
          )}
        </Box>
        <Box>
          <HtmlTooltip title="Add Signature">
            <label htmlFor={name}>
              <IconButton
                onClick={() => {
                  setOpenDialog(true);
                }}
                disabled={disable}
                color="primary"
                size="small"
                aria-label="upload sign"
                component="span"
              >
                <AddCircle />
              </IconButton>
            </label>
          </HtmlTooltip>
          <HtmlTooltip title="Remove Signature">
            <IconButton
              disabled={Boolean(!values[name]) || disable}
              className={Boolean(!values[name]) ? '' : 'errorColor'}
              size="small"
              aria-label="delete sign"
              component="span"
              onClick={() => {
                setFieldValue(name, '');
              }}
            >
              <Delete />
            </IconButton>
          </HtmlTooltip>
          {isTooltip && Boolean(tooltipMessage) && (
            <IconButton size="small">
              <HtmlTooltip title={tooltipMessage}>
                <Info color="disabled" />
              </HtmlTooltip>
            </IconButton>
          )}
        </Box>
      </Box>
      {touched[name] && Boolean(errors[name]) && (
        <Box pt={1}>
          <Typography variant="body2" className="text-truncate" color={'error'}>
            {errors[name]}
          </Typography>
        </Box>
      )}
      {openDialog && <SignatureDialog open={openDialog} onSave={handleSaveImage} close={() => setOpenDialog(false)} />}
    </Fragment>
  );
};

export default Signature;

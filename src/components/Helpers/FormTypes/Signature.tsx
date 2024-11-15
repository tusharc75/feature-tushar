import React, { Fragment, useEffect, useState } from 'react';
import { Typography, Box, Button, IconButton, Dialog } from '@material-ui/core';
import { AddCircle, Delete, Info } from '@material-ui/icons';
import SignaturePad from 'react-signature-canvas';
import { FaSignature } from 'react-icons/fa';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import Webcam from 'react-webcam';
import { CustomDialogTransition } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const UseCamera = ({ setUsePad, usePad, setPicture, picture, isFullScreen }) => {
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
            <Button size="small" variant="contained" color="primary" onClick={() => setUsePad(!usePad)}>
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
  const signCanvas: any = React.useRef(null);
  const { setToastConfig } = React.useContext(CustomToastContext);

  const [picture, setPicture] = useState('');

  const [usePad, setUsePad] = useState(true);
  const [fullScreen, setFullScreen] = useState(isMobile && !isTablet ? true : false);

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
        {usePad ? (
          <div className="flex min-h-full items-center justify-center bg-white">
            <SignaturePad
              className=""
              ref={signCanvas}
              canvasProps={{ width: fullScreen ? window.innerWidth - 30 : 500, height: fullScreen ? window.innerHeight - 118 : 400 }}
            />
          </div>
        ) : (
          <UseCamera isFullScreen={fullScreen} setUsePad={setUsePad} usePad={usePad} setPicture={setPicture} picture={picture} />
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="contained" size="small" color="primary" onClick={() => setUsePad(!usePad)}>
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
            //check if user is in camera mode or pad mode
            if (usePad) {
              if (!signCanvas.current?.isEmpty()) {
                const dataURL = signCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
                onSave(dataURL);
              } else {
                setToastConfig({ open: true, type: 'warning', message: 'Signature cannot be empty!' });
              }
            } else {
              if (picture !== '') {
                onSave(picture);
              } else {
                setToastConfig({ open: true, type: 'warning', message: 'Signature cannot be empty (no picture clicked)!' });
              }
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

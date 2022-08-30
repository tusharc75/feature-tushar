import React, { Fragment } from 'react';
import { Typography, Box, Avatar, CircularProgress, Button, IconButton, Dialog } from '@material-ui/core';
import { AddCircle, Delete, Info } from '@material-ui/icons';
import SignaturePad from 'react-signature-canvas';

import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const SignatureDialog = ({ onSave, open, close }) => {
  const signCanvas: any = React.useRef(null);
  const { setToastConfig } = React.useContext(CustomToastContext);

  return (
    <Dialog open={open} onClose={close}>
      <CustomDialogHeader title="Singature Pad" onClose={close} />
      <CustomDialogContent>
        <SignaturePad ref={signCanvas} canvasProps={{ minWidth: 500, width: 500, height: 400 }} />
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="contained" size="small" color="primary" onClick={close}>
          Close
        </Button>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={() => {
            if (!signCanvas.current?.isEmpty()) {
              const dataURL = signCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
              onSave(dataURL);
            } else {
              setToastConfig({ open: true, type: 'warning', message: 'Signature cannot be empty!' });
            }
          }}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

const Signature = ({ label, values, name, touched, errors, isTooltip, tooltipMessage, setFieldValue }) => {
  const [openDialog, setOpenDialog] = React.useState(false);

  const handleSaveImage = (dataURL: string) => {
    setFieldValue(name, dataURL);
    setOpenDialog(false);
  };

  return (
    <Fragment>
      <Typography color="textSecondary">{label}</Typography>
      <Box display="flex" flexDirection="row" mt={1}>
        <Box position="relative">
          <Avatar src={values[name]} style={{ width: 70, height: 70 }} alt="org_logo" />
          {/* <Box display="flex" justifyContent="center" alignItems="center" position="absolute" top="0" right="0" width="100%" height="100%">
        {isImgUploading && (
          <>
            <CircularProgress variant="determinate" value={imageUploadProgress} />
            <Box top={0} left={0} bottom={0} right={0} position="absolute" display="flex" alignItems="center" justifyContent="center">
              <Typography variant="caption" component="div" color="textSecondary">{`${imageUploadProgress}%`}</Typography>
            </Box>
          </>
        )}
      </Box> */}
        </Box>
        <Box>
          <label htmlFor={name}>
            <IconButton
              onClick={() => {
                setOpenDialog(true);
              }}
              title="Add sign"
              color="primary"
              size="small"
              aria-label="upload sign"
              component="span"
            >
              <AddCircle />
            </IconButton>
          </label>

          <IconButton
            disabled={Boolean(!values[name])}
            title="Remove sign"
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
          {isTooltip && Boolean(tooltipMessage) && (
            <IconButton size="small">
              <HtmlTooltip title={tooltipMessage}>
                <Info color="disabled" />
              </HtmlTooltip>
            </IconButton>
          )}
          <Box flex="1">
            <Typography
              variant="body2"
              className="text-truncate"
              style={{
                marginLeft: '4px',
                display: touched[name] && Boolean(errors[name]) ? '' : 'none'
              }}
              color={touched[name] && Boolean(errors[name]) ? 'error' : 'textPrimary'}
            >
              {touched[name] && Boolean(errors[name]) ? errors[name] : null}
            </Typography>
          </Box>
        </Box>
      </Box>
      {openDialog && <SignatureDialog open={openDialog} onSave={handleSaveImage} close={() => setOpenDialog(false)} />}
    </Fragment>
  );
};

export default Signature;

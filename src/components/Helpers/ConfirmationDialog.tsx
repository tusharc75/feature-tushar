import { CircularProgress, Theme, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { makeStyles } from '@mui/styles';
import React from 'react';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import { CustomDialogTransition } from 'src/constants/helpers';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  paper: {
    width: '80%',
    maxHeight: 435
  }
}));

type ConfirmationDialogRawProps = {
  title?: React.ReactNode;
  onClose: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onOk: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  open: boolean;
  message: React.ReactNode;
  okBtnLoading?: boolean;
  forwardText?: string;
  cancelText?: string;
};

export default function ConfirmationDialogRaw({
  title,
  onClose,
  onOk,
  open,
  message,
  okBtnLoading,
  forwardText = null,
  cancelText = null
}: ConfirmationDialogRawProps) {
  const classes = useStyles();
  const walkmeInstance = useGetWalkmeInstance();

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      transitionDuration={walkmeInstance ? 0 : 250}
      maxWidth="xs"
      aria-labelledby="confirmation-dialog-title"
      open={open}
      classes={{
        paper: classes.paper
      }}
      id="confirmation-dialog"
      keepMounted
    >
      <DialogTitle id="confirmation-dialog-title" className="text-white">
        {title ? title : 'Confirm'}
      </DialogTitle>
      <DialogContent dividers>{message ? <Typography>{message}</Typography> : null}</DialogContent>
      <DialogActions>
        <Button id={'confirmation-dialog-cancel-button'} size="small" autoFocus onClick={onClose} color="primary">
          {!cancelText ? 'Cancel' : cancelText}
        </Button>
        <Button id={'confirmation-dialog-confirm-button'} size="small" onClick={onOk} disabled={okBtnLoading} color="primary">
          {okBtnLoading ? <CircularProgress style={{ marginRight: '8px' }} size={20} color="inherit" /> : null}
          {!forwardText ? 'Confirm' : forwardText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

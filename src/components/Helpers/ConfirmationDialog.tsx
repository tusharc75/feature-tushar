import { CircularProgress, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import { CustomDialogTransition } from 'src/constants/helpers';

const useStyles = makeStyles((theme) => ({
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
      disableBackdropClick
      disableEscapeKeyDown
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

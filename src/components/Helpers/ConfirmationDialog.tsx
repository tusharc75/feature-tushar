import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { CircularProgress, IconButton } from '@material-ui/core';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import { Typography } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

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

export default function ConfirmationDialogRaw({ onClose, onOk, open, message, okBtnLoading, forwardText = null, cancelText = null }) {
  const classes = useStyles();

  return (
    <Dialog
      disableBackdropClick
      disableEscapeKeyDown
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
        Confirm 
      </DialogTitle>
      <DialogContent dividers>{message ? <Typography>{message}</Typography> : null}</DialogContent>
      <DialogActions>
        <Button size="small" autoFocus onClick={onClose} color="primary">
          {!cancelText ? 'Cancel' : cancelText}
        </Button>
        <Button size="small" onClick={onOk} disabled={okBtnLoading} color="primary">
          {okBtnLoading ? <CircularProgress style={{ marginRight: '8px' }} size={20} color="inherit" /> : null}
          {!forwardText ? 'Confirm' : forwardText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmationDialogRaw.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  message: PropTypes.node.isRequired,
  onOk: PropTypes.func,
  okBtnLoading: PropTypes.any
};

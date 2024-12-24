import React from 'react';
import { makeStyles } from '@mui/styles';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import { IoCloudOfflineOutline } from 'react-icons/io5';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Theme } from '@mui/material';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  paper: {
    width: '80%',
    maxHeight: 435
  },
  msg: {
    fontSize: '16px',
    fontWeight: 'normal'
  },
  contentBox: {
    color: '#a0a0a0',
    paddingTop: '30px'
  },
  title: {
    color: theme.palette.error.main,
    fontSize: '25px',
    fontWeight: 'bold'
  }
}));

export default function OfflineStatusDialog(props) {
  const classes = useStyles();

  return (
    <Dialog
      disableBackdropClick
      disableEscapeKeyDown
      TransitionComponent={CustomDialogTransition}
      maxWidth="xs"
      aria-labelledby="confirmation-dialog-title"
      open={true}
      classes={{
        paper: classes.paper
      }}
      id="confirmation-dialog"
      keepMounted
    >
      <DialogContent dividers className="d-flex align-items-center flex-column">
        <span className={classes.title}>Try Again!</span>
        <div className={`${classes.contentBox} d-flex align-items-center flex-column text-center`} color="text.grey">
          <IoCloudOfflineOutline size="40" color="text.grey" />
          <h2 className={`mt-2 ${classes.msg}`} color="text.grey">
            Your network is unavailable. Check your data or wifi connection.
          </h2>
        </div>
      </DialogContent>
    </Dialog>
  );
}

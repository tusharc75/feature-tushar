import React, { useContext } from 'react';
import { makeStyles } from '@mui/styles';
import DialogContent from '@mui/material/DialogContent';
import Dialog from '@mui/material/Dialog';
import { FaTimesCircle } from 'react-icons/fa';
import { DialogActions, Theme } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
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
  },
  msg: {
    fontSize: '16px',
    fontWeight: 'normal'
  },
  contentBox: {
    color: '#a0a0a0'
  },
  title: {
    color: theme.palette.error.main,
    fontSize: '25px',
    fontWeight: 'bold'
  }
}));

export default function RecordDeletedDialog() {
  const classes = useStyles();
  const history = useHistory();
  const { setToastConfig } = useContext(CustomToastContext);

  return (
    <Dialog
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
        {/* <span className={`${classes.title} text-center`}>You don't have access to this record</span> */}
        <div className={`${classes.contentBox} d-flex align-items-center flex-column text-center`} color="text.grey">
          <FaTimesCircle size="40" color="text.grey" className="mb-4 mt-1" />
          <h2 className={classes.msg} color="text.grey">
            Record you are trying to access is either deleted or you don't have permission to view it.
          </h2>
        </div>
      </DialogContent>

      <DialogActions>
        <ThemeButton
          onClick={() => {
            setToastConfig({ open: false, type: '', message: '' });
            history.push('/');
          }}
          buttonType="theme"
        >
          Back To Home
        </ThemeButton>
      </DialogActions>
    </Dialog>
  );
}

import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Theme, Typography } from '@mui/material';
import { CustomDialogTransition } from 'src/constants/helpers';
import { makeStyles } from '@mui/styles';

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
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500]
  }
}));

export default function ConfirmationCancelDialog(props) {
  const classes = useStyles();
  const { onClose, onSave, open, close } = props;

  return (
    <Dialog
      disableEscapeKeyDown
      TransitionComponent={CustomDialogTransition}
      maxWidth="xs"
      aria-labelledby="confirmation-dialog-title"
      open={open}
      classes={{
        paper: classes.paper
      }}
      id="confirmation-dialog"
      keepMounted
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <DialogTitle id="confirmation-dialog-title" className="text-white">
        Confirm
        {onClose ? (
          <IconButton title="Close Confirm Dialog" aria-label="close" className={classes.closeButton} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        <Typography>Do you want to save changes or leave?</Typography>
      </DialogContent>
      <DialogActions>
        <Button title="Leave Form" id="confirm-dialog-cancel-button" size="small" autoFocus onClick={onClose} color="primary">
          Leave
        </Button>
        <Button title="Save and Close" size="small" id="confirm-dialog-confirm-button" onClick={onSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmationCancelDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  onSave: PropTypes.func,
  close: PropTypes.func
};

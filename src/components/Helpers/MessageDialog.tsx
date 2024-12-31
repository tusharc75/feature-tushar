import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import { Theme, Typography } from '@mui/material';
import { CustomDialogTransition } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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

export default function MessageDialog({ onClose, open, message, header = 'Message' }) {
  const classes = useStyles();

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
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
        {header}
      </DialogTitle>
      <DialogContent dividers>{message ? <Typography>{message}</Typography> : null}</DialogContent>
      <DialogActions>
        <ThemeButton buttonType='transparent' onClick={onClose}>
          Close
        </ThemeButton>
      </DialogActions>
    </Dialog>
  );
}

MessageDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired
};

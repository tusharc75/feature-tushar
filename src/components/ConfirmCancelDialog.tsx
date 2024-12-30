import CloseIcon from '@mui/icons-material/Close';
import { Theme, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { makeStyles } from '@mui/styles';
import { ThemeButton } from 'src/components/Helpers/Buttons';
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

type ConfirmDialogProps = {
  onClose: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  open: boolean;
  onSave?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export default function ConfirmationCancelDialog({ onClose, onSave, open }: ConfirmDialogProps) {
  const classes = useStyles();

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
      <DialogTitle
        id="confirmation-dialog-title"
        className="flex min-h-[54px] items-center justify-between bg-[#1c1c31] px-4 py-2 text-white dark:bg-[#1a1a26]"
      >
        Confirm
        {onClose ? (
          <IconButton title="Close Confirm Dialog" aria-label="close" className={'text-white [transform:translateX(8px)]'} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        <Typography>Do you want to save changes or leave?</Typography>
      </DialogContent>
      <DialogActions className="bg-[#ebebeb] dark:bg-[#1a1a26]">
        <ThemeButton
          buttonType='transparent'
          onClick={onClose}
          autoFocus
          id="confirm-dialog-cancel-button"
        >
          Leave
        </ThemeButton>
        <ThemeButton
          buttonType='theme'
          onClick={onSave}
          id="confirm-dialog-confirm-button"
        >
          Save
        </ThemeButton>
      </DialogActions>
    </Dialog>
  );
}

import { Theme, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { makeStyles } from '@mui/styles';
import React from 'react';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
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
      <DialogTitle
        id="confirmation-dialog-title"
        className="flex min-h-[54px] items-center justify-between bg-[#1c1c31] px-4 py-2 text-white dark:bg-[#1a1a26]"
      >
        {title ? title : 'Confirm'}
      </DialogTitle>
      <DialogContent dividers>{message ? <Typography>{message}</Typography> : null}</DialogContent>
      <DialogActions className="bg-[#ebebeb] dark:bg-[#1a1a26]">
        <ThemeButton
          id={'confirmation-dialog-cancel-button'}
          buttonType="transparent"
          onClick={onClose}
        >
          {!cancelText ? 'Cancel' : cancelText}
        </ThemeButton>
        <ThemeButton
          id={'confirmation-dialog-confirm-button'}
          disabled={okBtnLoading}
          buttonType="theme"
          isLoading={okBtnLoading}
          onClick={onOk}
        >
          {!forwardText ? 'Confirm' : forwardText}
        </ThemeButton>
      </DialogActions>
    </Dialog>
  );
}

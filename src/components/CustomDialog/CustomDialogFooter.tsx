import React from 'react';
import MuiDialogActions from '@mui/material/DialogActions';
import type { DialogActionsProps } from '@mui/material/DialogActions';
import { withStyles } from '@mui/styles';
import { Theme } from '@mui/material';
import { cn } from 'src/constants/helpers';

interface CustomDialogFooterProps extends DialogActionsProps {}

const DialogActions = withStyles((theme: Theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1.5, 2)
  }
}))(MuiDialogActions);

function CustomDialogFooter({ children, className = '', ...others }: CustomDialogFooterProps) {
  return (
    <React.Fragment>
      <DialogActions className={cn(`overscroll-contain bg-[#ebebeb] py-2 dark:bg-[#1a1a26]`, className)} {...others}>
        {children}
      </DialogActions>
    </React.Fragment>
  );
}

export default CustomDialogFooter;

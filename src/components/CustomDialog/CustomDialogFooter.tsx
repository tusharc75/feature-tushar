import React from 'react';
import MuiDialogActions from '@mui/material/DialogActions';
import type { DialogActionsProps } from '@mui/material/DialogActions';
import { withStyles } from '@mui/styles';
import { Theme } from '@mui/material';

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
      <DialogActions className={`${className} overscroll-contain`} {...others}>
        {children}
      </DialogActions>
    </React.Fragment>
  );
}

export default CustomDialogFooter;

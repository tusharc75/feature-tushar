import React from 'react';
import { withStyles } from '@material-ui/core';
import MuiDialogActions from '@material-ui/core/DialogActions';
import type { DialogActionsProps } from '@material-ui/core/DialogActions';

interface CustomDialogFooterProps extends DialogActionsProps {}

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1.5, 2)
  }
}))(MuiDialogActions);

function CustomDialogFooter({ children, ...others }: CustomDialogFooterProps) {
  return (
    <React.Fragment>
      <DialogActions {...others}>{children}</DialogActions>
    </React.Fragment>
  );
}

export default CustomDialogFooter;

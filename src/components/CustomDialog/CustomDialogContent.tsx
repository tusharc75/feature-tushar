import React from 'react';
import { withStyles } from '@material-ui/core';
import MuiDialogContent, { DialogContentProps } from '@material-ui/core/DialogContent';
import { useAppTheme } from 'src/constants/AppConfig';

const DialogContent = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1, 2)
  }
}))(MuiDialogContent);

function CustomDialogContent({ children, style = {}, ...others }: DialogContentProps) {
  const [themeColor] = useAppTheme();
  return (
    <React.Fragment>
      <DialogContent
        className="!max-h-[calc(100svh-110px)]"
        style={{ ...style, background: themeColor === 'dark' ? 'var(--dark-primary)' : '#fff' }}
        {...others}
      >
        {children}
      </DialogContent>
    </React.Fragment>
  );
}

export default CustomDialogContent;

import React from 'react';
import { withStyles } from '@material-ui/core';
import MuiDialogContent from '@material-ui/core/DialogContent';
import PropTypes from 'prop-types';
import { useAppTheme } from 'src/constants/AppConfig';

const DialogContent = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1, 2)
  }
}))(MuiDialogContent);

function CustomDialogContent({ children, style = {} }) {
  const [themeColor] = useAppTheme();
  return (
    <React.Fragment>
      <DialogContent style={{ ...style, background: themeColor === 'dark' ? 'var(--dark-primary)' : '#fff' }}>{children}</DialogContent>
    </React.Fragment>
  );
}

CustomDialogContent.propTypes = {
  children: PropTypes.any
};

export default CustomDialogContent;

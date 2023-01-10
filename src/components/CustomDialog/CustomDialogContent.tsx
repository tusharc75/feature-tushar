import React from 'react';
import { withStyles } from '@material-ui/core';
import MuiDialogContent from '@material-ui/core/DialogContent';
import PropTypes from 'prop-types';

const DialogContent = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1, 2)
  }
}))(MuiDialogContent);

function CustomDialogContent({ children, style = {} }) {
  return (
    <React.Fragment>
      <DialogContent style={style}>{children}</DialogContent>
    </React.Fragment>
  );
}

CustomDialogContent.propTypes = {
  children: PropTypes.any
};

export default CustomDialogContent;

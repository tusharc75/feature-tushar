import React from 'react'
import {
  IconButton,
  Typography,
  makeStyles,
} from "@material-ui/core";
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import CloseIcon from "@material-ui/icons/Close";
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1.5, 1.5, 1.5, 2),
    // borderBottom: `1px solid #daf5ff`
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(1.5),
    top: theme.spacing(1.5),
    color: theme.palette.grey[500],
  },
  dialogTitle: {
    fontSize: "1.2rem"
  }
}));

export const DialogTitle = ({ title, onClose }) => {
  const classes = useStyles();

  return (
    <React.Fragment>
      <MuiDialogTitle disableTypography className={classes.root}>
        <Typography variant="h6" className={classes.dialogTitle}>{title}</Typography>
        {
          onClose && <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={onClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        }
      </MuiDialogTitle>
    </React.Fragment>
  )
}

DialogTitle.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func
}

export const DialogContent = withStyles(theme => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

export const DialogActions = withStyles(theme => ({
  root: {
    borderTop: `1px solid ${theme.palette.divider}`,
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);



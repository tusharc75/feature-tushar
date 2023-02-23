import React from 'react';
import { IconButton, Typography, makeStyles, Box } from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import CloseIcon from '@material-ui/icons/Close';
import PropTypes from 'prop-types';
import { FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { isMobile, isTablet } from 'react-device-detect';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1.5, 1.5, 1.5, 2)
    // borderBottom: `1px solid #daf5ff`
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1.5),
    top: theme.spacing(1.5),
    color: theme.palette.grey[500]
  },
  dialogTitle: {
    fontSize: '1.2rem'
  }
}));

function CustomDialogHeader({
  title,
  onClose,
  showManimizeMaximize = false,
  showRequiredLabel = true,
  isMinimized = true,
  onMinimizeMaximize = () => { },
  style = {},
  additionalTitle = null
}) {
  const classes = useStyles();

  return (
    <React.Fragment>
      <MuiDialogTitle disableTypography className={classes.root}>
        <Box display={'flex'}>
          <Box>
            <Typography variant="h6" className={`${classes.dialogTitle} title-layout text-truncate`} style={style}>
              {title}
            </Typography>
          </Box>
          {additionalTitle && additionalTitle}
        </Box>
        <div className={`${classes.closeButton} close`}>
          {showRequiredLabel && (
            <span className="form-label-style required-text mr-2" style={{ borderBottom: 'none' }}>
              * Required Fields
            </span>
          )}
          {showManimizeMaximize && !(isMobile || isTablet) && (
            <IconButton aria-label="close" onClick={onMinimizeMaximize} size="small" className="mr-2 close-button">
              {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
            </IconButton>
          )}
          {onClose && (
            <IconButton aria-label="close" onClick={onClose} size="small">
              <CloseIcon className="close-button" />
            </IconButton>
          )}
        </div>
      </MuiDialogTitle>
    </React.Fragment>
  );
}

CustomDialogHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  isMinimized: PropTypes.bool,
  onMinimizeMaximize: PropTypes.func,
  showManimizeMaximize: PropTypes.bool
};

export default CustomDialogHeader;

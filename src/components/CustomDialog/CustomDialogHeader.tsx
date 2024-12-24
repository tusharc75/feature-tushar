import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Typography } from '@mui/material';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { makeStyles } from '@mui/styles';
import React from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1.5, 1.5, 1.5, 2),
    display: 'flex'
    // background: '#282845'

    // borderBottom: `1px solid #daf5ff`
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1.5),
    top: theme.spacing(1.5),
    color: theme.palette.grey[500]
  },
  dialogTitle: {
    fontSize: '1.2rem',
    display: 'inline-flex',
    alignItems: 'center'
  }
}));

type CustomDialogHeaderProps = {
  title: React.ReactNode;
  onClose: () => void;
  showManimizeMaximize?: boolean;
  showRequiredLabel?: boolean;
  isMinimized?: boolean;
  onMinimizeMaximize?: () => void;
  style?: object;
  additionalTitle?: React.ReactNode;
};

function CustomDialogHeader({
  title,
  onClose,
  showManimizeMaximize = false,
  showRequiredLabel = true,
  isMinimized = true,
  onMinimizeMaximize = () => {},
  style = {},
  additionalTitle = null
}: CustomDialogHeaderProps) {
  const classes = useStyles();

  const maxWidth = React.useMemo(() => {
    let tempWidth = 0;
    const onCloseButtonWidth = 30;
    const showManimizeMaximizeWidth = 32;
    const showRequiredLabelWidth = 121;
    if (onClose) {
      tempWidth += onCloseButtonWidth;
    }
    if (showManimizeMaximize) {
      tempWidth += showManimizeMaximizeWidth;
    }
    if (showRequiredLabel) {
      tempWidth += showRequiredLabelWidth;
    }
    return tempWidth;
  }, [showRequiredLabel, showManimizeMaximize, onClose, title, additionalTitle]);

  return (
    <React.Fragment>
      <MuiDialogTitle disableTypography className={`${classes.root}`}>
        <Typography
          variant="h6"
          className={`${classes.dialogTitle} title-layout text-truncate`}
          style={{ ...style, maxWidth: `calc(100% - ${maxWidth}px)` }}
        >
          {title}
          {additionalTitle && <span className="text-truncate">{additionalTitle}</span>}
        </Typography>
        <div className={`${classes.closeButton} close`}>
          {showRequiredLabel && (
            <span className="form-label-style required-text mr-2" style={{ borderBottom: 'none' }}>
              * Required Fields
            </span>
          )}
          {showManimizeMaximize && !(isMobile || isTablet) && (
            <IconButton aria-label="close" onClick={onMinimizeMaximize} size="small" className="close-button mr-2">
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

export default CustomDialogHeader;

import CloseIcon from '@mui/icons-material/Close';
import { DialogTitle, IconButton, Typography } from '@mui/material';

import React from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';

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
      <DialogTitle component={'div'} className={`flex justify-between bg-[#1c1c31] py-3 text-white dark:bg-[#1a1a26]`}>
        <h2
          className={` title-layout text-truncate text-xl font-semibold leading-[1.5]`}
          style={{ ...style, maxWidth: `calc(100% - ${maxWidth}px)` }}
        >
          {title}
          {additionalTitle && <span className="text-truncate">{additionalTitle}</span>}
        </h2>
        <div className={` close`}>
          {showRequiredLabel && (
            <span className="form-label-style required-text mr-2" style={{ borderBottom: 'none' }}>
              * Required Fields
            </span>
          )}
          {showManimizeMaximize && !(isMobile || isTablet) && (
            <IconButton aria-label="close" onClick={onMinimizeMaximize} size="small" className="close-button mr-2 text-white">
              {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
            </IconButton>
          )}
          {onClose && (
            <IconButton aria-label="close" onClick={onClose} size="small" className="text-white">
              <CloseIcon className="close-button " />
            </IconButton>
          )}
        </div>
      </DialogTitle>
    </React.Fragment>
  );
}

export default CustomDialogHeader;

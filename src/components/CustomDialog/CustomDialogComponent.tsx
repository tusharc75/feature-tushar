import React from 'react';
import CustomDialogHeader from './CustomDialogHeader';
import CustomDialogContent from './CustomDialogContent';
import CustomDialogFooter from './CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';

import PropTypes from 'prop-types';
import { Button, Dialog } from '@mui/material';
import { useAppTheme } from 'src/constants/AppConfig';
import { CustomDialogTransition } from 'src/constants/helpers';

// Under Construction - Don't Use It Right Now: Punit
function CustomDialogComponent({ title, open, onClose, children }) {
  const [themeColor] = useAppTheme();
  return (
    <Dialog
      disableBackdropClick={true}
      maxWidth="md"
      open={open}
      onClose={onClose}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="form-dialog-title"
      fullScreen={isMobile || isTablet}
      fullWidth
      PaperProps={{ style: { background: themeColor === 'dark' ? 'var(--dark-primary)' : '#fff' }, className: 'overscroll-contain' }}
    >
      {title && <CustomDialogHeader title={title} onClose={onClose}></CustomDialogHeader>}

      <CustomDialogContent style={{ background: themeColor === 'dark' ? 'var(--dark-primary)' : '#fff' }}>{children}</CustomDialogContent>

      <CustomDialogFooter>
        <Button color="primary" size="small" onClick={onClose}>
          Close
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}

CustomDialogComponent.propTypes = {
  text: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.any
};

export default CustomDialogComponent;

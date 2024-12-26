import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import '../sidebar.scss';
import { isMobile } from 'react-device-detect';
import { MdRateReview } from 'react-icons/md';

function CustomButton(props) {
  const { loading, children, disabled, ...rest } = props;
  return (
    <Button {...rest} disabled={disabled} size={'small'} variant={'contained'} endIcon={loading && <CircularProgress size={18} color="inherit" />}>
      {children}
    </Button>
  );
}
export default CustomButton;

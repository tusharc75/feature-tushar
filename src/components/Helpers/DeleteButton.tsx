import React from 'react';
import { Button } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteIcon from '@material-ui/icons/Delete';

function DeleteButton({ text, onClick, ...rest }) {
  return (
    <Button className={'btn-outline-red-v1'} variant={isMobile && !isTablet ? 'text' : 'contained'} size="small" onClick={onClick} {...rest}>
      {isMobile && !isTablet ? <DeleteIcon style={{ fontSize: 18 }} /> : text}
    </Button>
  );
}

export default DeleteButton;

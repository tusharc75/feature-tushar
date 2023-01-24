import React from 'react';
import { Button } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';

function DeleteButton({ text, onClick, ...rest }) {
  return (
    <Button className={'btn-outline-red-v1'} size="small" onClick={onClick} {...rest}>
      {text}
    </Button>
  );
}

export default DeleteButton;

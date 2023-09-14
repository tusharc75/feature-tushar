import React from 'react';
import { Button, ButtonProps } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteIcon from '@material-ui/icons/Delete';

export type DeleteButtonProps = {
  text: string | React.ReactNode;
  mode?: 'dark' | 'light';
} & ButtonProps;

function DeleteButton({ text, onClick, children, mode = 'dark', ...rest }: DeleteButtonProps) {
  return (
    <Button className={`btn-outline-red-v1 ${mode}`} variant={isMobile && !isTablet ? 'text' : 'contained'} size="small" onClick={onClick} {...rest}>
      {children ? children : isMobile && !isTablet ? <DeleteIcon style={{ fontSize: 18 }} /> : text}
    </Button>
  );
}

export default DeleteButton;

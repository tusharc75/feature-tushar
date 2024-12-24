import React from 'react';
import { Button, ButtonProps, useMediaQuery } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';

export type DeleteButtonProps = {
  text: string | React.ReactNode;
  mode?: 'dark' | 'light';
  isVisible?: boolean;
} & ButtonProps;

function DeleteButton({ text, onClick, children, mode = 'dark', isVisible = true, ...rest }: DeleteButtonProps) {
  const isMobile = useMediaQuery('(max-width:600px)');

  if (!isVisible) return null;
  return (
    <Button className={`btn-outline-red-v1 ${mode}`} variant={isMobile ? 'text' : 'contained'} size="small" onClick={onClick} {...rest}>
      {children ? children : isMobile ? <DeleteIcon style={{ fontSize: 18 }} /> : text}
    </Button>
  );
}

export default DeleteButton;

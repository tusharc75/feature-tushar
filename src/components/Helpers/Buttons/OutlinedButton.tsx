import React, { ReactNode } from 'react';
import { Button, ButtonProps, useMediaQuery } from '@material-ui/core';
import { FaMobileButton } from 'react-icons/fa6';

export type OutlinedButtonProps = {
  mode?: 'dark' | 'light';
  icon?: ReactNode;
  withBorder?: boolean;
} & ButtonProps;

function OutlinedButton({ children, mode = 'dark', icon = <FaMobileButton size={18} />, withBorder = true, ...rest }: OutlinedButtonProps) {
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <Button
      className={`btn-outline-v1 ${withBorder ? 'with-border' : ''} max-[600px]:[max-width:36px_!important] max-[600px]:[height:32px_!important]`}
      variant={isMobile ? 'text' : 'outlined'}
      size="small"
      {...rest}
    >
      {isMobile ? icon : children}
    </Button>
  );
}

export default OutlinedButton;

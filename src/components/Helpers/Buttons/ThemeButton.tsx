import React, { ReactNode } from 'react';
import { Button, ButtonProps, useMediaQuery } from '@material-ui/core';
import { FaMobileButton } from 'react-icons/fa6';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type SimpleButton = {
  borderColor: 'none';
  iconForMobile: ReactNode;
  variant: 'contained';
  tooltip?: string;
} & Omit<ButtonProps, 'variant'>;

type OutlinedButtonProps = {
  borderColor: 'default';
  iconForMobile: ReactNode;
  hasMobileBorder?: boolean;
  tooltip?: string;
} & ButtonProps;

type RedOutlineProps = {
  borderColor: 'red';
  iconForMobile: ReactNode;
  hasMobileBorder?: boolean;
  mode?: 'dark' | 'light';
  tooltip?: string;
} & ButtonProps;

type ButtonType = OutlinedButtonProps | RedOutlineProps | SimpleButton;

const ThemeButton = ({
  borderColor = 'default',
  iconForMobile = <FaMobileButton size={18} />,
  variant,
  children,
  tooltip = '',
  ...rest
}: ButtonType) => {
  const isMobile = useMediaQuery('(max-width:600px)');

  let className = `max-[600px]:[max-width:36px_!important] max-[600px]:[height:32px_!important] `;

  switch (borderColor) {
    case 'default': {
      const { hasMobileBorder = true } = rest as RedOutlineProps;
      className += ` btn-outline-v1 ${hasMobileBorder ? 'with-border' : ''}`;
      break;
    }
    case 'red': {
      const { mode, hasMobileBorder = true } = rest as RedOutlineProps;
      className += ` btn-outline-red-v1 ${mode} ${hasMobileBorder ? 'with-border' : ''}`;
      break;
    }
    default:
      break;
  }

  return (
    <HtmlTooltip title={tooltip} placement="top" arrow enterTouchDelay={0}>
      <Button className={`${className}`} variant={isMobile ? 'text' : 'outlined'} size="small" {...rest}>
        {isMobile ? iconForMobile : children}
      </Button>
    </HtmlTooltip>
  );
};

export default ThemeButton;

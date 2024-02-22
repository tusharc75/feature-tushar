import React, { ReactNode, useMemo } from 'react';
import { Button, ButtonProps, useMediaQuery } from '@material-ui/core';
import { FaMobileButton } from 'react-icons/fa6';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type SimpleButton = {
  borderColor?: 'none';
  iconForMobile: ReactNode | boolean;
  tooltip?: string;
} & Omit<ButtonProps, 'variant'>;

type OutlinedButtonProps = {
  borderColor?: 'default';
  iconForMobile: ReactNode | boolean;
  hasMobileBorder?: boolean;
  tooltip?: string;
} & ButtonProps;

type RedOutlineProps = {
  borderColor?: 'red';
  iconForMobile: ReactNode | boolean;
  hasMobileBorder?: boolean;
  mode?: 'dark' | 'light';
  tooltip?: string;
} & ButtonProps;

type ButtonType = OutlinedButtonProps | RedOutlineProps | SimpleButton;

const ThemeButton = ({ borderColor = 'default', iconForMobile = <FaMobileButton size={18} />, children, tooltip = '', ...rest }: ButtonType) => {
  const isMobile = useMediaQuery('(max-width:600px)');

  const getButtonProps = useMemo(() => {
    const buttonProps: Pick<ButtonProps, 'className' | 'variant'> = {
      className: `${iconForMobile ? 'max-[600px]:[max-width:36px_!important] max-[600px]:[height:32px_!important]' : ''} no-shadow`,
      variant: 'contained'
    };

    switch (borderColor) {
      case 'default': {
        const { hasMobileBorder = true } = rest as OutlinedButtonProps;
        buttonProps.variant = isMobile && iconForMobile ? 'text' : 'outlined';
        buttonProps.className += ` btn-outline-v1 ${hasMobileBorder ? 'with-border' : ''}`;
        break;
      }
      case 'red': {
        const { mode, hasMobileBorder = true } = rest as RedOutlineProps;
        buttonProps.variant = isMobile && iconForMobile ? 'text' : 'outlined';
        buttonProps.className += ` btn-outline-red-v1 ${mode} ${hasMobileBorder ? 'with-border' : ''}`;
        break;
      }
      case 'none': {
        buttonProps.className += ` `;
        buttonProps.variant = 'contained';
        break;
      }
      default:
        break;
    }
    return buttonProps;
  }, [borderColor, isMobile, rest]);

  return (
    <HtmlTooltip title={tooltip} placement="top" arrow enterTouchDelay={0}>
      <Button size="small" {...rest} {...getButtonProps}>
        {isMobile ? (iconForMobile ? iconForMobile : children) : children}
      </Button>
    </HtmlTooltip>
  );
};

export default ThemeButton;

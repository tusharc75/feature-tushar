import React, { ReactNode, useMemo } from 'react';
import { Button, ButtonProps, CircularProgress, useMediaQuery } from '@material-ui/core';
import { FaMobileButton } from 'react-icons/fa6';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type SimpleButton = {
  borderColor?: 'none';
  iconForMobile?: ReactNode | boolean;
  tooltip?: string;
  mobileTooltip?: string;
  isLoading?: boolean;
  isVisible?: boolean;
} & Omit<ButtonProps, 'variant'>;

type OutlinedButtonProps = {
  borderColor?: 'default';
  iconForMobile?: ReactNode | boolean;
  hasMobileBorder?: boolean;
  mobileTooltip?: string;
  tooltip?: string;
  isLoading?: boolean;
  isVisible?: boolean;
} & ButtonProps;

type RedOutlineProps = {
  borderColor?: 'red';
  iconForMobile?: ReactNode | boolean;
  hasMobileBorder?: boolean;
  mode?: 'dark' | 'light';
  tooltip?: string;
  mobileTooltip?: string;
  isLoading?: boolean;
  isVisible?: boolean;
} & ButtonProps;

export type ButtonType = OutlinedButtonProps | RedOutlineProps | SimpleButton;

const ThemeButton = ({
  borderColor = 'default',
  iconForMobile = <FaMobileButton size={18} />,
  children,
  tooltip = '',
  isLoading,
  disabled,
  className,
  startIcon,
  endIcon,
  isVisible = true,
  mobileTooltip,
  ...rest
}: ButtonType) => {
  const isMobile = useMediaQuery('(max-width:600px)');

  const getButtonProps = useMemo(() => {
    const buttonProps: Pick<ButtonProps, 'className' | 'variant'> = {
      className: `${iconForMobile ? 'max-[600px]:[max-width:36px_!important] [height:32px_!important]' : ''} no-shadow min-h-[32px] ${className}`,
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

  const loader = useMemo(() => (isLoading ? <CircularProgress size={22} color="inherit" className="ml-1" /> : ''), [isLoading]);

  if (!isVisible) return <></>;

  return (
    <HtmlTooltip title={tooltip ? tooltip : mobileTooltip && isMobile ? mobileTooltip : ''} placement="top" arrow enterTouchDelay={0}>
      <span>
        <Button size="small" disabled={disabled || isLoading} {...rest} {...getButtonProps}>
          {isMobile ? (
            iconForMobile ? (
              <>
                {iconForMobile} {loader}
              </>
            ) : (
              <>
                {children} {loader}
              </>
            )
          ) : (
            <>
              {startIcon && <span className="max-h-[16px] [&>svg]:-ml-[2px] [&>svg]:mr-2 [&>svg]:text-[18px]">{startIcon}</span>}
              {children} {loader}
              {endIcon && <span className="max-h-[16px] [&>svg]:-mr-[2px] [&>svg]:ml-2 [&>svg]:text-[18px]">{endIcon}</span>}
            </>
          )}
        </Button>
      </span>
    </HtmlTooltip>
  );
};

export default ThemeButton;

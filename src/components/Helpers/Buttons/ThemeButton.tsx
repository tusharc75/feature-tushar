import { Button, ButtonProps, CircularProgress, useMediaQuery } from '@mui/material';
import React, { ReactNode, useMemo } from 'react';
import { FaMobileButton } from 'react-icons/fa6';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';

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

type ThemeOutlinedButtonProps = {
  borderColor?: 'theme';
  iconForMobile?: ReactNode | boolean;
  hasMobileBorder?: boolean;
  mobileTooltip?: string;
  tooltip?: string;
  isLoading?: boolean;
  isVisible?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

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

type YellowProps = {
  borderColor?: 'yellow';
  iconForMobile?: ReactNode | boolean;
  mode?: 'dark' | 'light';
  tooltip?: string;
  mobileTooltip?: string;
  isLoading?: boolean;
  isVisible?: boolean;
} & ButtonProps;

export type ButtonType = OutlinedButtonProps | RedOutlineProps | SimpleButton | ThemeOutlinedButtonProps | YellowProps;

const ThemeButton = React.forwardRef<HTMLButtonElement, ButtonType>(
  (
    {
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
    },
    ref
  ) => {
    const isMobile = useMediaQuery('(max-width:600px)');

    const getButtonProps = useMemo(() => {
      const buttonProps: Pick<ButtonProps, 'className' | 'variant'> = {
        className: cn(`${iconForMobile ? 'max-[600px]:[max-width:36px_!important] [height:32px_!important] no-shadow' : ''} h-[32px]`, className),
        variant: 'contained'
      };

      switch (borderColor) {
        case 'default': {
          const { hasMobileBorder = true } = rest as OutlinedButtonProps;
          buttonProps.variant = isMobile && iconForMobile ? 'text' : 'outlined';
          buttonProps.className += ` btn-outline-v1   ${hasMobileBorder ? 'with-border' : ''}`;
          break;
        }
        case 'yellow': {
          buttonProps.variant = isMobile && iconForMobile ? 'text' : 'outlined';
          buttonProps.className += ` new-dropdown-v1`;
          break;
        }
        case 'red': {
          const { mode, hasMobileBorder = true } = rest as RedOutlineProps;
          buttonProps.variant = isMobile && iconForMobile ? 'text' : 'outlined';
          buttonProps.className += ` btn-outline-red-v1   ${mode} ${hasMobileBorder ? 'with-border' : ''}`;
          break;
        }
        case 'theme': {
          buttonProps.className += ` btn-theme-outline-v1  ripple`;
          break;
        }
        case 'none': {
          buttonProps.className += ``;
          buttonProps.variant = 'contained';
          break;
        }
        default:
          break;
      }
      return buttonProps;
    }, [borderColor, className, iconForMobile, isMobile, rest]);

    const loader = useMemo(() => (isLoading ? <CircularProgress size={22} color="inherit" className="ml-1" /> : ''), [isLoading]);

    if (!isVisible) return <></>;

    return (
      <HtmlTooltip title={tooltip ? tooltip : mobileTooltip && isMobile ? mobileTooltip : ''} placement="top" arrow enterTouchDelay={0}>
        {borderColor === 'theme' ? (
          <button ref={ref} disabled={disabled || isLoading} {...rest} {...(getButtonProps as any)}>
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
          </button>
        ) : (
          <Button ref={ref} size="small" disabled={disabled || isLoading} {...rest} {...(getButtonProps as any)}>
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
        )}
      </HtmlTooltip>
    );
  }
);

export default ThemeButton;

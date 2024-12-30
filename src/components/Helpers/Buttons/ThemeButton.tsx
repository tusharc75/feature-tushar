import { Button, ButtonProps, CircularProgress, useMediaQuery } from '@mui/material';
import React, { ReactNode, useMemo } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type MButtonProps = Omit<ButtonProps, 'variant' | 'color'>;
type BackgroundColors = ButtonProps['color'] | 'yellow' | 'theme';
type BorderColors = 'none' | 'theme' | 'red' | 'yellow' | 'default';
type TextColors = 'primary' | 'red' | 'white' | 'theme';

export type ButtonType = {
  tooltip?: string;
  mobileTooltip?: string;
  isLoading?: boolean;
  visible?: boolean;
  backgroundColor?: BackgroundColors;
  iconForMobile?: ReactNode;
  borderColor?: BorderColors;
  textColor?: TextColors;
} & Partial<GetButtonStyle> &
  MButtonProps;

export type BorderedButtonType = {
  tooltip?: string;
  mobileTooltip?: string;
  isLoading?: boolean;
  visible?: boolean;
  backgroundColor?: 'none';
  iconForMobile?: ReactNode;
  borderColor?: BorderColors;
  textColor?: TextColors;
  mode?: 'dark' | 'light';
} & Partial<GetButtonStyle> &
  MButtonProps;

export type ThemeButtonProps = BorderedButtonType | ButtonType;

type GetButtonStyle = {
  borderColor: BorderColors;
  backgroundColor: BackgroundColors | 'none';
  iconForMobile?: ReactNode;
  textColor: TextColors;
  isMobile: boolean;
  mode?: 'dark' | 'light';
  sx: ButtonProps['sx'];
};

const getButtonStyle = ({
  borderColor = 'default',
  backgroundColor = 'none',
  mode = 'dark',
  textColor = 'primary',
  iconForMobile = false,
  isMobile,
  sx = {}
}: GetButtonStyle): ButtonProps => {
  const buttonProps: ButtonProps = {
    sx: {
      height: '32px',
      fontSize: '13px',
      gap: '5px',
      alignItems: 'center',
      '& .MuiButton-icon': {
        margin: 0,
        '&>:nth-of-type(1)': {
          fontSize: '18px'
        }
      },
      '& .MuiButton-endIcon': { marginRight: '-5px' },
      '& .MuiButton-startIcon': { marginLeft: '-5px' },
      fontWeight: 500,
      ...sx
    }
  };

  switch (backgroundColor) {
    case 'none': {
      buttonProps.variant = 'outlined';
      buttonProps.sx = {
        ...buttonProps.sx,
        ...(mode === 'dark' ? { background: 'var(--dark-primary, white)' } : { background: 'var(--dark-secondary, white)' })
      };
      break;
    }
    case 'error':
    case 'info':
    case 'inherit':
    case 'primary':
    case 'secondary':
    case 'success':
    case 'warning': {
      buttonProps.variant = 'contained';
      buttonProps.color = backgroundColor;
      buttonProps.sx = { ...buttonProps.sx, padding: '4px 10px' };
      break;
    }
    case 'theme': {
      buttonProps.sx = {
        ...buttonProps.sx,
        background: 'var(--new-theme-color)',
        '&:hover': {
          backgroundColor: 'var(--new-theme-color-hover)'
        },
        '&:disabled': {
          backgroundColor: 'var(--new-theme-color-hover)'
        }
      };
      buttonProps.variant = 'contained';
      buttonProps.sx = { ...buttonProps.sx, padding: '4px 10px' };
      break;
    }
    case 'yellow': {
      buttonProps.sx = {
        ...buttonProps.sx,
        background: 'var(--new-theme-secondary-color)',
        color: 'black',
        '&:disabled': { background: 'var(--new-theme-secondary-color-hover)', opacity: 0.7, color: 'black' },
        '&:hover': { background: 'var(--new-theme-secondary-color-hover)' }
      };
      buttonProps.variant = 'contained';
      buttonProps.sx = { ...buttonProps.sx, padding: '4px 10px' };
      break;
    }
  }
  switch (borderColor) {
    case 'default': {
      buttonProps.sx = { ...buttonProps.sx, border: '1px solid var(--common-border-color)' };
      break;
    }
    case 'none': {
      buttonProps.sx = { ...buttonProps.sx, border: '1px solid transparent' };
      break;
    }
    case 'red': {
      buttonProps.sx = { ...buttonProps.sx, border: '1px solid var(--common-red-border-color)' };
      break;
    }
    case 'theme': {
      buttonProps.sx = { ...buttonProps.sx, border: '1px solid var(--new-theme-color)', fontWeight: '600' };
      break;
    }
    case 'yellow': {
      buttonProps.sx = { ...buttonProps.sx, border: '1px solid var(--new_theme_secondary_border_color)', color: 'black' };
      break;
    }
  }
  switch (textColor) {
    case 'primary': {
      if (borderColor !== 'yellow' && backgroundColor !== 'yellow') {
        buttonProps.sx = { ...buttonProps.sx, color: 'var(--primary-button-text)' };
      }
      break;
    }
    case 'red': {
      buttonProps.sx = { ...buttonProps.sx, color: '#d43e3e' };
      break;
    }
    case 'white': {
      buttonProps.sx = { ...buttonProps.sx, color: 'white', '&:disabled': { color: 'white' } };
      break;
    }
    case 'theme': {
      buttonProps.sx = { ...buttonProps.sx, color: 'var(--new-theme-color)' };
      break;
    }
  }
  if (isMobile && iconForMobile) {
    buttonProps.sx = {
      ...buttonProps.sx,
      width: '34px',
      height: '32px',
      padding: '3px',
      minWidth: 'unset',
      '& svg': { maxWidth: 20, maxHeight: 20, width: '100%', height: '100%' }
    };
  }

  return buttonProps;
};

const getChildren = ({
  isMobile,
  children,
  iconForMobile,
  loader,
  isLoading
}: {
  isMobile: boolean;
  children: React.ReactNode;
  iconForMobile: React.ReactNode;
  loader: React.ReactNode;
  isLoading: boolean;
}) => {
  if (isMobile && iconForMobile && isLoading) {
    return loader;
  }
  if (isMobile && iconForMobile) {
    return iconForMobile;
  }
  if (isLoading) {
    return (
      <>
        {children}
        {loader}
      </>
    );
  }
  return children;
};

const ThemeButton = React.forwardRef<HTMLButtonElement, ThemeButtonProps>(
  (
    {
      borderColor = 'default',
      mode = 'dark',
      iconForMobile,
      tooltip = '',
      mobileTooltip = '',
      isLoading,
      visible = true,
      backgroundColor = 'none',
      startIcon,
      endIcon,
      textColor = 'primary',
      children,
      disabled,
      sx,
      ...rest
    },
    ref
  ) => {
    const isMobile = useMediaQuery('(max-width:600px)');
    const loader = useMemo(() => (isLoading ? <CircularProgress size={18} color="inherit" className="ml-1" /> : null), [isLoading]);
    const shouldRenderIcons = (isMobile && !Boolean(iconForMobile)) || !isMobile;
    const updatedChildren = useMemo(
      () => getChildren({ isMobile, children, iconForMobile, loader, isLoading }),
      [children, iconForMobile, isLoading, isMobile, loader]
    );
    const buttonStyles = useMemo(
      () => getButtonStyle({ borderColor, backgroundColor, mode, textColor, iconForMobile, isMobile, sx }),
      [borderColor, backgroundColor, mode, textColor, iconForMobile, isMobile, sx]
    );

    return (
      <HtmlTooltip title={tooltip ? tooltip : mobileTooltip && isMobile ? mobileTooltip : ''}>
        <Button
          ref={ref}
          disableElevation
          disabled={disabled || isLoading}
          startIcon={shouldRenderIcons && startIcon}
          endIcon={shouldRenderIcons && endIcon}
          {...buttonStyles}
          {...rest}
        >
          {updatedChildren}
        </Button>
      </HtmlTooltip>
    );
  }
);

export default ThemeButton;

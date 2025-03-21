import { ButtonProps, IconButtonProps, Menu, MenuItem, MenuItemProps, MenuProps } from '@mui/material';
import React from 'react';
import { BiChevronDown } from 'react-icons/bi';
import { ThemeButtonProps, ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';

export type ButtonMenuProps<D, I> = {
  items: Items<D, I>[];
  menuProps?: MenuProps;
  iconForMobile?: React.ReactElement | boolean;
  onItemClick?: (e: React.MouseEvent<HTMLLIElement, MouseEvent>, item: Items<D, I>) => void;
  getLabel?: (item: I) => React.ReactNode;
  slot?: (props: any) => JSX.Element;
  showChevron?: boolean;
  horizontal?: 'left' | 'right' | 'center';
  getSelectedMenuItem?: (item: I) => boolean;
} & Omit<ThemeButtonProps, 'iconForMobile'>;

export type Items<D, I> = {
  label?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  value?: D;
  visible?: boolean;
} & Omit<MenuItemProps, 'children'> &
  I;

const ButtonMenu = <D, I>({
  items,
  iconForMobile = false,
  children,
  onClick = () => {},
  menuProps,
  onItemClick = () => {},
  slot = undefined,
  showChevron = false,
  getLabel,
  getSelectedMenuItem,
  horizontal = 'left',
  ...rest
}: ButtonMenuProps<D, I>) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);

  const Slot: React.ComponentType<any> = React.useMemo(() => slot || ThemeButton, [slot]);
  const slotProps: React.ButtonHTMLAttributes<HTMLButtonElement> | IconButtonProps | ButtonProps = {
    onClick: (e) => {
      handleClick(e);
      onClick?.(e);
    },
    ...(slot
      ? {}
      : { iconForMobile, endIcon: showChevron ? <BiChevronDown size={18} className={cn(open ? '[transform:rotate(180deg)]' : '')} /> : undefined }),
    ...rest
  } as const;

  return (
    <>
      <Slot {...(slotProps as any)}>{children}</Slot>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: horizontal
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: horizontal
        }}
        keepMounted={false}
        {...menuProps}
      >
        {items.map((item, index) => {
          const { onClick = () => {}, startIcon, endIcon, visible = true, ...rest } = item;
          if (!visible) return null;
          return (
            <MenuItem
              key={index}
              onClick={(e) => {
                onClick?.(e);
                onItemClick?.(e, item);
                handleClose();
              }}
              selected={typeof getSelectedMenuItem === 'function' ? getSelectedMenuItem(item) : undefined}
              {...rest}
            >
              <span className="flex items-center gap-2">
                {startIcon}
                {typeof getLabel === 'function' ? getLabel(item) : item.label}
                {endIcon}
              </span>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default ButtonMenu;

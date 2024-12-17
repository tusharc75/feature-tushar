import { MenuProps } from '@aws-amplify/ui-react';
import { ButtonProps, IconButtonProps, Menu, MenuItem, MenuItemProps } from '@material-ui/core';
import React from 'react';
import { BiChevronDown } from 'react-icons/bi';
import { ButtonType, ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';

// type SlotProp =
//   | Partial<React.ButtonHTMLAttributes<HTMLButtonElement>>
//   | Omit<Partial<IconButtonProps>, 'color'>
//   | Omit<Partial<ButtonProps>, 'variants' | 'color'>;
// // | Omit<ButtonType, 'iconForMobile' | 'variant' | 'color'>;

export type ButtonMenuProps<D extends string> = {
  items: Items<D>[];
  menuProps?: MenuProps;
  iconForMobile?: React.ReactElement | boolean;
  onItemClick?: (e: React.MouseEvent<HTMLLIElement, MouseEvent>, item: Items<D>) => void;
  slot?: ((props: any) => JSX.Element) | undefined;
  showChevron?: boolean;
} & Omit<ButtonType, 'iconForMobile'>;

type Items<D extends string> = {
  label: D;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
} & Omit<MenuItemProps, 'children' | 'button'>;

const ButtonMenu = <D extends string>({
  items,
  iconForMobile = false,
  children,
  onClick = () => {},
  menuProps,
  onItemClick = () => {},
  slot = undefined,
  showChevron = false,
  ...rest
}: ButtonMenuProps<D>) => {
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
        getContentAnchorEl={null}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        keepMounted={false}
        {...menuProps}
      >
        {items.map((item, index) => {
          const { onClick = () => {}, ...rest } = item;
          return (
            <MenuItem
              key={index}
              button={true}
              onClick={(e) => {
                onClick?.(e);
                onItemClick?.(e, item);
                handleClose();
              }}
              {...rest}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default ButtonMenu;

import { IconButton, IconButtonProps, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React, { ReactElement, useLayoutEffect, useRef, useState } from 'react';
import { ThemeButton, ThemeButtonProps } from 'src/components/Helpers/Buttons';
import { MoreHoriz } from '@mui/icons-material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

// --- Subcomponents ---
const BulkActionButton = (props: ThemeButtonProps) => <ThemeButton {...props} />;
BulkActionButton.displayName = 'BulkActionButton';

const BulkActionDivider = () => <div className="divider"></div>;
BulkActionDivider.displayName = 'BulkActionDivider';

const BulkActionIconButton = (props: IconButtonProps & { text: React.ReactNode; tooltip?: React.ReactNode }) => <IconButton {...props} />;
BulkActionIconButton.displayName = 'BulkActionIconButton';

type BulkActionChild = ReactElement<typeof BulkActionButton> | ReactElement<typeof BulkActionDivider> | ReactElement<typeof BulkActionIconButton>;

interface BulkActionContainerProps {
  children: BulkActionChild | BulkActionChild[];
}
function flattenChildren(children: React.ReactNode): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!child) return;
    if ((child as any).type === React.Fragment) {
      result.push(...flattenChildren((child as React.ReactElement).props.children));
    } else {
      result.push(child);
    }
  });
  return result;
}

const BulkActionContainer = ({ children }: BulkActionContainerProps) => {
  const normalizedChildren = React.Children.toArray(flattenChildren(children));
  const [visibleItemsLength, setVisibleItemsLength] = useState(normalizedChildren.length);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parentContainer = container.parentElement.parentElement;
    if (!parentContainer) return;

    const parentRect = parentContainer.getBoundingClientRect();
    const maxWidth = parentRect.width - 200; // available space

    const childrens = Array.from(container.children);
    let totalWidth = 0;
    let count = 0;

    for (let i = 0; i < childrens.length; i++) {
      const child = childrens[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childWidth = childRect.width;

      // add gap (8px) except before the first element
      if (i > 0) totalWidth += 8;
      totalWidth += childWidth;

      if (totalWidth <= maxWidth) {
        count++;
      } else {
        break;
      }
    }

    setVisibleItemsLength(count);
  }, [normalizedChildren]);

  return (
    <div className="flex items-center gap-2">
      <div className="isolate flex flex-grow flex-wrap items-center gap-2" ref={containerRef}>
        {[...normalizedChildren].slice(0, visibleItemsLength)}
      </div>
      {visibleItemsLength !== normalizedChildren.length && <RenderMenuWithButton items={[...normalizedChildren].slice(visibleItemsLength)} />}
    </div>
  );
};

BulkActionContainer.Divider = BulkActionDivider;
BulkActionContainer.Button = BulkActionButton;
BulkActionContainer.IconButton = BulkActionIconButton;

export default BulkActionContainer;

type ChildList = React.ReactChild | React.ReactFragment | React.ReactPortal;

const RenderMenuWithButton = ({ items }: { items: ChildList[] }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = () => {
    const menuItems: JSX.Element[] = [];
    for (const item of items) {
      if (!React.isValidElement(item)) continue;
      const childType = (item.type as any).displayName || (item.type as any).name;
      const { children, tooltip, startIcon, endIcon, ...props } = item.props;
      switch (childType) {
        case 'BulkActionButton': {
          menuItems.push(
            <HtmlTooltip title={tooltip}>
              <MenuItem {...props}>
                {startIcon && <ListItemIcon>{startIcon}</ListItemIcon>}
                <ListItemText>{children}</ListItemText>
                {endIcon && <ListItemIcon>{item.props.endIcon}</ListItemIcon>}
              </MenuItem>
            </HtmlTooltip>
          );
          break;
        }
        case 'BulkActionDivider': {
          break;
        }
        case 'BulkActionIconButton': {
          menuItems.push(
            <HtmlTooltip title={tooltip}>
              <MenuItem {...props}>{item.props.text}</MenuItem>
            </HtmlTooltip>
          );
          break;
        }
        default: {
          menuItems.push(
            <HtmlTooltip title={tooltip}>
              <MenuItem {...props}>
                {startIcon && <ListItemIcon>{startIcon}</ListItemIcon>}
                <ListItemText>{children}</ListItemText>
                {endIcon && <ListItemIcon>{item.props.endIcon}</ListItemIcon>}
              </MenuItem>
            </HtmlTooltip>
          );
        }
      }
    }
    return menuItems;
  };

  return (
    <>
      <HtmlTooltip title="More Actions">
        <IconButton
          size="small"
          aria-controls={open ? 'bulk-action-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          <MoreHoriz />
        </IconButton>
      </HtmlTooltip>
      <Menu
        id="bulk-action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disablePortal
        slotProps={{
          list: {
            'aria-labelledby': 'basic-button'
          }
        }}
      >
        {menuItems()}
      </Menu>
    </>
  );
};

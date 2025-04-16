import { DragIndicator, ExpandMore, MoreVert, Person } from '@mui/icons-material';
import { Avatar, Badge, IconButton, Menu, MenuItem } from '@mui/material';
import { forwardRef, memo, useMemo, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { UseDesktopDM } from 'src/components/DesktopDM/types';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';

const RenderHeader = memo(
  forwardRef<HTMLButtonElement, { state: UseDesktopDM }>(({ state }, ref) => {
    const { toggleMainWindow, chats, user, mainWindow, closeMainWindow } = state;
    const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);
    const totalNotifications = useMemo(() => {
      return chats.reduce((acc, curr) => {
        if (curr.notifications > 0) {
          acc += curr.notifications;
        }
        return acc;
      }, 0);
    }, [chats]);

    const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      e.preventDefault();
      setMenuAnchor(e.currentTarget);
    };
    const handleCloseMenu = () => {
      setMenuAnchor(null);
    };

    const isPartial = mainWindow && mainWindow === 'partial';

    return (
      <header className="relative flex h-[--partially-openned-container-h] cursor-pointer items-center justify-between border-b p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
        <RippleButton children="" className="absolute inset-0" onClick={toggleMainWindow} />
        <div className="flex items-center gap-2">
          <RippleButton ref={ref} className="cursor-grab">
            <DragIndicator fontSize="small" />
          </RippleButton>
          <Badge
            overlap="circular"
            sx={(theme) => ({
              '& .MuiBadge-badge': {
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
              }
            })}
            className={cn('[&_.MuiBadge-badge]:!bg-green-500')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant={'dot'}
          >
            <Avatar src={user.avatar} sx={{ width: 30, height: 30 }} alt={user.firstName}>
              <Person fontSize="small" />
            </Avatar>
          </Badge>
          <h6 className="text-sm font-semibold">BeConnected</h6>
          {totalNotifications > 0 && (
            <div className="flex min-h-[15px] min-w-[15px] flex-shrink-0 items-center justify-center rounded-full bg-green-500 px-1">
              <span className="text-center text-[10px] leading-[15px] text-white">{totalNotifications}</span>
            </div>
          )}
        </div>
        <div className="buttons flex items-center">
          <HtmlTooltip title={isPartial ? 'Expand' : 'Collapse'}>
            <IconButton size="small" color="primary" onClick={toggleMainWindow}>
              <span className={cn(isPartial ? '[transform:rotate(180deg)]' : 'rotate-0', 'origin-center transition-transform')}>
                <ExpandMore fontSize="small" />
              </span>
            </IconButton>
          </HtmlTooltip>
          <IconButton onClick={handleOpenMenu} size="small" color="primary">
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu
            open={Boolean(menuAnchor)}
            anchorEl={menuAnchor}
            onClose={handleCloseMenu}
            disableScrollLock
            slotProps={{
              paper: { sx: { minWidth: '200px' }, className: cn('border [&>ul]:py-1', isPartial ? '' : 'mt-2') }
            }}
            anchorOrigin={{
              vertical: isPartial ? 'top' : 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: isPartial ? 'bottom' : 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem onClick={closeMainWindow}>Close</MenuItem>
          </Menu>
        </div>
      </header>
    );
  })
);

export default RenderHeader;

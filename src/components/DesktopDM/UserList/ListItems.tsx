import { Person } from '@mui/icons-material';
import { Avatar, Badge } from '@mui/material';
import { memo } from 'react';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import GenieText from 'src/assets/svg/GenieText';
import { Chat, User } from 'src/components/DesktopDM/types';
import { cn } from 'src/constants/helpers';

export const RenderGenie = memo(({ openGenie }: { openGenie: () => void }) => {
  return (
    <div>
      <button
        className="flex w-full cursor-pointer list-none items-center gap-2 rounded-md bg-transparent px-2 py-2 text-left hover:bg-gray-100 focus-visible:outline-theme dark:text-white dark:hover:bg-[--dark-secondary]"
        role="listitem"
        onClick={() => openGenie()}
      >
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
          <Avatar
            src={genieImage}
            alt="eGenie"
            sx={{ width: '35px', height: '35px', '& img': { maxWidth: '80%', maxHeight: '90%' } }}
            className="border p-[1px]"
          >
            <Person fontSize="small" />
          </Avatar>
        </Badge>
        <GenieText className="max-h-[14px]" />
      </button>
    </div>
  );
});

export const RenderChatUser = memo(({ chat, onClick, onlineUsers }: { onClick: (d: Chat) => void; chat: Chat; onlineUsers: string[] }) => {
  return (
    <button
      className="flex w-full cursor-pointer list-none items-center gap-2 rounded-md bg-transparent px-2 py-2 text-left hover:bg-gray-100 focus-visible:outline-theme dark:text-white dark:hover:bg-[--dark-secondary]"
      role="listitem"
      onClick={() => onClick(chat)}
    >
      <Badge
        overlap="circular"
        sx={(theme) => ({
          '& .MuiBadge-badge': {
            boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
          }
        })}
        className={cn(
          onlineUsers.includes(chat.to?.optionValue)
            ? '[&_.MuiBadge-badge]:!bg-green-500'
            : '[&_.MuiBadge-badge]:!bg-[#d9d9d9] dark:[&_.MuiBadge-badge]:!bg-[#757575]'
        )}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant={'dot'}
      >
        <Avatar src={chat.to?.avatar} sx={{ width: '35px', height: '35px' }} alt={chat.to?.optionLabel}>
          <Person fontSize="small" />
        </Avatar>
      </Badge>
      <p className="flex items-center gap-2 text-xs font-normal">
        <span className="line-clamp-1">{chat.to?.optionLabel}</span>
        {chat.notifications > 0 && (
          <div className="flex min-h-[15px] min-w-[15px] flex-shrink-0 items-center justify-center rounded-full bg-green-500 px-1">
            <span className="text-center text-[10px] leading-[15px] text-white">{chat.notifications}</span>
          </div>
        )}
      </p>
    </button>
  );
});

export const RenderUser = memo(({ user, onClick, onlineUsers }: { onClick: (d: User) => void; user: User; onlineUsers: string[] }) => {
  return (
    <button
      className="flex w-full cursor-pointer list-none items-center gap-2 rounded-md bg-transparent px-2 py-2 text-left hover:bg-gray-100 focus-visible:outline-theme dark:text-white dark:hover:bg-[--dark-secondary]"
      role="listitem"
      onClick={() => onClick(user)}
    >
      <Badge
        overlap="circular"
        sx={(theme) => ({
          '& .MuiBadge-badge': {
            boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
          }
        })}
        className={cn(
          onlineUsers.includes(user._id)
            ? '[&_.MuiBadge-badge]:!bg-green-500'
            : '[&_.MuiBadge-badge]:!bg-[#d9d9d9] dark:[&_.MuiBadge-badge]:!bg-[#757575]'
        )}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant={'dot'}
      >
        <Avatar src={user.avatar} sx={{ width: '35px', height: '35px' }} alt={user.concatedName}>
          <Person fontSize="small" />
        </Avatar>
      </Badge>
      <p className="line-clamp-1 text-xs font-normal">{user.concatedName ? user.concatedName : `${user.firstName} ${user.lastName}`}</p>
    </button>
  );
});

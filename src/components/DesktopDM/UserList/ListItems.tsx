import { Person } from '@mui/icons-material';
import { Avatar, Badge } from '@mui/material';
import dayjs from 'dayjs';
import { memo } from 'react';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import GenieText from 'src/assets/svg/GenieText';
import { Chat, User } from 'src/components/DesktopDM/types';
import { stripHtmlTags } from 'src/components/DesktopDM/utils';
import { cn, formatDate } from 'src/constants/helpers';

export const RenderGenie = memo(({ openGenie }: { openGenie: () => void }) => {
  return (
    <>
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
            sx={{ width: '48px', height: '48px', '& img': { maxWidth: '80%', maxHeight: '90%' } }}
            className="border p-[1px]"
          >
            <Person className="!text-[28px]" />
          </Avatar>
        </Badge>
        <GenieText className="max-h-[14px] w-[64px]" />
      </button>
      <span className="ml-auto block w-[calc(264px-64px)] border-b " />
    </>
  );
});

export const RenderChatUser = memo(
  ({ chat, onClick, onlineUsers, user }: { onClick: (d: Chat) => void; chat: Chat; onlineUsers: string[]; user: any }) => {
    return (
      <>
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
            <Avatar src={chat.to?.avatar} sx={{ width: '48px', height: '48px' }} alt={chat.to?.optionLabel}>
              <Person className="!text-[28px]" />
            </Avatar>
          </Badge>
          <div className="flex-grow">
            <div className="flex w-full justify-between">
              <p className="line-clamp-1 text-[14px]">{chat.to?.optionLabel}</p>
              <div className="flex items-start gap-1">
                {chat.notifications > 0 && (
                  <div className="flex min-h-[15px] min-w-[15px] flex-shrink-0 items-center justify-center rounded-full bg-green-500 px-1">
                    <span className="text-center text-[10px] leading-[15px] text-white">{chat.notifications}</span>
                  </div>
                )}
                <span className="line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">
                  {dayjs(chat.recentMessage?.date).isSame(dayjs(), 'date')
                    ? formatDate(chat.recentMessage?.date, 'H:MM A')
                    : formatDate(chat.recentMessage?.date, 'MMM D')}
                </span>
              </div>
            </div>
            <span className="line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">
              {user._id === chat.recentMessage?.sender?.optionValue ? 'You: ' : `${chat.recentMessage?.sender?.optionLabel.split(' ')[0]}: `}
              {stripHtmlTags(chat.recentMessage?.message)}
            </span>
          </div>
        </button>
        <span className="ml-auto block w-[calc(264px-64px)] border-b " />
      </>
    );
  }
);

export const RenderUser = memo(({ user, onClick, onlineUsers }: { onClick: (d: User) => void; user: User; onlineUsers: string[] }) => {
  return (
    <>
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
          <Avatar src={user.avatar} sx={{ width: '48px', height: '48px' }} alt={user.concatedName}>
            <Person className="!text-[28px]" />
          </Avatar>
        </Badge>
        <p className="line-clamp-1 text-xs font-normal">{user.concatedName ? user.concatedName : `${user.firstName} ${user.lastName}`}</p>
      </button>
      <span className="ml-auto block w-[calc(264px-64px)] border-b " />
    </>
  );
});

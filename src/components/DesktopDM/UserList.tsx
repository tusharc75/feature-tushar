import { Close, ExpandMore, Groups, Person } from '@mui/icons-material';
import { Avatar, Badge, IconButton } from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Chat, UseDesktopDM, User } from 'src/components/DesktopDM/types';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import { useStore } from 'src/StateProvider/fastContext';
import { Link } from 'react-router-dom';

type UserListProps = {
  state: UseDesktopDM;
};

const UserList = memo(
  ({ state }: UserListProps) => {
    const { mainWindow, toggleMainWindow, user, closeMainWindow, users, chats, handleChatOpen, checkIsUser, resources } = state;
    const [onlineUsers] = useStore((state) => state.onlineUsers);
    const [inputValue, setInputValue] = useState('');

    const filteredData = useMemo(() => {
      const smallInput = inputValue.toLowerCase();
      if (smallInput.trim() === '') return [...chats, ...users];
      const newData = [...chats, ...users].filter((d) => {
        const isUser = checkIsUser(d);
        if (isUser && d?.concatedName?.toLowerCase().includes(smallInput)) {
          return true;
        } else if (!isUser && d?.to?.optionLabel?.toLowerCase().includes(smallInput)) {
          return true;
        }
        return false;
      });
      return newData;
    }, [users, chats, inputValue, checkIsUser]);

    const totalNotifications = useMemo(() => {
      return chats.reduce((acc, curr) => {
        if (curr.notifications > 0) {
          acc += curr.notifications;
        }
        return acc;
      }, 0);
    }, [chats]);

    const openChat = useCallback(
      (data: Chat) => {
        handleChatOpen(data._id, 'chat');
      },
      [handleChatOpen]
    );

    const openUser = useCallback(
      (data: User) => {
        handleChatOpen(data._id, 'user');
      },
      [handleChatOpen]
    );

    return (
      <div
        className={cn(
          'mr-[--user-list-right-space] flex w-[--user-list-container-w] flex-[0_0_var(--user-list-container-w)] flex-col overflow-hidden rounded-t-md border bg-[--dark-primary,white] shadow-md transition-all',
          mainWindow && mainWindow === 'partial' ? 'h-[--partially-openned-container-h]' : 'h-[calc(100vh-100px)]'
        )}
      >
        <header
          className="flex h-[--partially-openned-container-h] cursor-pointer items-center justify-between border-b p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={toggleMainWindow}
        >
          <div className="flex items-center gap-2">
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
          <div className="buttons flex items-center gap-1">
            <HtmlTooltip title={mainWindow && mainWindow === 'partial' ? 'Expand' : 'Collapse'}>
              <IconButton size="small" color="primary">
                <span
                  className={cn(
                    mainWindow && mainWindow === 'partial' ? '[transform:rotate(180deg)]' : 'rotate-0',
                    'origin-center transition-transform'
                  )}
                >
                  <ExpandMore fontSize="small" />
                </span>
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title={'Close'}>
              <IconButton onClick={closeMainWindow} size="small" color="primary">
                <Close fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </div>
        </header>
        <div className="search border-b p-2">
          <div className="flex gap-2">
            <SearchBox value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            <Link to={routes.workSpace.path} onClick={() => toggleMainWindow()}>
              <HtmlTooltip title={resources?.workSpace?.titlePlural}>
                <IconButton size="small" color="primary">
                  <Groups fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </Link>
          </div>
        </div>
        <section role="list" className="relative flex-grow overflow-y-auto overscroll-contain px-2 py-2">
          {filteredData?.length > 0 ? (
            filteredData?.map((c) => {
              const isUser = checkIsUser(c);
              if (isUser) {
                return <RenderUser user={c} onClick={openUser} onlineUsers={onlineUsers} key={c._id} />;
              } else {
                return <RenderChatUser chat={c} onClick={openChat} onlineUsers={onlineUsers} key={c._id} />;
              }
            })
          ) : (
            <div className="absolute left-2 right-2 top-1/3 text-center">
              <p className="select-none text-sm font-semibold text-gray-500 dark:text-gray-400">
                No User found with keyword:
                <pre className="mx-auto mt-1 block max-w-fit rounded-md border bg-gray-100 px-1 py-[2px] dark:bg-gray-800">"{inputValue}"</pre>
              </p>
            </div>
          )}
        </section>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.state.mainWindow === next.state.mainWindow &&
      // prev.state.toggleMainWindow === next.state.toggleMainWindow &&
      prev.state.user === next.state.user &&
      // prev.state.closeMainWindow === next.state.closeMainWindow &&
      prev.state.users === next.state.users &&
      prev.state.chats === next.state.chats &&
      prev.state.handleChatOpen === next.state.handleChatOpen
      // prev.state.checkIsUser === next.state.checkIsUser
    );
  }
);

export default UserList;

const RenderChatUser = memo(({ chat, onClick, onlineUsers }: { onClick: (d: Chat) => void; chat: Chat; onlineUsers: string[] }) => {
  return (
    <button
      className="flex w-full cursor-pointer list-none items-center gap-2 rounded-md bg-transparent px-2 py-2 text-left hover:bg-gray-100 dark:text-white dark:hover:bg-[--dark-secondary]"
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

const RenderUser = memo(({ user, onClick, onlineUsers }: { onClick: (d: User) => void; user: User; onlineUsers: string[] }) => {
  return (
    <button
      className="flex w-full cursor-pointer list-none items-center gap-2 rounded-md bg-transparent px-2 py-2 text-left hover:bg-gray-100 dark:text-white dark:hover:bg-[--dark-secondary]"
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

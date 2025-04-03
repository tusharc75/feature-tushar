import { Close, ExpandMore, Person } from '@mui/icons-material';
import { Avatar, Badge, IconButton } from '@mui/material';
import { useMemo, useState } from 'react';
import { Chat, UseDesktopDM, User } from 'src/components/DesktopDM/types';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import { useStore } from 'src/StateProvider/fastContext';

type UserListProps = {
  state: UseDesktopDM;
};

const UserList = ({ state }: UserListProps) => {
  const { mainWindow, toggleMainWindow, user, closeMainWindow, users, chats, handleChatOpen, checkIsUser } = state;
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
        </div>
        <div className="buttons flex items-center gap-1">
          <IconButton size="small">
            <span
              className={cn(mainWindow && mainWindow === 'partial' ? '[transform:rotate(180deg)]' : 'rotate-0', 'origin-center transition-transform')}
            >
              <ExpandMore fontSize="small" />
            </span>
          </IconButton>
          <IconButton onClick={closeMainWindow} size="small">
            <Close fontSize="small" />
          </IconButton>
        </div>
      </header>
      <div className="search  border-b p-2">
        <div className="relative">
          <SearchBox value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        </div>
      </div>
      <section role="list" className="flex-grow overflow-y-auto overscroll-contain px-2 py-2">
        {filteredData?.map((c) => {
          const isUser = checkIsUser(c);
          if (isUser) {
            return <RenderUser user={c} onClick={(d) => handleChatOpen(d._id, 'user')} onlineUsers={onlineUsers} key={c._id} />;
          } else {
            return <RenderChatUser chat={c} onClick={(d) => handleChatOpen(d._id, 'chat')} onlineUsers={onlineUsers} key={c._id} />;
          }
        })}
      </section>
    </div>
  );
};

export default UserList;

const RenderChatUser = ({ chat, onClick, onlineUsers }: { onClick: (d: Chat) => void; chat: Chat; onlineUsers: string[] }) => {
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
            <span className="text-center text-[10px] leading-[1] text-white">{chat.notifications}</span>
          </div>
        )}
      </p>
    </button>
  );
};

const RenderUser = ({ user, onClick, onlineUsers }: { onClick: (d: User) => void; user: User; onlineUsers: string[] }) => {
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
};

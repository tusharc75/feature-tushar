import { Groups } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { GENIE_WINDOW_ID } from 'src/components/DesktopDM/constants';
import { Chat, UseDesktopDM, User } from 'src/components/DesktopDM/types';
import { RenderChatUser, RenderGenie, RenderUser } from 'src/components/DesktopDM/UserList/ListItems';
import RenderHeader from 'src/components/DesktopDM/UserList/RenderHeader';
import useDragAndDrop from 'src/components/DesktopDM/UserList/useDragAndDrop';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import { useStore } from 'src/StateProvider/fastContext';

type UserListProps = {
  state: UseDesktopDM;
};

const UserList = memo(
  ({ state }: UserListProps) => {
    const { mainWindow, toggleMainWindow, users, chats, handleChatOpen, checkIsUser, resources, permissions, isMobile, openedChats, user } = state;
    const [onlineUsers] = useStore((state) => state.onlineUsers);
    const [inputValue, setInputValue] = useState('');
    const { containerRef, handleRef, enableDisableDraggable } = useDragAndDrop();

    useEffect(() => {
      if (openedChats.length === 0) {
        enableDisableDraggable(true);
      } else {
        enableDisableDraggable(false);
      }
    }, [openedChats, enableDisableDraggable]);

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

    // Split filteredData into pinned and others
    const { pinnedUsers, otherUsers } = useMemo(() => {
      const pinned: typeof filteredData = [];
      const others: typeof filteredData = [];
      filteredData.forEach((item) => {
        if (item.pinned) {
          pinned.push(item);
        } else {
          others.push(item);
        }
      });
      return { pinnedUsers: pinned, otherUsers: others };
    }, [filteredData]);

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

    const openGenie = useCallback(() => {
      handleChatOpen(GENIE_WINDOW_ID, 'genie');
    }, [handleChatOpen]);

    return (
      <div ref={containerRef} className={cn('pointer-events-none')}>
        <div
          className={cn(
            'pointer-events-auto mr-[--user-list-right-space] flex w-[--user-list-container-w] origin-bottom flex-col overflow-hidden rounded-t-md border bg-[--dark-primary,white] shadow-md transition-all [--max-h:calc(100vh-100px)]',
            'h-[--max-h]',
            mainWindow && mainWindow === 'partial' ? ' [transform:translateY(calc(var(--max-h)-var(--partially-openned-container-h)))]' : '',
            isMobile ? `w-auto ` : 'flex-[0_0_var(--user-list-container-w)]'
          )}
        >
          <RenderHeader state={state} ref={handleRef} />
          <div className="search border-b p-2">
            <div className="flex gap-2">
              <SearchBox value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
              {permissions?.['workSpace']?.isRead && (
                <Link to={routes.workSpace.path} onClick={() => toggleMainWindow()}>
                  <HtmlTooltip title={resources?.workSpace?.titlePlural}>
                    <IconButton size="small" color="primary">
                      <Groups fontSize="small" />
                    </IconButton>
                  </HtmlTooltip>
                </Link>
              )}
            </div>
          </div>
          <section role="list" className="relative flex-grow overflow-y-auto overscroll-contain px-2 py-2">
            {permissions?.equiptAi?.isRead && <RenderGenie openGenie={openGenie} />}
            {(pinnedUsers.length > 0 || otherUsers.length > 0) ? (
              <>
                {/* Pinned Users */}
                {pinnedUsers.length > 0 && (
                  <div>
                    {pinnedUsers.map((c) => {
                      const isUser = checkIsUser(c);
                      if (isUser) {
                        return <RenderUser user={c} onClick={openUser} onlineUsers={onlineUsers} key={c._id} isPinned={c.pinned} />;
                      } else {
                        return <RenderChatUser user={user} chat={c} onClick={openChat} onlineUsers={onlineUsers} key={c._id} isPinned={c.pinned} />;
                      }
                    })}
                  </div>
                )}

                {/* Other Users */}
                {otherUsers.map((c) => {
                  const isUser = checkIsUser(c);
                  if (isUser) {
                    return <RenderUser user={c} onClick={openUser} onlineUsers={onlineUsers} key={c._id} isPinned={c.pinned} />;
                  } else {
                    return <RenderChatUser user={user} chat={c} onClick={openChat} onlineUsers={onlineUsers} key={c._id} isPinned={c.pinned} />;
                  }
                })}
              </>
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
      prev.state.handleChatOpen === next.state.handleChatOpen &&
      prev.state.openedChats.length === next.state.openedChats.length
      // prev.state.checkIsUser === next.state.checkIsUser
    );
  }
);

export default UserList;

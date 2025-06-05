import { Close, ExpandMore, Person } from '@mui/icons-material';
import { Avatar, Badge, IconButton } from '@mui/material';
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import SendMessage from 'src/components/DesktopDM/SendMessage';
import ShowMessages, { ShowMessageRef } from 'src/components/DesktopDM/ShowMessage';
import { Chat, OpenedChat, UseDesktopDM, User } from 'src/components/DesktopDM/types';
import { checkIsUser } from 'src/components/DesktopDM/useDesktopDM';
import { cn } from 'src/constants/helpers';
import { useDelayedClass } from 'src/hooks';
import { useStore } from 'src/StateProvider/fastContext';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { TbPinnedOff } from 'react-icons/tb';
import { BsFillPinFill } from 'react-icons/bs';

type ChatBoxProps = {
  state: UseDesktopDM;
  openedChat: OpenedChat;
};

export const initialClass = `h-[--partially-openned-container-h] w-[--partially-openned-chatbox-w] flex-[0_0_var(--partially-openned-chatbox-w)]`;
export const delayedClass = `h-[min(600px,calc(100vh-100px))] w-[--fully-openned-chatbox-w] flex-[0_0_var(--fully-openned-chatbox-w)]`;

const ChatBox = memo(({ state, openedChat }: ChatBoxProps) => {
  const { users, chats, handleToggleChatWindow, closeChatBox, isMobile } = state;
  const showMessageRef = useRef<ShowMessageRef>(null);

  const { className } = useDelayedClass(initialClass, delayedClass, 5);
  const data = useMemo(() => {
    if (openedChat.type === 'chat') {
      return chats.find((c) => c._id === openedChat.id);
    } else {
      return users.find((c) => c._id === openedChat.id);
    }
  }, [users, chats, openedChat]);
  if (!data) return null;

  return (
    <div
      className={cn(
        'mr-[--chatbox-gap] flex  h-0 flex-col overflow-hidden rounded-t-md border bg-[--dark-primary,white] shadow-md transition-all',
        openedChat.open === 'partial'
          ? 'h-[--partially-openned-container-h] w-[--partially-openned-chatbox-w] flex-[0_0_var(--partially-openned-chatbox-w)]'
          : className,
        isMobile ? 'h-full' : ''
      )}
    >
      <ChatBoxHeader
        closeChatBox={closeChatBox}
        isMobile={isMobile}
        data={data}
        handleToggleChatWindow={handleToggleChatWindow}
        openedChat={openedChat}
      />
      <ShowMessages data={data} state={state} ref={showMessageRef} openedChat={openedChat} />
      <SendMessage state={state} data={data} onNewMessagePost={showMessageRef.current?.onNewMessagePost} />
    </div>
  );
});

export default ChatBox;

const ChatBoxHeader = memo(
  ({
    data,
    handleToggleChatWindow,
    openedChat,
    closeChatBox,
    isMobile
  }: {
    data: User | Chat;
    handleToggleChatWindow: (id: string) => void;
    openedChat: OpenedChat;
    closeChatBox: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: string) => void;
    isMobile: boolean;
  }) => {
    const isUserData = checkIsUser(data);
    const [onlineUsers] = useStore((state) => state.onlineUsers);
    const isUserOnline = onlineUsers.includes(isUserData ? data._id : (data as Chat).to?.optionValue);
    const { setToastConfig } = useContext(CustomToastContext);

    // --- Pin logic ---
    const [pinned, setPinned] = useState(!!data.pinned);

    useEffect(() => {
      setPinned(!!data.pinned);
    }, [data]);

    const handlePinUser = async (e: React.MouseEvent) => {
      e.stopPropagation();
      const userId = isUserData ? data._id : (data as Chat).to?.optionValue;

      try {
        const response = await axiosInstance().post(`work-space/channel/pin-unpin/${userId}`);
        setPinned(response.data.pinned);

        setToastConfig({
          open: true,
          type: 'success',
          message: response.data.pinned ? 'User pinned successfully' : 'User unpinned successfully'
        });

        // Notify UserList to refresh
        window.dispatchEvent(new CustomEvent('pinnedUsersUpdated'));
      } catch (err) {
        setToastConfig({
          open: true,
          type: 'error',
          message: 'Something went wrong. Please try again.'
        });
      }
    };

    return (
      <header
        className="flex h-[--partially-openned-container-h] cursor-pointer items-center justify-between border-b p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => handleToggleChatWindow(openedChat.id)}
      >
        <div className="flex items-center gap-2">
          <Badge
            overlap="circular"
            sx={(theme) => ({
              '& .MuiBadge-badge': {
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
              }
            })}
            className={cn(
              isUserOnline ? '[&_.MuiBadge-badge]:!bg-green-500' : '[&_.MuiBadge-badge]:!bg-[#d9d9d9] dark:[&_.MuiBadge-badge]:!bg-[#757575]'
            )}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant={'dot'}
          >
            <Avatar
              src={isUserData ? data?.avatar : data.to?.avatar}
              sx={{ width: 30, height: 30 }}
              alt={isUserData ? data.concatedName : data.to.optionLabel}
            >
              <Person fontSize="small" />
            </Avatar>
          </Badge>
          <div className="relative">
            <h6 className="line-clamp-1 text-sm font-semibold" title={isUserData ? data.concatedName : data.to.optionLabel}>
              {isUserData ? data.concatedName : data.to.optionLabel}
            </h6>
            <p className="text-[11px] tracking-wide">{isUserOnline ? 'Online' : 'Offline'}</p>
          </div>
          {!isUserData && data.notifications > 0 && (
            <div className="flex min-h-[15px] min-w-[15px] flex-shrink-0 items-center justify-center rounded-full bg-green-500 px-1">
              <span className="text-center text-[10px] leading-[15px] text-white">{data.notifications}</span>
            </div>
          )}
        </div>
        <div className="buttons flex items-center gap-1">

          {/* Pin User Button */}
          <HtmlTooltip title={pinned ? "Unpin" : "Pin"}>
            <IconButton
              size="small"
              onClick={handlePinUser}
              sx={{ color: "primary", size: "small" }}
            >
              {pinned ? (
                <TbPinnedOff fontSize="18px" />
              ) : (
                 <BsFillPinFill fontSize="18px" />
              )}
            </IconButton>
          </HtmlTooltip>


          {!isMobile && (
            <HtmlTooltip title={openedChat.open === 'partial' ? 'Expand' : 'Collapse'}>
              <IconButton size="small" color="primary">
                <span className={cn(openedChat.open === 'partial' ? '[transform:rotate(180deg)]' : 'rotate-0', 'origin-center transition-transform')}>
                  <ExpandMore fontSize="small" />
                </span>
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={'Close'}>
            <IconButton onClick={(e) => closeChatBox(e, openedChat.id)} size="small" color="primary">
              <Close fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        </div>
      </header>
    );
  }
);

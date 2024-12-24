import { Badge, Box, IconButton, MenuItem, Popover, useMediaQuery } from '@mui/material';
import { ArrowBack, ChatBubbleOutlineOutlined } from '@material-ui/icons';
import { useCallback, useContext, useState } from 'react';
import { CustomChatNotificationCountContext } from '../../../StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import { GlobalChatContext } from 'src/StateProvider/GlobalChatContext';
import HtmlTooltip from '../../CustomTooltipTitle';
import NewChat from './NewChat';
import NotificationContent from './NotificationContent';
import { assignAvatar } from './utils';
import { useHistory } from 'react-router-dom';

// Rename Tabs here
export const tabOptions: ['all', 'unread', 'chats'] = ['all', 'unread', 'chats'];
export type TabOptions = (typeof tabOptions)[number];

const ChatNotification = () => {
  const toastConfig = useContext(CustomToastContext);
  const notification = useContext(CustomChatNotificationCountContext);
  const isMobile = useMediaQuery('(max-width:960px)');
  const { setOpen: setChatOpen, setSelectedChat, chatList } = useContext(GlobalChatContext);

  const history = useHistory();

  const {
    state: { user }
  }: any = useData();

  const [anchorEl, setAnchorEl] = useState(null);
  const isNotificationOpen = Boolean(anchorEl);
  const [notificationList, setNotificationList] = useState([]);
  const [notificationData, setNotificationData] = useState({
    [tabOptions[0]]: [],
    [tabOptions[1]]: [],
    [tabOptions[2]]: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [newChat, setNewChat] = useState(false);

  const handleNotificationClose = () => {
    setAnchorEl(null);
    setNewChat(false);
  };

  const notificationId = isNotificationOpen ? 'chat-notification' : undefined;

  const getAllNotifications = async (event) => {
    setAnchorEl(event.currentTarget);
    setIsLoading(true);

    await axiosInstance()
      .get('/user/user-notification')
      .then(({ data: { data } }) => {
        setNotificationList(data);
        const dataWithAvatar = assignAvatar(data, chatList);
        const nData = {
          [tabOptions[0]]: dataWithAvatar as any[],
          [tabOptions[1]]: data.filter((d) => !d.read) as any[],
          [tabOptions[2]]: chatList as any[]
        };
        setNotificationData(nData);
        notification.setCount(0);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => setIsLoading(false));
  };

  const handleMarkAllReadUnread = (toggle: boolean = true) => {
    axiosInstance()
      .put('/user/user-notification/all-read', { toggle })
      .then(({ data }) => {
        let updatedNotificationList = [];
        notificationList.forEach((notification) => {
          notification.read = true;
          updatedNotificationList.push(notification);
        });
        setNotificationList(updatedNotificationList);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          type: 'success'
        });
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleClearAll = () => {
    axiosInstance()
      .put('/user/user-notification/clear-all', { toggle: true })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          type: 'success'
        });
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleReadSingle = (d) => {
    if (d.read === false) {
      axiosInstance()
        .put('/user/user-notification/read', {
          toggle: true,
          _id: d._id
        })
        .then(() => {})
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }

    if (d.chatterId) {
      const selectedChat = chatList.find((c) => c.id === d.chatterId);
      if (selectedChat) {
        setAnchorEl(null);
        setChatOpen(true);
        setSelectedChat(selectedChat);
      } else if (d?.resourcePath !== '') {
        setAnchorEl(null);
        history.push(d.resourcePath);
      }
    }
  };

  const isReplayVisible = (d) => {
    return Boolean(chatList.find((c) => c.id === d.chatterId)) || d?.resourcePath !== '' ? true : false;
  };

  const handleClickHistory = (chat) => {
    setSelectedChat(chat);
    closeAndOpenChat();
    if (chat.unseen > 0) {
      axiosInstance().put(`chatter/mark-read/${chat.id}`);
    }
  };

  const closeAndOpenChat = useCallback(() => {
    setAnchorEl(null);
    setChatOpen(true);
    setNewChat(false);
  }, [setChatOpen]);

  return (
    <>
      {isMobile ? (
        <>
          <MenuItem onClick={anchorEl === null ? getAllNotifications : () => {}}>
            <Badge
              variant="dot"
              overlap="circular"
              badgeContent={notification ? notification.count : 0}
              color="secondary"
              aria-describedby={notificationId}
            >
              <ChatBubbleOutlineOutlined className="[font-size:22px_!important]" />
            </Badge>
            <Box component="span" mx={1} />
            <p>Chat Notifications</p>
          </MenuItem>
        </>
      ) : (
        <IconButton
          id="notificationButton"
          aria-describedby={notificationId}
          aria-label="settings"
          color="inherit"
          title="Notifications"
          onClick={getAllNotifications}
          className={`[margin-inline:8px_!important] [padding:5px_!important]`}
        >
          <Badge variant="dot" overlap="circular" badgeContent={notification ? notification.count : 0} color="secondary">
            <ChatBubbleOutlineOutlined />
          </Badge>
        </IconButton>
      )}
      <Popover
        PaperProps={{
          className: 'w-[min(400px,100%)_!important]',
          style: {
            borderRadius: 0,
            boxShadow: '-4px 0px 40px 0px rgba(0, 0, 0, 0.06)',
            background: 'var(--dark-primary, #fefeff)'
          }
        }}
        id={notificationId}
        open={isNotificationOpen}
        anchorEl={anchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        {newChat ? (
          <>
            <div className="flex items-center justify-between px-[20px] py-[10px] [border-bottom:1px_solid_var(--common-border-color)]">
              <h6 className="text-[16px] font-semibold ">Start New Chat</h6>
              <HtmlTooltip title={'back'} enterTouchDelay={0} placement="top" arrow>
                <span>
                  <IconButton
                    onClick={() => {
                      setNewChat(false);
                    }}
                    size={'small'}
                  >
                    <ArrowBack />
                  </IconButton>
                </span>
              </HtmlTooltip>
            </div>
            <NewChat closeAndOpenChat={closeAndOpenChat} userId={user.user._id} setSelectedChat={setSelectedChat} />
          </>
        ) : (
          <NotificationContent
            isLoading={isLoading}
            handleMarkAllReadUnread={handleMarkAllReadUnread}
            handleClearAll={handleClearAll}
            handleReadSingle={handleReadSingle}
            data={notificationData}
            setNewChat={setNewChat}
            handleClickHistory={handleClickHistory}
            isReplayVisible={isReplayVisible}
          />
        )}
      </Popover>
    </>
  );
};

export default ChatNotification;

import { ChatBubbleOutlineOutlined } from '@mui/icons-material';
import { Badge, IconButton, useMediaQuery } from '@mui/material';
import HtmlTooltip from '../../CustomTooltipTitle';
import { useStore } from 'src/StateProvider/fastContext';

// Rename Tabs here
export const tabOptions: ['all', 'unread', 'chats'] = ['all', 'unread', 'chats'];
export type TabOptions = (typeof tabOptions)[number];

const ChatNotification = () => {
  const isMobile = useMediaQuery('(max-width:960px)');
  const [handleOpenChat] = useStore((state) => state.handleOpenChat);

  if (isMobile) return null;
  return (
    <>
      <HtmlTooltip title={'BeConnected'}>
        <IconButton
          id="notificationButton"
          aria-label="settings"
          color="inherit"
          className={`[margin-inline:8px_!important] [padding:5px_!important]`}
          onClick={handleOpenChat}
        >
          <Badge variant="dot" overlap="circular" badgeContent={0} color="secondary">
            <ChatBubbleOutlineOutlined />
          </Badge>
        </IconButton>
      </HtmlTooltip>
    </>
  );
};

export default ChatNotification;

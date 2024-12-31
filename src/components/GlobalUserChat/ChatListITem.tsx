import { Fragment } from 'react';
import { ListItem, ListItemText, ListItemAvatar, Avatar, Box, Chip, Typography } from '@mui/material';
import { Group } from '@mui/icons-material';

import axiosInstance from '../../axios/axiosInstance';
import HtmlTooltip from '../CustomTooltipTitle';
import dayjs from 'dayjs';

const ChatList = (props) => {
  const { chat, setSelectedChat, userId } = props;

  const onChatClick = () => {
    setSelectedChat(chat);

    if (chat.unseen > 0) {
      axiosInstance().put(`chatter/mark-read/${chat.id}`);
    }
  };

  const formatTime = (time) => dayjs.utc(time).tz().fromNow(true);

  return (
    <Fragment>
      <ListItem button divider onClick={onChatClick} alignItems="flex-start">
        <ListItemAvatar>
          <Avatar alt={chat?.chatTitle} src={chat.avatar} />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box display="flex" alignItems="center">
              <p title={chat.chatTitle} className={`chat-listTitle text-truncate ${chat?.unseen > 0 ? 'new-msg' : ''}`}>
                {chat.chatTitle}
              </p>
              <Box ml={1} />
              {chat?.users.length > 2 && (
                <HtmlTooltip title={<Fragment>{chat?.users.map((u) => <Typography>{`${u?.firstName} ${u?.lastName}`}</Typography>)}</Fragment>}>
                  <Chip variant="outlined" color="secondary" label="Group" size="small" icon={<Group />} />
                </HtmlTooltip>
              )}
            </Box>
          }
          secondary={
            <span title={chat.message?.message} className="chat-listSubtext">
              <span className="chat-listSubtitle">
                <span className={`who ${chat?.unseen > 0 ? 'unseen' : ''}`}>{chat?.message?.userid === userId ? 'You:' : ''}</span>
                <span className={`msg text-truncate ${chat?.unseen > 0 ? 'unseen' : ''}`}>
                  {chat.message?.message ? chat.message?.message : "'New chat'"}
                </span>
              </span>
              {chat.message?.message && <span className={`message-time ${chat?.unseen > 0 ? 'new-msg' : ''}`}>{formatTime(chat.message.date)}</span>}
            </span>
          }
        />
      </ListItem>
    </Fragment>
  );
};

export default ChatList;

import { useState, useEffect, useContext } from 'react';
import { createStyles, Theme, makeStyles, withStyles } from '@material-ui/core/styles';
import { Popover, Box, Typography, Divider, IconButton, Tooltip, List } from '@material-ui/core';
import { Create, Clear, ArrowBack, Group } from '@material-ui/icons';

import ChatList from './ChatList';
import ChatBox from './ChatBox';
import NewChat from './NewChat';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    listRoot: {
      width: '100%',
      backgroundColor: theme.palette.background.paper
    },
    inline: {
      display: 'inline'
    }
  })
);

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9'
  }
}))(Tooltip);

const ChatsPopover = (props) => {
  const classes = useStyles();
  const { socket, chatList, selectedChat, setSelectedChat } = useContext(GlobalChatContext);
  const {
    state: {
      user: { user }
    }
  } = useData();
  const { open, anchorEl, setAnchorEl, getChats } = props;
  const [newChat, setNewChat] = useState(false);
  const [users, setUsers] = useState([]);

  const onClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const fetchUsersList = () => {
    axiosInstance()
      .get('/user?limit=0')
      .then(({ data: { data } }) => {
        const allUsers = data.filter((d) => d._id !== user._id).map((d) => ({ id: d._id, avatar: d.avatar || '', name: d.concatedName }));
        setUsers(allUsers);
      })
      .catch((err) => {});
  };

  return (
    <Popover
      id={open ? 'chats-popover' : undefined}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
    >
      <Box width={350} height={450} overflow="hidden">
        <Box mx={1} height={50} display="flex" justifyContent="space-between" alignItems="center">
          {selectedChat || newChat ? (
            <Tooltip title="Go Back">
              <IconButton
                onClick={() => {
                  setSelectedChat(null);
                  setNewChat(false);
                }}
                size="small"
              >
                <ArrowBack color="action" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="New chat">
              <IconButton
                onClick={() => {
                  if (selectedChat) setSelectedChat(null);
                  setNewChat(!newChat);
                }}
                size="small"
              >
                <Create color="action" />
              </IconButton>
            </Tooltip>
          )}

          <Box display="flex" alignItems="center">
            <Typography variant="h6" color="textPrimary" className="text-truncate">
              {selectedChat ? selectedChat?.chatTitle : newChat ? 'New chat' : `Chats (${chatList?.length})`}
            </Typography>
            {selectedChat && selectedChat?.users?.length > 2 && (
              <Box ml={1} pt={1}>
                <HtmlTooltip
                  title={
                    <>
                      {selectedChat?.users?.map((u) => (
                        <Typography>{`${u?.firstName} ${u?.lastName}`}</Typography>
                      ))}
                    </>
                  }
                >
                  <Group fontSize="medium" color="action" />
                </HtmlTooltip>
              </Box>
            )}
          </Box>

          <Tooltip title="Close chat">
            <IconButton onClick={onClose} size="small">
              <Clear color="action" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider orientation="horizontal" />

        <Box height={400} style={{ overflowY: 'auto' }}>
          {newChat ? (
            <NewChat userId={user._id} setNewChat={setNewChat} setSelectedChat={setSelectedChat} users={users} />
          ) : selectedChat ? (
            <ChatBox getChats={getChats} />
          ) : (
            <List disablePadding className={classes.listRoot}>
              {chatList.map((chat, i) => (
                <ChatList key={i} userId={user._id} socket={socket} chat={chat} setSelectedChat={setSelectedChat} getChats={getChats} />
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Popover>
  );
};

export default ChatsPopover;

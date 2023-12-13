import { useState, useEffect, useContext } from 'react';
import { createStyles, Theme, makeStyles, useTheme } from '@material-ui/core/styles';
import { Popover, Box, Typography, Divider, IconButton, List, useMediaQuery } from '@material-ui/core';
import { Create, Clear, ArrowBack, Group } from '@material-ui/icons';

import ChatListITem from './ChatListITem';
import ChatBox from './ChatBox';
import NewChat from './NewChat';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import HtmlTooltip from '../CustomTooltipTitle';

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

const ChatsPopover = (props) => {
  const classes = useStyles();
  const { socket, chatList, selectedChat, setSelectedChat } = useContext(GlobalChatContext);
  const {
    state: {
      user: { user }
    }
  } = useData();
  const { open, anchorEl, onClose, getChats } = props;
  const [newChat, setNewChat] = useState(false);
  const [users, setUsers] = useState([]);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchUsersList();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      msgSeen(selectedChat.id);
    }
  }, [selectedChat]);

  const msgSeen = (id) => {
    axiosInstance().put(`chatter/mark-read/${id}`);
  };

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
    <div id={open ? 'chats-popover' : undefined} className={`chat-popover ${isSmallScreen ? 'small-screen' : ''}`}>
      {open && (
        <Box overflow="hidden">
          <Box className="flex justify-between items-center h-[60px] p-[20px] bg-[var(--new-theme-color)] text-[white]">
            {selectedChat || newChat ? (
              <HtmlTooltip title="Go Back">
                <IconButton
                  onClick={() => {
                    setSelectedChat(null);
                    setNewChat(false);
                  }}
                  size="small"
                >
                  <ArrowBack className="text-[white]" />
                </IconButton>
              </HtmlTooltip>
            ) : (
              <HtmlTooltip title="New chat">
                <IconButton
                  onClick={() => {
                    if (selectedChat) setSelectedChat(null);
                    setNewChat(!newChat);
                  }}
                  size="small"
                >
                  <Create className="text-[white]" />
                </IconButton>
              </HtmlTooltip>
            )}

            <Box display="flex" alignItems="center">
              <Typography variant="h6" className="text-truncate [font-size:16px_!important] font-bold">
                {selectedChat ? selectedChat?.chatTitle : newChat ? 'New chat' : `Chats (${chatList?.length})`}
              </Typography>
              {selectedChat && selectedChat?.users?.length > 2 && (
                <Box ml={1}>
                  <HtmlTooltip
                    arrow
                    placement="top"
                    title={
                      <>
                        {selectedChat?.users?.map((u) => (
                          <Typography>{`${u?.firstName} ${u?.lastName}`}</Typography>
                        ))}
                      </>
                    }
                  >
                    <Group fontSize="medium" className="text-[white]" />
                  </HtmlTooltip>
                </Box>
              )}
            </Box>

            <div className="w-[24px]" />
          </Box>

          <Divider orientation="horizontal" />

          <Box height={isSmallScreen ? '100%' : 509} style={{ overflowY: 'auto' }}>
            {newChat ? (
              <NewChat userId={user._id} setNewChat={setNewChat} setSelectedChat={setSelectedChat} users={users} />
            ) : selectedChat ? (
              <ChatBox isSmallScreen={isSmallScreen} user={user} />
            ) : (
              <List disablePadding dense className={classes.listRoot}>
                {chatList.map((chat, i) => (
                  <ChatListITem key={i} userId={user._id} socket={socket} chat={chat} setSelectedChat={setSelectedChat} getChats={getChats} />
                ))}
              </List>
            )}
          </Box>
        </Box>
      )}
    </div>
  );
};

export default ChatsPopover;

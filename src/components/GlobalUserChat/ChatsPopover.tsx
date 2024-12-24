import { Avatar, Box, Divider, IconButton, List, TextField, Typography, useMediaQuery } from '@mui/material';
import { Theme, createStyles, useTheme } from '@mui/material/styles';
import { ArrowBack, Create, Group } from '@material-ui/icons';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';

import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import HtmlTooltip from '../CustomTooltipTitle';
import ChatBox from './ChatBox';
import ChatListITem from './ChatListITem';
import NewChat from './NewChat';

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
  const [filterValue, setFilterValue] = useState('');
  const [filteredChatList, setFilteredChatList] = useState(chatList);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const setFilterChatList = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = e.target.value;
    setFilterValue(value);
    if (value.trim() === '') {
      setFilteredChatList(chatList);
      return;
    }
    const filteredList = chatList.filter((d) => d.chatTitle.toLowerCase().includes(value.toLowerCase()));
    setFilteredChatList(filteredList);
  };

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
          <Box className="flex h-[60px] items-center justify-between bg-[var(--new-theme-color)] p-[20px] text-[white]">
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
              <>
                <div className={`min-w-[24px]`} />
                {/* <HtmlTooltip title="New chat">
                <IconButton
                  onClick={() => {
                    if (selectedChat) setSelectedChat(null);
                    setNewChat(!newChat);
                  }}
                  size="small"
                >
                  <Create className="text-[white]" />
                </IconButton>
              </HtmlTooltip> */}
              </>
            )}

            <Box display="flex" alignItems="center">
              {selectedChat ? (
                <Avatar src={selectedChat.avatar} alt={selectedChat.chatTitle ? selectedChat.chatTitle : ''} className="ml-[12px] mr-2" />
              ) : null}
              <Typography variant="h6" className="text-truncate font-bold [font-size:16px_!important]">
                {selectedChat ? selectedChat?.chatTitle : newChat ? 'New chat' : `Chats (${chatList?.length})`}
              </Typography>
              {selectedChat && selectedChat?.users?.length > 2 && (
                <Box ml={1}>
                  <HtmlTooltip
                    arrow
                    placement="top"
                    title={<>{selectedChat?.users?.map((u) => <Typography>{`${u?.firstName} ${u?.lastName}`}</Typography>)}</>}
                  >
                    <Group fontSize="medium" className="text-[white]" />
                  </HtmlTooltip>
                </Box>
              )}
            </Box>

            <div className={`min-w-[24px] ${selectedChat ? 'flex-grow' : ''}`} />
          </Box>

          <Divider orientation="horizontal" />

          <Box>
            {newChat ? (
              <NewChat userId={user._id} setNewChat={setNewChat} setSelectedChat={setSelectedChat} users={users} />
            ) : selectedChat ? (
              <ChatBox isSmallScreen={isSmallScreen} user={user} />
            ) : (
              <>
                <div className="relative m-[21px_17px_23px]">
                  <TextField
                    value={filterValue}
                    onChange={(e) => setFilterChatList(e)}
                    className="w-full"
                    id="filter-chat-list"
                    name="outlined-basic"
                    type="search"
                    variant="outlined"
                    fullWidth
                    size="small"
                    label={'Search name or number'}
                  />
                </div>
                <h4 className="mb-3 px-[17px] text-[14px] font-semibold text-[var(--primary-text)]">Quick Contacts</h4>
                <List
                  disablePadding
                  dense
                  className={`${classes.listRoot} `}
                  style={{ overflowY: 'auto', height: isSmallScreen ? 'calc(100vh - 225px)' : '394px', background: 'var(--dark-secondary)' }}
                >
                  {filteredChatList.map((chat, i) => (
                    <ChatListITem key={chat.id} userId={user._id} socket={socket} chat={chat} setSelectedChat={setSelectedChat} getChats={getChats} />
                  ))}
                </List>
              </>
            )}
          </Box>
        </Box>
      )}
    </div>
  );
};

export default ChatsPopover;

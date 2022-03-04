import { useEffect, useState, useContext } from 'react';
import { Box, IconButton, Typography, CircularProgress } from '@material-ui/core';
import { SendOutlined } from '@material-ui/icons';
import moment from 'moment';

import axiosInstance from '../../axios/axiosInstance';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const ChatBox = ({ user: loggedInUser, msgSeen }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const { selectedChat, socket } = useContext(GlobalChatContext);
  const [messageValue, setMessageValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [isMsgSending, setIsMsgSending] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);
  const [loadingChat, setLoadingChat] = useState(true);

  useEffect(() => {
    if (!socket) return;
    socket.on('data', (data: any) => {
     if(data.userid === loggedInUser?._id) return

     setMessages((prevState) => [data, ...prevState])

    });
  }, [socket]);

  useEffect(() => {
    if (selectedChat) {
      getChatterInfo();
      setChatUsers(selectedChat.users);
    }
  }, [selectedChat]);

  const getChatterInfo = () => {
    setLoadingChat(true);
    if (selectedChat) {
      axiosInstance()
        .get(`/chatter/${selectedChat.id}`)
        .then(({ data: { data } }) => {
          setMessages(data.Messages);
          setCurrentUser(data.currentUser);
          setLoadingChat(false);
        })
        .catch(() => {
          setLoadingChat(false);
        });
    }
  };

  const sendMessage = async (e:React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsMsgSending(true);
    setMessages((prevState) => [
      {
        userid: loggedInUser?._id,
        seen: [loggedInUser?._id],
        message: messageValue,
        date: new Date().toISOString(),
        userName: `${loggedInUser?.firstName} ${loggedInUser?.lastName}`
      },
      ...prevState
    ]);
    setMessageValue('');
    try {
      const { data } = await axiosInstance().put(`/chatter/${selectedChat.id}`, { message: messageValue });

      if (data) {
        setIsMsgSending(false);
      }
    } catch (err) {
      setIsMsgSending(false);
      setToastConfig(err);
    }
  };

  const formatTime = (time:string) => moment(time).fromNow(true);

  const user = (data:any) => chatUsers.find((_d) => _d?._id === data.userid);

  return (
    <div className="global-chatbox">
      {selectedChat.chatTitle === 'eQuip-t User' && (
        <div className="not-found">
          <p>Account Deleted</p>
        </div>
      )}
      {loadingChat ? (
        <Box height={'100%'} display={'flex'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
          <CircularProgress size={24} />
          <div>
            <Typography component={'p'} variant="body1">
              Loading Chat...
            </Typography>
          </div>
        </Box>
      ) : (
        <div className="chatbox-container">
          {messages &&
            messages.map((data, i) => (
              <div key={i} className={`message-container ${data.userid === currentUser ? 'my-message' : ''}`}>
                <div
                  title={moment(data.date).format('DD, MMM YYYY')}
                  className={`message-outlet ${data.userid === currentUser ? 'my-color ml-4' : 'mr-4'}`}
                >
                  {selectedChat && chatUsers?.length > 2 ? (
                    <p className="username">{!user(data) ? 'eQuip-t User' : user(data)?._id !== currentUser && user(data)?.firstName}</p>
                  ) : null}
                  <div className="msg-data">
                    <Typography>{data.message}</Typography>
                    <p className="message-time">{formatTime(data.date)}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {!loadingChat && (
        <form onSubmit={sendMessage} className="chatbox-input">
          <input
            disabled={selectedChat.chatTitle === 'eQuip-t User'}
            placeholder="Start Typing..."
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
          />
          <Box mr={1}>
            <IconButton
              color="primary"
              disabled={!messageValue || selectedChat.chatTitle === 'eQuip-t User' || isMsgSending}
              type="submit"
              size="small"
            >
              <SendOutlined />
            </IconButton>
          </Box>
        </form>
      )}
    </div>
  );
};

export default ChatBox;

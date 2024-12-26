import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { Done, DoneAll } from '@mui/icons-material';
import { useContext, useEffect, useRef, useState } from 'react';

import { SendIcon } from 'src/assets/svg/svgIcons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import axiosInstance from '../../axios/axiosInstance';
import dayjs from 'dayjs';
import { displayDateTime } from 'src/constants/helpers';

const ChatBox = ({ user: loggedInUser, isSmallScreen }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const { selectedChat, socket } = useContext(GlobalChatContext);
  const [messageValue, setMessageValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [isMsgSending, setIsMsgSending] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('data', (data: any) => {
      if (data.userid === loggedInUser?._id) return;

      setMessages((prevState) => [data, ...prevState]);
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

  const sendMessage = async (e: React.ChangeEvent<HTMLFormElement>) => {
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

  const formatTime = (time: string) => dayjs.utc(time).tz().format('HH:MM');

  const user = (data: any) => chatUsers.find((_d) => _d?._id === data.userid);

  useEffect(() => {
    if (inputRef.current && !loadingChat) {
      inputRef.current.focus();
    }
  }, [selectedChat.id, loadingChat]);

  const RenderReadReceipt = ({ messageData }) => {
    if (messageData.userid !== currentUser) return null;
    if (messageData.seen.length === 1) {
      return (
        <span className="read-receipt received">
          <Done className="text-gray-500 [font-size:14px_!important]" />
        </span>
      );
    }
    if (messageData.seen.length === selectedChat.users.length) {
      return (
        <span className="read-receipt seen">
          <DoneAll className="text-[#49B11D] [font-size:14px_!important]" />
        </span>
      );
    }
    if (messageData.seen.length < selectedChat.users.length) {
      return (
        <span className="read-receipt sent">
          <DoneAll className="text-gray-500 [font-size:14px_!important]" />
        </span>
      );
    }
    return null;
  };

  return (
    <Box height={isSmallScreen ? '100%' : '509px'} className="global-chatbox">
      {selectedChat.chatTitle === 'Equipt User' && (
        <div className="not-found">
          <p>Account Deleted</p>
        </div>
      )}
      {loadingChat ? (
        <Box
          height={isSmallScreen ? 'calc(100vh - 171px)' : '449px'}
          display={'flex'}
          flexDirection={'column'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <CircularProgress size={24} />
          <div>
            <Typography component={'p'} variant="body1">
              Loading Chat...
            </Typography>
          </div>
        </Box>
      ) : (
        <Box
          height={isSmallScreen ? 'calc(100vh - 171px)' : '449px'}
          className="chatbox-container gap-y-[9px] bg-[var(--dark-secondary,white)] px-[17px] py-[20px]"
        >
          {messages &&
            messages.map((data, i) => {
              const userFromChat = user(data);
              const isMyMessage = data.userid === currentUser;
              return (
                <div key={i} className={`single-message group w-fit max-w-[calc(100%-min(30%,30px))] ${isMyMessage ? 'ml-auto' : 'mr-auto'}`}>
                  <div
                    title={displayDateTime(data.date, 'DD, MMM YYYY')}
                    className={`message-outlet p-[10px] ${
                      isMyMessage
                        ? 'my-message rounded-[10.142px_10.142px_0px_10.142px] bg-[var(--dark-primary,#E8FCFB)] text-right'
                        : 'rounded-[10.142px_10.142px_10.142px_0px] bg-[#F4F8F6] dark:bg-[rgba(14,14,35,0.5)]'
                    }`}
                    style={{
                      borderBottomLeftRadius: isMyMessage ? '14px' : 0,
                      borderBottomRightRadius: isMyMessage ? 0 : '14px'
                    }}
                  >
                    {selectedChat && chatUsers?.length > 2 ? (
                      <p className="mb-[2px] text-[13px] font-semibold">
                        {!userFromChat ? 'Equipt User' : userFromChat?._id !== currentUser && `${userFromChat?.firstName} ${userFromChat?.lastName}`}
                      </p>
                    ) : null}
                    <div className="msg-data">
                      <div className="msg-info">{/* <p className="name">{isMyMessage ? 'You' : data.userName}</p> */}</div>
                      <p className="msg-text">{data.message}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${isMyMessage ? 'justify-end text-right' : ''}`}>
                    <RenderReadReceipt messageData={data} />
                    <p className={`text-[12px] ${isMyMessage ? '' : 'opacity-0 transition-opacity duration-300 group-hover:opacity-100'}`}>
                      {formatTime(data.date)}
                    </p>
                  </div>
                </div>
              );
            })}
        </Box>
      )}

      {!loadingChat && (
        <form
          onSubmit={sendMessage}
          className={`grid h-[60px] grid-cols-[1fr_32px] items-center gap-[10px] px-[15px] py-[10px] shadow-[0px_-4px_40px_0px_rgba(0,_0,_0,_0.06)] dark:bg-[rgba(14,14,35,0.5)] dark:[border-top:1px_solid_var(--common-border-color)]`}
        >
          <input
            disabled={selectedChat.chatTitle === 'Equipt User'}
            placeholder="Start Typing..."
            value={messageValue}
            className="rounded-[26px] bg-[transparent] p-[12px_22px] text-[13px] text-[var(--primary-text)] [border:1px_solid_var(--common-border-color)] [outline-color:transparent] focus-within:[outline:2px_solid_var(--common-border-color)]"
            onChange={(e) => setMessageValue(e.target.value)}
            ref={inputRef}
          />

          <Box mr={1}>
            <IconButton
              color="primary"
              disabled={!messageValue || selectedChat.chatTitle === 'Equipt User' || isMsgSending}
              type="submit"
              size="small"
            >
              <SendIcon
                size={32}
                className={`text-[var(--dark-primary-text,#2A3042)]  ${
                  !messageValue || selectedChat.chatTitle === 'Equipt User' || isMsgSending ? ' opacity-70' : ''
                }`}
              />
            </IconButton>
          </Box>
        </form>
      )}
    </Box>
  );
};

export default ChatBox;

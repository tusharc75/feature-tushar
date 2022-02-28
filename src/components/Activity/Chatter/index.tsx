import { useContext, useEffect, useState } from 'react';
import { Box, IconButton, InputBase, Typography } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { Send } from '@material-ui/icons';
import io, { Socket } from 'socket.io-client';

import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { backendApi } from 'src/config';
import moment from 'moment';

const Chatter = (props: any) => {
  const { relatedTo } = props;

  const {
    state: {
      user: { user }
    }
  } = useData();
  const token = localStorage.getItem('token');
  const { setToastConfig } = useContext(CustomToastContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [chatterId, setChatterId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket>(null);
  const [isFocused, setFocused] = useState(false);
  const [isSending, setSending] = useState(false)

  const getChatter = () => {
    setLoading(true);
    axiosInstance()
      .get(`/chatter/resource?relatedTo=${JSON.stringify(relatedTo)}`)
      .then(({ data: { data } }) => {
        if (data) {
          setMessages(data.Messages.reverse());
          setChatterId(data._id);
        } else {
          createChatter();
        }
        setLoading(false);
      })
      .catch((err) => {
        setToastConfig(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!relatedTo || relatedTo.length === 0) return;

    const timeout = setTimeout(getChatter, 1000);
    return () => clearTimeout(timeout);
  }, [relatedTo]);

  useEffect(() => {
    if (!token || !chatterId) return;

    const s = io(`${backendApi}/chatter`, {
      auth: {
        token
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      transports: ['websocket', 'pooling']
    });
    s.on('connect', () => {
      s.emit('join', chatterId);
    });
    setSocket(s);
  }, [token, chatterId]);

  // Socket listening for data
  useEffect(() => {
    if (!socket) return;

    socket.on('data', (data) => {
      setMessages(data.Messages.reverse());
    });
  }, [socket]);

  const createChatter = () => {
    axiosInstance()
      .post(`/chatter`, { relatedTo })
      .then(({ data: { data } }) => {
        setChatterId(data._id);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setSending(true)
    try {
      await axiosInstance().put(`/chatter/${chatterId}`, { message });
      setSending(false)
      
      // setMessages((prevState) => [
        //   {
          //     message,
          //     date: new Date().toISOString(),
          //     userName: `${user?.firstName} ${user?.lastName}`,
          //     userid: user._id
          //   },
          //   ...prevState
          // ]);
        } catch (error) {
      setSending(false)
      setToastConfig(error);
    }
    setMessage('');
  };

  return (
    <Box p={1}>
      <div className="chat-box" id="chatList">
        <div className="chat-box-header">
          <Typography variant="h6"> Chatter</Typography>
        </div>
        <div className="chat-box-body">
          <div className="chat-logs" style={{ height: 300 }}>
            {loading ? (
              <Box height="100%" display="flex" flexDirection="column" justifyContent="flex-end">
                {[100, 180, 120, 160].map((i) => (
                  <Box height={60} key={i} display="flex" alignSelf={i < 150 ? 'flex-start' : 'flex-end'}>
                    <Skeleton height="100%" width={i} style={{ borderRadius: 16 }} />
                  </Box>
                ))}
              </Box>
            ) : messages.length ? (
              messages.map((data, idx) => (
                <div key={idx}>
                  {user._id === data.userid ? (
                    <div className="chat-msg self">
                      <div className="cm-msg-text self">
                        <p className="chat-user">{data.userName}</p>
                        <div className="message"> {data.message}</div>
                        <Box textAlign="right" className="chatTimer">
                          <Typography variant="caption">{moment(data.date).fromNow()}</Typography>
                        </Box>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-msg user">
                      <div className="cm-msg-text user">
                        <p className="chat-user">{data.userName}</p>
                        <div className="message"> {data.message} </div>
                        <Box textAlign="right" className="chatTimer">
                          <Typography variant="caption">{moment(data.date).fromNow()}</Typography>
                        </Box>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <Box textAlign="center">
                <Typography>No Messages</Typography>
              </Box>
            )}
          </div>
        </div>

        <Box component="form" onSubmit={sendMessage}>
          <Box style={{ padding: '8px 10px' }} display="flex" alignItems="center" boxShadow={1}>
            <Box border="1px solid #aaa" borderRadius={20} width="100%" height={34} borderColor={isFocused ? '#555' : '#aaa'}>
              <InputBase
                style={{ padding: '0 10px' }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                placeholder="Write message..."
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </Box>
            <Box mx={1} />
            <IconButton size="small" type="submit" disabled={!message || isSending} color="secondary">
              <Send />
            </IconButton>
          </Box>
        </Box>
      </div>
    </Box>
  );
};

export default Chatter;

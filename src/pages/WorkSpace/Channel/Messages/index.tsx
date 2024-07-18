import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { List, ListItem, ListItemText, Typography, Box, TextField, Button } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import io, { Socket } from 'socket.io-client';
import { backendApi } from 'src/config';

const Messages = ({ channelId }) => {
  const [messages, setMessages] = useState(null);
  const [message, setMessage] = useState('');
  const [lastMessageId, setLastMessageId] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [socket, setSocket] = useState<Socket>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    const s = io(`${backendApi?.replace('/api', '')}/workspace/channel`, {
      path: backendApi?.includes('/api') ? '/api/socket.io/' : '/socket.io/',
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      transports: ['websocket', 'pooling']
    });
    setSocket(s);
  }, [token]);

  const fetchMessages = async (after: string = null) => {
    try {
      let api = `/work-space/channel/${channelId}/message`;
      if (after) {
        api += `?after=${after}`;
      }
      const { data } = await axiosInstance().get(api);
      if (after) {
        setMessages((prevMessages) => [...prevMessages, ...data.data || []]);
      } else {
        setMessages(data?.data || []);
      }
      if (data?.data?.length > 0) setLastMessageId(data.data[data.data.length - 1]?._id);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const postMessage = async () => {
    try {
      await axiosInstance().post('/work-space/channel/message', { channelId, message });
      setMessage('');
      socket.emit('newMessagePosted', { channelId });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.emit('joinChannel', channelId);

      socket.on('fetchNewMessage', () => { fetchMessages(lastMessageId) });

      return () => {
        socket.emit('leaveChannel', channelId);
        socket.off('receiveMessage');
      };
    }
  }, [socket])


  useEffect(() => {
    fetchMessages();
  }, [channelId]);

  return (
    <>
      {messages !== null ?
        <List>
          {messages?.map((message) => (
            <ListItem key={message._id}>
              <ListItemText
                primary={message.user.optionLabel}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textPrimary">
                      {new Date(message.date).toLocaleString()}
                    </Typography>
                    {' - '}
                    {message.message}
                  </>
                }
              />
            </ListItem>
          ))}
        </List> : <>
          <CommonSkeleton lenArray={[...Array(2).keys()]} />
        </>}
      <Box display="flex" alignItems="center" mt={2}>
        <TextField
          fullWidth
          variant="outlined"
          label="Type Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button color="primary" variant="contained" onClick={postMessage}>
          Send
        </Button>
      </Box>
    </>
  );
};

export default Messages;

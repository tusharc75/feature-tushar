import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { List, ListItem, ListItemText, Typography, Box, TextField, Button } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const Messages = ({ channelId }) => {
  const [messages, setMessages] = useState(null);
  const [message, setMessage] = useState('');
  const toastConfig = useContext(CustomToastContext);

  const fetchMessages = async () => {
    try {
      const { data } = await axiosInstance().get(`/work-space/channel/${channelId}/message`);
      setMessages(data?.data || []);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const postMessage = async () => {
    try {
      await axiosInstance().post('/work-space/channel/message', { channelId, message });
      setMessage('');
      fetchMessages();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };


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

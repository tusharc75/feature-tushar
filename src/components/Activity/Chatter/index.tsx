import { Box, IconButton, InputBase, Typography } from '@mui/material';
import { Skeleton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SendIcon } from 'src/assets/svg/svgIcons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { backendApi } from 'src/config';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { ChatBoxIcon } from 'src/assets/svg/CollaborateSidebar';
import dayjs from 'dayjs';

const Chatter = (props: any) => {
  const { relatedTo } = props;

  const {
    state: {
      user: { user }
    }
  } = useData();

  const { isOffline } = useContext(CustomOfflineContext);

  const token = localStorage.getItem('token');
  const { setToastConfig } = useContext(CustomToastContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [chatterId, setChatterId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket>(null);
  const [isSending, setSending] = useState(false);

  const getChatter = () => {
    setLoading(true);
    if (!isOffline) {
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
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    if (!relatedTo || relatedTo.length === 0) return;

    const timeout = setTimeout(getChatter, 1000);
    return () => clearTimeout(timeout);
  }, [relatedTo]);

  useEffect(() => {
    if (!token || !chatterId || isOffline) return;
    const s = io(`${backendApi?.replace('/api', '')}/chatter`, {
      path: backendApi?.includes('/api') ? '/api/socket.io' : '/socket.io',
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
  }, [token, chatterId, isOffline]);

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
        //setToastConfig(err);
      });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axiosInstance().put(`/chatter/${chatterId}`, { message });
      setSending(false);
    } catch (error) {
      setSending(false);
      setToastConfig(error);
    }
    setMessage('');
  };

  return (
    <div className="overflow-hidden rounded-[10px] shadow-lg [border:1px_solid_var(--common-border-color)]" id="chatList">
      <div className="flex min-h-[53px] items-center gap-[18px] px-[20px] py-[9px] [border-bottom:1px_solid_var(--common-border-color)]">
        <span className="max-h-[25px] max-w-[25px]">
          <ChatBoxIcon />
        </span>
        <h6 className="text-[16px] font-semibold leading-[19px] text-[var(--dark-primary-text,#2A3042)]">Collaborate</h6>
      </div>
      <div className="chat-box-body">
        <div className="chat-logs relative" style={{ height: 250 }}>
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
                        <Typography variant="caption">{dayjs(data.date).fromNow()}</Typography>
                      </Box>
                    </div>
                  </div>
                ) : (
                  <div className="chat-msg user">
                    <div className="cm-msg-text user">
                      <p className="chat-user">{data.userName}</p>
                      <div className="message"> {data.message} </div>
                      <Box textAlign="right" className="chatTimer">
                        <Typography variant="caption">{dayjs(data.date).fromNow()}</Typography>
                      </Box>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="absolute left-1/2 top-1/2 select-none text-[16px] font-normal text-[#767676] [transform:translate(-50%,-50%)]">
              Start messaging
            </p>
          )}
        </div>
      </div>

      <form onSubmit={sendMessage} className="relative min-h-[48px] px-[11px] py-[8px] [border-top:1px_solid_var(--common-border-color)]">
        <Box display="flex" alignItems="center">
          <InputBase
            style={{ padding: '4px 15px' }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            placeholder="Type here..."
          />
          <IconButton
            size="small"
            type="submit"
            disabled={!message || isSending}
            style={{ borderRadius: 10, background: 'var(--new-theme-color)', width: 32, height: 32 }}
            className="!ml-[5px]"
          >
            <SendIcon size={20} className={`text-[white] ${!message || isSending ? ' opacity-70' : ''}`} />
          </IconButton>
        </Box>
      </form>
    </div>
  );
};

export default Chatter;

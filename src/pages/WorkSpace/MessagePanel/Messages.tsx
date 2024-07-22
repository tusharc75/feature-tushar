import { List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { groupBy } from 'lodash';
import moment from 'moment';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { dateFormat, dateTimeFormat } from 'src/constants/helpers';
import { Message } from 'src/pages/WorkSpace/types';

type MessagesProps = {
  channelId: string;
  socket: Socket;
};

const Messages = ({ channelId, socket }: MessagesProps) => {
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  const groupByDate = (messages: Message[]) => {
    return groupBy(messages, (message) => moment(message.date).format(dateFormat));
  };

  const fetchMessages = useCallback(
    async (after: string = null) => {
      try {
        let api = `/work-space/channel/${channelId}/message`;
        if (after) {
          api += `?after=${after}`;
        }
        const { data } = await axiosInstance().get(api);
        if (after) {
          setMessages((prevMessages) => groupByDate([...Object.values(prevMessages), ...(data.data || [])]));
        } else {
          setMessages(groupByDate(data?.data || []));
        }
        if (data?.data?.length > 0) setLastMessageId(data.data[data.data.length - 1]?._id);
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    },
    [channelId, toastConfig]
  );

  useEffect(() => {
    if (socket) {
      socket.emit('joinChannel', channelId);
      socket.on('fetchNewMessage', () => {
        fetchMessages(lastMessageId);
      });
      return () => {
        socket.emit('leaveChannel', channelId);
        socket.off('receiveMessage');
      };
    }
  }, [socket]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return (
    <>
      {messages !== null ? (
        <ul className="mt-8 list-none">
          {Object.keys(messages).map((date) => (
            <li key={date} className="mb- list-none">
              <div className="relative my-[20px] h-[1px] bg-[var(--common-border-color)]">
                <p
                  className={`absolute rounded-lg bg-[var(--dark-primary,white)] p-2 px-2 text-center 
                    text-gray-400 [border:1px_solid_var(--common-border-color)] [left:50%] [top:50%] [transform:translate(-50%,_-50%)]`}
                >
                  {moment(date, dateFormat).format('MMMM Do YYYY')}
                </p>
              </div>
              <ul className="list-none space-y-5 px-3">
                {messages[date].map((message) => (
                  <li key={message._id} className="list-none">
                    <div className="flex items-end gap-2">
                      <p className="user text-[15px] font-bold">{message.user?.optionLabel}</p>
                      <span className="text-[12px] font-normal">{moment(message.date).format('hh:mm A')}</span>
                    </div>
                    <p className="message" dangerouslySetInnerHTML={{ __html: message.message }}></p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-3">
          <CommonSkeleton lenArray={[...Array(2).keys()]} xs={12} sm={12} md={12} lg={12} />
        </div>
      )}
    </>
  );
};

export default Messages;

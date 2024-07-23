import { IconButton } from '@material-ui/core';
import { Delete, Reply } from '@material-ui/icons';
import { groupBy } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { dateFormat } from 'src/constants/helpers';
import { Message } from 'src/pages/WorkSpace/types';
import Thread from './Thread';

type MessagesProps = {
  channelId: string;
  socket: Socket;
  setIsEditorActive: React.Dispatch<React.SetStateAction<boolean>>;
};

export const groupByDate = (messages: Message[]) => {
  return groupBy(messages, (message) => moment(message.date).format(dateFormat));
};

const Messages = ({ channelId, socket, setIsEditorActive }: MessagesProps) => {
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, _id: null });
  const [threadDialog, setThreadDialog] = useState({ open: false, message: null });
  const { state: { user: { user } } } = useData();

  const fetchMessages = async (after: string = null) => {
    try {
      let api = `/work-space/channel/message/${channelId}`;
      if (after) {
        api += `?after=${after}`;
      }
      const { data } = await axiosInstance().get(api);

      setMessages(prevMessages => {
        let newMessages = data?.data || [];
        if (after) {
          return groupByDate([...Object.values(prevMessages).flat().slice(0, -1), ...newMessages]);
        } else {
          return groupByDate(newMessages);
        }
      });
      setThreadDialog((prevDialog) => {
        if (prevDialog.open && (prevDialog.message?._id === after || !after)) {
          const updatedMessage = data?.data?.find((message) => message._id === prevDialog.message?._id);
          return { open: true, message: updatedMessage || prevDialog.message };
        }
        return prevDialog;
      });
      if (data?.data?.length > 0) setLastMessageId(data.data[data.data.length - 1]?._id);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.emit('joinChannel', channelId);
      socket.on('fetchNewMessage', (messageId) => {
        if (messageId) {
          fetchMessages(messageId)
        } else {
          fetchMessages(lastMessageId);
        }
      });
      socket.on('fetchMessages', () => { fetchMessages() });
      return () => {
        socket.off('fetchNewMessage');
        socket.off('fetchMessages');
        socket.emit('leaveChannel', channelId);
      };
    }
  }, [socket, lastMessageId]);

  useEffect(() => {
    fetchMessages();
  }, [channelId]);

  const deleteMessage = async (_id) => {
    try {
      await axiosInstance().delete(`/work-space/channel/message`, { data: { _id } });
      socket.emit('messageDeleted', { channelId });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

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
                    {message?.user?.optionValue === user?._id && (
                      <>
                        <HtmlTooltip title={'Delete'}>
                          <IconButton onClick={() => setShowConfirmBox({ open: true, _id: message?._id })} size={'small'}>
                            <Delete color="error" />
                          </IconButton>
                        </HtmlTooltip>
                      </>
                    )}
                    <HtmlTooltip title={'Reply'} >
                      <IconButton size={'small'} onClick={() => setThreadDialog({ open: true, message: message })}>
                        <Reply />
                      </IconButton>
                    </HtmlTooltip>
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
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={showConfirmBox.open}
          message={`Are you sure you want to delete Message?`}
          onClose={() => {
            setShowConfirmBox({ open: false, _id: null });
          }}
          onOk={() => {
            deleteMessage(showConfirmBox._id);
            setShowConfirmBox({ open: false, _id: null });
          }}
        />
      )}
      {threadDialog.open && (
        <Thread
          message={threadDialog.message}
          onClose={() => setThreadDialog({ open: false, message: null })}
          socket={socket}
          channelId={channelId}
          deleteMessage={deleteMessage}
          setIsEditorActive={setIsEditorActive}
        />
      )}
    </>
  );
};

export default Messages;

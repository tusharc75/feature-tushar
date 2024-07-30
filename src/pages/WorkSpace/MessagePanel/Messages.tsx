import { IconButton, Menu, MenuItem } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { groupBy } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { cn, dateFormat } from 'src/constants/helpers';
import { Message } from 'src/pages/WorkSpace/types';
import Thread from './Thread';
import SendMessage from './SendMessage';
import EmojiPicker from 'emoji-picker-react';
import { BsEmojiGrin } from 'react-icons/bs';
import { useAppTheme } from 'src/constants/AppConfig';

type MessagesProps = {
  channelId: string;
  socket: Socket;
};

export const groupByDate = (messages: Message[]) => {
  return groupBy(messages, (message) => moment(message.date).format(dateFormat));
};

const spanClassName = 'text-[13px] text-gray-400';

const Messages = ({ channelId, socket }: MessagesProps) => {
  const [theme] = useAppTheme();
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, _id: null });
  const [threadDialog, setThreadDialog] = useState({ open: false, message: null });
  const [emojiPanelOpen, setEmojiPanleOpen] = useState<Message>(null);
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState<Message>(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const fetchMessages = async (after: string = null) => {
    try {
      let api = `/work-space/channel/message/${channelId}`;
      if (after) {
        api += `?after=${after}`;
      }
      const { data } = await axiosInstance().get(api);

      setMessages((prevMessages) => {
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
          fetchMessages(messageId);
        } else {
          fetchMessages(lastMessageId);
        }
      });
      socket.on('fetchMessages', () => {
        fetchMessages();
      });
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

  const handleMenuClick = (event, message: Message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleEdit = () => {
    setEditingMessage(selectedMessage);
    handleMenuClose();
  };

  const handleEditComplete = () => {
    setEditingMessage(null);
  };

  return (
    <div className={cn('message-panel relative flex transition-all duration-300', threadDialog?.open && 'lg:pr-[max(360px,_40%)]')}>
      <div className="flex w-full flex-col">
        <div className={cn('messages-container my-2 max-h-[max(500px,_calc(100vh-430px))] min-h-[500px] flex-grow overflow-y-auto')}>
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
                  <ul className="list-none space-y-5">
                    {messages[date].map((message) => (
                      <li
                        key={message._id}
                        className={cn(
                          'group relative list-none px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800',
                          selectedMessage?._id === message._id && 'bg-gray-100 dark:bg-gray-800'
                        )}
                        onMouseLeave={() => setEmojiPanleOpen(null)}
                      >
                        <div className="flex items-end gap-2">
                          <p className="user text-[15px] font-bold">{message.user?.optionLabel}</p>
                          <span className="text-[12px] font-normal">{moment(message.date).format('hh:mm A')}</span>
                        </div>
                        {editingMessage?._id === message._id ? (
                          <SendMessage
                            channelId={channelId}
                            socket={socket}
                            messageId={message._id}
                            initialMessage={message.message}
                            onEditComplete={handleEditComplete}
                            editorId={`sone`}
                          />
                        ) : (
                          <>
                            <div className="flex items-end gap-1">
                              <span
                                className="message [&_*:nth-last-child(2)]:inline [&_*]:max-w-fit [&_span:last-child]:ml-1 [&_span:last-child]:text-[12px] [&_span:last-child]:text-gray-400"
                                dangerouslySetInnerHTML={{
                                  __html: `${message.message} <span className=''>${message?.lastModified ? '(edited)' : ''}</span>`
                                }}
                              ></span>
                            </div>

                            <div
                              className={cn(
                                'floating-controls absolute -top-[10px] right-2 z-[10] flex items-center gap-1 rounded-md bg-[var(--dark-primary,_white)] p-1 opacity-0 [border:1px_solid_var(--common-border-color)] group-hover:opacity-100',
                                selectedMessage?._id === message._id && 'opacity-100'
                              )}
                            >
                              <IconButton size="small" onClick={() => setEmojiPanleOpen((prev) => (!prev ? message : null))}>
                                <span className="flex h-6 w-6 items-center justify-center">
                                  <BsEmojiGrin />
                                </span>
                              </IconButton>
                              <IconButton
                                onClick={(event) => {
                                  handleMenuClick(event, message);
                                }}
                                size="small"
                              >
                                <MoreVert />
                              </IconButton>
                              <div className="absolute right-0 top-10 z-[10]">
                                <EmojiPicker
                                  theme={theme}
                                  open={emojiPanelOpen?._id === message._id}
                                  lazyLoadEmojis
                                  className=" z-[10]"
                                  width={400}
                                  height={500}
                                  reactions={[]}
                                  onReactionClick={(d) => console.log(d)}
                                />
                              </div>
                            </div>
                          </>
                        )}
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
        </div>
        <SendMessage channelId={channelId} socket={socket} />
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem button>Mark unread</MenuItem>
        <MenuItem
          button
          onClick={() => {
            handleMenuClose();
            setThreadDialog({ open: true, message: selectedMessage });
          }}
        >
          Reply
        </MenuItem>
        {selectedMessage?.user?.optionValue === user?._id && (
          <MenuItem button onClick={handleEdit}>
            Edit
          </MenuItem>
        )}
        {selectedMessage?.user?.optionValue === user?._id && (
          <MenuItem button onClick={() => setShowConfirmBox({ open: true, _id: selectedMessage?._id })}>
            Delete
          </MenuItem>
        )}
      </Menu>
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
      <Thread
        message={threadDialog.message}
        open={threadDialog.open}
        onClose={() => setThreadDialog({ open: false, message: null })}
        socket={socket}
        channelId={channelId}
        deleteMessage={deleteMessage}
      />
    </div>
  );
};

export default Messages;

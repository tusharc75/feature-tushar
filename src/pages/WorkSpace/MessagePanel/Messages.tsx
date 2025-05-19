import { Delete, Edit, PushPin, Reply } from '@mui/icons-material';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { groupBy } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { TiPin } from 'react-icons/ti';
import { Socket } from 'socket.io-client';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { cn, dateFormat, displayDate } from 'src/constants/helpers';
import { ChannelData, Message } from 'src/pages/WorkSpace/types';
import { UseWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';
import { formatDateWithTodayYestarday } from 'src/pages/WorkSpace/utils';
import SendMessage from './SendMessage';
import Thread from './Thread';
import { DisplaySingleMessage } from 'src/pages/WorkSpace/MessagePanel/DisplaySingleMessage';

type MessagesProps = {
  channelId: string;
  threadDialogOpen: { open: boolean; message: Message };
  setThreadDialogOpen: React.Dispatch<React.SetStateAction<{ open: boolean; message: Message }>>;
  channelData: ChannelData;
  type: 'messages' | 'pins';
  state: UseWorkSpace;
  resourceData?: any | null;
  fromSidebar?: boolean;
};

export const groupByDate = (messages: Message[]) => {
  return groupBy(messages, (message) => displayDate(message.date));
};

const Messages = ({
  channelId,
  threadDialogOpen,
  setThreadDialogOpen,
  channelData,
  type,
  state,
  resourceData = null,
  fromSidebar = false
}: MessagesProps) => {
  const { socket, initialLoading } = state;
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMessageSeen, setLastMessageSeen] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState<Message>(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (props?: { messageId?: string; updateMessage?: Boolean }) => {
    const { messageId = null, updateMessage = false } = props || {};
    try {
      let api = `/work-space/channel/message/${channelId}`;
      if (updateMessage && messageId) {
        api += `/${messageId}`;
      } else if (messageId) {
        api += `?after=${messageId}${type === 'pins' ? '&type=pins' : ''}`;
      } else {
        api += `${type === 'pins' ? '?type=pins' : ''}`;
        // setIsLoading(true);
      }

      const { data } = await axiosInstance().get(api);

      setMessages((prevMessages) => {
        let newMessages = data?.data || [];
        if (updateMessage) {
          const updatedMessages: Message[] = Object?.values(prevMessages)?.flat();
          const index: number = updatedMessages?.findIndex((message) => message._id === messageId);
          updatedMessages[index] = data?.data;
          return groupByDate(updatedMessages);
        } else if (!updateMessage && messageId) {
          return groupByDate([...Object?.values(prevMessages)?.flat()?.slice(0, -1), ...newMessages]);
        } else {
          return groupByDate(newMessages);
        }
      });

      setTimeout(() => {
        containerRef.current?.scrollTo(0, containerRef.current?.scrollHeight || 0);
      }, 100);
      setThreadDialogOpen((prevDialog) => {
        if (prevDialog.open && (prevDialog.message?._id === messageId || !messageId)) {
          const updatedMessage = data?.data?.find((message) => message._id === prevDialog.message?._id);
          return { open: true, message: updatedMessage || prevDialog.message };
        }
        return prevDialog;
      });
      if (data?.data?.length > 0) setLastMessageSeen(data?.data[data.data.length - 1]?._id);
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('fetchUpdatedMessage', (messageId) => {
        fetchMessages({ messageId, updateMessage: true });
      });
      socket.on('fetchMessages', (messageId) => {
        fetchMessages(messageId);
      });
      socket.on('addReaction', ({ messageId, emoji, user }) => {
        setMessages((prevMessages) => {
          let updatedMessages: any = Object.assign({}, prevMessages);
          Object.values(updatedMessages).forEach((u: any) => {
            u.forEach((m) => {
              if (m._id === messageId) {
                if (!m['reactions']) m['reactions'] = [];
                m['reactions'].push({ emoji, user });
              }
            });
          });
          return updatedMessages;
        });
      });
      socket.on('removeReaction', ({ messageId, emoji, user }) => {
        setMessages((prevMessages) => {
          let updatedMessages: any = Object.assign({}, prevMessages);
          Object.values(updatedMessages).forEach((u: any) => {
            u.forEach((m) => {
              if (m._id === messageId) {
                if (m['reactions']) {
                  m['reactions'] = m['reactions'].filter((reaction) => reaction.emoji !== emoji || reaction.user.optionValue !== user);
                }
              }
            });
          });
          return updatedMessages;
        });
      });
    }
    return () => {
      if (socket) {
        socket.off('fetchUpdatedMessage');
        socket.off('fetchMessages');
        socket.off('addReaction');
        socket.off('removeReaction');
      }
    };
  }, [socket, channelId, type]);

  useEffect(() => {
    if (channelId) {
      setIsLoading(true);
      fetchMessages();
    }
  }, [channelId, type]);

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
  };

  const handleEditComplete = () => {
    setEditingMessage(null);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'messages-container relative my-2 flex-shrink flex-grow overflow-y-auto scroll-smooth',
          fromSidebar ? 'h-[300px] overflow-y-auto' : ''
        )}
      >
        {messages && !isLoading ? (
          <ul className="mt-8 list-none">
            {Object.keys(messages).map((date) => (
              <li key={date} className="mb- list-none">
                <div className="relative mx-auto my-[20px] h-[1px] w-[calc(100%-30px)] bg-[var(--common-border-color)]">
                  <p
                    className={`absolute rounded-lg bg-[var(--dark-primary,white)] p-2 px-2 text-center text-xs 
                    text-gray-400 [left:50%] [top:50%] [transform:translate(-50%,_-50%)]`}
                  >
                    {formatDateWithTodayYestarday(date, { onlyMonths: true, dateFormat })}
                  </p>
                </div>
                <ul className="list-none space-y-5">
                  {messages[date].map((message) => {
                    return (
                      <DisplaySingleMessage
                        key={message._id}
                        message={message}
                        selectedMessage={selectedMessage}
                        editingMessage={editingMessage}
                        channelId={channelId}
                        socket={socket}
                        state={state}
                        handleEditComplete={handleEditComplete}
                        setThreadDialogOpen={setThreadDialogOpen}
                        handleMenuClick={handleMenuClick}
                        channelData={channelData}
                      />
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        ) : !channelId ? (
          <div className={'absolute inset-2 flex select-none items-center justify-center text-gray-500'}>Start Conversation</div>
        ) : (
          <div className="p-3">
            <CommonSkeleton lenArray={[...Array(2).keys()]} xs={12} sm={12} md={12} lg={12} />
          </div>
        )}
      </div>
      <SendMessage
        channelId={channelId}
        socket={socket}
        channelData={channelData}
        messageId={lastMessageSeen}
        state={state}
        disabled={
          initialLoading
            ? true
            : resourceData
              ? false
              : !channelData?.members.some((d) => d.optionValue === user?._id) || isLoading || type === 'pins'
        }
        resourceData={resourceData}
      />
      <MoreMenuAndDeleteConfirmDialog
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        setThreadDialogOpen={setThreadDialogOpen}
        selectedMessage={selectedMessage}
        handleEdit={handleEdit}
        socket={socket}
      />
      {threadDialogOpen.open && (
        <Thread
          state={state}
          message={threadDialogOpen.message}
          open={threadDialogOpen.open}
          onClose={() => setThreadDialogOpen({ open: false, message: null })}
          socket={socket}
          channelId={channelId}
          channelData={channelData}
        />
      )}
    </>
  );
};

export default Messages;

type MoreMenuAndDeleteConfirmDialogProps = {
  anchorEl: HTMLElement;
  handleMenuClose: () => void;
  setThreadDialogOpen?: React.Dispatch<React.SetStateAction<{ open: boolean; message: Message }>>;
  selectedMessage: Message;
  handleEdit: () => void;
  socket: Socket;
  type?: 'messages' | 'pins';
};

export const MoreMenuAndDeleteConfirmDialog = ({
  anchorEl,
  handleMenuClose,
  setThreadDialogOpen,
  selectedMessage,
  handleEdit,
  socket,
  type = 'messages'
}: MoreMenuAndDeleteConfirmDialogProps) => {
  const {
    state: {
      user: { user }
    }
  } = useData();

  const toastConfig = useContext(CustomToastContext);

  const [showConfirmBox, setShowConfirmBox] = useState<boolean>(false);

  const deleteMessage = async () => {
    try {
      await axiosInstance().delete(`/work-space/channel/message`, { data: { _id: selectedMessage?._id } });
      socket.emit('messageDeleted', { channelId: selectedMessage?.channel });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const pinMessage = async () => {
    try {
      await axiosInstance().post(`/work-space/channel/message/pin-unpin/${selectedMessage?._id}`);
      socket.emit('messageUpdated', { channelId: selectedMessage?.channel, messageId: selectedMessage?._id });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <span onClick={handleMenuClose}>
          <MenuItem onClick={pinMessage}>
            <ListItemIcon>
              {selectedMessage?.pinned ? <TiPin size={22} className="text-black dark:text-white" /> : <PushPin fontSize="small" color="primary" />}
            </ListItemIcon>
            <ListItemText>{selectedMessage?.pinned ? 'Unpin' : 'Pin'}</ListItemText>
          </MenuItem>
          {setThreadDialogOpen && type !== 'pins' && (
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setThreadDialogOpen({ open: true, message: selectedMessage });
              }}
            >
              <ListItemIcon>
                <Reply fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Reply</ListItemText>
            </MenuItem>
          )}
          {selectedMessage?.user?.optionValue === user?._id && (
            <MenuItem onClick={() => handleEdit()}>
              <ListItemIcon>
                <Edit fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          )}
          {selectedMessage?.user?.optionValue === user?._id && (
            <MenuItem onClick={() => setShowConfirmBox(true)}>
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </span>
      </Menu>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete Message?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={() => {
            deleteMessage();
            setShowConfirmBox(false);
          }}
        />
      )}
    </>
  );
};

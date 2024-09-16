import { Avatar, IconButton, Menu, MenuItem, Popper, Tooltip } from '@material-ui/core';
import { MoreVert, Delete, GetApp } from '@material-ui/icons';
import EmojiPicker from 'emoji-picker-react';
import { groupBy, uniqBy } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useRef, useState } from 'react';
import { BsEmojiGrin, BsReply } from 'react-icons/bs';
import { Socket } from 'socket.io-client';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, dateFormat, getFileIconSrc } from 'src/constants/helpers';
import { ChannelData, Message } from 'src/pages/WorkSpace/types';
import { formatDateWithTodayYestarday } from 'src/pages/WorkSpace/utils';
import SendMessage from './SendMessage';
import Thread from './Thread';

type MessagesProps = {
  channelId: string;
  socket: Socket;
  threadDialogOpen: { open: boolean; message: Message };
  setThreadDialogOpen: React.Dispatch<React.SetStateAction<{ open: boolean; message: Message }>>;
  channelData: ChannelData;
};

export const groupByDate = (messages: Message[]) => {
  return groupBy(messages, (message) => moment(message.date).format(dateFormat));
};

const Messages = ({ channelId, socket, threadDialogOpen, setThreadDialogOpen, channelData }: MessagesProps) => {
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, _id: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState<Message>(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      containerRef.current?.scrollTo(0, containerRef.current?.scrollHeight || 0);
      setThreadDialogOpen((prevDialog) => {
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
      return () => {
        socket.off('fetchNewMessage');
        socket.off('fetchMessages');
        socket.off('addReaction');
        socket.off('removeReaction');
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
  };

  const handleEditComplete = () => {
    setEditingMessage(null);
  };

  return (
    <>
      <div ref={containerRef} className={cn('messages-container my-2 flex-shrink flex-grow overflow-y-auto scroll-smooth')}>
        {messages !== null ? (
          <ul className="mt-8 list-none">
            {Object.keys(messages).map((date) => (
              <li key={date} className="mb- list-none">
                <div className="relative my-[20px] h-[1px] bg-[var(--common-border-color)]">
                  <p
                    className={`absolute rounded-lg bg-[var(--dark-primary,white)] p-2 px-2 text-center 
                    text-gray-400 [border:1px_solid_var(--common-border-color)] [left:50%] [top:50%] [transform:translate(-50%,_-50%)]`}
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
                        handleEditComplete={handleEditComplete}
                        setThreadDialogOpen={setThreadDialogOpen}
                        handleMenuClick={handleMenuClick}
                      />
                    );
                  })}
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
      <SendMessage channelId={channelId} socket={socket} channelData={channelData} />
      <MoreMenuAndDeleteConfirmDialog
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        setThreadDialogOpen={setThreadDialogOpen}
        selectedMessage={selectedMessage}
        handleEdit={handleEdit}
        setShowConfirmBox={setShowConfirmBox}
        showConfirmBox={showConfirmBox}
        deleteMessage={deleteMessage}
      />
      <Thread
        message={threadDialogOpen.message}
        open={threadDialogOpen.open}
        onClose={() => setThreadDialogOpen({ open: false, message: null })}
        socket={socket}
        channelId={channelId}
        deleteMessage={deleteMessage}
        channelData={channelData}
      />
    </>
  );
};

export default Messages;

type DisplaySingleMessageProps = {
  message: Message;
  selectedMessage: Message;
  editingMessage: Message;
  channelId: string;
  socket: Socket;
  handleEditComplete: () => void;
  setThreadDialogOpen?: React.Dispatch<React.SetStateAction<{ open: boolean; message: Message }>>;
  handleMenuClick: (event: React.MouseEvent<HTMLButtonElement>, message: Message) => void;
  messageTimeFormatter?: (string) => string;
};

export const DisplaySingleMessage = ({
  message,
  selectedMessage,
  editingMessage,
  channelId,
  socket,
  handleEditComplete,
  setThreadDialogOpen,
  handleMenuClick,
  messageTimeFormatter = (date) => moment(date).format('hh:mm A')
}: DisplaySingleMessageProps) => {
  const [theme] = useAppTheme();
  const [emojiPanleAnchor, setEmojiPanelAnchor] = useState<HTMLElement>(null);
  const [attachmentConfirmBox, setAttachmentConfirmBox] = useState({ open: false, messageId: null, attachmentId: null });
  const openEmojiPanel = (e: React.MouseEvent<HTMLButtonElement>, message: Message) => {
    setEmojiPanelAnchor((prev) => (!prev ? e.currentTarget : null));
  };
  const closeEmojiPanel = () => {
    setEmojiPanelAnchor(null);
  };
  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      user: { user }
    }
  } = useData();

  if (!message) return null;

  const replies = message.replies || [];
  const uniqueReplies = setThreadDialogOpen ? uniqBy(replies, (d) => d.user.optionLabel) : [];

  const groupedReactions = Object.values(groupBy(message.reactions, 'emoji')).map((reactions) => ({
    emoji: reactions[0].emoji,
    count: reactions.length,
    users: reactions.map((reaction) => reaction.user)
  }));

  const handleReaction = async (emoji) => {
    try {
      await axiosInstance().post('/work-space/channel/message/reaction', { messageId: message._id, emoji });
      socket.emit('reaction', { channelId, messageId: message._id, emoji });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      closeEmojiPanel();
    }
  };

  const handleReactionClick = async (reaction) => {
    try {
      if (reaction?.users?.find((u) => u.optionValue === user?._id)) {
        await axiosInstance().delete(`/work-space/channel/message/reaction`, { data: { messageId: message._id, emoji: reaction.emoji } });
        socket.emit('removeReaction', { channelId, messageId: message._id, emoji: reaction.emoji });
      } else {
        await handleReaction(reaction.emoji);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const downloadFile = (attachment) => {
    axiosInstance()
      .get(`user/download?fileName=${attachment}`, { responseType: 'blob' })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', attachment);
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const deleteAttachment = async (messageId, attachmentId) => {
    try {
      await axiosInstance().put(`/work-space/channel/message/remove-attachment`, { messageId, attachmentId });
      socket.emit('messageDeleted', { channelId });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const isSelf = user?._id === message?.user?.optionValue;

  return (
    <>
      <li
        key={message._id}
        className={cn(
          'group relative list-none px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800',
          selectedMessage?._id === message._id && 'bg-gray-100 dark:bg-gray-800'
        )}
        onMouseLeave={closeEmojiPanel}
      >
        <div className={cn('flex gap-2', isSelf ? ' flex-row-reverse justify-start' : '')}>
          <Avatar style={{ width: 28, height: 28, borderRadius: 8, fontSize: 15 }} variant="rounded" className="mt-[3px]" src={message.avatar}>
            {message.user?.optionLabel.match(/(\b\S)?/g).join('')}
          </Avatar>
          <div className="flex-grow">
            <div className={cn('flex items-end gap-2 pb-[6px]', isSelf ? 'ml-auto w-fit' : '')}>
              <h6 className="user text-[14px] font-medium">
                {message.user?.optionLabel}
                {isSelf ? ' (you)' : ''}
              </h6>
              <span className="text-[12px] font-normal ">{messageTimeFormatter(message.date)}</span>
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
                <div>
                  <span
                    className={cn(
                      `message block w-fit max-w-[70%] rounded-lg px-[20px]  py-[9px] md:max-w-[60%]  
                        [&_*:nth-last-child(2)]:inline [&_*]:max-w-fit [&_span:last-child]:ml-1 [&_span:last-child]:text-[12px] 
                       [&_span:last-child]:text-gray-400`,
                      isSelf
                        ? 'ml-auto bg-[#0DA0A840] text-[#777575] dark:bg-[#0DA0A840] dark:text-[white]'
                        : 'bg-[#F4F4F4] text-[#777575] dark:bg-[hsla(0deg,0%,37.27%,0.5)] dark:text-white'
                    )}
                    dangerouslySetInnerHTML={{
                      __html: `${message.message} <span className=''>${message?.lastModified ? '(edited)' : ''}</span>`
                    }}
                  ></span>
                  <div className={cn('max-w-fit', isSelf ? 'ml-auto text-right' : '')}>
                    {groupedReactions?.length > 0 && (
                      <div className={cn('reactions mt-2 flex gap-1', isSelf ? ' justify-end' : '')}>
                        {groupedReactions?.map((reaction, index) => (
                          <Tooltip
                            key={index}
                            title={
                              <div className="p-1">
                                <p>
                                  {reaction.users
                                    .map((u) => {
                                      if (u.optionValue === user?._id) return 'You';
                                      else return u.optionLabel;
                                    })
                                    .join(', ')}{' '}
                                  reacted with {reaction.emoji}
                                </p>
                              </div>
                            }
                          >
                            <div className="reaction flex items-center gap-1 rounded-md bg-gray-200 p-1 dark:bg-gray-700">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactionClick(reaction);
                                }}
                              >
                                {reaction.emoji}
                              </span>
                              <span>{reaction.count}</span>
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                    {message?.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 py-3">
                        {message?.attachments?.map((attachment) => {
                          const Icon = getFileIconSrc(attachment?.url);
                          return (
                            <>
                              <div className="group relative min-h-[153px] w-[138px] max-w-[138px] flex-grow basis-[138px] rounded-[4px] border border-[var(--common-border-color)] p-[var(--gutter)] [--gutter:18px]">
                                <div className="front  group-hover:hidden">
                                  <div className="mx-auto mb-[11px] h-[79px] text-center">
                                    <Icon size={50} className="mx-auto" />
                                  </div>
                                  <p className=" line-clamp-1 text-[14px] text-[var(--text-primary)]">{attachment?.fileName}</p>
                                </div>
                                <div className="back absolute inset-0 flex flex-col justify-between p-[var(--gutter)] opacity-0 group-hover:opacity-100">
                                  <p className=" line-clamp-4 text-[14px] text-[var(--text-primary)]" title={attachment?.fileName}>
                                    {attachment?.fileName}
                                  </p>
                                  <div className="flex justify-between">
                                    <HtmlTooltip title="Download" placement="top" enterTouchDelay={0}>
                                      <IconButton
                                        size={'small'}
                                        onClick={() => downloadFile(attachment.url)}
                                        style={{ paddingBottom: 3, width: 30, height: 30 }}
                                      >
                                        {<GetApp />}
                                      </IconButton>
                                    </HtmlTooltip>
                                    {message?.user?.optionValue === user?._id && (
                                      <HtmlTooltip title="Delete Attachment" placement="top" enterTouchDelay={0}>
                                        <IconButton
                                          size={'small'}
                                          onClick={() => {
                                            setAttachmentConfirmBox({ open: true, messageId: message?._id, attachmentId: attachment?._id });
                                          }}
                                          style={{ paddingBottom: 3, width: 30, height: 30 }}
                                        >
                                          {<Delete color="error" />}
                                        </IconButton>
                                      </HtmlTooltip>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })}
                      </div>
                    )}
                    {replies.length > 0 && setThreadDialogOpen && (
                      <div
                        onClick={() => setThreadDialogOpen({ open: true, message })}
                        className="group flex cursor-pointer items-center gap-1 rounded-md bg-[var(--dark-primary,white)] p-1 transition-all duration-200 [outline:1px_solid_transparent] hover:shadow-md hover:[outline:1px_solid_var(--common-border-color)]"
                      >
                        {uniqueReplies.map((reply, index) => {
                          if (index > 3) return null;
                          return (
                            <Avatar
                              style={{
                                width: 24,
                                height: 24,
                                fontSize: '0.8rem',
                                borderRadius: 'clamp(6px, min(22.222%, 12px), 12px)'
                              }}
                              variant="rounded"
                              src={reply.avatar}
                            >
                              {reply.user?.optionLabel.match(/(\b\S)?/g).join('')}
                            </Avatar>
                          );
                        })}
                        <span className="link ml-1 line-clamp-1">{message.replies.length} replies</span>
                        <div className="relative ml-1 text-[13px] font-normal">
                          <span className="absolute line-clamp-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">View Thread</span>
                          <span className="line-clamp-1 opacity-100 transition-opacity duration-200 group-hover:opacity-0">
                            Last reply {formatDateWithTodayYestarday(replies[replies.length - 1].date)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    'floating-controls absolute -top-[10px] right-2 z-[10] flex items-center gap-[2px] rounded-md bg-[var(--dark-primary,_white)] p-1 opacity-0 [border:1px_solid_var(--common-border-color)] group-hover:opacity-100',
                    selectedMessage?._id === message._id && 'opacity-100'
                  )}
                >
                  <HtmlTooltip title="Find reaction">
                    <IconButton size="small" onClick={(e) => openEmojiPanel(e, message)}>
                      <span className="flex h-6 w-6 items-center justify-center">
                        <BsEmojiGrin />
                      </span>
                    </IconButton>
                  </HtmlTooltip>
                  {setThreadDialogOpen && (
                    <HtmlTooltip title="Reply in thread">
                      <IconButton size="small" onClick={() => setThreadDialogOpen({ open: true, message })}>
                        <span className="flex h-6 w-6 items-center justify-center">
                          <BsReply size={24} />
                        </span>
                      </IconButton>
                    </HtmlTooltip>
                  )}
                  <HtmlTooltip title="More actions">
                    <IconButton
                      onClick={(event) => {
                        handleMenuClick(event, message);
                      }}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </HtmlTooltip>
                  <Popper
                    placement="bottom-end"
                    open={Boolean(emojiPanleAnchor)}
                    anchorEl={emojiPanleAnchor}
                    disablePortal={true}
                    modifiers={{
                      flip: {
                        enabled: true
                      },
                      preventOverflow: {
                        enabled: true,
                        boundariesElement: 'scrollParent'
                      },
                      arrow: {
                        enabled: true
                      }
                    }}
                  >
                    <EmojiPicker
                      theme={theme}
                      open={Boolean(emojiPanleAnchor)}
                      lazyLoadEmojis
                      className=" z-[10]"
                      width={400}
                      height={400}
                      reactions={[]}
                      onEmojiClick={(d) => {
                        handleReaction(d.emoji);
                      }}
                    />
                  </Popper>
                </div>
              </>
            )}
          </div>
        </div>
      </li>
      {attachmentConfirmBox.open && (
        <ConfirmationDialog
          open={attachmentConfirmBox.open}
          message={`Are you sure you want to delete attachment?`}
          onClose={() => {
            setAttachmentConfirmBox({ open: false, messageId: null, attachmentId: null });
          }}
          onOk={() => {
            deleteAttachment(attachmentConfirmBox.messageId, attachmentConfirmBox.attachmentId);
            setAttachmentConfirmBox({ open: false, messageId: null, attachmentId: null });
          }}
        />
      )}
    </>
  );
};

type MoreMenuAndDeleteConfirmDialogProps = {
  anchorEl: HTMLElement;
  handleMenuClose: () => void;
  setThreadDialogOpen?: React.Dispatch<React.SetStateAction<{ open: boolean; message: Message }>>;
  selectedMessage: Message;
  handleEdit: () => void;
  setShowConfirmBox: React.Dispatch<React.SetStateAction<{ open: boolean; _id: string }>>;
  showConfirmBox: { open: boolean; _id: string };
  deleteMessage: (id: string) => void;
};

export const MoreMenuAndDeleteConfirmDialog = ({
  anchorEl,
  handleMenuClose,
  setThreadDialogOpen,
  selectedMessage,
  handleEdit,
  setShowConfirmBox,
  showConfirmBox,
  deleteMessage
}: MoreMenuAndDeleteConfirmDialogProps) => {
  const {
    state: {
      user: { user }
    }
  } = useData();

  return (
    <>
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
        <span onClick={handleMenuClose}>
          <MenuItem button>Mark unread</MenuItem>
          {setThreadDialogOpen && (
            <MenuItem
              button
              onClick={() => {
                handleMenuClose();
                setThreadDialogOpen({ open: true, message: selectedMessage });
              }}
            >
              Reply
            </MenuItem>
          )}
          {selectedMessage?.user?.optionValue === user?._id && (
            <MenuItem button onClick={() => handleEdit()}>
              Edit
            </MenuItem>
          )}
          {selectedMessage?.user?.optionValue === user?._id && (
            <MenuItem button onClick={() => setShowConfirmBox({ open: true, _id: selectedMessage?._id })}>
              Delete
            </MenuItem>
          )}
        </span>
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
    </>
  );
};

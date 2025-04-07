import { groupBy } from 'lodash';
import React, { Fragment, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { RenderAvatar, RenderButton, RenderContent } from 'src/components/DesktopDM/ShowMessage/helperComponents';
import { Chat, Message, OpenedChat, UseDesktopDM, User } from 'src/components/DesktopDM/types';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cn, displayDate } from 'src/constants/helpers';

type ShowMessagesProps = {
  state: UseDesktopDM;
  data: User | Chat;
  openedChat: OpenedChat;
};

export const groupByDate = (messages: Message[]) => {
  return groupBy(messages, (message) => displayDate(message.date));
};

export type ShowMessageRef = {
  onNewMessagePost: (messageId: string) => void;
  focusMessage: (messageId: string) => void;
};

let timeout: NodeJS.Timeout;

const ShowMessages = React.forwardRef<ShowMessageRef, ShowMessagesProps>(({ data: panelData, state, openedChat }, ref) => {
  const { toastConfig, socket, user, readMessage, checkIsUser, currentlyEditingMessage } = state;
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(null);
  const isUserData = checkIsUser(panelData);
  const containerRef = useRef<HTMLDivElement>(null);
  const pinndedMessges = useMemo(() => {
    return messages
      ? Object.values(messages)
          .flat()
          ?.filter((message) => message['pinned'] === true)
      : [];
  }, [messages]);

  const channelId = useMemo(() => {
    if (isUserData) return null;
    return panelData._id;
  }, [isUserData, panelData._id]);

  useEffect(() => {
    if (channelId) {
      socket.emit('joinChannel', channelId);
    }
    return () => {
      socket.emit('leaveChannel', channelId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    if (openedChat.open === 'fullyOpen' && channelId) {
      readMessage(channelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedChat.open, channelId]);

  const fetchMessages = async (props?: { messageId?: string; updateMessage?: Boolean }) => {
    const { messageId = null, updateMessage = false } = props || {};
    if (isUserData) return;
    try {
      let api = `/work-space/channel/message/${panelData._id}`;
      if (updateMessage && messageId) {
        api += `/${messageId}`;
      } else if (messageId) {
        api += `?after=${messageId}`;
      }
      const { data } = await axiosInstance().get(api);
      let newMessages = data?.data || [];
      if (!channelId && newMessages[0] && openedChat.open !== 'partial') readMessage(newMessages[0].channel);
      setMessages((prevMessages) => {
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

      scrollToBottom();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const scrollToBottom = () => {
    timeout = setTimeout(() => {
      containerRef.current?.scrollTo(0, containerRef.current?.scrollHeight || 0);
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, panelData?._id]);

  useEffect(() => {
    if (!isUserData) {
      fetchMessages({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelData?._id, isUserData]);

  useEffect(() => {
    if (currentlyEditingMessage?._id) {
      focusMessage(currentlyEditingMessage._id, false);
    }
  }, [currentlyEditingMessage?._id]);

  const focusMessage = (messageId: string, showBorder = true) => {
    if (containerRef.current) {
      const messageElement = containerRef.current.querySelector(`#message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (showBorder) {
          messageElement.classList.add('outline', 'outline-2', 'outline-theme');
          setTimeout(() => {
            messageElement.classList.remove('outline', 'outline-2', 'outline-theme');
          }, 2000);
        }
      }
    }
  };

  useImperativeHandle(ref, () => ({
    onNewMessagePost: (messageId) => {
      fetchMessages({ messageId });
    },
    focusMessage
  }));

  return (
    <div ref={containerRef} className={cn('flex-grow scroll-smooth', currentlyEditingMessage ? 'overflow-hidden' : 'overflow-y-auto')}>
      {/* Pinned messages */}
      {pinndedMessges.length > 0 && (
        <div className="sticky top-0 z-10 flex w-full items-center justify-between border-b bg-white p-2 text-sm font-semibold text-gray-900 dark:bg-slate-800 dark:text-white">
          <span>Pinned Messages</span>
          <span className="flex gap-2">
            {pinndedMessges.map((message) => {
              return (
                <div onClick={() => focusMessage(message._id)} className="cursor-pointer" key={message._id}>
                  <RenderAvatar message={message} key={message._id} />
                </div>
              );
            })}
          </span>
        </div>
      )}
      {/* End of Pinned messages */}
      {/* Start of Message content */}
      {messages ? (
        <div className={cn('messages relative')}>
          {currentlyEditingMessage && <div className="absolute inset-0 z-[1] bg-black/50" />}
          {Object.keys(messages).map((date) => {
            const messagesInThatDate = messages[date];
            return (
              <Fragment key={date}>
                <div className="space-y-4 p-2">
                  {messagesInThatDate.map((message) => {
                    const isUserMessage = user._id === message.user.optionValue;
                    return (
                      <div className={cn('flex  items-start gap-2.5', isUserMessage ? 'flex-row-reverse' : '')} key={message._id}>
                        <RenderAvatar message={message} />
                        <RenderContent
                          message={message}
                          state={state}
                          isUserMessage={isUserMessage}
                          className={cn('scroll-m-[60px]', currentlyEditingMessage?._id === message._id ? 'z-[2] bg-[--dark-primary,white]' : '')}
                          id={`message-${message._id}`}
                        />
                        <RenderButton message={message} isUserMessage={isUserMessage} state={state} />
                      </div>
                    );
                  })}
                </div>
              </Fragment>
            );
          })}
        </div>
      ) : isUserData ? (
        <div className="flex h-full items-center justify-center">
          <p>Send Message</p>
        </div>
      ) : (
        <div className="p-2">
          <CommonSkeleton />
        </div>
      )}
      {/* End of Message content */}
    </div>
  );
});

export default ShowMessages;

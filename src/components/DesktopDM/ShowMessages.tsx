import { MoreVert } from '@mui/icons-material';
import { Avatar, IconButton } from '@mui/material';
import { groupBy } from 'lodash';
import React, { Fragment, useEffect, useImperativeHandle, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Chat, Message, UseDesktopDM, User } from 'src/components/DesktopDM/types';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cn, displayDate, formatDate } from 'src/constants/helpers';

type ShowMessagesProps = {
  state: UseDesktopDM;
  data: User | Chat;
};

export const groupByDate = (messages: Message[]) => {
  return groupBy(messages, (message) => displayDate(message.date));
};

export type ShowMessageRef = {
  onNewMessagePost: (messageId: string) => void;
};

let timeout: NodeJS.Timeout;

const ShowMessages = React.forwardRef<ShowMessageRef, ShowMessagesProps>(({ data: panelData, state }, ref) => {
  const { toastConfig, socket, user, checkIsUser } = state;
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>(null);
  const isUserData = checkIsUser(panelData);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async ({ messageId = null, updateMessage = false }: { messageId?: string; updateMessage?: Boolean }) => {
    if (isUserData) return;
    try {
      let api = `/work-space/channel/message/${panelData._id}`;
      if (updateMessage && messageId) {
        api += `/${messageId}`;
      } else if (messageId) {
        api += `?after=${messageId}`;
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

      scrollToBottom();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const onNewMessagePost = async (messageId: string) => {
    if (isUserData) return;
    try {
      const api = `/work-space/channel/message/${panelData._id}?after=${messageId}`;
      const { data } = await axiosInstance().get(api);
      setMessages((prevMessages) => {
        let newMessages = data?.data || [];
        return groupByDate([...Object?.values(prevMessages)?.flat(), ...newMessages]);
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      scrollToBottom();
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

  useImperativeHandle(ref, () => ({
    onNewMessagePost(messageId) {
      onNewMessagePost(messageId);
    }
  }));

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
    fetchMessages({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelData?._id]);

  return (
    <div ref={containerRef} className="flex-grow overflow-y-auto scroll-smooth">
      {messages ? (
        <>
          {Object.keys(messages).map((date) => {
            const messagesInThatDate = messages[date];
            return (
              <Fragment key={date}>
                <div className="space-y-4 p-2">
                  {messagesInThatDate.map((message) => {
                    const isUserMessage = user._id === message.user.optionValue;
                    return (
                      <div className={cn('flex items-start gap-2.5', isUserMessage ? 'flex-row-reverse' : '')} key={message._id}>
                        <RenderAvatar message={message} />
                        <RenderContent message={message} isUserMessage={isUserMessage} />
                        <RenderButton message={message} />
                      </div>
                    );
                  })}
                </div>
              </Fragment>
            );
          })}
        </>
      ) : isUserData ? (
        <div className="flex h-full items-center justify-center">
          <p>Send Message</p>
        </div>
      ) : (
        <div className="p-2">
          <CommonSkeleton />
        </div>
      )}
    </div>
  );
});

export default ShowMessages;

const RenderAvatar = ({ message }: { message: Message }) => {
  return <Avatar src={message.user.avatar} sx={{ width: '32px', height: '32px' }} alt={message.user.optionLabel} />;
};
const RenderContent = ({ message, isUserMessage }: { message: Message; isUserMessage: boolean }) => {
  return (
    <div
      className={cn(
        'leading-1.5 flex w-fit max-w-[320px] flex-col  p-4 ',
        isUserMessage ? 'rounded-xl rounded-tr-none' : 'rounded-xl rounded-tl-none',
        isUserMessage ? 'border-slate-200 bg-new-theme-color/10 dark:bg-slate-800' : 'border-gray-200 bg-gray-100 dark:bg-gray-700'
      )}
    >
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{message.user.optionLabel}</span>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{formatDate(message.date, 'hh:mm A')}</span>
      </div>
      <div className="py-2.5 text-sm font-normal text-gray-900 dark:text-white" dangerouslySetInnerHTML={{ __html: message.message }} />
    </div>
  );
};
const RenderButton = ({ message }: { message: Message }) => {
  return (
    <IconButton size={'small'} id={`dropdownMenuIconButton-${message._id}`} className="inline-flex items-center self-center" type="button">
      <MoreVert fontSize="small" />
    </IconButton>
  );
};

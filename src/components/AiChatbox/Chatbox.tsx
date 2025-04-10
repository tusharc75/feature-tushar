import { Avatar, Badge, CircularProgress, IconButton, Typography } from '@mui/material';
import { Close, Person } from '@mui/icons-material';
import { Dispatch, useCallback, useContext, useEffect, useRef } from 'react';
import { BsStars } from 'react-icons/bs';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { RiChatNewLine } from 'react-icons/ri';
import { useLocation } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import { TChatboxActions, TInitialChatboxState } from 'src/components/AiChatbox/chatboxReducer';
import RenderFields from 'src/components/AiChatbox/RenderFields';
import RenderSingleChat from 'src/components/AiChatbox/RenderSingleChat';
import SendMessageForm from 'src/components/AiChatbox/SendMessageInputForm';
import Suggestions from 'src/components/AiChatbox/Suggestions';
import { FormValueStateObj } from 'src/components/AiChatbox/types';
import { scrollToBottom } from 'src/components/AiChatbox/utils';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { io, Socket } from 'socket.io-client';
import { backendApi } from 'src/config';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';

type ChatboxPopupProps = {
  mode?: 'popup';
  handleClose: () => void;
  state: TInitialChatboxState;
  setState: Dispatch<TChatboxActions>;
  handleToggleChatWindow?: () => void;
  toggleGenieFullScreen: () => void;
  isMobile?: boolean;
};

type ChatboxDefaultProps = {
  mode?: 'default';
  state: TInitialChatboxState;
  setState: Dispatch<TChatboxActions>;
};
let timeout: NodeJS.Timeout;

type ChatboxProps = ChatboxDefaultProps | ChatboxPopupProps;

const Chatbox = (props: ChatboxProps) => {
  const { mode = 'default', state, setState } = props;

  const isDefaultMode = mode === 'default';

  const toastConfig = useContext(CustomToastContext);

  const { chatId, loading, messages, isSendButtonDisabled, fullScreen, selectedTopics, globalLoading, status: aiStatus, error: aiError } = state;
  const { pathname } = useLocation();
  const scrollContainer = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');

  let socket = useRef<Socket>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      setState({ type: 'initUserMessage', payload: question });
      try {
        socket.current = io(`${backendApi?.replace('/api', '')}/ai/chat`, {
          path: backendApi?.includes('/api') ? '/api/socket.io' : '/socket.io',
          auth: {
            token
          },
          reconnectionAttempts: 5,
          reconnectionDelay: 5000,
          transports: ['websocket', 'pooling']
        });

        let payload: { question: string; _id?: string; topicIds: string[] } = {
          question,
          topicIds: selectedTopics.map((d) => d._id)
        };

        if (chatId) {
          payload = { ...payload, _id: chatId };
        }

        socket.current.on('ready', () => {
          socket.current.emit('message', payload);
        });

        socket.current.on('data', (d) => {
          if (d.ask_user_input) {
            d.fields = [
              {
                primary: false,
                field: 'User Input',
                label: 'Input',
                type: 'singleLine',
                order: 1
              }
            ];
            d.reply.content = d.ask_user_input;
          }

          setState({ type: 'setMessage', payload: d });
        });

        socket.current.on('end', (d) => {
          setState({ type: 'setMessage', payload: d });
          socket.current.disconnect();
          socket.current = null;
        });
      } catch (error) {
        toastConfig.setToastConfig(error);
        setState({ type: 'setError', error: error.message || '' });
      }
    },
    [chatId]
  );

  const submitForm = useCallback(
    async (question: string) => {
      try {
        let payload: { question: string; _id?: string; topicIds: string[] } = {
          question,
          topicIds: selectedTopics.map((d) => d._id)
        };

        socket.current.emit('message', payload);
      } catch (error) {
        toastConfig.setToastConfig(error);
        setState({ type: 'setError', error: error.message || '' });
      }
    },
    [chatId]
  );

  useEffect(() => {
    timeout = setTimeout(() => {
      scrollToBottom(scrollContainer.current);
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, messages.length]);

  useEffect(() => {
    scrollToBottom(scrollContainer.current);
  }, [fullScreen]);

  const transformObjToMessage = useCallback(
    (obj: FormValueStateObj) => {
      let query = '';
      for (let i = 0; i < Object.keys(obj).length; i++) {
        const value = `${Object.values(obj)[i] || ''}`.replace('_cur', '');
        query += `${Object.keys(obj)[i]}: ${value}\n`;
      }
      submitForm(query);
    },
    [submitForm]
  );

  const resetChat = () => {
    setState({ type: 'reset' });
  };

  return (
    <div
      className={cn(
        ' flex items-end justify-end gap-2',
        isDefaultMode
          ? 'flex-grow'
          : `z-14000 w-[min(var(--chatbox-width),calc(100vw-24px))] max-w-[min(var(--chatbox-width),calc(100vw-24px))]
          ${fullScreen ? '[--chat-container-h:100vh] [--chatbox-width:100vw]' : '[--chat-container-h:600px] [--chatbox-width:var(--gennie-openned-chatbox-w)]'}`
      )}
    >
      <div
        className={cn(
          'flex h-[var(--chat-container-h)] max-h-[var(--chat-container-h)] flex-grow  flex-col',
          isDefaultMode ? 'mt-auto [--chat-container-h:calc(100vh-250px)]' : '  rounded-md bg-[var(--dark-secondary,white)]',
          fullScreen && !isDefaultMode && 'fixed inset-0 '
        )}
      >
        {mode === 'popup' && (
          <header
            className="flex h-[--partially-openned-container-h] cursor-pointer items-center justify-between border-b p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => (props as ChatboxPopupProps).handleToggleChatWindow?.()}
          >
            <div className="flex items-center gap-2">
              <Badge
                overlap="circular"
                sx={(theme) => ({
                  '& .MuiBadge-badge': {
                    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
                  }
                })}
                className={cn('[&_.MuiBadge-badge]:!bg-green-500')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant={'dot'}
              >
                <Avatar
                  src={genieImage}
                  alt="eGenie"
                  sx={{ width: '35px', height: '35px', '& img': { maxWidth: '80%', maxHeight: '90%' } }}
                  className="bg-[#bdbdbd] dark:bg-[#757575]"
                >
                  <Person fontSize="small" />
                </Avatar>
              </Badge>
              <div className="relative">
                <h6 className="line-clamp-1 text-sm font-semibold" title={`Equipt Genie`}>
                  Equipt Genie
                </h6>
                <p className="text-[11px] tracking-wide">{'Online'}</p>
              </div>
            </div>

            <div className="flex gap-1">
              {!(props as ChatboxPopupProps).isMobile && (
                <HtmlTooltip title={fullScreen ? 'Minimize' : 'Make genie full screen'}>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      (props as ChatboxPopupProps).toggleGenieFullScreen();
                    }}
                  >
                    {fullScreen ? <FiMinimize2 fontSize={'small'} /> : <FiMaximize2 fontSize={'small'} />}
                  </IconButton>
                </HtmlTooltip>
              )}
              <HtmlTooltip title={'Close genie'}>
                <IconButton
                  color="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    (props as ChatboxPopupProps).handleClose();
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </div>
          </header>
        )}
        <div ref={scrollContainer} className={cn('body relative flex-grow overflow-y-auto overscroll-contain scroll-smooth p-3')}>
          <div className={cn('container', fullScreen ? '' : '!w-full')}>
            {globalLoading ? (
              <div className="">
                <RenderSingleChat loading={true} chatId={chatId} align="right" />
                <RenderSingleChat loading={true} chatId={chatId} align="left" />
              </div>
            ) : !chatId && !messages?.length && isDefaultMode ? (
              <div className="absolute left-1/2 top-1/2 max-w-fit [transform:translate(-50%,-45%)]">
                <BsStars className="text-[var(--new-theme-color)]" size={50} />
              </div>
            ) : (
              <>
                {messages.length > 0 &&
                  messages?.map((message, i) => {
                    return <RenderSingleChat message={message} chatId={chatId} error={aiError} />;
                  })}
                {loading && <RenderSingleChat loading={true} chatId={chatId} align="left" />}
                {messages[messages.length - 1]?.fields && (
                  <RenderFields
                    state={state}
                    fields={messages[messages.length - 1].fields}
                    disabled={false}
                    setState={setState}
                    handleSubmit={transformObjToMessage}
                    isDefaultMode={isDefaultMode}
                  />
                )}
                {messages.length === 0 && <Suggestions pathname={pathname} sendMessage={sendMessage} />}
              </>
            )}
          </div>
        </div>
        <div
          className={cn(
            'footer  ',
            isDefaultMode
              ? 'rounded-[20px] py-2 pl-3 pr-4 [border:1px_solid_var(--common-border-color)]'
              : 'flex items-center gap-1 p-3 [border-top:1px_solid_var(--common-border-color)]'
          )}
        >
          {mode === 'popup' && (
            <HtmlTooltip title={'New Chat'}>
              <IconButton
                size="small"
                onClick={resetChat}
                style={{ background: 'var(--dark-primary, white)', borderRadius: '999px', border: '1px solid var(--common-border-color)' }}
              >
                <RiChatNewLine />
              </IconButton>
            </HtmlTooltip>
          )}
          <div className="flex-grow">
            <SendMessageForm sendMessage={sendMessage} loading={loading} disabled={isSendButtonDisabled} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;

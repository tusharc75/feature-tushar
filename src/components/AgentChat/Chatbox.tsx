import { Grow, IconButton, Typography } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef } from 'react';
import { BsStars } from 'react-icons/bs';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { RiChatNewLine } from 'react-icons/ri';
import Markdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import { TMessage, useChatboxReducer } from 'src/components/AgentChat/chatboxReducer';
import RenderFields from 'src/components/AgentChat/RenderFields';
import SendMessageForm from 'src/components/AgentChat/SendMessageInputForm';
import Suggestions from 'src/components/AgentChat/Suggestions';
import { getRandomNumber, scrollToBottom } from 'src/components/AgentChat/utils';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

type ChatboxProps = {
  isChatboxOpen: boolean;
  setIsChatboxOpen: Dispatch<SetStateAction<boolean>>;
};
const Chatbox = ({ isChatboxOpen, setIsChatboxOpen }: ChatboxProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [state, setState] = useChatboxReducer();
  const { sessionId, loading, messages, isSendButtonDisabled, fullScreen } = state;
  const { pathname } = useLocation();
  const scrollContainer = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(
    async (query: string) => {
      setState({ type: 'initUserMessage', payload: { query } });
      setTimeout(() => {
        scrollToBottom(scrollContainer.current);
      }, 100);
      try {
        let payload: { query: string; session?: string } = {
          query
        };
        if (sessionId) {
          payload = { ...payload, session: sessionId };
        }
        const {
          data: { data }
        } = await axiosInstance().post('/agents/chat', payload);
        setState({ type: 'setNewAssistantMessage', payload: data });
        scrollToBottom(scrollContainer.current);
      } catch (error) {
        toastConfig.setToastConfig(error);
        setState({ type: 'setError', error: error.message || '' });
      }
    },
    [sessionId, setState, toastConfig]
  );

  useEffect(() => {
    scrollToBottom(scrollContainer.current);
  }, [fullScreen]);

  const transformObjToMessage = useCallback(
    (obj) => {
      let query = '';
      for (let i = 0; i < Object.keys(obj).length; i++) {
        query += `${Object.keys(obj)[i]}: ${Object.values(obj)[i]}\n`;
      }
      sendMessage(query);
    },
    [sendMessage]
  );

  const resetChat = () => {
    setState({ type: 'reset' });
  };

  return (
    <Grow in={isChatboxOpen} unmountOnExit>
      <div
        className={cn(
          'absolute bottom-[calc(100%+10px)] right-0 z-10 flex w-[min(var(--chatbox-width),calc(100vw-24px))] max-w-[min(var(--chatbox-width),calc(100vw-24px))] items-end justify-end gap-2',
          fullScreen ? '[--chat-container-h:calc(100vh-113px)] [--chatbox-width:100vw]' : '[--chat-container-h:500px] [--chatbox-width:500px]'
        )}
      >
        <HtmlTooltip title={'New Chat'}>
          <IconButton
            onClick={resetChat}
            style={{ background: 'var(--dark-primary, white)', borderRadius: '999px', border: '1px solid var(--common-border-color)' }}
          >
            <RiChatNewLine />
          </IconButton>
        </HtmlTooltip>

        <div
          className={cn(
            'flex-grow rounded-md bg-[var(--dark-secondary,white)] shadow-md [border:1px_solid_var(--common-border-color)] ',
            fullScreen && 'fixed inset-0 '
          )}
        >
          <div className="head flex items-center justify-between p-3 [border-bottom:1px_solid_var(--common-border-color)]">
            <h5 className="text-[16px] font-semibold">Equipt Genie</h5>
            <div className="flex gap-2">
              <IconButton size="small" onClick={() => setState({ type: 'setFullScreen', payload: !fullScreen })}>
                {fullScreen ? <FiMinimize2 /> : <FiMaximize2 />}
              </IconButton>
              <IconButton size="small" onClick={() => setIsChatboxOpen(false)}>
                <Close />
              </IconButton>
            </div>
          </div>
          <div
            ref={scrollContainer}
            className={cn('body h-[var(--chat-container-h)] max-h-[var(--chat-container-h)]  overflow-y-auto overscroll-contain scroll-smooth p-3')}
          >
            <div className={cn('container', fullScreen ? '' : '!w-full')}>
              {messages.length > 0 &&
                messages?.map((message, i) => {
                  return <RenderSingleChat message={message} />;
                })}
              {loading && <RenderSingleChat loading={true} />}
              {messages[messages.length - 1]?.fields && (
                <RenderFields
                  state={state}
                  fields={messages[messages.length - 1].fields}
                  disabled={false}
                  setState={setState}
                  handleSubmit={transformObjToMessage}
                />
              )}

              {messages.length === 0 && <Suggestions pathname={pathname} sendMessage={sendMessage} />}
            </div>
          </div>
          <div className="footer p-3 [border-top:1px_solid_var(--common-border-color)]">
            <SendMessageForm sendMessage={sendMessage} loading={loading} disabled={isSendButtonDisabled} />
          </div>
        </div>
      </div>
    </Grow>
  );
};

export default Chatbox;

const RenderSingleChat = ({ message, loading = false }: { message?: TMessage; loading?: boolean }) => {
  const isUserMessage = message?.role === 'user' || false;

  return (
    <>
      <div className={cn('py-[18px]', isUserMessage ? ' ml-auto' : 'flex gap-2 text-base ', loading ? 'w-full' : 'w-fit max-w-fit')}>
        <h6 className="user mb-[6px] text-[14px] font-medium">
          {isUserMessage ? (
            ''
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full [border:1px_solid_var(--common-border-color)]">
              <BsStars className="text-[var(--new-theme-color)]" />
            </span>
          )}
        </h6>
        {loading ? (
          <div className="w-full">
            <Skeleton animation="wave" />
            <Skeleton />
            <Skeleton animation="wave" />
            <Skeleton width={`${getRandomNumber(30, 80)}%`} />
          </div>
        ) : isUserMessage ? (
          <Typography
            component={'pre'}
            variant="body2"
            className="!ml-[46px] whitespace-pre-wrap rounded-3xl bg-[#f4f4f4] px-[20px] py-[10px] text-[black] dark:bg-[#1e4358] dark:text-[white]"
          >
            {message.content}
          </Typography>
        ) : (
          <div className="whitespace-pre-wrap rounded-lg pt-[8px] text-sm text-[var(--primary)] dark:text-white">
            <Markdown>{message.content}</Markdown>
          </div>
        )}
      </div>
    </>
  );
};

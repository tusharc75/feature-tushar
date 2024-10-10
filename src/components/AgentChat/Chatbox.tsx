import { Grow, IconButton } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef } from 'react';
import { RiChatNewLine } from 'react-icons/ri';
import { useLocation } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import { TMessage, useChatboxReducer } from 'src/components/AgentChat/chatboxReducer';
import SendMessageForm from 'src/components/AgentChat/SendMessageInputForm';
import Suggestions from 'src/components/AgentChat/Suggestions';
import { scrollToBottom } from 'src/components/AgentChat/utils';
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
  const { sessionId, loading, messages } = state;
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

  const resetChat = () => {
    setState({ type: 'reset' });
  };

  useEffect(() => {
    setState({ type: 'reset' });
  }, [pathname, setState]);

  return (
    <Grow in={isChatboxOpen} unmountOnExit>
      <div className="absolute bottom-[calc(100%+10px)] right-0 flex w-[min(var(--chatbox-width),calc(100vw-24px))] max-w-[min(var(--chatbox-width),calc(100vw-24px))] items-end justify-end gap-2">
        <HtmlTooltip title={'New Chat'}>
          <IconButton
            onClick={resetChat}
            style={{ background: 'var(--dark-primary, white)', borderRadius: '999px', border: '1px solid var(--common-border-color)' }}
          >
            <RiChatNewLine />
          </IconButton>
        </HtmlTooltip>
        <div className="flex-grow rounded-md bg-[var(--dark-secondary,white)] shadow-md [border:1px_solid_var(--common-border-color)]">
          <div className="head flex items-center justify-between p-3 [border-bottom:1px_solid_var(--common-border-color)]">
            <h5 className="text-[16px] font-semibold">Assistant</h5>
            <IconButton size="small" onClick={() => setIsChatboxOpen(false)}>
              <Close />
            </IconButton>
          </div>
          <div
            ref={scrollContainer}
            className="body h-[var(--chat-container-h)] max-h-[var(--chat-container-h)] overflow-y-auto overscroll-contain scroll-smooth p-3"
          >
            {messages.length > 0 &&
              messages?.map((message) => {
                return <RenderSingleChat message={message} />;
              })}
            {messages.length === 0 && <Suggestions pathname={pathname} sendMessage={sendMessage} />}
          </div>
          <div className="footer p-3 [border-top:1px_solid_var(--common-border-color)]">
            <SendMessageForm sendMessage={sendMessage} loading={loading} />
          </div>
        </div>
      </div>
    </Grow>
  );
};

export default Chatbox;

const RenderSingleChat = ({ message }: { message: TMessage }) => {
  return (
    <div className={cn('w-fit max-w-[60%]', message.role === 'user' ? ' ml-auto text-right' : '')}>
      <h6 className="user mb-[6px] text-[14px] font-medium">{message.role === 'user' ? 'You' : 'Assistant'}</h6>
      <p
        className={cn(
          'rounded-lg px-[20px] py-[9px]',
          message.role === 'user'
            ? 'bg-[#0DA0A840] text-[#777575] dark:bg-[#0DA0A840] dark:text-[white]'
            : 'bg-[#F4F4F4] text-[#777575] dark:bg-[hsla(0deg,0%,37.27%,0.5)] dark:text-white'
        )}
      >
        {message.content}
      </p>
    </div>
  );
};

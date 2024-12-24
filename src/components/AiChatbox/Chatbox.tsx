import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
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

type ChatboxPopupProps = {
  mode?: 'popup';
  handleClose: () => void;
  state: TInitialChatboxState;
  setState: Dispatch<TChatboxActions>;
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

  const { chatId, loading, messages, isSendButtonDisabled, fullScreen, selectedTopics, globalLoading } = state;
  const { pathname } = useLocation();
  const scrollContainer = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      setState({ type: 'initUserMessage', payload: question });
      try {
        let payload: { question: string; _id?: string; topicIds: string[] } = {
          question,
          topicIds: selectedTopics.map((d) => d._id)
        };
        if (chatId) {
          payload = { ...payload, _id: chatId };
        }
        const {
          data: { data }
        } = await axiosInstance().post('/generative-ai/chat/ask', payload);
        setState({ type: 'setNewAssistantMessage', payload: data });
      } catch (error) {
        toastConfig.setToastConfig(error);
        setState({ type: 'setError', error: error.message || '' });
      }
    },
    [chatId, setState, toastConfig, selectedTopics]
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
    <div
      className={cn(
        ' flex items-end justify-end gap-2',
        isDefaultMode
          ? 'flex-grow'
          : `absolute bottom-[calc(100%+10px)] right-0 z-10 w-[min(var(--chatbox-width),calc(100vw-24px))] max-w-[min(var(--chatbox-width),calc(100vw-24px))] 
          ${fullScreen ? '[--chat-container-h:100vh] [--chatbox-width:100vw]' : '[--chat-container-h:600px] [--chatbox-width:500px]'}`
      )}
    >
      {mode === 'popup' && (
        <HtmlTooltip title={'New Chat'}>
          <IconButton
            onClick={resetChat}
            style={{ background: 'var(--dark-primary, white)', borderRadius: '999px', border: '1px solid var(--common-border-color)' }}
          >
            <RiChatNewLine />
          </IconButton>
        </HtmlTooltip>
      )}

      <div
        className={cn(
          'flex h-[var(--chat-container-h)] max-h-[var(--chat-container-h)] flex-grow  flex-col',
          isDefaultMode
            ? 'mt-auto [--chat-container-h:calc(100vh-250px)]'
            : '  rounded-md bg-[var(--dark-secondary,white)]  shadow-md [border:1px_solid_var(--common-border-color)]',
          fullScreen && !isDefaultMode && 'fixed inset-0 '
        )}
      >
        {mode === 'popup' && (
          <div className="head flex items-center justify-between p-3 [border-bottom:1px_solid_var(--common-border-color)]">
            <h5 className="text-[16px] font-semibold">Equipt Genie</h5>
            <div className="flex gap-2">
              <IconButton size="small" onClick={() => setState({ type: 'setFullScreen', payload: !fullScreen })}>
                {fullScreen ? <FiMinimize2 /> : <FiMaximize2 />}
              </IconButton>
              <IconButton size="small" onClick={() => (props as ChatboxPopupProps).handleClose()}>
                <Close />
              </IconButton>
            </div>
          </div>
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
                    return <RenderSingleChat message={message} chatId={chatId} />;
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
              : 'p-3 [border-top:1px_solid_var(--common-border-color)]'
          )}
        >
          <SendMessageForm sendMessage={sendMessage} loading={loading} disabled={isSendButtonDisabled} />
        </div>
      </div>
    </div>
  );
};

export default Chatbox;

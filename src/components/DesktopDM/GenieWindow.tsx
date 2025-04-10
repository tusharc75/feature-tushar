import { useEffect } from 'react';
import GenieChatBox, { useChatboxReducer } from 'src/components/AiChatbox';
import { delayedClass, initialClass } from 'src/components/DesktopDM/ChatBox';
import { GENIE_WINDOW_ID } from 'src/components/DesktopDM/constants';
import { OpenedChat, UseDesktopDM } from 'src/components/DesktopDM/types';
import { cn } from 'src/constants/helpers';
import { useDelayedClass } from 'src/hooks';

type GenieWindowProps = {
  state: UseDesktopDM;
  openedChat: OpenedChat;
};

const GenieWindow = ({ state, openedChat }: GenieWindowProps) => {
  const { isMobile, closeChatBox, handleToggleChatWindow, onGenieFullScreen } = state;
  const { className } = useDelayedClass(initialClass, delayedClass, 5);
  const [genieChatState, setGenieChatState] = useChatboxReducer();

  const toggleGenieFullScreen = () => {
    if (!genieChatState.fullScreen) {
      onGenieFullScreen();
    }
    setGenieChatState({ type: 'setFullScreen', payload: !genieChatState.fullScreen });
  };

  useEffect(() => {
    if (isMobile) {
      setGenieChatState({ type: 'setFullScreen', payload: true });
      onGenieFullScreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  return (
    <div
      className={cn(
        'mr-[--chatbox-gap] flex  h-0 flex-col overflow-hidden rounded-t-md border bg-[--dark-primary,white] shadow-md transition-all',
        openedChat.open === 'partial'
          ? 'h-[--partially-openned-container-h] w-[--partially-openned-chatbox-w] flex-[0_0_var(--partially-openned-chatbox-w)]'
          : className,
        isMobile ? 'h-full' : '',
        openedChat.open === 'partial'
          ? '[--gennie-openned-chatbox-w:var(--partially-openned-chatbox-w)]'
          : '[--gennie-openned-chatbox-w:var(--fully-openned-chatbox-w)]'
      )}
    >
      <GenieChatBox
        state={genieChatState}
        isMobile={isMobile}
        setState={setGenieChatState}
        toggleGenieFullScreen={toggleGenieFullScreen}
        handleToggleChatWindow={() => handleToggleChatWindow(openedChat.id)}
        mode="popup"
        handleClose={() => closeChatBox(undefined, GENIE_WINDOW_ID)}
      />
    </div>
  );
};

export default GenieWindow;

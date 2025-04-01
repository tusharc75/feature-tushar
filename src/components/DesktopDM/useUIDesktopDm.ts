import { useMediaQuery } from '@mui/material';
import { useCallback, useState } from 'react';
import { isMobile as isMobileDevice } from 'react-device-detect';
import { OpenedChat, UIState } from 'src/components/DesktopDM/types';

const windowWidth = window.innerWidth;
const initialState: UIState = {
  mainWindow: 'partial',
  openedChats: []
};

const CHATBOX_GAP = 16;
const USER_LIST_CONTAINER_WIDTH = 288;
const FULLY_OPENNED_CHATBOX_WIDTH = 400;
const PARTIALLY_OPENNED_CHATBOX_WIDTH = 216;
const PARTIALLY_OPENNED_CONTAINER_HEIGHT = 48;

const getTotalOccupiedWidth = (openedChats: OpenedChat[]) => {
  let totalSize = USER_LIST_CONTAINER_WIDTH + CHATBOX_GAP;
  for (const c of openedChats) {
    if (c.open === 'partial') {
      totalSize += PARTIALLY_OPENNED_CHATBOX_WIDTH + CHATBOX_GAP;
    } else if (c.open === 'fullyOpen') {
      totalSize += FULLY_OPENNED_CHATBOX_WIDTH + CHATBOX_GAP;
    }
  }
  return totalSize;
};

const checkCanExpandChatBox = (openedChats: OpenedChat[]) => {
  const totalSize =
    getTotalOccupiedWidth(openedChats) - (PARTIALLY_OPENNED_CHATBOX_WIDTH + CHATBOX_GAP) + (FULLY_OPENNED_CHATBOX_WIDTH + CHATBOX_GAP);
  return totalSize < windowWidth;
};

const checkCanAddNewChatBox = (openedChats: OpenedChat[]) => {
  const totalSize = getTotalOccupiedWidth(openedChats) + FULLY_OPENNED_CHATBOX_WIDTH + CHATBOX_GAP;
  return totalSize < windowWidth;
};

const useUIDesktopDm = () => {
  const [uiState, setUiState] = useState<UIState>(initialState);
  const isMobile = useMediaQuery('(max-width:768px)');

  const handleChatOpen = useCallback(
    (id: string, type: OpenedChat['type']) => {
      const chatBoxOpenedState: OpenedChat = uiState.openedChats.find((d) => d.id === id);

      if (uiState.openedChats.length === 0) {
        setUiState((prev) => ({ ...prev, openedChats: [{ id, open: 'fullyOpen', type }] }));
      } else if (chatBoxOpenedState) {
        setUiState((prev) => {
          const newPayload: UIState = { ...prev };
          newPayload.openedChats = prev.openedChats.map((d) => {
            if (d.id === id) {
              return { ...d, open: 'fullyOpen' };
            }
            return { ...d, open: 'partial' };
          });
          return newPayload;
        });
        return;
      } else {
        const canAddNewChatWithoutChangingState = checkCanAddNewChatBox(uiState.openedChats);
        if (canAddNewChatWithoutChangingState) {
          setUiState((prev) => {
            const newPayload: UIState = { ...prev };
            newPayload.openedChats = [...prev.openedChats, { id, open: 'fullyOpen', type }];
            return newPayload;
          });
          return;
        }
        const canAddNewChatIfChatsArePartiallyOpen = checkCanAddNewChatBox(uiState.openedChats.map((d) => ({ ...d, open: 'partial' })));
        if (canAddNewChatIfChatsArePartiallyOpen) {
          setUiState((prev) => {
            const newPayload: UIState = { ...prev };
            const prevOpenedChats = prev.openedChats.map((d) => ({ ...d, open: 'partial' })) as UIState['openedChats'];
            newPayload.openedChats = [...prevOpenedChats, { id, open: 'fullyOpen', type }];
            return newPayload;
          });
          return;
        }
        // Remove oldest chat from list and make rest of the chats partial
        setUiState((prev) => {
          const newPayload: UIState = { ...prev };
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_first, ...prevOpenedChats] = prev.openedChats.map((d) => ({ ...d, open: 'partial' })) as UIState['openedChats'];
          newPayload.openedChats = [...prevOpenedChats, { id, open: 'fullyOpen', type }];
          return newPayload;
        });
      }
    },
    [uiState.openedChats]
  );

  const handleToggleChatWindow = useCallback(
    (id: string) => {
      let chatBoxOpenedState: OpenedChat;
      let index = 0;
      for (let i = 0; i < uiState.openedChats.length; i++) {
        const chat = uiState.openedChats[i];
        if (chat.id === id) {
          chatBoxOpenedState = chat;
          index = i;
        }
      }

      if (!chatBoxOpenedState) return;
      if (chatBoxOpenedState.open === 'fullyOpen') {
        setUiState((prev) => {
          const newPayload: UIState = { ...prev };
          const newOpenedChats = newPayload.openedChats.map((c) => {
            if (c.id === chatBoxOpenedState.id) {
              return { ...c, open: 'partial' } as OpenedChat;
            }
            return c;
          });
          return { ...newPayload, openedChats: newOpenedChats };
        });
      } else {
        const canExpandChatWithoutChangingState = checkCanExpandChatBox(uiState.openedChats);
        if (canExpandChatWithoutChangingState) {
          setUiState((prev) => {
            const newPayload: UIState = { ...prev };
            const newOpenedChats = newPayload.openedChats.map((c) => {
              if (c.id === chatBoxOpenedState.id) {
                return { ...c, open: 'fullyOpen' } as OpenedChat;
              }
              return c;
            });
            return { ...newPayload, openedChats: newOpenedChats };
          });
          return;
        }
        const canExpandChatIfChatsArePartiallyOpen = checkCanExpandChatBox(uiState.openedChats.map((d) => ({ ...d, open: 'partial' })));
        if (canExpandChatIfChatsArePartiallyOpen) {
          setUiState((prev) => {
            const newPayload: UIState = { ...prev };
            const newOpenedChats = newPayload.openedChats.map((c) => {
              if (c.id === chatBoxOpenedState.id) {
                return { ...c, open: 'fullyOpen' } as OpenedChat;
              }
              return { ...c, open: 'partial' } as OpenedChat;
            });
            return { ...newPayload, openedChats: newOpenedChats };
          });
          return;
        }
        // Remove oldest chat from list and make rest of the chats partial
        setUiState((prev) => {
          const newPayload: UIState = { ...prev };
          if (index === 0) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [first, _second, ...prevOpenedChats] = prev.openedChats.map((d) => ({ ...d, open: 'partial' })) as UIState['openedChats'];
            newPayload.openedChats = [first, { ...chatBoxOpenedState, open: 'fullyOpen' }];
          } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_first, ...prevOpenedChats] = prev.openedChats.map((d) => ({ ...d, open: 'partial' })) as UIState['openedChats'];
            newPayload.openedChats = [...prevOpenedChats, { ...chatBoxOpenedState, open: 'fullyOpen' }];
          }
          return newPayload;
        });
      }
    },
    [uiState.openedChats]
  );

  const closeChatBox = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: string) => {
    e.stopPropagation();
    setUiState((prev) => ({ ...prev, openedChats: prev.openedChats.filter((d) => d.id !== id) }));
  }, []);

  const toggleMainWindow = useCallback(() => {
    setUiState((prev) => ({ ...prev, mainWindow: prev.mainWindow === 'partial' ? 'fullyOpen' : 'partial' }));
  }, []);

  const closeMainWindow = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    setUiState({ ...initialState, mainWindow: null });
  }, []);

  const onUserFirstMessageSent = useCallback(({ userId, channelId }: { userId: string; channelId: string }) => {
    if (!userId || !channelId) return;
    setUiState((prev) => {
      const newData = { ...prev };
      newData.openedChats = prev.openedChats.map((d) => {
        if (d.id === userId) {
          return { ...d, id: channelId, type: 'chat' };
        }
        return d;
      });
      return newData;
    });
  }, []);

  return {
    ...uiState,
    isMobileDevice,
    isMobile,
    CHATBOX_GAP,
    USER_LIST_CONTAINER_WIDTH,
    FULLY_OPENNED_CHATBOX_WIDTH,
    PARTIALLY_OPENNED_CHATBOX_WIDTH,
    PARTIALLY_OPENNED_CONTAINER_HEIGHT,
    handleToggleChatWindow,
    handleChatOpen,
    closeChatBox,
    toggleMainWindow,
    closeMainWindow,
    onUserFirstMessageSent
  };
};

export default useUIDesktopDm;

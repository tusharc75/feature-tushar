import { Dialog } from '@mui/material';
import React from 'react';
import ChatBox from 'src/components/DesktopDM/ChatBox';
import useDesktopDM from 'src/components/DesktopDM/useDesktopDM';
import UserList from 'src/components/DesktopDM/UserList';
import { CustomDialogTransition } from 'src/constants/helpers';

const DesktopDM = () => {
  const state = useDesktopDM();
  const {
    mainWindow,
    openedChats,
    CHATBOX_GAP,
    FULLY_OPENNED_CHATBOX_WIDTH,
    PARTIALLY_OPENNED_CHATBOX_WIDTH,
    USER_LIST_CONTAINER_WIDTH,
    PARTIALLY_OPENNED_CONTAINER_HEIGHT,
    USER_LIST_RIGHT_SPACE,
    isMobile
  } = state;

  if (!mainWindow) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[1300] flex h-4 items-end justify-end"
      style={
        {
          '--chatbox-gap': `${CHATBOX_GAP}px`,
          '--fully-openned-chatbox-w': `${FULLY_OPENNED_CHATBOX_WIDTH}px`,
          '--partially-openned-chatbox-w': `${PARTIALLY_OPENNED_CHATBOX_WIDTH}px`,
          '--user-list-container-w': `${USER_LIST_CONTAINER_WIDTH}px`,
          '--partially-openned-container-h': `${PARTIALLY_OPENNED_CONTAINER_HEIGHT}px`,
          '--user-list-right-space': `${USER_LIST_RIGHT_SPACE}PX`
        } as React.CSSProperties
      }
    >
      <aside className="pointer-events-auto flex h-0 w-screen flex-1 flex-row-reverse items-end overflow-visible">
        <UserList state={state} />
        {isMobile && openedChats.length > 0 ? (
          <Dialog open={true} slots={{ transition: CustomDialogTransition }} fullScreen fullWidth>
            <ChatBox openedChat={openedChats[openedChats.length - 1]} state={state} key={openedChats[openedChats.length - 1]['id']} />
          </Dialog>
        ) : (
          openedChats.map((o) => <ChatBox openedChat={o} state={state} key={o.id} />)
        )}
      </aside>
    </div>
  );
};

export default DesktopDM;

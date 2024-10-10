import { Button } from '@material-ui/core';
import { Chat, Close } from '@material-ui/icons';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Chatbox from 'src/components/AgentChat/Chatbox';
import { removeMongoDBObjectIdFromPath } from 'src/components/AgentChat/utils';
import routes from 'src/components/Helpers/Routes';

const isAgentVisible = (pathName: string) => {
  const visiblePaths = [];
  return visiblePaths.some((path) => removeMongoDBObjectIdFromPath(pathName) === path);
};

const AgentChat = () => {
  const { pathname } = useLocation();
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  const isVisible = useMemo(() => isAgentVisible(pathname), [pathname]);

  const toggleChatbox = () => {
    setIsChatboxOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-2 right-3 z-[50] [--chat-container-h:350px] [--chatbox-width:500px] min-[768px]:bottom-[58px]">
      <Chatbox isChatboxOpen={isChatboxOpen} setIsChatboxOpen={setIsChatboxOpen} />
      {isVisible ? (
        <Button onClick={toggleChatbox} variant="contained" color="primary" style={{ borderRadius: 30 }} startIcon={isChatboxOpen ? null : <Chat />}>
          {isChatboxOpen ? <Close /> : "Let's chat"}
        </Button>
      ) : null}
    </div>
  );
};

export default AgentChat;

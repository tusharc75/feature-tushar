import { Button } from '@material-ui/core';
import { Chat, Close } from '@material-ui/icons';
import { useEffect, useMemo, useState } from 'react';
import { RiBrainLine } from 'react-icons/ri';
import { useLocation } from 'react-router-dom';
import Chatbox from 'src/components/AgentChat/Chatbox';
import { checkDomain, removeMongoDBObjectIdFromPath } from 'src/components/AgentChat/utils';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import { IS_AI_PRESENT, useStore } from 'src/StateProvider/fastContext';

// const VISIBLE_PATHS = [routes.rentalManagement.path, routes.rentalManagementDetail.path];
const VISIBLE_PATHS = [];

const isAgentVisible = (pathName: string) => {
  let isCorrectDomain = checkDomain();
  return VISIBLE_PATHS.some((path) => removeMongoDBObjectIdFromPath(pathName) === path) && isCorrectDomain;
};

const AgentChat = () => {
  const { pathname } = useLocation();
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isAIAvailable, setAvailable] = useStore((store) => store[IS_AI_PRESENT]);
  const isVisible = useMemo(() => isAgentVisible(pathname), [pathname]);

  useEffect(() => {
    setAvailable({ [IS_AI_PRESENT]: isVisible });
  }, [isVisible, setAvailable]);

  const toggleChatbox = () => {
    setIsChatboxOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-2 right-3 z-[50] [--chat-container-h:500px] [--chatbox-width:500px]">
      <Chatbox isChatboxOpen={isChatboxOpen} setIsChatboxOpen={setIsChatboxOpen} />
      {isVisible ? (
        <HtmlTooltip title={isChatboxOpen ? '' : 'Equipt Intelligence'} className="block">
          <Button
            onClick={toggleChatbox}
            variant="contained"
            color="primary"
            // className="!transition-all [transform-origin:bottom_right] hover:[transform:scale(150%)_!important]"
            style={{ borderRadius: 999, width: 40, height: 40, minWidth: 'unset', padding: 8 }}
          >
            {isChatboxOpen ? <Close /> : <RiBrainLine size={50} />}
          </Button>
        </HtmlTooltip>
      ) : null}
    </div>
  );
};

export default AgentChat;

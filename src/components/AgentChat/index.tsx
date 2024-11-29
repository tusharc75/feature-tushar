import { Button, Grow } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { useState } from 'react';
import { RiBrainLine } from 'react-icons/ri';
import { useLocation } from 'react-router-dom';
import Chatbox, { useChatboxReducer } from 'src/components/AiChatbox';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import { AI_AGENT } from 'src/config';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.png';

const excludedPaths = ['/', routes.equiptAi.path, '/user-manual'];

const AgentChat = () => {
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  const [state, setState] = useChatboxReducer();
  const { pathname } = useLocation();
  const toggleChatbox = () => {
    setIsChatboxOpen((prev) => !prev);
  };

  if (excludedPaths.includes(pathname) || pathname.includes('/user-manual')) {
    return null;
  }

  return (
    <div className="fixed bottom-2 right-3 z-[1300] ">
      <Grow in={isChatboxOpen} unmountOnExit>
        <Chatbox state={state} setState={setState} mode="popup" handleClose={() => setIsChatboxOpen(false)} />
      </Grow>
      {AI_AGENT && localStorage.getItem('token') && (
        <HtmlTooltip title={isChatboxOpen ? '' : 'Equipt Genie'} className="block">
          <div className="rounded-full bg-[var(--dark-primary,white)]">
            <Button onClick={toggleChatbox} variant="outlined" style={{ borderRadius: 999, width: 40, height: 40, minWidth: 'unset', padding: 8 }}>
              {isChatboxOpen ? <Close /> : <img src={genieImage} className="max-w-full" alt="" />}
            </Button>
          </div>
        </HtmlTooltip>
      )}
    </div>
  );
};

export default AgentChat;

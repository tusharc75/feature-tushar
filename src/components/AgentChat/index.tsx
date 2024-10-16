import { Button } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { useState } from 'react';
import { RiBrainLine } from 'react-icons/ri';
import Chatbox from 'src/components/AgentChat/Chatbox';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AI_AGENT } from 'src/config';

const AgentChat = () => {
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);

  const toggleChatbox = () => {
    setIsChatboxOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-2 right-3 z-[50] [--chat-container-h:500px] [--chatbox-width:500px]">
      <Chatbox isChatboxOpen={isChatboxOpen} setIsChatboxOpen={setIsChatboxOpen} />
      {AI_AGENT && (
        <HtmlTooltip title={isChatboxOpen ? '' : 'Equip-t Agent'} className="block">
          <Button
            onClick={toggleChatbox}
            variant="contained"
            color="primary"
            style={{ borderRadius: 999, width: 40, height: 40, minWidth: 'unset', padding: 8 }}
          >
            {isChatboxOpen ? <Close /> : <RiBrainLine size={50} />}
          </Button>
        </HtmlTooltip>
      )}
    </div>
  );
};

export default AgentChat;

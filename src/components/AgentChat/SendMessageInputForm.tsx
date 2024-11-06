import { IconButton, TextareaAutosize } from '@material-ui/core';
import { FormEvent, KeyboardEvent, useState } from 'react';
import { SendIcon } from 'src/assets/svg/svgIcons';
import VoiceInput from 'src/components/AgentChat/VoiceInput';

type SendMessageFormProps = {
  sendMessage: (query: string) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
};

const SendMessageForm = ({ sendMessage, loading, disabled = false }: SendMessageFormProps) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(message);
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (!e.shiftKey && !loading && !disabled && message.trim().length > 1) {
        // Send the message
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      } else if (message.trim().length < 1 && !e.shiftKey) {
        e.preventDefault();
      }
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="flex items-center">
      <TextareaAutosize
        minRows={1}
        maxRows={4}
        value={message}
        disabled={disabled}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full resize-none rounded-sm border-0 px-2 py-3 outline-none "
        placeholder="Write a message..."
        autoCapitalize="off"
        autoComplete="off"
        aria-autocomplete="both"
        spellCheck="false"
        autoCorrect="off"
        onKeyDown={handleKeyDown}
        maxLength={4000}
      />
      <VoiceInput setMessage={setMessage} />
      <IconButton
        size="small"
        type="submit"
        disabled={!message || loading || disabled}
        style={{ borderRadius: 10, background: 'var(--new-theme-color)', width: 32, height: 32 }}
        className="!ml-[5px]"
      >
        <SendIcon size={20} className={`text-[white] ${!message || loading ? ' opacity-70' : ''}`} />
      </IconButton>
    </form>
  );
};

export default SendMessageForm;

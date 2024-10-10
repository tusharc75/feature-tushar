import { IconButton, InputBase } from '@material-ui/core';
import { FormEvent, useState } from 'react';
import { SendIcon } from 'src/assets/svg/svgIcons';

type SendMessageFormProps = {
  sendMessage: (query: string) => Promise<void>;
  loading: boolean;
};

const SendMessageForm = ({ sendMessage, loading }: SendMessageFormProps) => {
  const [message, setMessage] = useState('');
  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(message);
    setMessage('');
  };
  return (
    <form onSubmit={handleSendMessage} className="flex items-center">
      <InputBase value={message} onChange={(e) => setMessage(e.target.value)} fullWidth placeholder="Write a message..." />
      <IconButton
        size="small"
        type="submit"
        disabled={!message || loading}
        style={{ borderRadius: 10, background: 'var(--new-theme-color)', width: 32, height: 32 }}
        className="!ml-[5px]"
      >
        <SendIcon size={20} className={`text-[white] ${!message || loading ? ' opacity-70' : ''}`} />
      </IconButton>
    </form>
  );
};

export default SendMessageForm;

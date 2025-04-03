import { Send } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Chat, UseDesktopDM, User } from 'src/components/DesktopDM/types';
import { useAppTheme } from 'src/constants/AppConfig';
import editorCss from 'src/components/DesktopDM/editorcss.css?raw';
import RippleButton from 'src/components/RippleButton';

console.log(editorCss);

type SendMessageProps = {
  state: UseDesktopDM;
  data: User | Chat;
  messageId?: string;
  parentMessageId?: string;
  initialMessage?: string;
  disabled?: boolean;
  onNewMessagePost?: (messageId: string) => void;
};

const SendMessage = ({
  state,
  data: panelData,
  messageId,
  parentMessageId,
  initialMessage,
  disabled,
  onNewMessagePost = () => {}
}: SendMessageProps) => {
  const { toastConfig, socket, onUserFirstMessageSent, checkIsUser } = state;
  const [themeColor] = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [audioBlobs, setAudioBlobs] = useState([]);
  const editorRef = useRef<Editor['editor'] | null>(null);
  const isNewChatToUser = checkIsUser(panelData);

  const postMessage = async () => {
    setLoading(true);
    try {
      let formData = new FormData();
      formData.append('message', message);
      files.forEach((file) => {
        formData.append('files', file);
      });
      audioBlobs?.forEach((audioBlob, index) => {
        formData.append('files', new File([audioBlob], `recording-${index}.webm`, { type: 'audio/webm' }));
      });
      if (isNewChatToUser) {
        formData.append('toUsers', JSON.stringify([panelData._id]));
        await axiosInstance()
          .post('/work-space/channel/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then(({ data: { data } }) => {
            onUserFirstMessageSent({ channelId: data?.ops?.[0]?.channel, userId: panelData._id });
            socket.emit('newChat', { channelId: 'directMessaging' });
          });
      } else {
        formData.append('channelId', panelData._id);
        if (parentMessageId) formData.append('parentId', parentMessageId);
        await axiosInstance()
          .post('/work-space/channel/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then(({ data: { data } }) => {
            onNewMessagePost(data?.ops?.[0]?._id);
            socket.emit('newMessagePosted', { channelId: data._id, messageId });
          });
      }
      setMessage('');
      setFiles([]);
      setAudioBlobs([]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    const keyCombinations = e.ctrlKey || e.metaKey || e.shiftKey;
    if (key === 'Enter' && !keyCombinations) {
      e.preventDefault();
      if (message && editorRef.current.getContent({ format: 'text' }).length > 0 && message !== initialMessage && !loading) {
        postMessage();
      }
    }
  };

  return (
    <div className="remove-tiny-mce-toolbar-top-border relative border-t p-3 [--toolbar-width:42px] [&_.tox-edit-area]:!rounded-md [&_.tox-edit-area]:![border:1px_solid] [&_.tox-editor-header]:max-w-[--toolbar-width] [&_.tox-toolbar__primary]:!border-t-0 [&_.tox-toolbar__primary]:!border-none [&_.tox.tox-tinymce.tox-tinymce--toolbar-bottom]:!border-none">
      <Editor
        onKeyDown={handleKeyDown}
        key={themeColor}
        onEditorChange={(d) => {
          if (editorRef.current.isDirty()) {
            setMessage(d);
          }
        }}
        // onKeyDown={handleKeyDown}
        value={message ? message : '<span></span>'}
        onInit={(_evt, editor) => {
          editorRef.current = editor;
          if (initialMessage) {
            editor.setContent(initialMessage);
          }
        }}
        initialValue=""
        disabled={!(isNewChatToUser ? isNewChatToUser : panelData._id) || disabled}
        init={{
          skin: themeColor === 'dark' ? 'oxide-dark' : 'oxide',
          content_css: themeColor === 'dark' ? 'dark' : 'default',
          height: 100,
          menubar: false,
          paste_as_text: true,
          plugins: ['paste', 'autolink', 'link', 'anchor', 'code', 'wordcount', 'emoticons'],
          toolbar: `emoticons`,
          toolbar_location: 'bottom',
          toolbar_drawer: 'floating',
          // content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:12px }; p {margin-block-start: 0; margin-block-end:8px}',
          content_style: editorCss,
          setup: (editor) => {
            editor.on('BeforeSetContent', (e) => {
              // Adding 'link' class to <a> tags
              if (e?.content) {
                e.content = e.content.replace(/<a(?![^>]*\bclass\b)([^>]*)>/g, '<a class="link"$1>');
              }
            });
          }
        }}
      />
      <div className="absolute bottom-3 left-[calc(var(--toolbar-width)+12px)] right-3 z-10 flex">
        <IconButton
          className="!ml-auto !flex"
          size="small"
          disabled={(message.length === 0 && files.length === 0 && audioBlobs.length === 0) || loading}
          onClick={postMessage}
        >
          <Send />
        </IconButton>
      </div>
    </div>
  );
};

export default SendMessage;

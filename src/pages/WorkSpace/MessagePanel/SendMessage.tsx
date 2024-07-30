import React, { useContext, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import axiosInstance from 'src/axios/axiosInstance';
import { Editor } from '@tinymce/tinymce-react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useAppTheme } from 'src/constants/AppConfig';
import { Button, IconButton } from '@material-ui/core';
import { Send } from '@material-ui/icons';
import CustomButton from 'src/components/Helpers/CustomButton';

type SendMessageProps = {
  channelId: string;
  socket: Socket;
  messageId?: string | null;
  initialMessage?: string;
  onEditComplete?: () => void;
  editorId?: string;
};

const SendMessage = ({ channelId, socket, messageId = null, initialMessage = '', onEditComplete = () => {}, editorId = '' }: SendMessageProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [themeColor] = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const editorRef = useRef(null);

  const postMessage = async () => {
    setIsLoading(true);
    try {
      if (initialMessage) {
        await axiosInstance().put(`/work-space/channel/message`, { message, messageId });
        onEditComplete();
      } else {
        await axiosInstance().post('/work-space/channel/message', { channelId, message, ...(messageId && { parentId: messageId }) });
      }
      setMessage('');
      socket.emit('newMessagePosted', { channelId, messageId });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={!initialMessage ? `send-message absolute bottom-0 left-0 right-0 bg-[var(--dark-primary,white)] p-3` : ``}>
      <div className="editor overflow-hidden rounded-lg [border:1px_solid_var(--common-border-color)]">
        <Editor
          key={themeColor}
          id={editorId ? editorId : 'default'}
          onEditorChange={(d) => {
            if (editorRef.current.isDirty()) {
              setMessage(d);
            }
          }}
          value={message}
          onInit={(_evt, editor) => {
            editorRef.current = editor;
            if (initialMessage) {
              editor.setContent(initialMessage);
            }
          }}
          initialValue=""
          disabled={!channelId}
          init={{
            skin: themeColor === 'dark' ? 'oxide-dark' : 'oxide',
            content_css: themeColor === 'dark' ? 'dark' : 'default',
            height: 100,
            menubar: false,
            paste_as_text: true,
            plugins: [
              'advlist',
              'paste',
              'autolink',
              'lists',
              'link',
              'image',
              'charmap',
              'preview',
              'anchor',
              'searchreplace',
              'visualblocks',
              'fullscreen',
              'insertdatetime',
              'media',
              'table',
              'code',
              'help',
              'wordcount'
            ],
            toolbar: `undo redo | blocks | bold italic link | bullist numlist| removeformat | help`,
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
        <div className="footer [border-top:1px_solid_var(--common-border-color)]">
          {!initialMessage ? (
            <>
              <IconButton
                style={{ padding: 5 }}
                disabled={!message || isLoading}
                size="small"
                className="send-button !ml-auto !block"
                onClick={postMessage}
              >
                <Send />
              </IconButton>
            </>
          ) : (
            <>
              <Button size="small" color="primary" onClick={onEditComplete}>
                Cancel
              </Button>
              <CustomButton
                loading={isLoading}
                disabled={!message || message === initialMessage || isLoading}
                variant="contained"
                color="primary"
                type="submit"
                onClick={postMessage}
              >
                {' '}
                Save
              </CustomButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendMessage;

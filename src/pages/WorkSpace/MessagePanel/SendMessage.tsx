import React, { useContext, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import axiosInstance from 'src/axios/axiosInstance';
import { Editor } from '@tinymce/tinymce-react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useAppTheme } from 'src/constants/AppConfig';
import { Button, IconButton } from '@material-ui/core';
import { AttachFile, Send } from '@material-ui/icons';
import CustomButton from 'src/components/Helpers/CustomButton';
import { getFileIconSrc } from 'src/constants/helpers';

type SendMessageProps = {
  channelId: string;
  socket: Socket;
  messageId?: string | null;
  initialMessage?: string;
  onEditComplete?: () => void;
  editorId?: string;
};

const SendMessage = ({ channelId, socket, messageId = null, initialMessage = '', onEditComplete = () => { }, editorId = '' }: SendMessageProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [themeColor] = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const editorRef = useRef(null);
  const [files, setFiles] = useState([]);

  const postMessage = async () => {
    setIsLoading(true);
    try {
      let formData = new FormData();
      formData.append('message', message);
      files.forEach((file) => {
        formData.append('files', file);
      });
      if (initialMessage) {
        formData.append('messageId', messageId);
        await axiosInstance().put(`/work-space/channel/message`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        onEditComplete();
      } else {
        formData.append('channelId', channelId);
        if (messageId) formData.append('parentId', messageId);
        await axiosInstance().post('/work-space/channel/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setMessage('');
      setFiles([]);
      socket.emit('newMessagePosted', { channelId, messageId });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  return (
    <div className={`send-message bg-[var(--dark-primary,white)] p-3`}>
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
            plugins: ['advlist', 'paste', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'wordcount'],
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
            <div className="ml-auto flex justify-end gap-2 p-1">
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
            </div>
          )}
          <div>
            <input
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: 'none' }}
              id="file-upload"
              multiple
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <IconButton color="primary" aria-label="upload" component="span">
                <AttachFile />
              </IconButton>
            </label>
            <div className="flex flex-wrap">
              {
                files?.map((file, index) => {
                  const Icon = getFileIconSrc(file.name);
                  return (
                    <>
                      <div className="group relative min-h-[153px] w-[138px] max-w-[138px] flex-grow basis-[138px] rounded-[4px] border border-[var(--common-border-color)] p-[var(--gutter)] [--gutter:18px]">
                        <div className="mx-auto mb-[11px] h-[79px] text-center">
                          <Icon size={50} className="mx-auto" />
                        </div>
                        <p className=" line-clamp-1 text-[14px] text-[var(--text-primary)]">{file.name}</p>
                      </div>
                    </>
                  )
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;
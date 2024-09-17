import { Button, IconButton } from '@material-ui/core';
import { AttachFile, Close, Send } from '@material-ui/icons';
import { Editor } from '@tinymce/tinymce-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomButton from 'src/components/Helpers/CustomButton';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, getFileIconSrc } from 'src/constants/helpers';
import Mention from 'src/pages/WorkSpace/MessagePanel/Mention';
import { ChannelData } from 'src/pages/WorkSpace/types';
import { fileToBase64, isImageFile } from 'src/pages/WorkSpace/utils';

type SendMessageProps = {
  channelId: string;
  socket: Socket;
  messageId?: string | null;
  initialMessage?: string;
  onEditComplete?: () => void;
  editorId?: string;
  channelData?: ChannelData;
  disabled?: boolean;
};

const SendMessage = ({
  channelId,
  socket,
  messageId = null,
  initialMessage = '',
  onEditComplete = () => {},
  editorId = '',
  channelData,
  disabled = false
}: SendMessageProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [themeColor] = useAppTheme();
  const numberOfMentions = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const editorRef = useRef<Editor['editor'] | null>(null);
  const [files, setFiles] = useState([]);
  const [filesWithUrl, setFilesWithUrl] = useState([]);
  const [mentionInitialPosition, setMentionInitialPosition] = useState<{
    node: HTMLElement;
    offsetIndex: number;
    clientWidth: number;
    clientHeight: number;
    getBoundingClientRect: () => DOMRect;
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const applySelectedRef = useRef(null);

  useEffect(() => {
    numberOfMentions.current = 0;
  }, [channelId]);

  const postMessage = async () => {
    setIsLoading(true);
    try {
      if (initialMessage) {
        await axiosInstance().put(`/work-space/channel/message`, { message, messageId });
        onEditComplete();
      } else {
        let formData = new FormData();
        formData.append('message', message);
        files.forEach((file) => {
          formData.append('files', file);
        });
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
      numberOfMentions.current = 0;
    }
  };

  const handleFileChange = async (event) => {
    const newFiles = [...files, ...Array.from(event.target.files)];
    const data = [];
    for (const d of newFiles) {
      if (isImageFile(d)) {
        const url = await fileToBase64(d);
        d.url = url;
        data.push(d);
      } else {
        data.push(d);
      }
    }
    setFilesWithUrl(data);
    setFiles(newFiles);
    event.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setFilesWithUrl((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;

    if (key === '@') {
      e.preventDefault();
      e.stopPropagation();
      numberOfMentions.current += 1;
      if (!editorRef.current) return;
      setSelectedIndex(0);
      const elementRect = editorRef.current?.selection.getRng().getBoundingClientRect();
      const frameRect = editorRef.current?.iframeElement?.getBoundingClientRect();
      const range = editorRef.current?.selection.getRng();
      const htmlElement = document.createElement('span');
      htmlElement.id = `mention-${numberOfMentions.current || 0}`;
      htmlElement.innerHTML = '@';

      editorRef.current?.selection.setNode(htmlElement);
      setMentionInitialPosition({
        node: range.endContainer.parentElement,
        offsetIndex: range.endOffset,
        clientWidth: elementRect.width,
        clientHeight: elementRect.height,
        getBoundingClientRect: () => ({
          bottom: elementRect.bottom + frameRect.bottom,
          height: elementRect.height,
          width: elementRect.width,
          left: elementRect.left + frameRect.left,
          right: elementRect.right + frameRect.right,
          top: elementRect.top + frameRect.top,
          x: elementRect.x + frameRect.x,
          y: elementRect.y + frameRect.y,
          toJSON: () => {}
        })
      });
    }
    if (mentionInitialPosition) {
      if (key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev !== 0 ? prev - 1 : 0));
      }
      if (key === 'ArrowDown') {
        setSelectedIndex((prev) => prev + 1);
      }
      if (key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        applySelectedRef.current?.applySelected();
        return;
      }
      if (key === 'Enter' || key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    if (key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      postMessage();
    }
  };

  return (
    <div className={`send-message bg-[var(--dark-primary,white)] p-3`}>
      <div className="editor overflow-hidden rounded-lg [border:1px_solid_var(--common-border-color)]">
        {files.length > 0 && (
          <div className="flex flex-wrap p-1">
            {filesWithUrl?.map((file, index) => {
              const Icon = getFileIconSrc(file.name);
              return (
                <>
                  <div className="group relative min-h-[100px] w-[100px] max-w-[100px] flex-grow rounded-[4px] border border-[var(--common-border-color)] p-[var(--gutter)] [--gutter:8px]">
                    {file.url ? (
                      <>
                        <div style={{ backgroundImage: `url(${file.url})` }} className="absolute inset-0 bg-cover bg-center bg-no-repeat"></div>
                        <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"></div>
                      </>
                    ) : (
                      <div className="mx-auto mb-[11px] h-[30px] text-center">
                        <Icon size={30} className="mx-auto" />
                      </div>
                    )}

                    <span
                      className={cn(
                        'absolute right-0 top-0 z-10 transition-opacity group-hover:opacity-100 lg:opacity-0',
                        file.url ? 'bg-[var(--dark-primary,white)]' : ''
                      )}
                    >
                      <IconButton size="small" onClick={() => removeFile(index)}>
                        <Close fontSize="small" />
                      </IconButton>
                    </span>
                    <p
                      className={cn(
                        'absolute bottom-1 left-1 right-1 line-clamp-2 text-[14px] text-[var(--text-primary)]',
                        file.url ? 'text-white opacity-0 transition-opacity group-hover:opacity-100' : ''
                      )}
                    >
                      {file.name}
                    </p>
                  </div>
                </>
              );
            })}
          </div>
        )}

        <div className="editor" key={themeColor}>
          <Editor
            key={themeColor}
            id={editorId ? editorId : 'default'}
            onEditorChange={(d) => {
              if (editorRef.current.isDirty()) {
                setMessage(d);
              }
            }}
            onKeyDown={handleKeyDown}
            value={message ? message : '<span></span>'}
            onInit={(_evt, editor) => {
              editorRef.current = editor;
              if (initialMessage) {
                editor.setContent(initialMessage);
              }
            }}
            initialValue=""
            disabled={!channelId || disabled}
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
                'wordcount'
              ],
              toolbar: `undo redo | blocks | bold italic link | bullist numlist| removeformat | help`,
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
        </div>
        <div className="footer flex justify-between gap-2 [border-top:1px_solid_var(--common-border-color)]">
          {!initialMessage ? (
            <>
              <input
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                style={{ display: 'none' }}
                id="file-upload"
                multiple
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <IconButton color="primary" aria-label="upload" component="span" style={{ padding: 5, borderRadius: 0 }}>
                  <AttachFile />
                </IconButton>
              </label>
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
                Save
              </CustomButton>
            </>
          )}
        </div>
      </div>
      {mentionInitialPosition && (
        <Mention
          editor={editorRef.current}
          mentionInitialPosition={mentionInitialPosition}
          setMentionInitialPosition={setMentionInitialPosition}
          channelData={channelData}
          numberOfMentions={numberOfMentions.current}
          setSelectedIndex={setSelectedIndex}
          selectedIndex={selectedIndex}
          ref={applySelectedRef}
        />
      )}
    </div>
  );
};

export default SendMessage;

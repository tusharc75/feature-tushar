import { Button, IconButton } from '@material-ui/core';
import { AttachFile, Close, FindInPageRounded, Send } from '@material-ui/icons';
import { Editor } from '@tinymce/tinymce-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Socket } from 'socket.io-client';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomButton from 'src/components/Helpers/CustomButton';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, getFileIconSrc } from 'src/constants/helpers';
import { fileToBase64, isImageFile } from 'src/pages/WorkSpace/utils';

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
  const [filesWithUrl, setFilesWithUrl] = useState([]);

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

        <Editor
          key={themeColor}
          id={editorId ? editorId : 'default'}
          onEditorChange={(d) => {
            if (editorRef.current.isDirty()) {
              setMessage(d);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.ctrlKey) {
              e.preventDefault();
              postMessage();
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
              'wordcount'
            ],
            toolbar: `undo redo | blocks | bold italic link | bullist numlist| removeformat | help`,
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
        <div className="footer flex justify-between gap-2 [border-top:1px_solid_var(--common-border-color)]">
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
              <IconButton color="primary" aria-label="upload" component="span" style={{ padding: 5, borderRadius: 0 }}>
                <AttachFile />
              </IconButton>
            </label>
          </div>
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

const ImageViewer = ({ src, open, onClose }: { src: string | string[]; open: boolean; onClose: () => void }) => {
  const [currentSrc, setCurrentSrc] = useState(Array.isArray(src) ? src[0] : src);
  const imageRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState([imageRef.current?.width, imageRef.current?.height]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentSrc(Array.isArray(src) ? src[0] : src);
    return () => setSize([0, 0]);
  }, [src]);

  const portalContainer = document.getElementById('portal-container');
  const isList = Array.isArray(src);

  function ZoomIn() {
    const image = imageRef.current;
    let width = image.clientWidth;
    let height = image.clientHeight;

    setSize((prev) => [width + 50, height + 50]);
  }
  function ZoomOut() {
    const image = imageRef.current;
    let width = image.clientWidth;
    let height = image.clientHeight;

    setSize((prev) => [width - 50, height - 50]);
  }

  if (!open) return null;
  return createPortal(
    <div className="image-viewer fixed inset-0 z-[1499]  bg-black/50">
      <span className="absolute right-5 top-5 overflow-hidden rounded-md">
        <IconButton onClick={onClose}>
          <Close className="text-white" />
        </IconButton>
      </span>
      <span className="absolute right-20 top-5 overflow-hidden rounded-md">
        <IconButton onClick={ZoomIn}>
          <FindInPageRounded className="text-white" />
        </IconButton>
      </span>
      <div className="flex h-full w-full items-center justify-center">
        <div ref={containerRef} className="relative h-[calc(100%_-_20px)] w-[calc(100%_-_20px)] overflow-hidden md:h-[80%] md:w-[80%]">
          <img
            key={currentSrc}
            onLoad={(e) => {
              const target = e.currentTarget || (e.target as HTMLImageElement);
              if (target) setSize([target.width, target.height]);
            }}
            width={size[0] > 0 ? size[0] : undefined}
            height={size[1] > 0 ? size[1] : undefined}
            ref={imageRef}
            src={currentSrc}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-auto object-cover"
          />
        </div>
      </div>
    </div>,
    portalContainer
  );
};

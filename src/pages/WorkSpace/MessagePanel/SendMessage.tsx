import { AttachFile, Cancel, Close, Mic, MicOff, Send, Square } from '@mui/icons-material';
import { Button, IconButton } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, getFileIconSrc } from 'src/constants/helpers';
import Mention from 'src/pages/WorkSpace/MessagePanel/Mention';
import { ChannelData } from 'src/pages/WorkSpace/types';
import { UseWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';
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
  parentMessageId?: string | null;
  state: UseWorkSpace;
  resourceData?: any | null;
};

const SendMessage = ({
  channelId,
  socket,
  messageId = null,
  initialMessage = '',
  onEditComplete = () => { },
  editorId = '',
  channelData,
  disabled = false,
  parentMessageId = null,
  state,
  resourceData = null
}: SendMessageProps) => {
  const { setSelectedChannel } = state;
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

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobs, setAudioBlobs] = useState([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    numberOfMentions.current = 0;
    if (!initialMessage) {
      setMessage('');
      setFiles([]);
      setAudioBlobs([]);
      setFilesWithUrl([]);
    }
  }, [channelId]);

  const postMessage = async () => {
    setIsLoading(true);
    try {
      if (initialMessage) {
        await axiosInstance()
          .put(`/work-space/channel/message`, { message, messageId })
          .then(() => {
            socket.emit('messageUpdated', { channelId, messageId });
          });
        onEditComplete();
      } else {
        let formData = new FormData();
        formData.append('message', message);
        files.forEach((file) => {
          formData.append('files', file);
        });
        audioBlobs?.forEach((audioBlob, index) => {
          formData.append('files', new File([audioBlob], `recording-${index}.webm`, { type: 'audio/webm' }));
        });
        if (resourceData && !channelId) {
          // formData.append('toUsers', JSON.stringify([newChatToUser._id]));
          // await axiosInstance()
          //   .post('/work-space/channel/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          //   .then(({ data: { data } }) => {
          //     setNewDirectMessageChannelId(data?.ops?.[0]?.channel);
          //     socket.emit('newChat', { channelId: 'directMessaging' });
          //   });
          await axiosInstance()
            .post('/work-space/channel', {
              access: 'public',
              description: '',
              ...resourceData
            })
            .then(async ({ data: { data } }) => {
              if (data && data?._id) {
                formData.append('channelId', data?._id);
                await axiosInstance().post('/work-space/channel/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                setSelectedChannel(data);
                socket.emit('joinChannel', data?._id);
              }
            })
            .catch((error) => { });
        } else {
          formData.append('channelId', channelId);
          if (parentMessageId) formData.append('parentId', parentMessageId);
          await axiosInstance().post('/work-space/channel/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }
      setMessage('');
      setFiles([]);
      setAudioBlobs([]);
      if (editorRef.current) {
        editorRef.current.setContent('');
      }
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
          toJSON: () => { }
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

    if (key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const liElement = editorRef.current?.selection.getNode().closest('li');

      if (liElement) {
        return;
      } else {
        e.preventDefault();
        if (message && message !== initialMessage && !isLoading) postMessage();
      }
    }

    if (key === 'Enter' && (e.shiftKey || e.ctrlKey || e.metaKey)) {
      return;
    }
  };

  const getAudio = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Audio recording is not supported in this browser');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

        const recorder = new MediaRecorder(stream, { mimeType });

        recorderRef.current = recorder;
        chunks.current = [];

        recorder.ondataavailable = (e: BlobEvent) => {
          chunks.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: mimeType });
          setAudioBlobs((prev) => [...prev, blob]);
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.onerror = (event) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'error',
            message: 'Error during recording: ' + event.error
          });
          setIsRecording(false);
        };

        recorder.start();
        setIsRecording(true);
      } catch (e) {
        toastConfig.setToastConfig({ open: true, type: 'error', message: e.message || 'Error accessing microphone' });
      }
    }
  };

  return (
    <div className={`send-message bg-[var(--dark-primary,white)] pt-3`}>
      <div className="editor overflow-hidden ">
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
        <div className="flex flex-wrap gap-1">
          {audioBlobs?.map((audioBlob, index) => (
            <div key={index} className="relative">
              <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '200px' }}></audio>
              <HtmlTooltip title="Remove" placement="top" className="absolute right-0 top-0">
                <IconButton
                  size="small"
                  onClick={() => {
                    setAudioBlobs((prev) => prev.filter((_, i) => i !== index));
                  }}
                  style={{ padding: 4 }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </div>
          ))}
        </div>

        {isRecording && (
          <div className="relative flex items-center gap-3 px-4 py-3 mb-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
            {/* Animated border glow */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                animation: 'glow 1.5s infinite alternate',
                background: 'linear-gradient(90deg, #60a5fa22, #6366f122)'
              }}
            />
            {/* Recording indicator */}
            <div className="relative flex items-center gap-3">
              {/* Mic icon with animated background */}
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-red-500 shadow-sm">
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                <Mic className="relative w-4 h-4 text-white" />
              </div>

              {/* Recording text and status */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">Recording</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
                <span className="text-xs text-gray-600">Speak clearly into your microphone</span>
              </div>
            </div>
            {/* Stop button */}
            <Button
              variant="outline"
              size="sm"
              onClick={getAudio}
              className="ml-auto h-8 px-3 border-gray-300 hover:border-red-300 hover:bg-red-50 transition-colors"
            >
              <Square className="w-3 h-3 mr-1.5 fill-current" />
              Stop
            </Button>
          </div>
        )}

        <div className="editor [&_.tox-tinymce]:border-b-0" key={themeColor}>
          <Editor
            key={themeColor}
            id={editorId ? editorId : 'default'}
            onEditorChange={(d) => {
              if (editorRef.current.isDirty()) {
                setMessage(d);
              }
            }}
            onKeyDown={handleKeyDown}
            onInit={(_evt, editor) => {
              editorRef.current = editor;
              if (initialMessage) {
                editor.setContent(initialMessage);
              }
            }}
            initialValue={''}
            disabled={disabled || !(channelId || resourceData)}
            init={{
              placeholder: 'Type a message',
              auto_focus: editorId ? editorId : 'default',
              skin: themeColor === 'dark' ? 'oxide-dark' : 'oxide',
              content_css: themeColor === 'dark' ? 'dark' : 'default',
              height: 100,
              menubar: false,
              paste_as_text: true,
              plugins: [
                'placeholder',
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
                'wordcount',
                'help',
                'emoticons'
              ],
              toolbar: `undo redo | blocks | bold italic link | bullist numlist| removeformat | emoticons | help`,
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
              toolbar_mode: 'floating',
              mobile: {
                toolbar_mode: 'floating'
              },
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
        </div>
        <div className="flex items-center justify-between gap-2">
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
                <HtmlTooltip title="Attach file(s)" placement="top">
                  <IconButton color="primary" aria-label="upload" component="span" sx={{ padding: '5px', borderRadius: 0 }} disabled={disabled}>
                    <AttachFile fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </label>
              <HtmlTooltip title={isRecording ? 'Stop Recording Audio' : 'Record Audio'} placement="top">
                <IconButton
                  color="primary"
                  aria-label="upload-audio"
                  component="span"
                  sx={{ padding: '5px', borderRadius: 0 }}
                  disabled={disabled}
                  onClick={getAudio}
                >
                  {isRecording ? <MicOff fontSize="small" /> : <Mic fontSize="small" />}
                </IconButton>
              </HtmlTooltip>
              <IconButton
                sx={{
                  display: 'block',
                  padding: '8px',
                  borderRadius: '4px',
                  background: 'var(--new-theme-color)',
                  color: 'white',
                  '&:hover': {
                    background: 'var(--new-theme-color)',
                    color: 'white'
                  },
                  '&:disabled': {
                    background: 'var(--new-theme-color-disabled)',
                    color: 'white',
                    opacity: 0.5
                  }
                }}
                disabled={disabled || (!message && files.length === 0 && audioBlobs.length === 0) || isLoading}
                size="small"
                className="send-button !ml-auto !block"
                onClick={postMessage}
              >
                <Send fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <ThemeButton buttonType="transparent" onClick={onEditComplete}>
                Cancel
              </ThemeButton>
              <ThemeButton
                isLoading={isLoading}
                buttonType="theme"
                disabled={!message || message === initialMessage || isLoading}
                onClick={postMessage}
              >
                Save
              </ThemeButton>
            </>
          )}
        </div>
      </div>
      {mentionInitialPosition && !resourceData && (
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

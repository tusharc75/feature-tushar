import { Check, Close, Send } from '@mui/icons-material';
import { CircularProgress, IconButton } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import AudioPlayer from 'src/components/DesktopDM/Audio/AudioPlayer';
import Recorder from 'src/components/DesktopDM/Audio/Recorder';
import { RecordedData } from 'src/components/DesktopDM/Audio/RecorderClass';
import { AUDIO_EXTENSION, AUDIO_FORMAT } from 'src/components/DesktopDM/constants';
import editorCss from 'src/components/DesktopDM/editorcss.css?raw';
import AttachmentInput from 'src/components/DesktopDM/File/AttachmentInput';
import FilePreview, { AttachedFileType } from 'src/components/DesktopDM/File/FilePreview';
import { RenderContent } from 'src/components/DesktopDM/ShowMessage/helperComponents';
import { Chat, UseDesktopDM, User } from 'src/components/DesktopDM/types';
import { fileUrlCache } from 'src/components/DesktopDM/utils';
import { useAppTheme } from 'src/constants/AppConfig';

type SendMessageProps = {
  state: UseDesktopDM;
  data: User | Chat;
  parentMessageId?: string;
  disabled?: boolean;
  onNewMessagePost?: (messageId: string) => void;
};

const SendMessage = memo(({ state, data: panelData, parentMessageId, disabled, onNewMessagePost = () => {} }: SendMessageProps) => {
  const { toastConfig, onUserFirstMessageSent, checkIsUser, user, currentlyEditingMessage, socket } = state;
  const [themeColor] = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<AttachedFileType[]>([]);
  const [audioBlobs, setAudioBlobs] = useState<RecordedData[]>([]);
  const editorRef = useRef<Editor['editor'] | null>(null);
  const isNewChatToUser = checkIsUser(panelData);

  const postMessage = async () => {
    setLoading(true);
    try {
      if (currentlyEditingMessage) {
        await axiosInstance().put(`/work-space/channel/message`, { message, messageId: currentlyEditingMessage._id });
        socket.emit('messageUpdated', { channelId: currentlyEditingMessage.channel, messageId: currentlyEditingMessage._id });
      } else {
        let formData = new FormData();
        formData.append('message', message);
        files.forEach((file) => {
          formData.append('files', file.file);
        });
        audioBlobs?.forEach((audioData, index) => {
          formData.append('files', new File([audioData.blob], `recording-${index}-${Date.now()}.${AUDIO_EXTENSION}`, { type: AUDIO_FORMAT }));
        });
        if (isNewChatToUser) {
          formData.append('toUsers', JSON.stringify([panelData._id]));
          await axiosInstance()
            .post('/work-space/channel/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(({ data: { data } }) => {
              onUserFirstMessageSent({ channelId: data?.ops?.[0]?.channel, userId: panelData._id });
            });
        } else {
          formData.append('channelId', panelData._id);
          if (state.replyingToMessage) formData.append('parentId', state.replyingToMessage._id);
          if (parentMessageId) formData.append('parentId', parentMessageId);
          await axiosInstance()
            .post('/work-space/channel/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(({ data: { data } }) => {
              // onNewMessagePost?.(data?.ops?.[0]?._id);
              // console.log(data);
              // socket.emit('newMessagePosted', { channelId: data?.ops?.[0]?.channel, messageId: data?.ops?.[0]?._id });
            });
        }
        setMessage('');
        setFiles([]);
        setAudioBlobs([]);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
      state.setReplyingToMessage(null);
      state.setCurrentlyEditingMessage(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    const keyCombinations = e.ctrlKey || e.metaKey || e.shiftKey;
    if (key === 'Enter' && !keyCombinations) {
      e.preventDefault();
      if (message && editorRef.current.getContent({ format: 'text' }).length > 0 && message !== currentlyEditingMessage?.message && !loading) {
        postMessage();
      }
    }
  };

  const handleDeleteBlob = (src: string) => {
    fileUrlCache.delete(src);
    URL.revokeObjectURL(src);
    setAudioBlobs((prev) => prev.filter((d) => d.url !== src));
  };

  const handleDeleteFile = (data: AttachedFileType) => {
    fileUrlCache.delete(data.url);
    URL.revokeObjectURL(data.url);
    setFiles((prev) => prev.filter((d) => d._id !== data._id));
  };

  useEffect(() => {
    if (currentlyEditingMessage?.message) {
      setMessage(currentlyEditingMessage?.message);
    } else {
      setMessage('');
    }
  }, [currentlyEditingMessage?.message]);

  const onRecordingFinish = useCallback((data: RecordedData) => {
    setAudioBlobs((prev) => [...prev, data]);
  }, []);
  const onFileInput = useCallback((data: AttachedFileType[]) => {
    setFiles((prev) => [...prev, ...data]);
  }, []);

  return (
    <div className="remove-tiny-mce-toolbar-top-border relative border-t  p-3 [--toolbar-width:45px] [&_.tox-edit-area]:!rounded-md [&_.tox-edit-area]:![border:1px_solid] [&_.tox-editor-header]:max-w-[--toolbar-width] [&_.tox-toolbar__primary]:!border-t-0 [&_.tox-toolbar__primary]:!border-none [&_.tox.tox-tinymce.tox-tinymce--toolbar-bottom]:!border-none">
      {audioBlobs.length > 0 && (
        <div className="mb-2 max-h-[200px] space-y-1 overflow-y-auto">
          {audioBlobs.map((a) => (
            <AudioPlayer key={a.url} src={a.url} onDelete={handleDeleteBlob} />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="mb-2">
          <FilePreview hasToDownload={false} files={files} onDelete={handleDeleteFile} />
        </div>
      )}

      {state.replyingToMessage && (
        <div className="flex gap-2 rounded-t-md bg-gray-100 p-2 dark:bg-gray-700">
          <div className="w-1 rounded-md bg-new-theme-color" />
          <RenderContent
            state={state}
            message={state.replyingToMessage}
            isUserMessage={user._id === state.replyingToMessage.user.optionValue}
            isReplying
          />
          <span className="ml-auto">
            <IconButton size="small" onClick={() => state.setReplyingToMessage(null)} className="!ml-auto">
              <Close fontSize="small" />
            </IconButton>
          </span>
        </div>
      )}

      <Editor
        onKeyDown={handleKeyDown}
        key={`${themeColor}`}
        onEditorChange={(d) => {
          if (editorRef.current.isDirty()) {
            setMessage(d);
          }
        }}
        // onKeyDown={handleKeyDown}
        value={message ? message : '<span></span>'}
        onInit={(_evt, editor) => {
          editorRef.current = editor;
        }}
        initialValue={''}
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
      <div className="absolute bottom-3 left-[calc(var(--toolbar-width)+12px)] right-3 z-10 flex items-center gap-2">
        <AttachmentInput onFileInput={onFileInput} />
        <Recorder onRecordFinish={onRecordingFinish} />
        {currentlyEditingMessage ? (
          <>
            <IconButton disabled={loading} className="!ml-auto !flex" size="small" onClick={() => state.setCurrentlyEditingMessage(null)}>
              <Close />
            </IconButton>
            <IconButton
              size="small"
              disabled={
                (message.length === 0 && files.length === 0 && audioBlobs.length === 0) || loading || message === currentlyEditingMessage?.message
              }
              onClick={postMessage}
              sx={{
                background: 'var(--new-theme-color)',
                color: 'white',
                borderRadius: '8px',
                '&:hover': {
                  background: 'var(--new-theme-color-hover)'
                },
                '&:disabled': {
                  background: 'var(--new-theme-color)',
                  color: 'white',
                  opacity: 0.7
                }
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : <Check fontSize="small" />}
            </IconButton>
          </>
        ) : (
          <>
            <IconButton
              className="!ml-auto !flex"
              size="small"
              disabled={(message.length === 0 && files.length === 0 && audioBlobs.length === 0) || loading}
              onClick={postMessage}
              sx={{
                background: 'var(--new-theme-color)',
                color: 'white',
                borderRadius: '8px',
                '&:hover': {
                  background: 'var(--new-theme-color-hover)'
                },
                '&:disabled': {
                  background: 'var(--new-theme-color)',
                  color: 'white',
                  opacity: 0.7
                }
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : <Send fontSize="small" />}
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
});

export default SendMessage;

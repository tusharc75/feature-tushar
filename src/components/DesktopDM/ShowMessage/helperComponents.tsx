import { Delete, Edit, InsertDriveFile, Mic, MoreVert, PushPin, Reply } from '@mui/icons-material';
import { Avatar, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useMemo, useState } from 'react';
import { TiPin } from 'react-icons/ti';
import { FileIconData, getFileIconData } from 'src/assets/fileIcons';
import axiosInstance from 'src/axios/axiosInstance';
import AudioPlayer from 'src/components/DesktopDM/Audio/AudioPlayer';
import FilePreview from 'src/components/DesktopDM/File/FilePreview';
import { Attachment, Message, UseDesktopDM } from 'src/components/DesktopDM/types';
import { deleteAttachmentCache } from 'src/components/DesktopDM/utils';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import { cn, formatDate } from 'src/constants/helpers';

export const RenderAvatar = ({ message }: { message: Message }) => {
  return <Avatar src={message.user.avatar} sx={{ width: '32px', height: '32px' }} alt={message.user.optionLabel} />;
};
export const RenderContent = ({
  message,
  isUserMessage,
  isReplying = false,
  state,
  className,
  ...rest
}: {
  message: Message;
  isUserMessage: boolean;
  isReplying?: boolean;
  state: UseDesktopDM;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const [deleteAttachmentData, setDeleteAttachmentData] = useState<{
    open: boolean;
    loading: boolean;
    message: Message | null;
    attachment: Attachment | null;
  }>({ open: false, loading: false, attachment: null, message: null });

  const { socket, toastConfig } = state;
  const { recordings, files } = useMemo(() => {
    const data: { recordings: (Attachment & FileIconData)[]; files: (Attachment & FileIconData)[] } = {
      recordings: [],
      files: []
    };
    if (!message.attachments) return data;
    for (const attachment of message.attachments) {
      const fileIconData = getFileIconData(attachment.url);
      if (fileIconData.type === 'audio') {
        data.recordings.push({ ...attachment, ...fileIconData });
      } else {
        data.files.push({ ...attachment, ...fileIconData });
      }
    }
    return data;
  }, [message.attachments]);

  const deleteAttachment = async () => {
    const { message, attachment } = deleteAttachmentData;
    setDeleteAttachmentData((prev) => ({ ...prev, loading: true }));
    try {
      await axiosInstance().put(`/work-space/channel/message/remove-attachment`, { messageId: message._id, attachmentId: attachment._id });
      socket.emit('messageDeleted', { channelId: message.channel });
      deleteAttachmentCache(attachment.url);
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      closeDeleteAttachmentConfirmDialog();
    }
  };

  const openDeleteAttachmentConfirmDialog = ({ message, attachment }: { message: Message; attachment: Attachment }) => {
    setDeleteAttachmentData({ open: true, loading: false, message, attachment });
  };
  const closeDeleteAttachmentConfirmDialog = () => {
    setDeleteAttachmentData({ open: false, loading: false, attachment: null, message: null });
  };

  return (
    <>
      <div
        className={cn(
          'leading-1.5 relative flex w-fit max-w-[320px] flex-col',
          isReplying
            ? ''
            : `
          ${isUserMessage ? 'rounded-xl rounded-tr-none' : 'rounded-xl rounded-tl-none'} 
          ${isUserMessage ? 'border-slate-200 bg-new-theme-color/10 dark:bg-slate-800' : 'border-gray-200 bg-gray-100 dark:bg-gray-700'}
        `,
          isReplying ? 'p-0' : 'p-4',
          className
        )}
        {...rest}
      >
        {!isReplying && message.pinned && (
          <span className={cn('absolute top-1 text-gray-500', isUserMessage ? '-left-4' : '-right-4')}>
            <TiPin size={14} />
          </span>
        )}
        {message.lastModified && <span className={cn('-mt-[6px] text-[10px] font-light text-gray-500')}>Edited</span>}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {isUserMessage && isReplying ? 'You' : message.user.optionLabel}
          </span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{formatDate(message.date, 'hh:mm A')}</span>
        </div>
        {message.message && (
          <div
            className={cn('my-2.5 text-sm font-normal text-gray-900 dark:text-white', isReplying ? 'line-clamp-2 overflow-hidden' : '')}
            dangerouslySetInnerHTML={{ __html: message.message }}
          />
        )}
        {recordings.length > 0 &&
          (isReplying ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Mic className="!text-sm" />
              {recordings.length} Voice message{recordings.length > 1 ? 's' : ''}
            </p>
          ) : (
            <div className="-mx-2 mt-2 w-[calc(100%+16px)]">
              {recordings.map((r) => {
                return (
                  <AudioPlayer
                    height={25}
                    src={r.url}
                    hasToDownload={true}
                    downloadFileName={r.url}
                    onDelete={isUserMessage ? () => openDeleteAttachmentConfirmDialog({ message, attachment: r }) : undefined}
                  />
                );
              })}
            </div>
          ))}
        {files.length > 0 &&
          (isReplying ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <InsertDriveFile className="!text-sm" />
              {files.length} files
            </p>
          ) : (
            <div className="mt-2.5">
              <FilePreview
                files={files}
                hasToDownload
                showDownloadButton
                onDelete={isUserMessage ? (data) => openDeleteAttachmentConfirmDialog({ message, attachment: data }) : undefined}
              />
            </div>
          ))}
      </div>
      {deleteAttachmentData.open && (
        <ConfirmationDialogRaw
          open={true}
          onClose={closeDeleteAttachmentConfirmDialog}
          onOk={deleteAttachment}
          message={`Confirm if you'd like to delete "${deleteAttachmentData?.attachment?.fileName}"?`}
          forwardText="Delete"
          okBtnLoading={deleteAttachmentData.loading}
        />
      )}
    </>
  );
};
export const RenderButton = ({ message, isUserMessage, state }: { message: Message; isUserMessage: boolean; state: UseDesktopDM }) => {
  const { socket, toastConfig, setCurrentlyEditingMessage } = state;
  const [confirmDialogData, setConfirmDialogData] = useState({ open: false, loading: false });

  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  const isMenuOpen = Boolean(anchorEl);

  const deleteMessage = async () => {
    setConfirmDialogData((prev) => ({ ...prev, loading: true }));
    try {
      await axiosInstance().delete(`/work-space/channel/message`, { data: { _id: message?._id } });
      socket.emit('messageDeleted', { channelId: message?.channel });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setConfirmDialogData({ open: false, loading: false });
    }
  };

  const pinMessage = async () => {
    try {
      await axiosInstance().post(`/work-space/channel/message/pin-unpin/${message?._id}`);
      socket.emit('messageUpdated', { channelId: message?.channel, messageId: message?._id });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      <IconButton
        size={'small'}
        onClick={handleOpenMenu}
        id={`dropdownMenuIconButton-${message._id}`}
        className="inline-flex items-center self-center"
        type="button"
        color="primary"
      >
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu
        open={isMenuOpen}
        disableScrollLock
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        id={`dropdownMenu-${message._id}`}
        slotProps={{
          list: { 'aria-labelledby': `dropdownMenuIconButton-${message._id}` },
          paper: { sx: { minWidth: '150px' }, onClick: handleCloseMenu }
        }}
      >
        <MenuItem onClick={() => state.setReplyingToMessage(message)}>
          <ListItemIcon>
            <Reply fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={pinMessage}>
          <ListItemIcon>
            {message.pinned ? <TiPin size={22} className="text-black dark:text-white" /> : <PushPin fontSize="small" color="primary" />}
          </ListItemIcon>
          <ListItemText>{message.pinned ? 'Unpin' : 'Pin'}</ListItemText>
        </MenuItem>
        {isUserMessage && message.message.length > 0 && (
          <MenuItem onClick={() => setCurrentlyEditingMessage(message)}>
            <ListItemIcon>
              <Edit fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {isUserMessage && (
          <MenuItem onClick={() => setConfirmDialogData({ open: true, loading: false })}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {confirmDialogData.open && (
        <ConfirmationDialogRaw
          onClose={() => setConfirmDialogData({ open: false, loading: false })}
          open={true}
          message="Are you sure you want to delete Message?"
          onOk={deleteMessage}
          okBtnLoading={confirmDialogData.loading}
          forwardText="Delete"
        />
      )}
    </>
  );
};

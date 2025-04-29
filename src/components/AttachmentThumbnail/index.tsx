import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import PreviewIcon from '@mui/icons-material/Visibility';
import { IconButton } from '@mui/material';
import axios from 'axios';
import mimeDb from 'mime-db';
import { useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { FileIcon, fileIcons } from 'src/assets/fileIcons';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { deleteDisable } from 'src/constants/messageHelpers';
import HtmlTooltip from '../CustomTooltipTitle';

const imageExtensions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
const pdfExtensions = ['pdf'];

const AttachmentThumbnail = ({ attachments, handleDeleteAttachment, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const [, setDownloadProgress] = useState(0);
  const [, setIsDownloading] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [attachmentToDelete, setAttachemnetToDelete] = useState('');

  // GET ATTACHMENT ICON
  const getFileIconSrc = (file) => {
    if (mimeDb[file]) {
      let extension = `.${mimeDb[file].extensions[0]}`;
      let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
      if (data && data?.icon) return data.icon;
    }
    if (file?.contentType) {
      let extension = `.${mimeDb[file.contentType].extensions[0]}`;
      let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
      if (data && data?.icon) return data.icon;
    } else if (file) {
      let extension = file.substring(file.lastIndexOf('.')).toLowerCase();
      let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
      if (data && data?.icon) return data.icon;
    }
    return FileIcon;
  };

  // VIEW ATTACHMENT
  const viewAttachment = (event, file) => {
    if (event) {
      toastConfig.setToastConfig({
        open: true,
        type: 'info',
        message: `File is Loading, Please wait...`
      });
    }
    setDownloadProgress(0);
    setIsDownloading(true);
    axiosInstance()
      .get(`user/download?fileName=${encodeURIComponent(file)}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress(percentCompleted);
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Downloaded Successfully',
              open: true,
              type: 'success'
            });
            setTimeout(() => {
              setDownloadProgress(0);
              setIsDownloading(false);
            }, 2000);
          }
        }
      })
      .then(({ data }) => {
        const ext = file.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        if (pdfExtensions?.includes(ext)) {
          mimeType = 'application/pdf';
        } else if (imageExtensions?.includes(ext)) {
          mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        }
        const blob = new Blob([data], { type: mimeType });
        const fileURL = URL.createObjectURL(blob);
        const newWindow = window.open();
        newWindow.location.href = fileURL;
        setIsDownloading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloading(false);
      });
  };

  // DOWNLOAD ATTACHMENT
  const downloadFile = (event, file) => {
    if (event && !file?.base64) {
      toastConfig.setToastConfig({
        open: true,
        type: 'info',
        message: `Downloading, Please wait...`
      });
    }
    setIsDownloading(true);
    setDownloadProgress(0);

    if (file?.base64) {
      let link = document.createElement('a');
      link.href = `data:application/${file?.contentType};base64,${file?.base64}`;
      link.download = `${file?.name}${file?.extension}`;
      link.click();
      setIsDownloading(false);
    } else if (file.url) {
      axiosInstance()
        .get(`user/download?fileName=${encodeURIComponent(file.url)}`, {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);

            if (percentCompleted === 100) {
              toastConfig.setToastConfig({ open: true, type: 'success', message: 'File downloaded successfully.' });
              setTimeout(() => {
                setDownloadProgress(0);
                setIsDownloading(false);
              }, 2000);
            }
          }
        })
        .then(({ data }) => {
          const url = window.URL.createObjectURL(new Blob([data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', file.url);
          document.body.appendChild(link);
          link.click();
          setTimeout(() => setIsDownloading(false), 2000);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setIsDownloading(false);
        });
    } else {
      axios
        .get(file, {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);

            if (percentCompleted === 100) {
              toastConfig.setToastConfig({ open: true, type: 'success', message: 'File downloaded successfully.' });
              setTimeout(() => {
                setDownloadProgress(0);
                setIsDownloading(false);
              }, 2000);
            }
          }
        })
        .then((data) => {
          const url = window.URL.createObjectURL(new Blob([data.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', file?.substring(file.lastIndexOf('/') + 1));
          document.body.appendChild(link);
          link.click();
          setTimeout(() => setIsDownloading(false), 2000);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setIsDownloading(false);
        });
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 py-3">
        {attachments && attachments.length > 0 ? (
          <>
            {attachments.map((attachment, i) => {
              const Icon = getFileIconSrc(attachment?.contentType ? attachment?.contentType : attachment.url ? attachment.url : attachment);
              return (
                <div
                  key={i}
                  title={
                    attachment
                      ? attachment?.name
                        ? attachment?.name
                        : attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                          ? attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                          : attachment.substring(attachment.lastIndexOf('/') + 1)
                      : 'attachment'
                  }
                  className="group relative min-h-[153px] w-[138px] max-w-[138px] flex-grow basis-[138px] rounded-[4px] border border-[var(--common-border-color)] p-[var(--gutter)] [--gutter:8px]"
                >
                  <div className="mx-auto mb-[11px] h-[79px] text-center">
                    <Icon size={79} className="mx-auto" />
                  </div>
                  <p className="line-clamp-1 text-[14px] text-[var(--text-primary)]">
                    {attachment
                      ? attachment?.name
                        ? attachment?.name
                        : attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                          ? attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                          : attachment.substring(attachment.lastIndexOf('/') + 1)
                      : 'attachment'}
                  </p>
                  <div className="flex justify-between">
                    <HtmlTooltip title="Download" placement="top" enterTouchDelay={0}>
                      <IconButton
                        size={'small'}
                        onClick={(event) => downloadFile(event, attachment)}
                        style={{ paddingBottom: 3, width: 30, height: 30 }}
                        color="primary"
                      >
                        <GetAppIcon fontSize="small" />
                      </IconButton>
                    </HtmlTooltip>
                    {[...imageExtensions, ...pdfExtensions]?.includes(attachment?.url?.split('.')?.pop()?.toLowerCase()) && (
                      <HtmlTooltip title="Preview" placement="top" enterTouchDelay={0}>
                        <IconButton
                          size={'small'}
                          onClick={(e) => {
                            viewAttachment(e, attachment.url);
                          }}
                          style={{ paddingBottom: 3, width: 30, height: 30 }}
                          color="primary"
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </HtmlTooltip>
                    )}
                    <HtmlTooltip title={allowedToEdit ? 'Delete' : deleteDisable} placement="top" enterTouchDelay={0}>
                      <IconButton
                        size={'small'}
                        disabled={!allowedToEdit}
                        onClick={() => {
                          setShowConfirmationDialog(true);
                          setAttachemnetToDelete(attachment);
                        }}
                        style={{ paddingBottom: 3, width: 30, height: 30 }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </HtmlTooltip>
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
      </div>
      {showConfirmationDialog && (
        <ConfirmationDialog
          open={showConfirmationDialog}
          message="Are you sure you want to delete this attachment?"
          onClose={() => {
            setShowConfirmationDialog(false);
          }}
          onOk={() => {
            setShowConfirmationDialog(false);
            if (handleDeleteAttachment) {
              handleDeleteAttachment(attachmentToDelete);
            }
          }}
        />
      )}
    </>
  );
};

export default AttachmentThumbnail;

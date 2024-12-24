import { IconButton } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import GetAppIcon from '@material-ui/icons/GetApp';
import PreviewIcon from '@material-ui/icons/Visibility';
import axios from 'axios';
import _ from 'lodash';
import mimeDb from 'mime-db';
import { Fragment, useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { FileIcon, fileIcons } from 'src/assets/fileIcons';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import HtmlTooltip from '../CustomTooltipTitle';

const AttachmentThumbnail = ({ attachments, handleDeleteAttachment, canEdit }) => {
  const {
    state: { permissions }
  }: any = useData();

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
  const viewPdf = (event, file) => {
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
        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.location.href = fileURL;
        // toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
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
                <Fragment key={i}>
                  <div className="group relative min-h-[153px] w-[138px] max-w-[138px] flex-grow basis-[138px] rounded-[4px] border border-[var(--common-border-color)] p-[var(--gutter)] [--gutter:18px]">
                    <div className="front  group-hover:hidden">
                      <div className="mx-auto mb-[11px] h-[79px] text-center">
                        {/* <img
                          src={}
                          className={`object-contain mx-auto block h-full w-full max-w-full`}
                          alt="attchment"
                        /> */}
                        <Icon size={79} className="mx-auto" />
                      </div>
                      <p className=" line-clamp-1 text-[14px] text-[var(--text-primary)]">
                        {attachment
                          ? attachment?.name
                            ? attachment?.name
                            : attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                              ? attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                              : attachment.substring(attachment.lastIndexOf('/') + 1)
                          : 'attachment'}
                      </p>
                    </div>
                    <div className="back absolute inset-0 flex flex-col justify-between p-[var(--gutter)] opacity-0 group-hover:opacity-100">
                      <p
                        className=" line-clamp-4 text-[14px] text-[var(--text-primary)]"
                        title={
                          attachment
                            ? attachment?.name
                              ? attachment?.name
                              : attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                                ? attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                                : attachment?.substring(attachment.lastIndexOf('/') + 1)
                            : 'attachment'
                        }
                      >
                        {attachment
                          ? attachment?.name
                            ? attachment?.name
                            : attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                              ? attachment?.url?.substring(attachment.url.lastIndexOf('/') + 1)
                              : attachment?.substring(attachment.lastIndexOf('/') + 1)
                          : 'attachment'}
                      </p>
                      <div className="flex justify-between">
                        <HtmlTooltip title="Download" placement="top" enterTouchDelay={0}>
                          <IconButton
                            size={'small'}
                            onClick={(event) => downloadFile(event, attachment)}
                            style={{ paddingBottom: 3, width: 30, height: 30 }}
                          >
                            {<GetAppIcon />}
                          </IconButton>
                        </HtmlTooltip>
                        {_.endsWith(attachment?.url, '.pdf') && (
                          <HtmlTooltip title="Preview" placement="top" enterTouchDelay={0}>
                            <IconButton
                              size={'small'}
                              onClick={(e) => {
                                viewPdf(e, attachment.url);
                              }}
                              style={{ paddingBottom: 3, width: 30, height: 30 }}
                            >
                              <PreviewIcon color="primary" />
                            </IconButton>
                          </HtmlTooltip>
                        )}
                        {canEdit && permissions?.attachment?.isDelete ? (
                          <HtmlTooltip title="Delete" placement="top" enterTouchDelay={0}>
                            <IconButton
                              size={'small'}
                              onClick={() => {
                                setShowConfirmationDialog(true);
                                setAttachemnetToDelete(attachment);
                              }}
                              style={{ paddingBottom: 3, width: 30, height: 30 }}
                            >
                              {<DeleteIcon color="error" />}
                            </IconButton>
                          </HtmlTooltip>
                        ) : (
                          <HtmlTooltip className="cursor-stop" title={"You don't have permissions to delete attachment"} enterTouchDelay={0}>
                            <IconButton size={'small'} style={{ paddingBottom: 3, width: 30, height: 30 }}>
                              <DeleteIcon color="disabled" />
                            </IconButton>
                          </HtmlTooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </Fragment>
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

import React, { useState, useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { IconButton, Typography, Paper, Tooltip, Dialog } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import GetAppIcon from '@material-ui/icons/GetApp';
import { csvIcon, docIcon, excelSheetIcon, pdfFileIcon, pptIcon, textFileIcon, imageIcon, zipIcon } from 'src/assets/file_icons';
import emailStyles from 'src/pages/Activity/Email/email.module.scss';
import { useData } from 'src/StateProvider/Provider';
import PreviewIcon from '@material-ui/icons/Visibility';
import _ from 'lodash';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import moment from 'moment';
import { dateTimeFormat } from 'src/constants/helpers';
import axios from 'axios';
import mimeDb from 'mime-db';

const fileIcons = [
  {
    extensions: ['.txt', '.rtf'],
    source: textFileIcon
  },
  {
    extensions: ['.doc', '.docx', '.docs'],
    source: docIcon
  },
  {
    extensions: ['.pdf'],
    source: pdfFileIcon
  },
  {
    extensions: ['.xlsx', '.xml', '.xls', '.xlsm', '.xlt', '.xltm', '.xltx', '.xlw'],
    source: excelSheetIcon
  },
  {
    extensions: ['.csv'],
    source: csvIcon
  },
  {
    extensions: ['.pot', '.potm', '.potx', '.ppa', '.ppam', '.pptx', '.pptm', '.ppt', '.ppsx'],
    source: pptIcon
  },
  {
    extensions: ['.tif', 'tiff', '.bmp', '.jpg', '.jpeg', '.gif', '.png', '.eps', '.raw', '.cr2', '.nef', '.orf', '.sr2'],
    source: imageIcon
  },
  {
    extensions: [
      '.arc',
      '.arj',
      '.as',
      '.b64',
      '.btoa',
      '.bz',
      '.bz2',
      '.cab',
      '.cpt',
      '.gz',
      '.hqx',
      '.iso',
      '.lha',
      '.lzh',
      '.mim',
      '.mme',
      '.pak',
      '.pf',
      '.rar',
      '.rpm',
      '.sea',
      '.sit',
      '.sitx',
      '.tar',
      '.gz',
      '.tbz',
      '.tbz2',
      '.tgz',
      '.uu',
      '.uue',
      '.z',
      '.zip',
      '.zipx',
      '.zoo'
    ],
    source: zipIcon
  }
];

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
      if (data && data?.source) return data.source;
    }
    if (file?.contentType) {
      let extension = `.${mimeDb[file.contentType].extensions[0]}`;
      let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
      if (data && data?.source) return data.source;
    } else if (file) {
      let extension = file.substring(file.lastIndexOf('.')).toLowerCase();
      let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
      if (data && data?.source) return data.source;
    }
    return '';
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
      .get(`user/download?fileName=${file}`, {
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
    if (event) {
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
    } else if (file.url) {
      axiosInstance()
        .get(`user/download?fileName=${file.url}`, {
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
              return (
                <>
                  <div className="max-w-[138px] flex-grow group border border-[var(--common-border-color)] min-h-[153px] relative rounded-[4px] p-[var(--gutter)] [--gutter:18px]">
                    <div className="front  group-hover:hidden">
                      <div className="mx-auto h-[79px] mb-[11px]">
                        <img
                          src={getFileIconSrc(attachment?.contentType ? attachment?.contentType : attachment.url ? attachment.url : attachment)}
                          className={`object-contain mx-auto block h-full w-full max-w-full`}
                          alt="attchment"
                        />
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
                    <div className="back group-hover:opacity-100 opacity-0 absolute inset-0 p-[var(--gutter)] flex flex-col justify-between">
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
                        <Tooltip title="Download" placement="top">
                          <IconButton size={'small'} onClick={(event) => downloadFile(event, attachment)} style={{ paddingBottom: '1px' }}>
                            {<GetAppIcon />}
                          </IconButton>
                        </Tooltip>
                        {_.endsWith(attachment?.url, '.pdf') && (
                          <Tooltip title="Preview" placement="top">
                            <IconButton
                              size={'small'}
                              onClick={(e) => {
                                viewPdf(e, attachment.url);
                              }}
                            >
                              <PreviewIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canEdit && permissions?.attachment?.isDelete ? (
                          <Tooltip title="Delete" placement="top">
                            <IconButton
                              size={'small'}
                              onClick={() => {
                                setShowConfirmationDialog(true);
                                setAttachemnetToDelete(attachment);
                              }}
                            >
                              {<DeleteIcon color="error" />}
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip className="cursor-stop" title={"You don't have permissions to delete attachment"}>
                            <IconButton size={'small'}>
                              <DeleteIcon color="disabled" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </>
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

import { CircularProgress, Dialog, Icon, IconButton, MenuItem } from '@material-ui/core';
import { GetApp } from '@material-ui/icons';
import PreviewIcon from '@material-ui/icons/Visibility';
import { createElement, useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';

import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomDialogTransition } from 'src/constants/helpers';

const imageExtensions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
const pdfExtensions = ['pdf'];
const validExtensions = imageExtensions.concat(pdfExtensions);

export type PreviewFileProps = {
  fileName: string;
  component?: 'IconButton' | 'MenuItem' | keyof HTMLElementTagNameMap;
  showDownload?: boolean;
};

function getFileNameFromUrl(url: string) {
  const filename = decodeURIComponent(new URL(url).pathname.split('/').pop());
  if (!filename) return ''; // Provide a default filename if necessary
  return filename;
}

export const PreviewFile = ({ fileName, component = 'IconButton', showDownload = false }: PreviewFileProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [downloading, setDownloading] = useState(false);
  const [imageDialogData, setImageDialogData] = useState({ open: false, url: '', fileName });

  const downloadFile = async (fileName: string, setDialogUrl = false, showDownload = false): Promise<any> => {
    if (!fileName) return;
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Loading, Please wait...`
    });
    setDownloadProgress(0);
    setDownloading?.(true);

    try {
      if (fileName.startsWith('http')) {
        if (setDialogUrl) {
          setImageDialogData({ open: true, url: fileName, fileName: getFileNameFromUrl(fileName) });
        }
        return fileName;
      } else {
        const { data } = await axiosInstance().get(`user/download?fileName=${fileName}`, {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);
            if (percentCompleted === 100) {
              if (!setDialogUrl) {
                toastConfig.setToastConfig({
                  message: 'File Downloaded Successfully',
                  open: true,
                  type: 'success'
                });
              }
              setTimeout(() => {
                setDownloadProgress(-1);
                setDownloading?.(false);
              }, 100);
            }
          }
        });
        setDownloading(false);
        if (setDialogUrl) {
          setImageDialogData({ open: true, url: URL.createObjectURL(new Blob([data])), fileName });
        }
        if (showDownload) {
          const url = window.URL.createObjectURL(new Blob([data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
        } else {
          return data;
        }
      }
    } catch (error) {
      setDownloading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const viewPdf = async (fileName) => {
    try {
      const data = await downloadFile(fileName);
      if (!data) return;
      const file = new Blob([data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const pdfWindow = window.open();
      pdfWindow.document.title = fileName;
      pdfWindow.location.href = fileURL;
      pdfWindow.focus();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const extension = fileName?.split('.').pop();

  const handleClick = () => {
    if (pdfExtensions.includes(extension)) {
      viewPdf(fileName);
    } else {
      downloadFile(fileName, true);
    }
  };

  const RenderButton = ({ children, ...props }) => {
    if (component === 'IconButton') {
      return createElement(IconButton, { ...props, size: 'small', style: { width: 30, height: 30, padding: 3 } }, children);
    }
    if (component === 'MenuItem') {
      return createElement(MenuItem, props, children);
    }
    return createElement(component, props, children);
  };

  if (!fileName) return null;

  return (
    <div>
      {showDownload && (
        <HtmlTooltip title={component === 'IconButton' ? 'Download' : ''} leaveTouchDelay={0} leaveDelay={0}>
          <RenderButton disabled={downloading} onClick={() => downloadFile(fileName, false, showDownload)}>
            {component === 'IconButton' ? (
              downloading ? (
                `${downloadProgress}%`
              ) : (
                <GetApp fontSize="small" />
              )
            ) : downloading ? (
              `Downloading - ${downloadProgress}%`
            ) : (
              'Download'
            )}
          </RenderButton>
        </HtmlTooltip>
      )}
      {validExtensions.includes(extension) && (
        <HtmlTooltip title={component === 'IconButton' ? `Preview` : ''} leaveTouchDelay={0} leaveDelay={0}>
          <RenderButton disabled={downloading} onClick={handleClick}>
            {component === 'IconButton' ? <PreviewIcon fontSize="small" color="primary" /> : `Preview `}
          </RenderButton>
        </HtmlTooltip>
      )}
      {imageDialogData.open && (
        <ViewImage
          downloadProgress={downloadProgress}
          imageDialogData={imageDialogData}
          close={() => setImageDialogData({ open: false, url: '', fileName })}
        />
      )}
      {/* {showDownload && downloading && (
        <div className="flex items-center">
          {downloadProgress === 100 ? 'Downloaded' : 'Downloading'}

          <div className="relative ml-1 inline-flex">
            <CircularProgress size={30} variant="determinate" value={downloadProgress} />
            <div className="absolute inset-0 bottom-0 left-0 right-0 top-0 flex items-center justify-center">
              <p>{downloadProgress}%</p>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

const ViewImage = ({ imageDialogData, close, downloadProgress }) => {
  return (
    <Dialog TransitionComponent={CustomDialogTransition} maxWidth="md" fullWidth fullScreen open={true} onClose={close}>
      <CustomDialogHeader title={imageDialogData.fileName} onClose={close} showRequiredLabel={false} />
      <CustomDialogContent>
        <div className="flex min-h-[calc(100vh-128px)] items-center justify-center">
          {downloadProgress === -1 ? (
            <img src={imageDialogData.url} loading="lazy" alt={imageDialogData.fileName} />
          ) : (
            <p>Downloading {downloadProgress}%</p>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

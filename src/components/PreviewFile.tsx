import { Dialog, IconButton } from '@material-ui/core';
import PreviewIcon from '@material-ui/icons/Visibility';
import { useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';

import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';

const imageExtensions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
const pdfExtensions = ['pdf'];
const validExtensions = imageExtensions.concat(pdfExtensions);

export const PreviewFile = ({ fileName }) => {
  const toastConfig = useContext(CustomToastContext);
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [downloading, setDownloading] = useState(false);
  const [imageDialogData, setImageDialogData] = useState({ open: false, url: '', fileName });

  const downloadFile = async (fileName, setDialogUrl = false): Promise<any> => {
    if (!fileName) return;
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Loading, Please wait...`
    });
    setDownloadProgress(0);
    setDownloading?.(true);

    try {
      const { data } = await axiosInstance().get(`user/download?fileName=${fileName}`, {
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
              setDownloadProgress(-1);
              setDownloading?.(false);
            }, 100);
          }
        }
      });
      setDownloading(false);
      if (setDialogUrl) {
        setImageDialogData({ open: true, url: URL.createObjectURL(new Blob([data])), fileName });
      } else {
        return data;
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
      setImageDialogData({ open: true, url: '', fileName });
    }
  };

  if (!validExtensions.includes(extension)) return null;

  return (
    <div>
      <IconButton disabled={downloading} size="small" style={{ width: 30, height: 30, padding: 3 }} onClick={handleClick}>
        <PreviewIcon fontSize="small" color="primary" />
      </IconButton>
      {imageDialogData.open && (
        <ViewImage
          downloadProgress={downloadProgress}
          imageDialogData={imageDialogData}
          close={() => setImageDialogData({ open: false, image: '', fileName })}
        />
      )}
    </div>
  );
};

const ViewImage = ({ imageDialogData, close, downloadProgress }) => {
  return (
    <Dialog maxWidth="md" fullWidth fullScreen open={true} onClose={close}>
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

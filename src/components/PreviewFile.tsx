import { CircularProgress, CircularProgressProps, Dialog, IconButton, MenuItem, Box, Typography } from '@mui/material';
import { GetApp } from '@mui/icons-material';
import PreviewIcon from '@mui/icons-material/Visibility';
import { useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomDialogTransition } from 'src/constants/helpers';


function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ color: 'text.secondary' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

const imageExtensions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
const pdfExtensions = ['pdf'];

export type PreviewFileProps = {
  fileName: string;
  component?: 'IconButton' | 'MenuItem' | keyof HTMLElementTagNameMap;
};

function getFileNameFromUrl(url: string) {
  const filename = decodeURIComponent(new URL(url).pathname.split('/').pop());
  if (!filename) return ''; // Provide a default filename if necessary
  return filename;
}

export const PreviewFile = ({ fileName, component = 'IconButton' }: PreviewFileProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(-1);

  const [isViewing, setIsViewing] = useState(false);
  const [viewProgress, setViewProgress] = useState(-1);

  const [imageDialogData, setImageDialogData] = useState({ open: false, url: '', fileName });

  const validExtensions = [...pdfExtensions, ...imageExtensions];
  const extension = fileName?.split('.').pop();

  const downloadFile = async (): Promise<any> => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Downloading, Please wait...`
    });
    setDownloadProgress(0);
    setDownloading(true);
    try {
      const { data } = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(fileName)}`, {
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
              setDownloading(false);
            }, 100);
          }
        }
      });
      setDownloading(false);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      setDownloading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const viewFile = async (): Promise<any> => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File Preview is in-progress, Please wait...`
    });
    setViewProgress(0);
    setIsViewing(true);
    try {
      const { data } = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(fileName)}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          setViewProgress(percentCompleted);
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Previewed Successfully',
              open: true,
              type: 'success'
            });
            setTimeout(() => {
              setViewProgress(-1);
              setIsViewing(false);
            }, 100);
          }
        }
      });
      setIsViewing(false);
      if (pdfExtensions.includes(extension)) {
        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.document.title = fileName;
        pdfWindow.location.href = fileURL;
        pdfWindow.focus();
      } else {
        setImageDialogData({ open: true, url: URL.createObjectURL(new Blob([data])), fileName });
      }
    } catch (error) {
      setIsViewing(false);
      toastConfig.setToastConfig(error);
    }
  };

  if (!fileName) return null;

  return (
    <div>
      {component === 'IconButton' ?
        <>
          {validExtensions.includes(extension) &&
            <HtmlTooltip title={'Preview'} >
              <IconButton
                onClick={viewFile}
                size="small"
                disabled={isViewing}
              >
                {isViewing ?
                  <CircularProgressWithLabel size={'small'} value={viewProgress} />
                  : <PreviewIcon fontSize="small" color="primary" />}
              </IconButton>
            </HtmlTooltip>
          }
          <HtmlTooltip title={'Download'} >
            <IconButton
              onClick={downloadFile}
              size="small"
              disabled={downloading}
            >
              {downloading ?
                <CircularProgressWithLabel size={'small'} value={downloadProgress} />
                : <GetApp fontSize="small" color='primary' />}
            </IconButton>
          </HtmlTooltip>
        </>
        : <>
          {validExtensions.includes(extension) &&
            <MenuItem
              onClick={viewFile}
              disabled={isViewing}
            >
              Preview
            </MenuItem>
          }
        </>}
      {imageDialogData.open && (
        <ViewImage
          downloadProgress={downloadProgress}
          imageDialogData={imageDialogData}
          close={() => setImageDialogData({ open: false, url: '', fileName })}
        />
      )}
    </div >
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

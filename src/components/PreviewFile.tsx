import { CircularProgress, CircularProgressProps, Dialog, IconButton, MenuItem, Box, Typography } from '@mui/material';
import { GetApp } from '@mui/icons-material';
import PreviewIcon from '@mui/icons-material/Visibility';
import { useCallback, useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomDialogTransition } from 'src/constants/helpers';
import ImageZoomPan from 'src/components/ImageZoomPan';

function CircularProgressWithLabel(props: CircularProgressProps & { value: number }) {
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
          justifyContent: 'center'
        }}
      >
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

const imageExtensions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
const pdfExtensions = ['pdf'];

export type PreviewFileProps = PreviewFileInternal | PreviewFileEnternal;

type PreviewFileInternalCommon = {
  fileName: string;
  component?: 'IconButton' | 'MenuItem' | keyof HTMLElementTagNameMap;
  showDownload?: boolean;
};
type PreviewFileInternal = {
  externalImageViewer?: false;
} & PreviewFileInternalCommon;
type PreviewFileEnternal = {
  externalImageViewer?: true;
  setImageDialogData: React.Dispatch<React.SetStateAction<ImageDialogData>>;
  imageDialogData: ImageDialogData;
} & PreviewFileInternalCommon;
export type ImageDialogData = {
  open: boolean;
  url: string;
  fileName: string;
  viewProgress: number;
};

export const defaultImageDialogData = { fileName: '', open: false, url: '', viewProgress: -1 };

const useGetter = (props: PreviewFileProps): [ImageDialogData, React.Dispatch<React.SetStateAction<ImageDialogData>>] => {
  const [imageDialogData, setImageDialogData] = useState<ImageDialogData>({ open: false, url: '', fileName: props.fileName, viewProgress: -1 });
  if (props.externalImageViewer) {
    const setImageDialogData = props.setImageDialogData;
    const imageDialogData = props.imageDialogData;
    return [imageDialogData, setImageDialogData];
  } else {
    return [imageDialogData, setImageDialogData];
  }
};

export const PreviewFile: React.FC<PreviewFileProps> = (props) => {
  const { fileName, component = 'IconButton', externalImageViewer = false } = props;
  const toastConfig = useContext(CustomToastContext);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [isViewing, setIsViewing] = useState(false);
  const [imageDialogData, setImageDialogData] = useGetter({ ...props });

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
    setImageDialogData((prev) => ({ ...prev, viewProgress: 0 }));
    setIsViewing(true);
    try {
      if (!pdfExtensions.includes(extension)) {
        setImageDialogData((prev) => ({ ...prev, fileName, open: true }));
      }
      const { data } = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(fileName)}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          setImageDialogData((prev) => ({ ...prev, viewProgress: percentCompleted }));
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Loaded Successfully',
              open: true,
              type: 'success'
            });
            setTimeout(() => {
              setImageDialogData((prev) => ({ ...prev, viewProgress: -1 }));
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
        setImageDialogData((prev) => ({ ...prev, open: true, url: URL.createObjectURL(new Blob([data])), fileName }));
      }
    } catch (error) {
      setIsViewing(false);
      toastConfig.setToastConfig(error);
    }
  };

  if (!fileName) return null;

  return (
    <>
      {component === 'IconButton' ? (
        <>
          {validExtensions.includes(extension) && (
            <HtmlTooltip title={'Preview'}>
              <IconButton onClick={viewFile} size="small" disabled={isViewing}>
                {isViewing ? (
                  <CircularProgressWithLabel size={'small'} value={imageDialogData.viewProgress} />
                ) : (
                  <PreviewIcon fontSize="small" color="primary" />
                )}
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={'Download'}>
            <IconButton onClick={downloadFile} size="small" disabled={downloading}>
              {downloading ? <CircularProgressWithLabel size={'small'} value={downloadProgress} /> : <GetApp fontSize="small" color="primary" />}
            </IconButton>
          </HtmlTooltip>
        </>
      ) : (
        <>
          {validExtensions.includes(extension) && (
            <MenuItem onClick={viewFile} disabled={isViewing}>
              Preview
            </MenuItem>
          )}
        </>
      )}
      {!externalImageViewer && <ViewImage imageDialogData={imageDialogData} setImageDialogData={setImageDialogData} />}
    </>
  );
};

type ViewImageProps = {
  imageDialogData: ImageDialogData;
  setImageDialogData: React.Dispatch<React.SetStateAction<ImageDialogData>>;
};

export const ViewImage = ({ imageDialogData, setImageDialogData }: ViewImageProps) => {
  const handleClose = useCallback(() => {
    setImageDialogData({ open: false, url: '', fileName: '', viewProgress: -1 });
  }, [setImageDialogData]);
  return (
    <Dialog slots={{ transition: CustomDialogTransition }} maxWidth="md" fullWidth fullScreen open={imageDialogData.open} onClose={handleClose}>
      <CustomDialogHeader title={imageDialogData.fileName} onClose={handleClose} showRequiredLabel={false} />
      <CustomDialogContent className="flex p-3">
        <div className="flex flex-grow items-center justify-center overflow-hidden">
          {imageDialogData.viewProgress === -1 ? (
            <ImageZoomPan src={imageDialogData.url} alt={imageDialogData.fileName} />
          ) : (
            <p>Downloading {imageDialogData.viewProgress}%</p>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

import GetAppIcon from '@mui/icons-material/GetApp';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Collapse, IconButton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { getFileIcon, getFileNameWithExtension } from './utils';
import { KeyboardArrowDown } from '@mui/icons-material';
import { cn } from 'src/constants/helpers';

const imageExtensions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
const pdfExtensions = ['pdf'];

const RenderSingleFile = ({ f, setSelectedAttachment, file, selectedAttachment, setSendMail, handleMail }) => {
  const toastConfig = useContext(CustomToastContext);
  const [open, setOpen] = useState(false);

  const downloadFile = (file) => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Downloading, Please wait...`
    });
    axiosInstance()
      .get(`user/download`, {
        params: {
          fileName: file?.url
        },
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({ open: true, type: 'success', message: 'File downloaded successfully.' });
          }
        }
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const viewAttachment = (file) => {
    toastConfig.setToastConfig({
      open: true,
      type: 'info',
      message: `File is Loading, Please wait...`
    });
    axiosInstance()
      .get(`user/download`, {
        params: {
          fileName: file
        },
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Viewed Successfully',
              open: true,
              type: 'success'
            });
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
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const Icon = getFileIcon(f.url);
  const extension = f.url?.split('.').pop();

  return (
    <Box
      key={f.url}
      className={'cursor-pointer [--px:18px] [--py:8px]'}
      onClick={() => {
        if (imageExtensions.includes(extension)) {
          setOpen((prev) => !prev);
        } else {
          setSelectedAttachment({ ...f, attachmentId: file?._id });
        }
      }}
      style={{
        border: selectedAttachment?.url === f?.url ? '1px solid var(--dark-active-border-color,#0F9FA9 )' : '1px solid transparent',
        borderBottomColor: selectedAttachment?.url === f?.url ? 'var(--dark-active-border-color,#0F9FA9 )' : 'var(--common-border-color)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex max-w-fit cursor-pointer items-center gap-2 px-[--px] py-[--py]">
          <div className="w-[20px]">
            <Icon size={20} />
          </div>
          <HtmlTooltip title={f.name} className="max-w-fit">
            <p className=" line-clamp-1 text-[14px] font-normal">{getFileNameWithExtension(f)}</p>
          </HtmlTooltip>
        </div>
        <div className="flex items-center gap-1 pr-2">
          <HtmlTooltip title={'Download'}>
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(f);
              }}
            >
              <GetAppIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          {[...imageExtensions, ...pdfExtensions]?.includes(f?.url?.split('.')?.pop()?.toLowerCase()) && (
            <HtmlTooltip title={'Preview'}>
              <IconButton
                size="small"
                color="inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  viewAttachment(f?.url);
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={'Send Email'}>
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                setSendMail(true);
                handleMail({ file: [f] });
              }}
            >
              <SendIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          {imageExtensions.includes(extension) ? (
            <IconButton
              size="small"
              color="primary"
              sx={{ mr: '5px' }}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
            >
              <KeyboardArrowDown className={cn('origin-center !transition-all duration-300', open && '[transform:rotate(-180deg)]')} />
            </IconButton>
          ) : (
            <div className="w-[39px]" />
          )}
        </div>
      </div>
      <Collapse in={open} unmountOnExit>
        {imageExtensions.includes(extension) && (
          <ImagePreview name={f.name} url={f.url} onFileClick={() => setSelectedAttachment({ ...f, attachmentId: file?._id })} />
        )}
      </Collapse>
    </Box>
  );
};

export default RenderSingleFile;

type ImagePreviewProps = {
  name: string;
  url: string;
  onFileClick: () => void;
};

const ImagePreview = ({ name, url, onFileClick }: ImagePreviewProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [src, setSrc] = useState(null);
  const [progress, setProgress] = useState(-1);

  useEffect(() => {
    const viewFile = async () => {
      try {
        const { data } = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(url)}`, {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
            if (percentCompleted === 100) {
              setTimeout(() => {
                setProgress(-1);
              }, 100);
            }
          }
        });
        setSrc(URL.createObjectURL(new Blob([data])));
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    };

    viewFile();
  }, [url, toastConfig]);

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFileClick();
      }}
      className="mb-[--py] flex h-[500px]  max-w-fit items-center justify-center overflow-hidden px-[--px]"
    >
      {src ? <img src={src} alt={name} className="mr-auto max-h-full max-w-full" /> : <p>Loading...{progress >= 0 ? progress : 0}%</p>}
    </div>
  );
};

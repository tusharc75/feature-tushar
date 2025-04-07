import React from 'react';
import { RenderFileProps, RenderSingleFileProps } from 'src/components/DesktopDM/File/FilePreview';
import Carousel from 'react-material-ui-carousel';
import { handleDownload, useResolveFileUrl } from 'src/components/DesktopDM/utils';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close, Delete, Download } from '@mui/icons-material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const ImageSlider = ({
  files,
  hasToDownload,
  onDelete,
  showDownloadButton,
  onCLose,
  index
}: { onCLose: () => void; index: number } & RenderFileProps) => {
  const [activeIndex, setActiveIndex] = React.useState(index);

  const handleDelete = () => {
    if (typeof onDelete === 'function') {
      onDelete(files[activeIndex]);
      setActiveIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onCLose}
      fullWidth
      fullScreen
      slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none', padding: 0 } } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
        {typeof onDelete === 'function' && (
          <HtmlTooltip title="Delete">
            <IconButton
              color="error"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
              }}
              size="small"
              onClick={() => handleDelete()}
            >
              <Delete />
            </IconButton>
          </HtmlTooltip>
        )}

        {showDownloadButton && (
          <HtmlTooltip title="Download">
            <IconButton
              size="small"
              sx={{
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
              }}
              onClick={() => handleDownload(files[activeIndex], hasToDownload)}
            >
              <Download />
            </IconButton>
          </HtmlTooltip>
        )}
        <HtmlTooltip title="Close">
          <IconButton
            onClick={onCLose}
            size="small"
            sx={{
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <Close />
          </IconButton>
        </HtmlTooltip>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: 'transparent',
          padding: 0,
          boxShadow: 'none',
          position: 'relative'
        }}
      >
        <Carousel
          onChange={(i) => setActiveIndex(i)}
          index={activeIndex}
          autoPlay={false}
          swipe={true}
          animation="fade"
          duration={300}
          indicators={false}
          navButtonsAlwaysVisible={true}
          navButtonsProps={{ style: { backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' } }}
        >
          {files.map((image, index) => (
            <SingleImage file={image} hasToDownload={hasToDownload} key={image._id} onDelete={onDelete} showDownloadButton={showDownloadButton} />
          ))}
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};

export default ImageSlider;

const SingleImage = ({ file, hasToDownload, onDelete, showDownloadButton }: RenderSingleFileProps) => {
  const src = useResolveFileUrl({ url: file.url, hasToDownload, shouldDownload: true });
  return (
    <div className="relative mx-auto flex h-[calc(100vh-80px)] max-h-fit w-[calc(100vw-60px)] max-w-fit items-center justify-center">
      {src && <img draggable={false} src={src} alt={file.fileName} className="h-full w-full object-contain" />}
    </div>
  );
};

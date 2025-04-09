import { Delete, Download } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useCallback, useMemo } from 'react';
import CarouselDialog from 'src/components/CarouselDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { RenderFileProps } from 'src/components/DesktopDM/File/FilePreview';
import { handleDownload, resolveFileUrl } from 'src/components/DesktopDM/utils';

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
  const images = useMemo(() => files.map((f) => f.url), [files]);

  const resolveUrl = useCallback(
    async (src) => {
      try {
        return await resolveFileUrl({ hasToDownload, shouldDownload: true, url: src });
      } catch (error) {
        console.error(error);
      }
    },
    [hasToDownload]
  );

  return (
    <>
      <CarouselDialog
        images={images}
        close={onCLose}
        resolveUrl={resolveUrl}
        carouselProps={{
          onChange: (i) => setActiveIndex(i),
          index: activeIndex,
          animation: 'fade'
        }}
        headerComponent={
          <div className="flex items-center justify-end gap-1">
            {typeof onDelete === 'function' && (
              <HtmlTooltip title="Delete">
                <IconButton color="error" size="small" onClick={() => handleDelete()}>
                  <Delete />
                </IconButton>
              </HtmlTooltip>
            )}
            {showDownloadButton && (
              <HtmlTooltip title="Download">
                <IconButton size="small" color="primary" onClick={() => handleDownload(files[activeIndex], hasToDownload)}>
                  <Download />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        }
      />
    </>
  );
};

export default ImageSlider;

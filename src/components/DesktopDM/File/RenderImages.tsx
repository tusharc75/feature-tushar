import { Close } from '@mui/icons-material';
import { IconButton, Skeleton } from '@mui/material';
import { useMemo, useState } from 'react';
import { DEFAULT_IMAGE_VISIBLE_COUNT } from 'src/components/DesktopDM/constants';
import { RenderFileProps, RenderSingleFileProps } from 'src/components/DesktopDM/File/FilePreview';
import ImageSlider from 'src/components/DesktopDM/File/ImageSlider';
import { useResolveFileUrl } from 'src/components/DesktopDM/utils';
import { cn } from 'src/constants/helpers';

const RenderImages = ({ hasToDownload, files, ...rest }: RenderFileProps) => {
  const [imageSliderData, setImageSliderData] = useState({ open: false, index: 0 });
  const moreImageCount = useMemo(() => {
    if (files.length > DEFAULT_IMAGE_VISIBLE_COUNT) {
      return files.length - DEFAULT_IMAGE_VISIBLE_COUNT;
    }
    return 0;
  }, [files.length]);

  const opneImageSlider = (index: number) => {
    setImageSliderData({ open: true, index });
  };
  const closeImageSlider = () => {
    setImageSliderData({ open: false, index: 0 });
  };

  return (
    <div className={cn('grid ', hasToDownload ? 'grid-cols-2 gap-2 [--image-h:80px]' : 'grid-cols-4 gap-1 [--image-h:50px]')}>
      {files.map((file, index) => {
        if (index < DEFAULT_IMAGE_VISIBLE_COUNT) {
          return (
            <RenderSingleImage
              opneImageSlider={opneImageSlider}
              file={file}
              key={file._id}
              index={index}
              {...rest}
              hasToDownload={hasToDownload}
              moreImageCount={moreImageCount}
            />
          );
        }
        return null;
      })}
      {imageSliderData.open && (
        <ImageSlider files={files} index={imageSliderData.index} hasToDownload={hasToDownload} onCLose={closeImageSlider} {...rest} />
      )}
    </div>
  );
};

export default RenderImages;

const RenderSingleImage = ({
  file,
  hasToDownload,
  onDelete,
  index,
  moreImageCount,
  opneImageSlider
}: RenderSingleFileProps & { index: number; moreImageCount: number; opneImageSlider: (index: number) => void }) => {
  const overlayVisible = index === DEFAULT_IMAGE_VISIBLE_COUNT - 1 && moreImageCount > 0;
  const src = useResolveFileUrl({ url: file.url, hasToDownload, shouldDownload: index < DEFAULT_IMAGE_VISIBLE_COUNT });
  return (
    <div
      className={cn('group relative min-h-[--image-h] overflow-hidden ', hasToDownload ? 'rounded-lg' : ' rounded-md')}
      onClick={() => opneImageSlider(index)}
    >
      <div className="h-[--image-h]">
        {!src && hasToDownload && <Skeleton variant="rectangular" width={127} height={'var(--image-h)'} />}
        {src && <img src={src} className={cn('h-full w-full max-w-full object-cover')} alt={file.fileName} />}
      </div>
      {overlayVisible ? (
        <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50">
          <span className="text-white">+ {moreImageCount}</span>
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {typeof onDelete === 'function' && (
            <span className="absolute right-[2px] top-[2px] rounded-full bg-white opacity-0 group-hover:opacity-100">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(file);
                }}
                color={'error'}
              >
                <Close fontSize="small" />
              </IconButton>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

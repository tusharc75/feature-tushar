import { Close, Download } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_IMAGE_VISIBLE_COUNT } from 'src/components/DesktopDM/constants';
import { RenderFileProps, RenderSingleFileProps } from 'src/components/DesktopDM/File/FilePreview';
import { cn } from 'src/constants/helpers';

const RenderImages = ({ hasToDownload, files, ...rest }: RenderFileProps) => {
  const moreImageCount = useMemo(() => {
    if (files.length > DEFAULT_IMAGE_VISIBLE_COUNT) {
      return files.length - DEFAULT_IMAGE_VISIBLE_COUNT;
    }
    return 0;
  }, [files.length]);

  return (
    <div className={cn('grid ', hasToDownload ? 'grid-cols-2 gap-2 [--image-h:100px]' : 'grid-cols-4 gap-1 [--image-h:50px]')}>
      {files.map((file, index) => {
        if (index < DEFAULT_IMAGE_VISIBLE_COUNT) {
          return <RenderSingleImage file={file} key={file._id} index={index} {...rest} moreImageCount={moreImageCount} />;
        }
        return null;
      })}
    </div>
  );
};

export default RenderImages;

const RenderSingleImage = ({
  file,
  getFileUrl,
  handleDownload,
  hasToDownload,
  onDelete,
  index,
  showDownloadButton,
  moreImageCount
}: RenderSingleFileProps & { index: number; moreImageCount: number }) => {
  const [src, setSrc] = useState(file.url);

  const overlayVisible = index === DEFAULT_IMAGE_VISIBLE_COUNT - 1 && moreImageCount > 0;

  useEffect(() => {
    if (hasToDownload && index < 4) {
      getFileUrl(file.url, (url) => setSrc(url));
    } else {
      setSrc(file.url);
    }
  }, [file.url, hasToDownload, index]);

  return (
    <div className={cn('group relative min-h-[--image-h] overflow-hidden ', hasToDownload ? 'rounded-lg' : ' rounded-md')}>
      <img src={src} alt={file.fileName} className="block h-[--image-h] w-full max-w-full object-cover" />
      {overlayVisible ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="text-white">+ {moreImageCount}</span>
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {showDownloadButton && (
            <span className="absolute left-1/2 top-1/2 opacity-0 [transform:translate(-50%,-50%)] group-hover:opacity-100">
              <IconButton size="small" onClick={() => handleDownload(file)}>
                <Download fontSize="small" />
              </IconButton>
            </span>
          )}
          {typeof onDelete === 'function' && (
            <span className="absolute right-[2px] top-[2px] rounded-full bg-white opacity-0 group-hover:opacity-100">
              <IconButton size="small" onClick={() => onDelete(file)} color={'error'}>
                <Close fontSize="small" />
              </IconButton>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

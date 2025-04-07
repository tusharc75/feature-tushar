import { Close, Download } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React from 'react';
import { RenderFileProps } from 'src/components/DesktopDM/File/FilePreview';
import { cn } from 'src/constants/helpers';

const RenderFiles = ({ files, getFileUrl, handleDownload, hasToDownload, onDelete, showDownloadButton }: RenderFileProps) => {
  return (
    <div className="grid gap-1">
      {files.map((file) => (
        <div className={cn('flex items-center justify-between gap-2 rounded-md border p-2', hasToDownload ? 'bg-white' : '')}>
          <div className="flex items-center gap-2">
            <file.icon size={30} className="flex-shrink-0" />
            <p className="line-clamp-1 text-sm">{file.fileName}</p>
          </div>
          <div className="flex items-center">
            {showDownloadButton && (
              <IconButton size="small" onClick={() => handleDownload(file)}>
                <Download fontSize="small" />
              </IconButton>
            )}
            {typeof onDelete === 'function' && (
              <IconButton size="small" onClick={() => onDelete(file)} color={'error'}>
                <Close fontSize="small" />
              </IconButton>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RenderFiles;

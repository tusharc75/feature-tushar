import { Delete, Download, MoreVert } from '@mui/icons-material';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { memo, useMemo, useState } from 'react';
import { RenderFileProps } from 'src/components/DesktopDM/File/FilePreview';
import { handleDownload } from 'src/components/DesktopDM/utils';
import { cn } from 'src/constants/helpers';

const RenderFiles = memo(({ files, hasToDownload, onDelete, showDownloadButton }: RenderFileProps) => {
  const [optionMenuAnchor, setOptionMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const isBothButtonVisible = useMemo(() => showDownloadButton && typeof onDelete === 'function', [showDownloadButton, onDelete]);
  return (
    <div className="grid gap-1">
      {files.map((file) => (
        <div className={cn('flex items-center justify-between gap-2 rounded-md border p-2', hasToDownload ? 'bg-[--dark-primary,white]' : '')}>
          <div className="flex items-center gap-2">
            <file.icon size={30} className="flex-shrink-0" />
            <p className="line-clamp-1 text-sm">{file.fileName}</p>
          </div>
          {isBothButtonVisible ? (
            <>
              <IconButton size="small" color={'primary'} onClick={(e) => setOptionMenuAnchor(e.currentTarget)}>
                <MoreVert fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={optionMenuAnchor}
                disableScrollLock
                open={Boolean(optionMenuAnchor)}
                onClose={() => setOptionMenuAnchor(null)}
                slotProps={{ paper: { onClick: () => setOptionMenuAnchor(null), sx: { minWidth: '150px' } } }}
              >
                <MenuItem onClick={() => handleDownload(file, hasToDownload)}>
                  <ListItemIcon>
                    <Download color="primary" />
                  </ListItemIcon>
                  <ListItemText>Download</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => onDelete(file)}>
                  <ListItemIcon>
                    <Delete color="error" />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <div className="flex items-center">
                {showDownloadButton && (
                  <IconButton size="small" onClick={() => handleDownload(file, hasToDownload)}>
                    <Download fontSize="small" />
                  </IconButton>
                )}
                {typeof onDelete === 'function' && (
                  <IconButton size="small" onClick={() => onDelete(file)} color={'error'}>
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
});

export default RenderFiles;

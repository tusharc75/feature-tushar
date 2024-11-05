import { Popover } from '@material-ui/core';
import { useState } from 'react';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { PreviewFile } from 'src/components/PreviewFile';
import { getFileIconSrc } from 'src/constants/helpers';
import { IoCaretDown } from 'react-icons/io5';

export const MultiFileCell = ({ data }: { data: { fileName: string; size: string }[] | string }) => {
  let fileIcons = [];

  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | HTMLDivElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  if (Array.isArray(data)) {
    fileIcons = data.map((d, i) => {
      const Icon = getFileIconSrc(d.fileName || '');
      return (
        <span key={i} title={d.fileName} className=" single-row flex items-center gap-2">
          <span className="flex-shrink-0">
            <Icon />
          </span>
          <span className=" truncate">{d.fileName}</span>
          <span className="button-span flex-shrink-0">
            <PreviewFile fileName={d.fileName} imagePreview={false} />
          </span>
        </span>
      );
    });
  }

  if (fileIcons.length > 0)
    return (
      <div className="flex max-w-full overflow-hidden">
        <span
          className="[&_.button-span]:hidden"
          onMouseOver={(e) => {
            if (fileIcons.length === 1) {
              handleClick(e);
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            if (fileIcons.length === 1) {
              handleClick(e);
            }
          }}
        >
          {fileIcons[0]}
        </span>
        {fileIcons.length > 1 && (
          <span
            className=" createdAtTime badge-date flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              handleClick(e);
            }}
            onMouseOver={handleClick}
          >
            {' '}
            +{fileIcons.length - 1} more
          </span>
        )}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
          PaperProps={{
            style: {
              overflow: 'initial',
              padding: '10px 10px',
              transform: 'translateY(-11px)',
              minWidth: 100
            },
            onMouseLeave: handleClose
          }}
        >
          <div className="relative translate-y-2 items-center text-center">
            <div className=" max-h-[200px] min-w-[100px] space-y-1 overflow-y-auto overflow-x-hidden [&>span.single-row]:min-h-[30px]">
              {fileIcons}
            </div>
            <div className="filler absolute -bottom-[42px] -left-[10px] -right-[10px] h-[34px] "></div>
            <IoCaretDown size={24} className="absolute -bottom-[26px] left-0 right-0 z-10 mx-auto text-[var(--dark-primary,white)]" />
          </div>
        </Popover>
      </div>
    );
  return <NoDataCell />;
};

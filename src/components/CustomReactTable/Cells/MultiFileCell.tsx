import { Popover } from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ImageDialogData, PreviewFile, ViewImage, defaultImageDialogData } from 'src/components/PreviewFile';
import { getFileIconSrc } from 'src/constants/helpers';
import { IoCaretDown } from 'react-icons/io5';

const MultiFileCellImpl = ({ data }: { data: { fileName: string; size: string }[] | string }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | HTMLDivElement | null>(null);
  const [imageDialogData, setImageDialogData] = useState<ImageDialogData>(defaultImageDialogData);
  const handleClick = (event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const open = Boolean(anchorEl);

  const fileLength = useMemo(() => (Array.isArray(data) ? data.length : 0), [data]);

  return (
    <>
      {fileLength > 0 ? (
        <div className="flex max-w-full overflow-hidden">
          <span
            className="[&_.button-span]:hidden"
            onMouseOver={(e) => {
              if (fileLength === 1) {
                handleClick(e);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              if (fileLength === 1) {
                handleClick(e);
              }
            }}
          >
            {data[0] && <RenderFile data={data[0]} imageDialogData={imageDialogData} setImageDialogData={setImageDialogData} />}
          </span>
          {fileLength > 1 && (
            <span
              className=" createdAtTime badge-date flex-shrink-0 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleClick(e);
              }}
              onMouseOver={handleClick}
            >
              {' '}
              +{fileLength - 1} more
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
                {Array.isArray(data) &&
                  data.map((d) => <RenderFile data={d} key={d.fileName} imageDialogData={imageDialogData} setImageDialogData={setImageDialogData} />)}
              </div>
              <div className="filler absolute -bottom-[42px] -left-[10px] -right-[10px] h-[34px] "></div>
              <IoCaretDown size={24} className="absolute -bottom-[26px] left-0 right-0 z-10 mx-auto text-[var(--dark-primary,white)]" />
            </div>
          </Popover>
        </div>
      ) : (
        <NoDataCell />
      )}
      <ViewImage imageDialogData={imageDialogData} setImageDialogData={setImageDialogData} />
    </>
  );
};

export const MultiFileCell = memo(MultiFileCellImpl);

const RenderFile = ({ data, imageDialogData, setImageDialogData }) => {
  const Icon = useMemo(() => getFileIconSrc(data.fileName || ''), [data]);
  return (
    <span title={data.fileName} className="single-row flex items-center gap-2">
      <span className="flex-shrink-0">
        <Icon />
      </span>
      <span className=" truncate">{data.fileName}</span>
      <span className="button-span flex-shrink-0">
        <PreviewFile fileName={data.fileName} externalImageViewer={true} setImageDialogData={setImageDialogData} imageDialogData={imageDialogData} />
      </span>
    </span>
  );
};

// const getFileIcons = ({ data }) => {
//   let fileIcons: React.ReactNode[] = [];
//   if (Array.isArray(data)) {
//     fileIcons = data.map((d, i) => {
//       const Icon = getFileIconSrc(d.fileName || '');
//       return (
//         <span key={i} title={d.fileName} className=" single-row flex items-center gap-2">
//           <span className="flex-shrink-0">
//             <Icon />
//           </span>
//           <span className=" truncate">{d.fileName}</span>
//           <span className="button-span flex-shrink-0">
//             {/* <PreviewFile fileName={d.fileName} externalImageViewer={true} setImageDialogData={} imageDialogData={} /> */}
//           </span>
//         </span>
//       );
//     });
//   }

//   return fileIcons;
// };

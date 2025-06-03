import React, { useEffect, useState } from 'react';
import { Close, ControlCamera } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { PiMouseLeftClickFill, PiMouseMiddleClickFill } from 'react-icons/pi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CgMouse, CgScrollV } from 'react-icons/cg';

const ShowDragMessage = ({ containerRef }: { containerRef: React.MutableRefObject<HTMLDivElement> }) => {
  // const [showMessage, setShowMessage] = useLocalStorage(SHOW_MESSAGE_KEY, true);
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    const container = containerRef?.current;
    const handleClick = (e: MouseEvent) => {
      setShowMessage(false);
    };
    if (container) {
      container.addEventListener('click', handleClick);
      return () => {
        container.removeEventListener('click', handleClick);
      };
    }
  }, [containerRef]);

  if (!showMessage) return null;
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-[300px] top-0 z-50 flex items-center justify-center">
      <div className="pointer-events-auto relative max-w-[350px] rounded-md border bg-[var(--dark-secondary,white)] shadow">
        <div className="flex items-center justify-between border-b pb-2 pl-4 pr-2 pt-2">
          <p className="-mt-1 font-semibold">Controls</p>
          <div className="pointer-events-auto ">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMessage(false);
              }}
              color="primary"
              size="small"
            >
              <Close />
            </IconButton>
          </div>
        </div>

        <ul className="!list-disc space-y-2 px-4 pb-4 pt-2">
          <li className="flex !list-disc items-start gap-2 text-gray-500">
            <div className="mt-1 flex flex-shrink-0">
              <PiMouseLeftClickFill size={20} />
              <ControlCamera className="!text-[20px]" />
            </div>
            <p className="text-[13px] font-normal ">Adjust the timeline by clicking and dragging (Up, Down, Left, Right) to view more information.</p>
          </li>
          <li className="flex !list-disc items-start gap-2 text-gray-500">
            <div className="mt-1 flex flex-shrink-0">
              <PiMouseMiddleClickFill size={20} />
              <CgScrollV size={20} />
            </div>
            <p className="text-sm font-normal ">Adjust the zoom level using the scroll wheel.</p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ShowDragMessage;

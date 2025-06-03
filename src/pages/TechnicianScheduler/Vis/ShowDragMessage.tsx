import React, { useEffect, useState } from 'react';
import { Close, ControlCamera } from '@mui/icons-material';
import { IconButton } from '@mui/material';

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
      <div className="relative flex max-w-[350px] items-center gap-2 rounded-md border bg-[var(--dark-secondary,white)] p-4 shadow-md">
        <ControlCamera className="!text-[50px] text-gray-500" />
        <p className="text-sm font-normal text-gray-500">Adjust the timeline by clicking and dragging to view all information.</p>
        <div className="pointer-events-auto absolute right-0 top-0">
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
    </div>
  );
};

export default ShowDragMessage;

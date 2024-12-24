import { IconButton, Popper } from '@mui/material';
import { Close } from '@material-ui/icons';
import { ReactNode, useRef, useState } from 'react';
import { FaCaretUp } from 'react-icons/fa';
import { cn } from 'src/constants/helpers';

import React from 'react';

type CustomIntroWrapperProps = {
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  children: ReactNode;
};

export const CustomIntroWrapper = ({ title, content, disabled, children, ...rest }: CustomIntroWrapperProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const arrowRef = useRef(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  return (
    <span className="relative">
      {children}
      {!disabled && (
        <button
          type="button"
          onClick={handlePopoverOpen}
          className={cn(
            'absolute right-0 top-0 z-[2] !-mr-[5px] flex size-3 cursor-help items-center justify-center rounded-full border-0 bg-[var(--new-theme-color)] focus-within:border-0 focus-within:outline-none',
            open && 'opacity-0'
          )}
        >
          <span className="h-3 w-3 animate-ping rounded-full bg-[var(--new-theme-color)] opacity-75"></span>
          <span className=" sr-only">more info</span>
        </button>
      )}

      <Popper
        open={open}
        anchorEl={anchorEl}
        modifiers={[
          {
            name: 'arrow',
            enabled: true,
            options: {
              element: arrowRef
            }
          }
        ]}
      >
        <div className="relative mt-3 min-w-[200px] max-w-[300px] rounded-md bg-[var(--dark-secondary,white)] p-2 shadow-md">
          <div className="mb-2 flex items-center justify-between gap-2 pb-1 [border-bottom:1px_solid_var(--common-border-color)]">
            <p className=" truncate text-[16px] font-semibold ">{title}</p>
            <IconButton size="small" onClick={handlePopoverClose}>
              <Close />
            </IconButton>
          </div>
          <div className="p-1 text-gray-600 dark:text-gray-300">{content}</div>
          <span
            ref={arrowRef}
            className="absolute left-1/2 top-[-20px] text-[var(--dark-secondary,white)]  drop-shadow-md [transform:translateX(-50%)]"
          >
            <FaCaretUp size={30} />
          </span>
        </div>
      </Popper>
    </span>
  );
};

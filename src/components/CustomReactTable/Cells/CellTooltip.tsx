import { Popper } from '@material-ui/core';
import React, { useState } from 'react';
import { IoCaretDown } from 'react-icons/io5';
import { cn } from 'src/constants/helpers';

type CellTooltipProps = {
  children: React.ReactNode;
  text?: React.ReactNode;
  onTextClick?: () => void;
  className?: string;
};

const CellTooltip = ({ children, text = 'View', onTextClick = () => {}, className = '' }: CellTooltipProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | HTMLDivElement | null>(null);
  const [arrowRef, setArrowRef] = useState<any | null>(null);

  const handleMouseOver = (event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (e: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <div>
      <>
        <span onMouseOver={handleMouseOver} onClick={onTextClick} className="link">
          {text}
        </span>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="top"
          modifiers={{
            flip: {
              enabled: true
            },
            preventOverflow: {
              enabled: true,
              boundariesElement: 'scrollParent'
            },
            arrow: {
              enabled: true,
              element: arrowRef
            }
          }}
        >
          <div onMouseLeave={handleClose}>
            <div className="filler absolute -bottom-[10px] -left-0 -right-0 z-[2] h-[48px]" onClick={onTextClick}>
              <span className="link absolute -bottom-[8px] cursor-pointer opacity-0 [left:50%] [transform:translateX(-50%)] ">{text}</span>
            </div>
            <span className="absolute bottom-0 left-0 z-[1] -mb-[9px]" ref={setArrowRef}>
              <IoCaretDown size={24} className="!stroke-[var(--common-border-color)] text-[var(--dark-primary,white)] " />
            </span>
            <div
              className={cn(
                'min-w-[200px] rounded-md bg-[var(--dark-primary,white)] p-[10px] drop-shadow-lg [border:1px_solid_var(--common-border-color)] [filter:drop-shadow(0_4px_3px_rgb(0_0_0_/_0.07))_drop-shadow(0_2px_2px_rgb(0_0_0_/_0.06))]',
                className
              )}
              style={{ transform: 'translateY(-11px)' }}
            >
              <div className="translate-y-2 items-center text-center">{children}</div>
            </div>
          </div>
        </Popper>
      </>
    </div>
  );
};

export default CellTooltip;

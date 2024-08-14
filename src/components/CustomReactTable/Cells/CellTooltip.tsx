import { Popper } from '@material-ui/core';
import React, { useState } from 'react';
import { IoCaretDown } from 'react-icons/io5';
import { cn } from 'src/constants/helpers';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

// import CustomDialogContent from '../CustomDialog/CustomDialogContent';
// import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';

type CellTooltipProps = {
  children: (view: 'tooltip' | 'expanded') => React.ReactNode;
  text?: React.ReactNode;
  onTextClick?: () => void;
  className?: string;
  enableExpandView?: boolean;
  expandViewHead?: string;
};

const CellTooltip = ({
  children,
  text = 'View',
  onTextClick = () => {},
  className = '',
  enableExpandView = true,
  expandViewHead = 'View'
}: CellTooltipProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | HTMLDivElement | null>(null);
  const [arrowRef, setArrowRef] = useState<any | null>(null);
  const [isExpandViewOpen, setIsExpandViewOpen] = useState(false);

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

  const handleCloseExpandView = () => {
    setIsExpandViewOpen(false);
  };

  const onTextClickWrapper = () => {
    onTextClick();
    if (enableExpandView) {
      setAnchorEl(null);
      setIsExpandViewOpen(true);
    }
  };

  return (
    <div>
      <>
        <span onMouseOver={handleMouseOver} onClick={onTextClickWrapper} className="link block !text-[var(--link)]">
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
              enabled: false,
              boundariesElement: 'scrollParent'
            },
            arrow: {
              enabled: true,
              element: arrowRef
            }
          }}
        >
          <div onMouseLeave={handleClose}>
            <div className="filler absolute -bottom-[10px] -left-0 -right-0 z-[2] h-[48px]" onClick={onTextClickWrapper}>
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
              <div className="translate-y-2 items-center text-center">{children('tooltip')}</div>
              {enableExpandView && (
                <span className="mt-2 block text-center text-[12px] text-gray-400 [border-top:1px_solid_var(--common-border-color)]">
                  Click "{text}" to see in a expanded modal
                </span>
              )}
            </div>
          </div>
        </Popper>
      </>
      {enableExpandView && (
        <Dialog maxWidth="md" fullWidth open={isExpandViewOpen} onClose={handleCloseExpandView}>
          <CustomDialogHeader title={expandViewHead} onClose={handleCloseExpandView} showRequiredLabel={false} />
          <CustomDialogContent>{children('expanded')}</CustomDialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CellTooltip;

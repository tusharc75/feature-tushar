import { Popper } from '@mui/material';
import { useState } from 'react';
import { IoCaretDown } from 'react-icons/io5';

type CellToltipProps = {
  children: React.ReactNode;
  more: number;
  tooltipChildren: React.ReactNode;
  title?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

function CellTooltip({ children, more, tooltipChildren, title = '', ...rest }: CellToltipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | HTMLDivElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    if (Boolean(anchorEl)) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };
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
    <span className="flex w-full items-center">
      <>
        <p title={title} {...rest}>
          {children}
        </p>
        {more > 0 && (
          <>
            <span
              className="createdAtTime badge-date hide-in-export max-w-fit flex-shrink-0 cursor-pointer select-none !p-[4px_6px] md:!p-[0_6px]"
              onClick={(e) => {
                handleClick(e);
              }}
              data-hide-in-export="true"
              onMouseOver={handleMouseOver}
            >
              {`+${more} more..`}
            </span>
            <Popper open={open} anchorEl={anchorEl} placement="top">
              <div
                className="min-w-[100px] rounded-md bg-[var(--dark-primary,white)] p-[10px] drop-shadow-lg [border:1px_solid_var(--common-border-color)] [filter:drop-shadow(0_4px_3px_rgb(0_0_0_/_0.07))_drop-shadow(0_2px_2px_rgb(0_0_0_/_0.06))]"
                style={{ transform: 'translateY(-11px)' }}
                onMouseLeave={handleClose}
              >
                <div className="relative translate-y-2 items-center">
                  <div className=" max-h-[200px] min-w-[100px] max-w-[300px] space-y-1 overflow-y-auto overflow-x-hidden">{tooltipChildren}</div>
                  <div className="filler absolute -bottom-[45px] -left-[10px] -right-[10px] h-[48px] cursor-help "></div>
                  <IoCaretDown
                    size={24}
                    className="absolute -bottom-[26px] left-0 right-0 z-10 mx-auto !stroke-[var(--common-border-color)] text-[var(--dark-primary,white)] "
                  />
                </div>
              </div>
            </Popper>
          </>
        )}
      </>
    </span>
  );
}

export default CellTooltip;

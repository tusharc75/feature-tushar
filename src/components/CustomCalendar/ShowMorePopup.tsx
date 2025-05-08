import { Popover } from '@mui/material';
import React from 'react';
import { Event, EventPropGetter } from 'react-big-calendar';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';

const ShowMorePopup = React.memo(
  ({
    count,
    events,
    remainingEvents,
    eventPropGetter,
    popupDate,
    handleEventSelect
  }: {
    count: number;
    remainingEvents: Event[];
    events: Event[];
    popupDate: React.MutableRefObject<Date>;
    eventPropGetter: EventPropGetter<any> | EventPropGetter<Event>;
    handleEventSelect: (data: Event, e: React.SyntheticEvent<HTMLElement>) => void;
  }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = (e) => {
      e?.stopPropagation();
      e?.preventDefault();
      setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
      <>
        <div
          onMouseOver={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="pointer-events-auto w-full bg-[#32324f] text-[white]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick(e);
          }}
        >
          {`+${count} more`}
        </div>
        <Popover
          open={open}
          anchorEl={anchorEl}
          // onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
          slotProps={{
            paper: {
              className: 'pointer-events-auto isolate'
            },
            backdrop: {
              className: 'pointer-events-none z-[-2]'
            }
          }}
        >
          <div className="fixed inset-0 z-[-1] cursor-pointer " onClick={handleClose} />
          <div className="pointer-events-none bg-[var(--dark-primary,white)] p-2">
            <ul className="max-h-[200px] w-[221px] space-y-1 overflow-y-auto">
              {remainingEvents.map((re, i) => {
                const { className, style } = eventPropGetter(re, re.start, re.end, false);
                return (
                  <li key={i} className="m-0 list-none p-0">
                    <RippleButton
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleEventSelect(re, e);
                      }}
                      style={style}
                      className={cn(
                        'pointer-events-auto w-full rounded-md !p-[1px_5px] text-left text-[12px] transition-colors hover:opacity-95',
                        typeof handleEventSelect === 'function' ? 'cursor-pointer' : '',
                        className
                      )}
                    >
                      {re.title}
                    </RippleButton>
                  </li>
                );
              })}
            </ul>
          </div>
        </Popover>
      </>
    );
  }
);

export default ShowMorePopup;

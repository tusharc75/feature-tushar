import { Today } from '@mui/icons-material';
import { Menu, MenuItem, Popover } from '@mui/material';
import React, { useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { BiChevronDown } from 'react-icons/bi';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn, displayDate } from 'src/constants/helpers';
import { Calendar } from './Calendar';
import dayjs from 'dayjs';

type DateRanges = DateRange | undefined;

type DateRangePicerProps = {
  date: DateRanges;
  setDate: (date: DateRanges) => void;
  horizontal?: 'right' | 'left' | 'center';
} & React.HTMLAttributes<HTMLDivElement>;

const timeframeList = [
  { label: 'Custom', value: 'custom' },
  { label: 'Last 1 Month', value: '1-month' },
  { label: 'Last 3 Months', value: '3-months' },
  { label: 'Last 6 Months', value: '6-months' },
  { label: 'Current Year', value: 'current-year' },
  { label: 'Last 1 Year', value: '1-year' }
] as const;

type TimeFrameList = (typeof timeframeList)[number];

function DateRangePicker({ className, date, setDate, horizontal = 'center' }: DateRangePicerProps) {
  const [internalDate, setInternalDate] = React.useState(date);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [timeFrame, setTimeFrame] = React.useState<TimeFrameList>({ label: 'Custom', value: 'custom' });
  const [month, setMonth] = React.useState(date?.from);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'date-range-popover' : undefined;

  const handleDateChange = useCallback(
    (date: DateRange, changeToCustom: Boolean = false) => {
      if (changeToCustom) setTimeFrame(timeframeList[0]);
      setInternalDate(date);
      setDate({ from: date.from, to: date.to });
    },
    [setDate]
  );

  const handleTimeframe = (timeFrame: TimeFrameList) => {
    setTimeFrame(timeFrame);
    switch (timeFrame.value) {
      case '1-month': {
        const data = {
          from: dayjs.tz().subtract(1, 'month').toDate(),
          to: dayjs.tz().toDate()
        };
        setMonth(data.from);
        handleDateChange(data);
        break;
      }
      case '3-months': {
        const data = {
          from: dayjs.tz().subtract(3, 'month').toDate(),
          to: dayjs.tz().toDate()
        };
        setMonth(data.from);
        handleDateChange(data);
        break;
      }
      case '6-months': {
        const data = {
          from: dayjs.tz().subtract(6, 'month').toDate(),
          to: dayjs.tz().toDate()
        };
        setMonth(data.from);
        handleDateChange(data);
        break;
      }
      case '1-year': {
        const data = {
          from: dayjs.tz().subtract(1, 'year').toDate(),
          to: dayjs.tz().toDate()
        };
        setMonth(data.from);
        handleDateChange(data);
        break;
      }
      case 'current-year': {
        const data = {
          from: dayjs.tz().startOf('year').toDate(),
          to: dayjs.tz().endOf('year').toDate()
        };
        setMonth(data.from);
        handleDateChange(data);
        break;
      }
      case 'custom':
      default:
        handleDateChange({
          from: dayjs.tz().toDate(),
          to: dayjs.tz().toDate()
        });
        setMonth(dayjs.tz().toDate());
        break;
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <ThemeButton
        onClick={handleClick}
        iconForMobile={false}
        id="date"
        startIcon={<Today />}
        className={cn('justify-start text-left font-normal', !date && 'text-muted-foreground')}
      >
        <span className="text-[14px] font-normal">
          {date?.from ? (
            date.to ? (
              <>
                {displayDate(date.from)} - {displayDate(date.to)}
              </>
            ) : (
              displayDate(date.from)
            )
          ) : (
            <span>Pick a date</span>
          )}
        </span>
        {<BiChevronDown size={18} className={cn('ml-2', open ? '[transform:rotate(180deg)]' : '')} />}
      </ThemeButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: horizontal
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: horizontal
        }}
        PaperProps={{
          className: 'rounded-md shadow-md'
        }}
      >
        <div className="flex flex-col rounded-md border sm:flex-row">
          <div className="frame p-3 max-sm:[border-bottom:1px_solid_var(--common-border-color)] sm:[border-right:1px_solid_var(--common-border-color)]">
            <ul className="p-0 max-sm:hidden">
              <RenderMenuItems handleClick={handleTimeframe} timeFrame={timeFrame} />
            </ul>
            <ThemeButton
              fullWidth
              iconForMobile={false}
              aria-controls="timeframe-menu"
              aria-haspopup="true"
              onClick={(e) => setMenuAnchorEl(e.currentTarget)}
              className="sm:!hidden"
            >
              {timeFrame.label}
            </ThemeButton>
            <Menu id="timeframe-menu" anchorEl={menuAnchorEl} keepMounted open={Boolean(menuAnchorEl)} onClose={() => setMenuAnchorEl(null)}>
              <RenderMenuItems
                handleClick={(d) => {
                  handleTimeframe(d);
                  setMenuAnchorEl(null);
                }}
                timeFrame={timeFrame}
              />
            </Menu>
          </div>
          <Calendar
            month={month}
            showBorder={false}
            onMonthChange={setMonth}
            autoFocus
            mode="range"
            className="rounded-l-none border-none max-sm:rounded-none"
            defaultMonth={date?.from}
            selected={internalDate}
            disabled={timeFrame.value !== 'custom'}
            onSelect={(date) => handleDateChange(date, true)}
            numberOfMonths={2}
          />
        </div>
      </Popover>
    </div>
  );
}

const RenderMenuItems = ({ timeFrame, handleClick }) => {
  return (
    <>
      {timeframeList.map((t) => (
        <MenuItem key={t.value} selected={timeFrame.value === t.value} onClick={() => handleClick(t)}>
          {t.label}
        </MenuItem>
      ))}
    </>
  );
};

export default DateRangePicker;
export { Calendar };
export type { DateRange };

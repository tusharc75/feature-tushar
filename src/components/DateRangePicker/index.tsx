import { Menu, MenuItem, Popover } from '@mui/material';
import { Today } from '@mui/icons-material';
import moment from 'moment';
import React from 'react';
import { DateRange } from 'react-day-picker';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn, dateFormat } from 'src/constants/helpers';
import { Calendar } from './Calendar';
import { BiChevronDown } from 'react-icons/bi';

type DateRanges = DateRange | undefined;

type DateRangePicerProps = {
  date: DateRanges;
  setDate: (date: DateRanges) => void;
  horizontal?: 'right' | 'left' | 'center';
} & React.HTMLAttributes<HTMLDivElement>;

type TimeFrame = 'custom' | '1-month' | '3-months' | '6-months' | '1-year';

const timeframeList = [
  { label: 'Custom', value: 'custom' },
  { label: 'Last 1 Month', value: '1-month' },
  { label: 'Last 3 Months', value: '3-months' },
  { label: 'Last 6 Months', value: '6-months' },
  { label: 'Last 1 Year', value: '1-year' }
] as const;

type TimeFrameList = (typeof timeframeList)[number];

function DateRangePicker({ className, date, setDate, horizontal = 'center' }: DateRangePicerProps) {
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

  const handleTimeframe = (timeFrame: TimeFrameList) => {
    setTimeFrame(timeFrame);
    switch (timeFrame.value) {
      case '1-month': {
        const data = {
          from: new Date(moment().subtract('1', 'month').calendar()),
          to: new Date()
        };
        setMonth(data.from);
        setDate(data);
        break;
      }
      case '3-months': {
        const data = {
          from: new Date(moment().subtract('3', 'months').calendar()),
          to: new Date()
        };
        setMonth(data.from);
        setDate(data);
        break;
      }
      case '6-months': {
        const data = {
          from: new Date(moment().subtract('6', 'months').calendar()),
          to: new Date()
        };
        setMonth(data.from);
        setDate(data);
        break;
      }
      case '1-year': {
        const data = {
          from: new Date(moment().subtract('1', 'year').calendar()),
          to: new Date()
        };
        setMonth(data.from);
        setDate(data);
        break;
      }
      case 'custom':
      default:
        setDate({
          from: new Date(),
          to: new Date()
        });
        setMonth(new Date());
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
                {moment(date.from).format(dateFormat)} - {moment(date.to).format(dateFormat)}
              </>
            ) : (
              moment(date.from).format(dateFormat)
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
            selected={date}
            onSelect={({ from, to }) => setDate({ from, to })}
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

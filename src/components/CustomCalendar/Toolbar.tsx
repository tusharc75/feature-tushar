import { Popover } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Navigate, NavigateAction, View } from 'react-big-calendar';
import { ViewType } from 'src/components/CustomCalendar';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
const buttonClass = 'bg-transparent px-[14px] py-[6px] hover:bg-gray-100 dark:hover:bg-gray-800 text-[13px] font-medium';
const buttonClassActive = 'bg-theme hover:bg-theme text-white hover:text-white';

type CustomToolbarProps = {
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => void;
  onView: (view: ViewType) => void;
  label: string;
  date: Date;
  localizer: dayjs.Dayjs;
  view: ViewType;
  views: ViewType[];
  setStateDate: (date: dayjs.Dayjs) => void;
  parentOnNavigate: (newDate: Date, view: View, action: NavigateAction) => void;
};

const viewMap = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  agenda: 'List'
};

const CustomToolbar = ({ onNavigate, onView, label, date, localizer, view, views, setStateDate, parentOnNavigate }: CustomToolbarProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleToday = () => onNavigate(Navigate.TODAY);
  const handlePrev = () => onNavigate(Navigate.PREVIOUS);
  const handleNext = () => onNavigate(Navigate.NEXT);

  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div className="divide-x overflow-hidden rounded border">
        <RippleButton onClick={handlePrev} className={cn(buttonClass)}>
          Prev
        </RippleButton>
        <RippleButton onClick={handleToday} className={cn(buttonClass)}>
          Today
        </RippleButton>
        <RippleButton onClick={handleNext} className={cn(buttonClass)}>
          Next
        </RippleButton>
      </div>
      <Popover
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <StaticDatePicker
          value={dayjs(date)}
          views={view === 'month' ? ['month', 'year'] : ['year', 'month', 'day']}
          onChange={(value) => {
            setStateDate(value);
            parentOnNavigate?.(value.toDate(), view, 'DATE');
          }}
          shouldDisableDate={(date) => (view === 'week' ? !dayjs(date).startOf('week').isSame(date, 'day') : false)}
          slotProps={{
            actionBar: {
              sx: { display: 'none' }
            }
          }}
        />
      </Popover>
      <RippleButton onClick={(e) => setAnchorEl(e.currentTarget)} className={cn(buttonClass, 'rounded border ')}>
        {label}
      </RippleButton>
      <div className="divide-x overflow-hidden rounded border">
        {views.map((v) => (
          <RippleButton onClick={() => onView(v)} className={cn(buttonClass, view === v ? buttonClassActive : '')} key={v}>
            {viewMap[v]}
          </RippleButton>
        ))}
      </div>
    </div>
  );
};

export default CustomToolbar;

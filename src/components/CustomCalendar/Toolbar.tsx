import { Popover } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Navigate } from 'react-big-calendar';
import { ViewType } from 'src/components/CustomCalendar';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';
const buttonClass = 'bg-transparent px-[14px] py-[6px] hover:bg-gray-100 dark:hover:bg-gray-800 text-[13px] font-medium';
const buttonClassActive = 'bg-theme text-white';

type CustomToolbarProps = {
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => void;
  onView: (view: ViewType) => void;
  label: string;
  date: Date;
  localizer: dayjs.Dayjs;
  view: ViewType;
  views: ViewType[];
  setStateDate: (date: dayjs.Dayjs) => void;
};

const viewMap = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  agenda: 'List'
};

const CustomToolbar = ({ onNavigate, onView, label, date, localizer, view, views, setStateDate }: CustomToolbarProps) => {
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
          views={['month', 'year']}
          onChange={(value) => {
            setStateDate(value);
          }}
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

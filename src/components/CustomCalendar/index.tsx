import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin!
import timeGridPlugin from '@fullcalendar/timegrid';
import { Event } from 'src/components/CustomCalendar/types';
import { CalendarOptions, EventContentArg } from '@fullcalendar/core';
import { CircularProgress, Popover } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import './index.scss';
import { useAppTheme } from 'src/constants/AppConfig';

type CustomCalednerProps = {
  events: Event[];
  isLoading?: boolean;
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  getEventStyle: (data: Event, themeMode: 'dark' | 'light') => Partial<{ color: string; backgroundColor: string; borderColor: string }>;
} & Omit<CalendarOptions, 'views' | 'events'>;

const CustomCalendar = React.forwardRef<FullCalendar, CustomCalednerProps>(
  ({ events, isLoading, initialView = 'dayGridMonth', getEventStyle, ...rest }, ref) => {
    const [themeMode] = useAppTheme();
    const [stateEvents, setStateEvents] = useState(events);
    const calenderRef = useRef<FullCalendar>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    useEffect(() => {
      if (events && getEventStyle && typeof getEventStyle === 'function') {
        const newEvents = events.map((d) => ({ ...d, ...getEventStyle(d, themeMode) }));
        setStateEvents(newEvents);
      } else {
        setStateEvents(events);
      }
    }, [events, themeMode]);

    return (
      <div className="relative">
        <FullCalendar
          ref={(node) => {
            if (node) {
              if (ref && typeof ref === 'object' && 'current' in ref) {
                ref.current = node;
              }
              calenderRef.current = node;
            }
          }}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView={initialView}
          weekends={true}
          events={stateEvents}
          eventContent={(eventInfo) => renderEventContent(eventInfo)}
          dayMaxEventRows={4}
          customButtons={{
            dateSelectorButton: {
              text: calenderRef.current?.getApi().view.title,
              click: function (e) {
                setAnchorEl(e.currentTarget as HTMLButtonElement);
              }
            }
          }}
          headerToolbar={{
            left: 'prev,today,next',
            center: 'dateSelectorButton',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          moreLinkClick={'popover'}
          moreLinkClassNames={'bg-[#32324f] text-white w-full text-center py-1 mt-1 dark:hover:!bg-gray-600 hover:!bg-gray-500'}
          {...rest}
        />
        {isLoading && (
          <div className="absolute inset-0 z-[1] flex items-center justify-center bg-white/60">
            <CircularProgress />
          </div>
        )}
        <Popover open={!!anchorEl} onClose={() => setAnchorEl(null)} anchorEl={anchorEl}>
          <StaticDatePicker
            defaultValue={dayjs(calenderRef.current?.getApi().getDate())}
            views={calenderRef.current?.getApi().view.type === 'dayGridMonth' ? ['month', 'year'] : ['year', 'month', 'day']}
            shouldDisableDate={(date) =>
              calenderRef.current?.getApi().view.type === 'timeGridWeek' ? !dayjs(date).startOf('week').isSame(date, 'day') : false
            }
            onAccept={(date) => {
              calenderRef.current?.getApi().gotoDate(date.toDate());
              setAnchorEl(null);
            }}
          />
        </Popover>
      </div>
    );
  }
);

export default CustomCalendar;

function renderEventContent(eventInfo: EventContentArg) {
  return (
    <>
      <b>{eventInfo.timeText}</b>
      <p>{eventInfo.event.title}</p>
    </>
  );
}

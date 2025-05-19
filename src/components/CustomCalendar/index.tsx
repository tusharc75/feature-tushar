import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin!
import timeGridPlugin from '@fullcalendar/timegrid';
import { Event, View } from 'src/components/CustomCalendar/types';
import { CalendarOptions, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import { CircularProgress, Popover } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import './index.scss';
import { useAppTheme } from 'src/constants/AppConfig';
import interactionPlugin from '@fullcalendar/interaction';
import { useData } from 'src/StateProvider/Provider';

type CustomCalednerProps = {
  events: Event[];
  isLoading?: boolean;
  initialView?: View;
  getEventStyle?: (
    data: Event,
    themeMode: 'dark' | 'light'
  ) => Partial<{ color: string; backgroundColor: string; borderColor: string; textColor: string }>;
  view?: View;
  setView?: (view: View) => void;
  onNavigate?: (dateInfo: DatesSetArg) => void;
} & Omit<CalendarOptions, 'views' | 'events'>;

const CustomCalendar = React.forwardRef<FullCalendar, CustomCalednerProps>(
  (
    {
      events,
      isLoading,
      initialView = 'dayGridMonth',
      getEventStyle,
      view,
      setView,
      onNavigate,
      height = 'max(calc(100vh - 250px), 700px)',
      ...rest
    },
    ref
  ) => {
    const {
      state: { user }
    }: any = useData();
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events, themeMode]);

    useEffect(() => {
      if (view) {
        calenderRef.current?.getApi().changeView(view);
      }
    }, [view]);

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
          height={height}
          expandRows={true}
          timeZone={user?.user?.timezone || 'America/New_York'}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          weekends={true}
          events={stateEvents}
          eventContent={(eventInfo) => renderEventContent(eventInfo)}
          dayMaxEventRows={3}
          datesSet={function (dateInfo) {
            const view = dateInfo.view;
            onNavigate?.(dateInfo);
            setView?.(view.type as View);
          }}
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
          moreLinkClassNames={'bg-[#32324f] text-white w-full text-center py-1 mt-1 dark:hover:!bg-gray-600 hover:!bg-gray-500 font-semibold'}
          {...rest}
        />
        {isLoading && (
          <div className="absolute -inset-2 z-10 flex items-center justify-center rounded-md bg-white/60 [backdrop-filter:blur(2px)] dark:bg-black/60">
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
      {eventInfo.timeText && <b>{eventInfo.timeText}</b>}
      <p className="px-[5px] py-[2px] text-xs font-medium">
        {eventInfo.event.extendedProps.prefixConponent ? eventInfo.event.extendedProps.prefixConponent : null} {eventInfo.event.title}{' '}
        {eventInfo.event.extendedProps.suffixComponent ? eventInfo.event.extendedProps.suffixComponent : null}
      </p>
    </>
  );
}

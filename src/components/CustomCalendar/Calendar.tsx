import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin!
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { CircularProgress, Popover } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import { CustomCalednerProps } from 'src/components/CustomCalendar';
import { renderEventContent } from 'src/components/CustomCalendar/Components';
import { useInforSidebar } from 'src/components/InfoSidebar';
import { useAppTheme } from 'src/constants/AppConfig';

export const Calendar = React.forwardRef<FullCalendar, CustomCalednerProps>(
  (
    {
      events,
      isLoading,
      initialView = 'dayGridMonth',
      getEventStyle,
      onNavigate,
      height = 'max(calc(100vh - 250px), 700px)',
      ...rest
    },
    ref
  ) => {
    const {
      state: { user }
    }: any = useData();
    const [storeData] = useInforSidebar((state) => state.data);
    const [themeMode] = useAppTheme();
    const [stateEvents, setStateEvents] = useState(events);
    const calenderRef = useRef<FullCalendar>();
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
      // recalculate calendar size after open or closing sidebar
      const SIDEBAR_ANIMATION_DURATION = 350;
      const id = setTimeout(() => {
        calenderRef.current.getApi().updateSize();
      }, SIDEBAR_ANIMATION_DURATION);
      return () => {
        clearTimeout(id);
      };
    }, [storeData]);


    return (
      <div className="relative">
        <FullCalendar
          ref={(node) => {
            if (node) {
              if (ref && typeof ref === 'object' && 'current' in ref) {
                ref.current = node;
              } else if (typeof ref === 'function') {
                ref(node);
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
          eventContent={renderEventContent}
          dayMaxEventRows={calenderRef?.current?.getApi()?.view.type === 'dayGridMonth' ? 3 : 50}
          datesSet={onNavigate}
          eventOrder={'order'}
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
          now={() => dayjs().tz().format()}
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

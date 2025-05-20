import { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CustomCalednerProps } from 'src/components/CustomCalendar';
import { Calendar } from 'src/components/CustomCalendar/Calendar';
import { renderEventContent, renderEventContentForMonthViewMobile } from 'src/components/CustomCalendar/Components';
import { View } from 'src/components/CustomCalendar/types';
import { parseEventForMobile1 } from 'src/components/CustomCalendar/utils';

export const MobileCalendar = React.forwardRef<FullCalendar, CustomCalednerProps>(
  (
    { events, isLoading, initialView = 'dayGridMonth', getEventStyle, onNavigate, height = 'max(calc(100vh - 250px), 700px)', eventClick, ...rest },
    ref
  ) => {
    const [stateEvents, setStateEvents] = useState(events);
    const [navigationData, setNavigationData] = useState<DatesSetArg>(null);
    const calenderRef = useRef<FullCalendar>(null);

    const handleNavigate = useCallback(
      (data: DatesSetArg) => {
        onNavigate?.(data);
        setNavigationData(data);
      },
      [onNavigate]
    );

    const handleEventClick = (arg: EventClickArg) => {
      if (navigationData.view.type === 'dayGridMonth') {
        console.log(arg.event.start, calenderRef.current);
        calenderRef.current?.getApi().changeView('timeGridDay' as View, arg.event.start);
      } else {
        eventClick(arg);
      }
    };

    useEffect(() => {
      if ((navigationData?.view?.type as View) === 'dayGridMonth' && navigationData?.end) {
        const newData = parseEventForMobile1(events, navigationData?.start, navigationData?.end);
        setStateEvents(newData);
      } else {
        setStateEvents(events);
      }
    }, [events, navigationData?.view?.type, navigationData?.end, navigationData?.start]);

    return (
      <Calendar
        events={stateEvents}
        ref={(node) => {
          if (node) {
            if (ref && typeof ref === 'object' && 'current' in ref) {
              ref.current = node;
            }
            calenderRef.current = node;
          }
        }}
        isLoading={isLoading}
        initialView={initialView}
        getEventStyle={getEventStyle}
        onNavigate={handleNavigate}
        height={height}
        eventContent={(navigationData?.view?.type as View) === 'dayGridMonth' ? renderEventContentForMonthViewMobile : renderEventContent}
        eventClick={handleEventClick}
        {...rest}
      />
    );
  }
);

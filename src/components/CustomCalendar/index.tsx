import { CalendarOptions, DatesSetArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import { useMediaQuery } from '@mui/material';
import React from 'react';
import { Calendar } from 'src/components/CustomCalendar/Calendar';
import { MobileCalendar } from 'src/components/CustomCalendar/MobileCalendar';
import { Event, View } from 'src/components/CustomCalendar/types';

export type CustomCalednerProps = {
  events: Event[];
  isLoading?: boolean;
  initialView?: View;
  getEventStyle?: (
    data: Event,
    themeMode: 'dark' | 'light'
  ) => Partial<{ color: string; backgroundColor: string; borderColor: string; textColor: string }>;
  onNavigate?: (dateInfo: DatesSetArg) => void;
} & Omit<CalendarOptions, 'views' | 'events'>;

const CustomCalendar = React.forwardRef<FullCalendar, CustomCalednerProps>(
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
    const isMobile = useMediaQuery('(max-width:768px)');

    return isMobile ? (
      <MobileCalendar
        events={events}
        ref={ref}
        isLoading={isLoading}
        initialView={initialView}
        getEventStyle={getEventStyle}
        onNavigate={onNavigate}
        height={height}
        {...rest}
      />
    ) : (
      <Calendar
        events={events}
        ref={ref}
        isLoading={isLoading}
        initialView={initialView}
        getEventStyle={getEventStyle}
        onNavigate={onNavigate}
        height={height}
        {...rest}
      />
    );
  }
);

export default CustomCalendar;

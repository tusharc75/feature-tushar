import { useMediaQuery } from '@material-ui/core';
import React, { useState, useEffect } from 'react';
import { Calendar, CalendarProps } from 'react-big-calendar';
import { isMobile, isTablet } from 'react-device-detect';
import MobileDayView from 'src/components/CustomCalendar/MobileDayView';
import { parseEventForMobile } from 'src/components/CustomCalendar/utils';
import { cn, filterDataByDateIntersection } from 'src/constants/helpers';

type ViewType = 'month' | 'week' | 'day' | 'agenda';
type CustomCalendarProps = Omit<CalendarProps<any, any>, 'views'> & {
  views: ViewType[];
};

const CustomCalendar = ({ events, onRangeChange, view, defaultView, onView, views, onSelectEvent, ...rest }: CustomCalendarProps) => {
  const isMobileView = useMediaQuery('(max-width: 767px)');
  const mobileView = (isMobile && !isTablet) || isMobileView;
  const [isDataPresent, setIsDataPresent] = useState(true);
  const [stateView, setStateView] = useState(view ? view : defaultView ? defaultView : 'month');
  const [mobileEvents, setMobileEvents] = useState([]);
  const [mobileViewData, setMobileViewData] = useState<{ open: boolean; date: string }>({ open: false, date: '' });

  const handleRangeChange = (dates, view) => {
    if (view === 'day') {
      setIsDataPresent(!!filterDataByDateIntersection(dates, events)?.length);
    } else {
      setIsDataPresent(true);
    }
    onRangeChange?.(dates, view);
  };

  const handleView = (view: ViewType) => {
    setStateView(view);
    onView?.(view);
  };

  useEffect(() => {
    if (mobileView) {
      setMobileEvents(parseEventForMobile(events));
    }
  }, [events, mobileView]);

  const handleOpenMobileDayView = (data) => {
    setMobileViewData({ open: true, date: data.start });
  };

  const handleCloseMobileDayView = () => {
    setMobileViewData({ open: false, date: '' });
  };

  return (
    <div className="relative">
      <Calendar
        view={mobileView ? 'month' : stateView}
        events={mobileView ? mobileEvents : events}
        onView={handleView}
        onRangeChange={handleRangeChange}
        views={mobileView ? ['month'] : views}
        components={{
          event: (props) => {
            const { event } = props;
            return (
              <div className="flex min-h-2 flex-col rounded-md">
                <span className={cn('text-sm font-bold max-md:sr-only')}>{event.title}</span>
              </div>
            );
          },
          month: {
            header: (props) => {
              const { label } = props;
              return (
                <div>
                  <span className="sr-only max-md:not-sr-only">{label[0]}</span>
                  <span className="not-sr-only max-md:sr-only">{label}</span>
                </div>
              );
            }
          }
        }}
        onSelectEvent={(event, data) => (mobileView ? handleOpenMobileDayView(event) : onSelectEvent(event, data))}
        {...rest}
      />
      {!isDataPresent && (
        <div className="absolute left-1/2 top-1/2 select-none text-center text-gray-500 [transform:translate(-50%,-50%)]">
          No data available for the selected date range.
        </div>
      )}
      {mobileViewData.open && (
        <>
          <MobileDayView
            calnedarProps={{ onSelectEvent, events, view: 'day', views: ['day'], date: mobileViewData.date, ...rest }}
            date={mobileViewData.date}
            onClose={handleCloseMobileDayView}
          />
        </>
      )}
    </div>
  );
};

export default CustomCalendar;

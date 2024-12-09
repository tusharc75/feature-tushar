import { CircularProgress, useMediaQuery } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { Calendar, CalendarProps } from 'react-big-calendar';
import { isMobile, isTablet } from 'react-device-detect';
import MobileDayView from 'src/components/CustomCalendar/MobileDayView';
import { parseEventForMobile } from 'src/components/CustomCalendar/utils';
import { cn, filterDataByDateIntersection } from 'src/constants/helpers';
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';

interface DragAndDropCalendarProps<TEvent extends object = Event, TResource extends object = object>
  extends Omit<CalendarProps<TEvent, TResource>, 'views'>,
    withDragAndDropProps<TEvent, TResource> {}

const DragAndDropCalendar = withDragAndDrop(Calendar as any);

export type ViewType = 'month' | 'week' | 'day' | 'agenda';

type CommonProps = {
  views: ViewType[];
  loading?: boolean;
};
type NormalCalendarProps = {
  dragAndDrop?: false;
} & Omit<CalendarProps<any, any>, 'views'>;

type DraggableCalendarProps = {
  dragAndDrop?: true;
} & DragAndDropCalendarProps;

export type CustomCalendarProps = NormalCalendarProps | DraggableCalendarProps;

const CustomCalendar = ({
  events,
  onRangeChange,
  view,
  defaultView,
  onView,
  views,
  onSelectEvent,
  loading = false,
  dragAndDrop = false,
  ...rest
}: CustomCalendarProps & CommonProps) => {
  const isMobileView = useMediaQuery('(max-width: 767px)');
  const mobileView = (isMobile && !isTablet) || isMobileView;
  const [stateView, setStateView] = useState(view ? view : defaultView ? defaultView : 'month');
  const [mobileEvents, setMobileEvents] = useState([]);
  const [mobileViewData, setMobileViewData] = useState<{ open: boolean; date: string }>({ open: false, date: '' });
  const [isDataPresent, setIsDataPresent] = useState(true);

  const handleRangeChange = (dates, view) => {
    if (view === 'day' || view === 'agenda') {
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

  const Component = (dragAndDrop && !mobileView ? DragAndDropCalendar : Calendar) as any;

  return (
    <div className="relative">
      <Component
        view={stateView}
        events={mobileView ? mobileEvents : events}
        onView={handleView}
        onRangeChange={handleRangeChange}
        views={views}
        components={{
          month: {
            header: (props: any) => {
              const { label } = props;
              return (
                <div>
                  <span className="sr-only max-md:not-sr-only">{label[0]}</span>
                  <span className="not-sr-only max-md:sr-only">{label}</span>
                </div>
              );
            },
            ...(mobileView
              ? {
                  event: (props) => {
                    const { event } = props;
                    return (
                      <div className="flex min-h-2 flex-col rounded-md ">
                        <span
                          className={cn('text-sm ', stateView === 'month' ? 'max-md:sr-only' : '')}
                          {...rest.eventPropGetter(event, event.start, event.end, undefined)}
                        >
                          {event.title}
                        </span>
                      </div>
                    );
                  }
                }
              : {})
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
      {loading && (
        <div className="absolute inset-0 z-20  flex select-none items-center justify-center text-center [backdrop-filter:blur(3px)]">
          <div className="rounded-md bg-[var(--dark-primary,white)] p-8 shadow-md">
            <CircularProgress />
            <p className="text-center">Loading...</p>
          </div>
        </div>
      )}

      {mobileViewData.open && (
        <>
          <MobileDayView
            Component={Component}
            calnedarProps={{
              onSelectEvent,
              events,
              view: 'day',
              views: ['day'],
              date: mobileViewData.date,
              ...rest
            }}
            date={mobileViewData.date}
            onClose={handleCloseMobileDayView}
          />
        </>
      )}
    </div>
  );
};

export default CustomCalendar;

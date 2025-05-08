import { CircularProgress, useMediaQuery } from '@mui/material';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CalendarProps, Components, Event, Messages, Navigate } from 'react-big-calendar';
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';
import { isMobile, isTablet } from 'react-device-detect';
import MobileDayView from 'src/components/CustomCalendar/MobileDayView';
import ShowMorePopup from 'src/components/CustomCalendar/ShowMorePopup';
import CustomToolbar from 'src/components/CustomCalendar/Toolbar';
import { parseEventForMobile } from 'src/components/CustomCalendar/utils';
import { cn, filterDataByDateIntersection } from 'src/constants/helpers';

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

const CustomCalendar = React.memo(
  ({
    events,
    onRangeChange,
    view,
    defaultView,
    onView,
    views,
    onSelectEvent,
    loading = false,
    dragAndDrop = false,
    defaultDate,
    date,
    onNavigate,
    localizer,
    ...rest
  }: CustomCalendarProps & CommonProps) => {
    const [stateDate, setStateDate] = useState(date || defaultDate || dayjs());
    const isMobileView = useMediaQuery('(max-width: 767px)');
    const mobileView = (isMobile && !isTablet) || isMobileView;
    const [stateView, setStateView] = useState(view ? view : defaultView ? defaultView : 'month');
    const [mobileEvents, setMobileEvents] = useState([]);
    const [mobileViewData, setMobileViewData] = useState<{ open: boolean; date: string }>({ open: false, date: '' });
    const [isDataPresent, setIsDataPresent] = useState(true);
    const popupDate = useRef<Date>(null);

    const handleRangeChange = useCallback(
      (dates, view) => {
        if (view === 'day' || view === 'agenda') {
          setIsDataPresent(!!filterDataByDateIntersection(dates, events)?.length);
        } else {
          setIsDataPresent(true);
        }
        onRangeChange?.(dates, view);
      },
      [events, onRangeChange]
    );

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

    const components = useMemo(
      () =>
        ({
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
          },
          toolbar: (props: any) => <CustomToolbar {...props} parentOnNavigate={onNavigate} setStateDate={setStateDate} />
        }) as Components<any, any>,
      [mobileView, rest, stateView, onNavigate]
    );

    const handleEventSelect = useCallback(
      (data: Event, e: React.SyntheticEvent<HTMLElement>) => {
        if (mobileView && stateView === 'month') {
          handleOpenMobileDayView(data);
        } else {
          onSelectEvent(data, e);
        }
      },
      [mobileView, onSelectEvent, stateView]
    );

    const messages = useMemo(() => {
      return {
        showMore: (count, remainingEvents, events) => (
          <ShowMorePopup
            count={count}
            events={events}
            popupDate={popupDate}
            remainingEvents={remainingEvents}
            eventPropGetter={rest.eventPropGetter}
            handleEventSelect={handleEventSelect}
          />
        )
      } as Messages<any>;
    }, [handleEventSelect, rest.eventPropGetter]);

    return (
      <div className="relative min-h-[300px] [&_.rbc-agenda-empty]:hidden">
        {dragAndDrop && !mobileView ? (
          <DragAndDropCalendar
            date={stateDate as any}
            onNavigate={(date: Date, view: ViewType, action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => {
              setStateDate(date);
              onNavigate?.(date, view, action);
            }}
            localizer={localizer}
            view={stateView}
            events={mobileView ? mobileEvents : events}
            onView={handleView}
            onRangeChange={handleRangeChange}
            views={views}
            titleAccessor={rest.titleAccessor as any}
            components={components as any}
            tooltipAccessor={rest.tooltipAccessor as any}
            onSelectEvent={handleEventSelect}
            {...(rest as any)}
            messages={messages}
            // onShowMore={(e, date) => (popupDate.current = date)}
          />
        ) : (
          <Calendar
            localizer={localizer}
            date={stateDate as any}
            onNavigate={(date: Date, view: ViewType, action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => {
              setStateDate(date);
              onNavigate?.(date, view, action);
            }}
            view={stateView}
            events={mobileView ? mobileEvents : events}
            onView={handleView}
            onRangeChange={handleRangeChange}
            views={views}
            components={components}
            onSelectEvent={handleEventSelect}
            {...rest}
            messages={messages}
            // onShowMore={(e, date) => (popupDate.current = date)}
          />
        )}

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
              Component={dragAndDrop && !mobileView ? DragAndDropCalendar : Calendar}
              calnedarProps={{
                onSelectEvent,
                events,
                view: 'day',
                views: ['day'],
                date: mobileViewData.date,
                ...(rest as any)
              }}
              date={mobileViewData.date}
              onClose={handleCloseMobileDayView}
            />
          </>
        )}
      </div>
    );
  }
);

export default CustomCalendar;

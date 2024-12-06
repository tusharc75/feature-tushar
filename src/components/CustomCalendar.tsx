import { useMediaQuery } from '@material-ui/core';
import React, { useState } from 'react';
import { Calendar, CalendarProps } from 'react-big-calendar';
import { isMobile, isTablet } from 'react-device-detect';
import { cn, filterDataByDateIntersection } from 'src/constants/helpers';

type ViewType = 'month' | 'week' | 'day' | 'agenda';
type CustomCalendarProps = Omit<CalendarProps<any, any>, 'views'> & {
  views: ViewType[];
};

const CustomCalendar = ({ events, onRangeChange, view, defaultView, onView, views, ...rest }: CustomCalendarProps) => {
  const mobileView = isMobile && !isTablet;
  const isMobileView = useMediaQuery('(max-width: 767px)');
  const [isDataPresent, setIsDataPresent] = useState(true);
  const [stateView, setStateView] = useState(view ? view : defaultView ? defaultView : 'month');

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

  return (
    <div className="relative">
      <Calendar
        view={isMobileView ? 'month' : stateView}
        events={events}
        onView={handleView}
        onRangeChange={handleRangeChange}
        views={isMobileView ? ['month'] : views}
        components={{
          event: (props) => {
            const { event } = props;
            return (
              <div className="flex min-h-2 flex-col rounded-md">
                <span className={cn('text-sm font-bold max-md:sr-only')}>{event.title}</span>
              </div>
            );
          },
          // dateCellWrapper: (props) => {
          //   console.log(props);
          //   return <div className="asdfasdfjasdklfjasdl;kfjas;kldf">{props.children}hi</div>;
          // },
          // dayColumnWrapper: (props) => {
          //   console.log(props);
          //   return <div className="aklsdjflak;sdjfla;ksdfjlaskdfj">hiasdfasdjf;lkajsdf;kl ajsd;lfkjasd lfkjasdf lkasjdf ;kl</div>;
          // },
          // eventContainerWrapper: (props) => {
          //   console.log(props);
          //   return <div className="test-class">hiasdfasdjf;lkajsdf;kl ajsd;lfkjasd lfkjasdf lkasjdf ;kl{props.children}</div>;
          // },
          // eventWrapper: (props) => {
          //   console.log(props);
          //   return <div className="test-class">{props.children}</div>;
          // },
          // dayColumnWrapper: (props) => {
          //   console.log(props);
          //   return <>hi</>;
          // },
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
            // important
            // dateHeader: (props) => {
            //   console.log(props);
            //   return <div>{props.label}</div>;
            // }
          }
        }}
        {...rest}
      />
      {!isDataPresent && (
        <div className="absolute left-1/2 top-1/2 select-none text-center text-gray-500 [transform:translate(-50%,-50%)]">
          No data available for the selected date range.
        </div>
      )}
    </div>
  );
};

export default CustomCalendar;

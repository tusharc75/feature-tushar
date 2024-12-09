import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import { isMobile, isTablet } from 'react-device-detect';
import React, { useRef, useState } from 'react';
import { cn, filterDataByDateIntersection } from 'src/constants/helpers';
import CustomCalendar from 'src/components/CustomCalendar';

const localizer = momentLocalizer(moment);

type Props = {
  activities: any[];
  setActivityData: any;
  type?: string;
};

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const MyCalendar = (props: Props) => {
  const { activities, setActivityData } = props;
  const mobileView = isMobile && !isTablet;
  const calendarRef = useRef<Calendar<any, object>>(null);

  return (
    <div className="relative">
      <CustomCalendar
        key={mobileView ? 'mobile' : 'desktop'}
        defaultDate={moment().toDate()}
        defaultView={mobileView ? 'day' : 'month'}
        events={activities}
        localizer={localizer}
        formats={formats}
        style={{ height: 'calc(100vh - 200px)', borderRadius: '4px', overflow: 'auto' }}
        popup={!mobileView}
        ref={calendarRef}
        // views={{ month: !mobileView, week: !mobileView, day: true }}
        views={mobileView ? ['day'] : ['month', 'week', 'day']}
        eventPropGetter={(obj) => {
          const newStyles = {
            backgroundColor:
              obj.type === 'Event'
                ? 'var(--dark-secondary,rgba(255, 232, 204, 1))'
                : obj.type === 'Task'
                  ? 'var(--dark-secondary,rgba(234, 239, 254, 1))'
                  : 'var(--dark-secondary,rgba(253, 220, 228, 1))',
            color:
              obj.type === 'Event' ? 'rgba(236, 85, 0, 1)' : obj.type === 'Task' ? 'var(--task-color,rgba(4, 50, 161, 1))' : 'rgba(165, 4, 43, 1)',
            borderRadius: '4px',
            border: 'none',
            padding: '8px 16px'
          };

          return {
            style: newStyles
          };
        }}
        onSelectEvent={(event: any) => {
          setActivityData({
            type: event.type.toLowerCase(),
            id: event._id
          });
        }}
      />
    </div>
  );
};

export default MyCalendar;

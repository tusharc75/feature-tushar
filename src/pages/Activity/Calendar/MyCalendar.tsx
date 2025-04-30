import dayjs from 'dayjs';
import { useCallback } from 'react';
import { dayjsLocalizer } from 'react-big-calendar';
import { isMobile, isTablet } from 'react-device-detect';
import CustomCalendar from 'src/components/CustomCalendar';

type Props = {
  activities: any[];
  setActivityData: any;
  type?: string;
  loading?: boolean;
};

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const MyCalendar = ({ activities, setActivityData, loading }: Props) => {
  const mobileView = isMobile && !isTablet;

  const localizer = dayjsLocalizer(dayjs);
  localizer.segmentOffset = 0;

  const getEventStyle = useCallback((obj) => {
    return {
      style: {
        backgroundColor:
          obj.type === 'Event'
            ? 'var(--dark-secondary,rgba(255, 232, 204, 1))'
            : obj.type === 'Task'
              ? 'var(--dark-secondary,rgba(234, 239, 254, 1))'
              : 'var(--dark-secondary,rgba(253, 220, 228, 1))',
        color: obj.type === 'Event' ? 'rgba(236, 85, 0, 1)' : obj.type === 'Task' ? 'var(--task-color,rgba(4, 50, 161, 1))' : 'rgba(165, 4, 43, 1)',
        borderRadius: '4px',
        border: 'none',
        padding: '8px 16px'
      }
    };
  }, []);

  return (
    <div className="relative">
      <CustomCalendar
        events={activities}
        loading={loading}
        localizer={localizer}
        formats={formats}
        style={{ height: 'calc(100vh - 200px)', borderRadius: '4px', overflow: 'auto' }}
        popup={!mobileView}
        views={['month', 'week', 'day']}
        eventPropGetter={getEventStyle}
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

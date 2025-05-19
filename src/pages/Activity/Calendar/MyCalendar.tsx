import { useCallback } from 'react';
import CustomCalendar from 'src/components/CustomCalendar';

type Props = {
  activities: any[];
  setActivityData: any;
  type?: string;
  loading?: boolean;
};

const MyCalendar = ({ activities, setActivityData, loading }: Props) => {
  const getEventStyle = useCallback((obj) => {
    return {
      backgroundColor:
        obj.type === 'Event'
          ? 'var(--dark-secondary,rgba(255, 232, 204, 1))'
          : obj.type === 'Task'
            ? 'var(--dark-secondary,rgba(234, 239, 254, 1))'
            : 'var(--dark-secondary,rgba(253, 220, 228, 1))',
      color: obj.type === 'Event' ? 'rgba(236, 85, 0, 1)' : obj.type === 'Task' ? 'var(--task-color,rgba(4, 50, 161, 1))' : 'rgba(165, 4, 43, 1)',
      textColor: obj.type === 'Event' ? 'rgba(236, 85, 0, 1)' : obj.type === 'Task' ? 'var(--task-color,rgba(4, 50, 161, 1))' : 'rgba(165, 4, 43, 1)',
      borderRadius: '4px',
      borderColor: 'transparent'
    };
  }, []);

  return (
    <div className="relative mt-4">
      <CustomCalendar
        events={activities}
        isLoading={loading}
        height={'calc(100vh - 200px)'}
        getEventStyle={getEventStyle}
        eventClick={(arg) => {
          setActivityData({
            type: arg.event.extendedProps.type.toLowerCase(),
            id: arg.event.extendedProps._id
          });
        }}
      />
    </div>
  );
};

export default MyCalendar;

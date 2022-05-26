import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

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
  return (
    <Calendar
      defaultDate={moment().toDate()}
      defaultView="month"
      events={activities}
      localizer={localizer}
      formats={formats}
      style={{ height: 'calc(100vh - 200px)', borderRadius: '4px' }}
      popup={true}
      views={{ month: true, week: true, day: true }}
      eventPropGetter={(obj) => {
        const newStyles = {
          backgroundColor:
            obj.type === 'Event' ? 'rgba(255, 232, 204, 1)' : obj.type === 'Task' ? 'rgba(234, 239, 254, 1)' : 'rgba(253, 220, 228, 1)',
          color: obj.type === 'Event' ? 'rgba(236, 85, 0, 1)' : obj.type === 'Task' ? 'rgba(4, 50, 161, 1)' : 'rgba(165, 4, 43, 1)',
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
  );
};

export default MyCalendar;

import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

const localizer = momentLocalizer(moment);

type Props = {
  activities: any[];
  setActivityData: any;
  type: string;
};

const formats = {
  weekdayFormat: (date, culture, localizer) =>
    localizer.format(date, "dddd", culture),
};

const MyCalendar = (props: Props) => {
  const { activities, setActivityData, type } = props;
  return (
    <Calendar
      defaultDate={moment().toDate()}
      defaultView="month"
      events={activities}
      localizer={localizer}
      formats={formats}
      style={{ height: "100vh" }}
      popup={true}
      onSelectEvent={(event: any) => {
        setActivityData({
          type,
          id: event._id,
        });
      }}
    />
  );
};

export default MyCalendar;

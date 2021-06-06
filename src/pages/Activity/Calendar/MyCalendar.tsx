import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

const localizer = momentLocalizer(moment);

type Props = {
  activities: any[];
  setActivityData: any;
  type?: string;
};

const formats = {
  weekdayFormat: (date, culture, localizer) =>
    localizer.format(date, "dddd", culture),
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
      style={{ height: "100vh" }}
      popup={true}
      eventPropGetter={(obj) => {
        const newStyles = {
          backgroundColor:
            obj.type === "Event"
              ? "#E65100"
              : obj.type === "Task"
              ? "#3949AB"
              : "#BF360C",
          color: "white",
          borderRadius: "0px",
          border: "none",
        };

        return {
          style: newStyles,
        };
      }}
      onSelectEvent={(event: any) => {
        setActivityData({
          type: event.type.toLowerCase(),
          id: event._id,
        });
      }}
    />
  );
};

export default MyCalendar;

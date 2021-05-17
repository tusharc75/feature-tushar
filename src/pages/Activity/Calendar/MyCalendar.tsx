import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

type Props = {
  activities: any[];
  setActivityData: any;
  type: string;
};

const MyCalendar = (props: Props) => {
  const { activities, setActivityData, type } = props;
  return (
    <Calendar
      defaultDate={moment().toDate()}
      defaultView="month"
      events={activities}
      localizer={localizer}
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

import { useCallback, useEffect, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import { camelCase } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';

const localizer = momentLocalizer(moment);

type Props = {};

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const MyCalendar = (props: Props) => {
  const { resource } = useParams();
  const resourceName = camelCase(resource);
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState();
  const [view, setView] = useState<View>('month');

  useEffect(() => {
    const deepFilter = [
      {
        field: 'estimateStartDate',
        term: moment().format('02/01/2022')
      },
      {
        field: 'estimateEndDate',
        term: moment().format('02/04/2022')
      }
    ];
    axiosInstance()
      .get(`${routes.rentalManagement.path}?deepFilter=${JSON.stringify(deepFilter)}`)
      .then(({ data: { data } }) => {
        const eventsData = data.map((d: any) => ({
          id: d._id,
          title: d.rentalJobName,
          start: d.estimateStartDate,
          end: d.estimateEndDate,
          allDay: true,
          desc: d.jobDescription
        }));
        setEvents(eventsData);
      })
      .catch((err) => {});
    console.log(moment().toDate());
  }, [resource]);

  const onRangeChange = useCallback(
    (range) => {
      setRange(range);
    },
    [setRange]
  );

  const onView = useCallback(
    (view) => {
      setView(view);
    },
    [setView]
  );

  return (
    <Calendar
      defaultDate={moment().toDate()}
      defaultView="day"
      events={events}
      localizer={localizer}
      formats={formats}
      style={{ height: 'calc(100vh - 80px)' }}
      popup={true}
      views={{ month: true, week: true, day: true }}
      eventPropGetter={(obj) => ({})}
      onSelectEvent={(event: any) => {}}
      onRangeChange={onRangeChange}
      onView={onView}
      view={view}
    />
  );
};

export default MyCalendar;

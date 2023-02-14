import { useCallback, useEffect, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import { useParams, useHistory } from 'react-router-dom';
import moment from 'moment';

import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';

const localizer = momentLocalizer(moment);

type Props = {};

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const CalendarView = (props: Props) => {
  const history = useHistory();
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState();
  const [dateRange, setDateRange] = useState({
    estimateStartDate: moment().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: moment().endOf('month').format('MM/DD/YYYY')
  });
  const [view, setView] = useState<View>('month');

  useEffect(() => {
    const deepFilter = [
      {
        field: 'estimateStartDate',
        term: dateRange.estimateStartDate
      },
      {
        field: 'estimateEndDate',
        term: dateRange.estimateEndDate
      }
    ];

    axiosInstance()
      .get(`${routes?.schedule.path}?entity=${selectedEntity}&deepFilter=${JSON.stringify(deepFilter)}`)
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
      .catch((err) => { });
  }, [dateRange]);

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
    <>
        <Calendar
          defaultDate={moment().toDate()}
          defaultView="day"
          events={events}
          localizer={localizer}
          formats={formats}
          popup={true}
          onNavigate={(date) => {
            if (view === 'month') {
              setDateRange({
                estimateStartDate: moment(date).startOf('month').format('MM/DD/YYYY'),
                estimateEndDate: moment(date).endOf('month').format('MM/DD/YYYY')
              });
            }
          }}
          views={{ month: true, week: true, day: true }}
          eventPropGetter={(obj) => ({})}
          onSelectEvent={(event: any) => {
          }}
          onRangeChange={onRangeChange}
          onView={onView}
          view={view}
        />
    </>
  );
};

export default CalendarView;

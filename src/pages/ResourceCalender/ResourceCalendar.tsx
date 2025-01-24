import dayjs from 'dayjs';
import { camelCase, startCase } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { dayjsLocalizer, View } from 'react-big-calendar';
import { useHistory, useParams } from 'react-router-dom';

import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomCalendar from 'src/components/CustomCalendar';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';

type Props = {};

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const MyCalendar = (props: Props) => {
  const { resource } = useParams();
  const history = useHistory();
  const [resourcecamelCase] = useState(camelCase(resource));
  const [resourceStartCase] = useState(startCase(resource));
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState();
  const [dateRange, setDateRange] = useState({
    estimateStartDate: dayjs().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: dayjs().endOf('month').format('MM/DD/YYYY')
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
      .get(`${resource}?deepFilter=${JSON.stringify(deepFilter)}`)
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
  }, [resource, dateRange]);

  const onRangeChange = useCallback(
    (range, view) => {
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

  const localizer = dayjsLocalizer(dayjs);

  return (
    <>
      <div className="headerbox">
        <CustomBreadCrumbs
          routes={[
            {
              title: 'Resource Calender',
              path: '/resource-calendar'
            },
            { title: resourceStartCase, path: '' }
          ]}
        />
      </div>
      <CustomContainer styles={{ minHeight: 'calc(100vh-200px)' }}>
        <div className="relative">
          <CustomCalendar
            defaultDate={dayjs().toDate()}
            defaultView="day"
            events={events}
            localizer={localizer}
            formats={formats}
            popup={true}
            onNavigate={(date) => {
              if (view === 'month') {
                setDateRange({
                  estimateStartDate: dayjs(date).startOf('month').format('MM/DD/YYYY'),
                  estimateEndDate: dayjs(date).endOf('month').format('MM/DD/YYYY')
                });
              }
            }}
            views={['month', 'week', 'day']}
            eventPropGetter={(obj) => ({})}
            onSelectEvent={(event: any) => {
              history.push(`${routes[resourcecamelCase].path}/detail/${event.id}`);
            }}
            onRangeChange={onRangeChange}
            onView={onView}
            view={view}
          />
        </div>
      </CustomContainer>
    </>
  );
};

export default MyCalendar;

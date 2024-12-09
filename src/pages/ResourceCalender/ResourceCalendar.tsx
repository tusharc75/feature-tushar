import { camelCase, startCase } from 'lodash';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { momentLocalizer, View } from 'react-big-calendar';
import { useHistory, useParams } from 'react-router-dom';

import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomCalendar from 'src/components/CustomCalendar';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';

const localizer = momentLocalizer(moment);

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
      .catch((err) => {});
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

import dayjs from 'dayjs';
import { camelCase, startCase } from 'lodash';
import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomCalendar from 'src/components/CustomCalendar';
import { View } from 'src/components/CustomCalendar/types';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';

const MyCalendar = (props) => {
  const { resource } = useParams();
  const history = useHistory();
  const [resourcecamelCase] = useState(camelCase(resource));
  const [resourceStartCase] = useState(startCase(resource));
  const [events, setEvents] = useState([]);
  // const [range, setRange] = useState();
  const [dateRange, setDateRange] = useState({
    estimateStartDate: dayjs().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: dayjs().endOf('month').format('MM/DD/YYYY')
  });
  const [view, setView] = useState<View>('dayGridMonth');

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
            events={events}
            onNavigate={(arg) => {
              if (arg.view.type === 'dayGridMonth') {
                setDateRange({
                  estimateStartDate: dayjs(arg.start).startOf('month').format('MM/DD/YYYY'),
                  estimateEndDate: dayjs(arg.start).endOf('month').format('MM/DD/YYYY')
                });
              }
            }}
            eventClick={(arg) => {
              history.push(`${routes[resourcecamelCase].path}/detail/${arg.event.id}`);
            }}
            setView={setView}
            view={view}
          />
        </div>
      </CustomContainer>
    </>
  );
};

export default MyCalendar;

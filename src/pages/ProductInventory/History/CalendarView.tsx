import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';

const localizer = momentLocalizer(moment);

const CalendarView = ({ product, warehouse }) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      let data;
      const query = warehouse ? `?warehouse=${warehouse}` : ``;
      const response = await axiosInstance().get(`/history/product-ledger/${product}${query}`);
      data = response?.data?.data;

      var qty = 0;
      data
        ?.slice()
        .reverse()
        .forEach(function (item) {
          if (item.type === 'Credit') {
            qty = qty + item?.qty;
          } else {
            qty = qty - item?.qty;
          }
          item.finalInventory = qty;
        });

      let newData = data.map((d) => ({
        ...d,
        title: `${d?.referenceType} ${d?.reference?.optionLabel}`,
        start: new Date(d.date),
        end: new Date(d.date)
      }));
      setActivities(newData);
    } catch (error) {}
  };

  const formats = {
    weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
  };
  return (
    <div>
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
            backgroundColor: obj.type === 'credit' ? '#90ee90' : '#FFCCCB',
            color: '#000011',
            borderRadius: '4px',
            border: 'none',
            padding: '8px 16px'
          };

          return {
            style: newStyles
          };
        }}
        onSelectEvent={(event: any) => {}}
      />
    </div>
  );
};

export default CalendarView;

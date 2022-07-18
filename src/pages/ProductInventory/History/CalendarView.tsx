import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';

const localizer = momentLocalizer(moment);

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

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
      const response1 = await axiosInstance().get(`product-inventory/product/upcoming-ledger/${product}?${query}`);
      data = [...response?.data?.data, ...response1?.data?.data];
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

      let datewise = [];
      let datewiseData = [];

      datewise = data.sort((a, b) => {
        let timeA = new Date(a.date).getTime();
        let timeB = new Date(b.date).getTime();

        return timeA - timeB;
      });

      datewise.forEach((d) => {
        let sameDateData = datewise.filter((item) => {
          return item.date.split('T')[0] === d.date.split('T')[0];
        });
        let lastFinalInventory;
        if (sameDateData && sameDateData.length > 0) {
          lastFinalInventory = sameDateData[0];
        }

        if (lastFinalInventory.date === d.date && !lastFinalInventory?.isFinalInventory) {
          datewiseData.push({
            ...d,
            isFinalInventory: true
          });
        }
      });

      datewise = [...datewiseData, ...datewise];

      let newData = datewise.map((d) => {
        return {
          ...d,
          id: d?._id,
          title: d?.isFinalInventory ? `Final Inventory (${d.finalInventory})` : `${d?.referenceType} (${d?.qty})`,
          start: new Date(d.date),
          end: new Date(d.date)
        };
      });
      setActivities(newData);
    } catch (error) {}
  };

  return (
    <Calendar
      defaultDate={moment().toDate()}
      defaultView="month"
      events={activities}
      localizer={localizer}
      formats={formats}
      showAllEvents
      style={{ height: 'calc(100vh - 200px)', borderRadius: '4px' }}
      views={{ month: true, week: true, day: true }}
      eventPropGetter={(obj) => ({
        style: {
          backgroundColor: obj?.isFinalInventory ? '#047d1c' : obj.type === 'credit' ? '#90ee90' : '#FFCCCB',
          color: obj?.isFinalInventory ? '#ffffff' : '#000011',
          borderRadius: '4px',
          border: 'none',
          padding: '8px 16px',
          fontWeight: obj?.isFinalInventory ? 'bold' : 'normal'
        }
      })}
    />
  );
};

export default CalendarView;

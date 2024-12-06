import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { uniq } from 'lodash';
import { filterDataByDateIntersection } from 'src/constants/helpers';

const localizer = momentLocalizer(moment);

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const CalendarView = ({ product, warehouse, storageLocation }) => {
  const [activities, setActivities] = useState([]);

  const [isDataPresent, setIsDataPresent] = useState(true);

  const handleRangeChange = (dates, view) => {
    if (view === 'day') {
      setIsDataPresent(!!filterDataByDateIntersection(dates, activities)?.length);
    } else {
      setIsDataPresent(true);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    var query = `?`;
    if (warehouse) {
      query = `${query}&warehouse=${warehouse}`;
    }
    if (storageLocation) {
      query = `${query}&storageLocation=${storageLocation}`;
    }

    const response = await axiosInstance().get(`/history/product-ledger/${product}${query}`);
    const response1 = await axiosInstance().get(`/product-inventory/product/upcoming-ledger/${product}${query}`);

    let datewise = [...response?.data?.data, ...response1?.data?.data];
    let datewiseData = [];

    const uniqDate = uniq(datewise?.map((e) => moment(e.date).format('MM-DD-YYYY')));
    uniqDate?.forEach((e) => {
      let dayWiseRecord = datewise.filter((item) => moment(item.date).format('MM-DD-YYYY') === e);
      let lastFinalInventory;
      if (dayWiseRecord.length) {
        lastFinalInventory = dayWiseRecord[0];
      }
      if (lastFinalInventory) {
        datewiseData.push({
          ...lastFinalInventory,
          isFinalInventory: true
        });
      }
    });

    datewise = [...datewiseData, ...datewise];

    let newData = datewise.map((d) => {
      return {
        ...d,
        id: d?._id,
        title: d?.isFinalInventory
          ? `Final Quantity (${d?.finalInventory || 0})`
          : `${d?.type === 'credit' ? '↑' : '↓'} ${d?.referenceType} (${d?.qty})`,
        start: new Date(d.date),
        end: new Date(d.date),
        allDay: true
      };
    });

    setActivities(newData);
  };

  return (
    <div className="relative">
      <Calendar
        defaultDate={moment().toDate()}
        defaultView="month"
        events={activities}
        localizer={localizer}
        formats={formats}
        showAllEvents
        style={{ minHeight: 'calc(100vh - 200px)', borderRadius: '4px' }}
        views={{ month: true, week: true, day: true }}
        onRangeChange={handleRangeChange}
        eventPropGetter={(obj) => ({
          style: {
            backgroundColor: obj?.isFinalInventory ? '#D6F6F6' : obj.type === 'credit' ? '#DBF8DB' : '#FAEAE9',
            color: '#000011',
            borderRadius: '4px',
            border: 'none',
            padding: '8px 16px',
            fontWeight: obj?.isFinalInventory ? 'bold' : 'normal'
          }
        })}
      />
      {!isDataPresent && (
        <div className="absolute left-1/2 top-1/2 select-none text-center text-gray-500 [transform:translate(-50%,-50%)]">
          No data available for the selected date range.
        </div>
      )}
    </div>
  );
};

export default CalendarView;

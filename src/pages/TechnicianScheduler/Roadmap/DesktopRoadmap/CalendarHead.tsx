import dayjs from 'dayjs';
import React, { memo, useEffect } from 'react';
import { DaysBetweenDates } from 'src/components/Activity/Report/Roadmap/Calendar';

type CalendarHeadProps = {
  dayPixel: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
};

function CalendarHead({ dayPixel, startDate, endDate }: CalendarHeadProps) {
  const [totalDay, setTotalDay] = React.useState(0);
  const [dates, setDates] = React.useState(null);

  useEffect(() => {
    setTotalDay(endDate.diff(startDate, 'day') + 1);
    setDates(DaysBetweenDates('week', startDate, endDate));
  }, [startDate, endDate]);

  return (
    dates && (
      <ul
        className="sticky top-0 z-[2] flex h-[--header-h] overflow-hidden bg-[--dark-primary,white]"
        style={{
          minWidth: totalDay * dayPixel,
          maxWidth: totalDay * dayPixel
        }}
      >
        {Array.from(dates, (date: any, index) => {
          return (
            <li
              key={index}
              className="group relative flex list-none flex-col border-b [&:not(:last-child)]:border-r"
              style={{ minWidth: dayjs(date).daysInMonth() * dayPixel, maxWidth: dayjs(date).daysInMonth() * dayPixel }}
            >
              <p className="flex flex-grow items-center justify-center border-b text-center text-[14px] font-bold text-gray-400">
                {dayjs(date).format('MMM YYYY').toUpperCase()}
              </p>
              <div className="flex">
                {Array.from(Array(dayjs(date).daysInMonth()), (data, index) => {
                  return (
                    <div
                      key={index}
                      style={{
                        minWidth: dayPixel,
                        maxWidth: dayPixel,
                        textAlign: 'center'
                      }}
                      className="[&:not(:last-child)]:border-r"
                    >
                      <p className="text-[14px] font-bold text-[#777575]">
                        {dayjs(dayjs(date).format('YYYY-MM') + '-' + (index + 1)).format('ddd')[0]}{' '}
                        {dayjs(dayjs(date).format('YYYY-MM') + '-' + (index + 1)).format('D')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    )
  );
}

export default memo(CalendarHead);

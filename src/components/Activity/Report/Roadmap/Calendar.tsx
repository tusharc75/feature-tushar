import React, { useEffect, memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

export const DaysBetweenDates = function (calendarType, startDate, endDate) {
  var dateList = [];
  if (calendarType === 'month' || calendarType === 'week') {
    while (endDate > startDate || startDate.format('M') === endDate.format('M')) {
      dateList.push(startDate.format('YYYY-MM-DD'));
      startDate.add(1, 'month');
    }
  } else {
    let years = [];
    years.push(dayjs().year() - 1);
    years.push(dayjs().year());
    years.push(dayjs().year() + 1);

    for (let year of years) {
      dateList.push({
        q_s_date: dayjs().year(year).month(0).startOf('month'),
        q_e_date: dayjs().year(year).month(2).endOf('month'),
        days: dayjs().year(year).month(2).endOf('month').diff(dayjs().year(year).month(0).startOf('month'), 'days') + 1
      });
      dateList.push({
        q_s_date: dayjs().year(year).month(3).startOf('month'),
        q_e_date: dayjs().year(year).month(5).endOf('month'),
        days: dayjs().year(year).month(5).endOf('month').diff(dayjs().year(year).month(3).startOf('month'), 'days') + 1
      });
      dateList.push({
        q_s_date: dayjs().year(year).month(6).startOf('month'),
        q_e_date: dayjs().year(year).month(8).endOf('month'),
        days: dayjs().year(year).month(8).endOf('month').diff(dayjs().year(year).month(6).startOf('month'), 'days') + 1
      });
      dateList.push({
        q_s_date: dayjs().year(year).month(9).startOf('month'),
        q_e_date: dayjs().year(year).month(11).endOf('month'),
        days: dayjs().year(year).month(11).endOf('month').diff(dayjs().year(year).month(9).startOf('month'), 'days') + 1
      });
    }
  }
  return dateList;
};

function Calendar({ calendarType, dayPixel, startDate, endDate }) {
  const [totalDay, setTotalDay] = React.useState(0);
  const [dates, setDates] = React.useState(null);
  const [calType, setCalType] = React.useState(calendarType);

  useEffect(() => {
    setCalType(calendarType);
    setTotalDay(endDate.diff(startDate, 'days') + 1);
    setDates(DaysBetweenDates(calendarType, startDate, endDate));
  }, [calendarType]);

  return (
    dates &&
    calType === calendarType && (
      <Box
        height={60}
        display="flex"
        width={totalDay * dayPixel}
        className="bg-[var(--dark-primary, white)] sticky top-0 z-[2]"
        style={{ borderBottom: '1px solid var(--common-border-color)' }}
      >
        {calendarType === 'week'
          ? Array.from(dates, (date: any, index) => {
              return (
                <Box key={index} borderColor="var(--common-border-color)" minWidth={dayjs(date).daysInMonth() * dayPixel}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {dayjs(date).format('MMM YYYY').toUpperCase()}
                  </Typography>
                  {Array.from(Array(dayjs(date, 'YYYY-MM-DD').daysInMonth()), (data, index) => {
                    return (
                      <div
                        key={index}
                        style={{
                          minWidth: dayPixel,
                          maxWidth: dayPixel,
                          textAlign: 'center',
                          float: 'left',
                          borderLeft: '1px solid #dfdfdf'
                        }}
                      >
                        <Typography variant="body2" color={'textSecondary'} display="block">
                          {dayjs(dayjs(date).add(index, 'd')).format('ddd')[0]}
                        </Typography>
                        <Typography variant="caption" color={'textSecondary'} display="block">
                          {dayjs(dayjs(date).add(index, 'd')).format('D')}
                        </Typography>
                      </div>
                    );
                  })}
                </Box>
              );
            })
          : null}
        {calendarType === 'month'
          ? Array.from(dates, (date: any, index) => {
              return (
                <Box
                  key={index}
                  p={2}
                  display="inline"
                  minWidth={dayjs(date).daysInMonth() * dayPixel}
                  border={1}
                  borderColor="var(--common-border-color)"
                  textAlign="center"
                >
                  <Typography variant="body2" color="textSecondary" display="block">
                    {dayjs(date).format('MMM YYYY').toUpperCase()}
                  </Typography>
                </Box>
              );
            })
          : null}
        {calendarType === 'quater'
          ? dates.map((date, index) => (
              <Box
                key={index}
                p={2}
                display="inline"
                minWidth={dayPixel * parseInt(date.days)}
                border={1}
                borderColor="var(--common-border-color)"
                textAlign="center"
              >
                <Typography variant="body2" display="block">
                  {(
                    dayjs(date.q_s_date).format('MMM') +
                    ' - ' +
                    dayjs(date.q_e_date).format('MMM') +
                    ' ' +
                    dayjs(date.q_s_date).format('YYYY')
                  ).toUpperCase()}
                </Typography>
              </Box>
            ))
          : null}
      </Box>
    )
  );
}

export default memo(Calendar);

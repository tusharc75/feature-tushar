import React, { useEffect, memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { DaysBetweenDates } from 'src/components/Activity/Report/Roadmap/Calendar';

function Calendar({ calendarType, dayPixel, startDate, endDate }) {
  const [totalDay, setTotalDay] = React.useState(0);
  const [dates, setDates] = React.useState(null);
  const [calType, setCalType] = React.useState(calendarType);

  useEffect(() => {
    setCalType(calendarType);
    setTotalDay(endDate.diff(startDate, 'day') + 1);
    setDates(DaysBetweenDates(calendarType, startDate, endDate));
  }, [calendarType, startDate, endDate]);

  return (
    dates &&
    calType === calendarType && (
      <Box
        height={60}
        display="flex"
        width={totalDay * dayPixel}
        bgcolor="var(--dark-secondary, white)"
        style={{ position: 'sticky', top: 0, zIndex: 2 }}
      >
        {calendarType === 'week'
          ? Array.from(dates, (date: any, index) => {
            return (
              <Box key={index} borderColor="var(--common-border-color)" minWidth={dayjs(date).daysInMonth() * dayPixel}>
                <Typography variant="caption" color="textSecondary" display="block">
                  {dayjs(date).format('MMM YYYY').toUpperCase()}
                </Typography>
                {Array.from(Array(dayjs(date).daysInMonth()), (data, index) => {
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
                        {dayjs(dayjs(date).format('YYYY-MM') + '-' + (index + 1)).format('ddd')[0]}
                      </Typography>
                      <Typography variant="caption" color={'textSecondary'} display="block">
                        {dayjs(dayjs(date).format('YYYY-MM') + '-' + (index + 1)).format('D')}
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

import React, { useEffect, memo } from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';

const DaysBetweenDates = function (calendarType, startDate, endDate) {
  var dateList = [];
  if (calendarType === 'month' || calendarType === 'week') {
    while (endDate > startDate || startDate.format('M') === endDate.format('M')) {
      dateList.push(startDate.format('YYYY-MM-DD'));
      startDate.add(1, 'month');
    }
  } else {
    let years = [];
    years.push(moment().year() - 1);
    years.push(moment().year());
    years.push(moment().year() + 1);

    for (let year of years) {
      dateList.push({
        q_s_date: moment().year(year).month(0).startOf('month'),
        q_e_date: moment().year(year).month(2).endOf('month'),
        days: moment().year(year).month(2).endOf('month').diff(moment().year(year).month(0).startOf('month'), 'days') + 1
      });
      dateList.push({
        q_s_date: moment().year(year).month(3).startOf('month'),
        q_e_date: moment().year(year).month(5).endOf('month'),
        days: moment().year(year).month(5).endOf('month').diff(moment().year(year).month(3).startOf('month'), 'days') + 1
      });
      dateList.push({
        q_s_date: moment().year(year).month(6).startOf('month'),
        q_e_date: moment().year(year).month(8).endOf('month'),
        days: moment().year(year).month(8).endOf('month').diff(moment().year(year).month(6).startOf('month'), 'days') + 1
      });
      dateList.push({
        q_s_date: moment().year(year).month(9).startOf('month'),
        q_e_date: moment().year(year).month(11).endOf('month'),
        days: moment().year(year).month(11).endOf('month').diff(moment().year(year).month(9).startOf('month'), 'days') + 1
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
      <Box height={60} display="flex" width={totalDay * dayPixel} bgcolor="grey.200" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
        {calendarType === 'week'
          ? Array.from(dates, (date, index) => {
              return (
                <Box key={index} borderColor="grey.300" minWidth={moment(date).daysInMonth() * dayPixel}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    {moment(date).format('MMM YYYY').toUpperCase()}
                  </Typography>
                  {Array.from(Array(moment(date).daysInMonth()), (data, index) => {
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
                          {moment(moment(date).format('YYYY-MM') + '-' + (index + 1)).format('ddd')[0]}
                        </Typography>
                        <Typography variant="caption" color={'textSecondary'} display="block">
                          {moment(moment(date).format('YYYY-MM') + '-' + (index + 1)).format('D')}
                        </Typography>
                      </div>
                    );
                  })}
                </Box>
              );
            })
          : null}
        {calendarType === 'month'
          ? Array.from(dates, (date, index) => {
              return (
                <Box
                  key={index}
                  p={2}
                  display="inline"
                  minWidth={moment(date).daysInMonth() * dayPixel}
                  border={1}
                  borderColor="grey.300"
                  textAlign="center"
                >
                  <Typography variant="body2" color="textSecondary" display="block">
                    {moment(date).format('MMM YYYY').toUpperCase()}
                  </Typography>
                </Box>
              );
            })
          : null}
        {calendarType === 'quater'
          ? dates.map((date, index) => (
              <Box key={index} p={2} display="inline" minWidth={dayPixel * parseInt(date.days)} border={1} borderColor="grey.300" textAlign="center">
                <Typography variant="body2" display="block">
                  {(
                    moment(date.q_s_date).format('MMM') +
                    ' - ' +
                    moment(date.q_e_date).format('MMM') +
                    ' ' +
                    moment(date.q_s_date).format('YYYY')
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

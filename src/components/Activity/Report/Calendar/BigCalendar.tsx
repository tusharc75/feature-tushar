import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useHistory } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import { dayNamesShort, displayDate } from 'src/constants/helpers';
import dayjs from 'dayjs';

const useStyles = makeStyles((theme: Theme) => ({
  fontBold: {
    fontWeight: 500,
    color: theme.palette.primary.main
  },
  minusMargin: {
    margin: '-1px'
  },
  tdWidth: {
    width: '14.2857%!important'
  },
  calHeader: {
    fontSize: theme.spacing(2),
    color: '#a8a6a6',
    background: 'white'
  },
  calTask: {
    backgroundColor: '#efefef',
    borderLeft: '3px solid #d46101',
    fontSize: '0.70rem',
    color: '#5a5959',
    fontWeight: 500,
    padding: '3px'
  },
  calContent: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '-1px',
    flexDirection: 'column',
    background: 'white'
  },
  tableContent: {
    height: 'calc(100vh - 31vh)',
    overflow: 'auto'
  }
}));

const GetDays = function (month, year) {
  let blank_days = [];

  let preMonth = dayjs(year + '-' + month + '-01')
    .subtract(1, 'month')
    .format('MM');
  let nextMonth = dayjs(year + '-' + month + '-01')
    .subtract(1, 'month')
    .format('MM');
  let blankDay = parseInt(
    dayjs(year + '-' + month + '-01')
      .startOf('month')
      .format('d')
  );
  for (let i = 1; i <= blankDay; i++) {
    blank_days.push({
      day:
        parseInt(
          dayjs(year + '-' + preMonth + '-01')
            .endOf('month')
            .format('DD')
        ) -
        (blankDay - i),
      month: preMonth
    });
  }

  let days_in_month = [];
  for (let d = 1; d <= dayjs(year + '-' + month + '-01').daysInMonth(); d++) {
    days_in_month.push({ day: d, month: month });
  }
  var total_slot = [...blank_days, ...days_in_month];

  let rows = [];
  let cells = [];

  total_slot.forEach((row, i) => {
    if (i % 7 !== 0) {
      cells.push(row);
    } else {
      rows.push(cells);
      cells = [];
      cells.push(row);
    }
    if (i === total_slot.length - 1) {
      rows.push(cells);
    }
  });

  rows.forEach((row, i) => {
    if (i === rows.length - 1) {
      if (row.length < 7) {
        let NextMonthDays = 7 - row.length;
        for (let i = 1; i <= NextMonthDays; i++) {
          row.push({ day: i, month: nextMonth });
        }
      }
    }
  });
  return rows;
};

export default function BigCalendar({ type, activity }) {
  const history = useHistory();
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());

  const handlechange = (type) => {
    if (type === 'next') {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    } else {
      if (month === 1) {
        setMonth(12);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    }
  };

  const handleActivityOpen = (activityId) => {
    history.push({
      pathname: '/activity/' + type,
      search: '?activityType=' + type + '&activityId=' + activityId
    });
  };

  let days = GetDays(month, year);
  const classes = useStyles();

  return (
    <Box>
      <Box display="flex" flexDirection="row" className="gap-2" p={1}>
        <Box className="d-flex align-items-center">
          <IconButton className="p-0" aria-label="delete" onClick={() => handlechange('pre')}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton className="p-0" aria-label="delete" onClick={() => handlechange('next')}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Box className="d-flex align-items-center">
          <Typography className={classes.fontBold}>
            {dayjs(month, 'MM').format('MMMM')} - {year}
          </Typography>
        </Box>
      </Box>
      <Box className={classes.tableContent}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              {dayNamesShort.map((day, key) => (
                <td key={key} className={classes.tdWidth}>
                  <Box border={0.7} borderColor="var(--common-border-color)" className={classes.minusMargin} p={1}>
                    <Typography className={classes.calHeader}>{day}</Typography>
                  </Box>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((_days, key) => (
              <tr key={key}>
                {_days.map((_day, key) => (
                  <td key={key} className={classes.tdWidth}>
                    <Box className={classes.calContent} border={0.7} borderColor="var(--common-border-color)" minHeight={100} maxHeight={100}>
                      <Box pl={1} pt={1}>
                        <Typography className={_day.month == month ? classes.fontBold : ''}>{_day.day}</Typography>
                      </Box>
                      {activity
                        .filter(
                          (data) =>
                            displayDate(data.dueDate) ===
                            year + '-' + _day.month.toString().padStart(2, '0') + '-' + _day.day.toString().padStart(2, '0')
                        )
                        .map(
                          (_data, key) =>
                            key === 0 && (
                              <Box style={{ cursor: 'pointer' }} key={key} onClick={() => handleActivityOpen(_data._id)}>
                                <Typography className={classes.calTask}>{_data.name}</Typography>
                              </Box>
                            )
                        )}
                    </Box>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}

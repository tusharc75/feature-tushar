import React, { useEffect, memo } from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';
import { Virtualizer } from '@tanstack/react-virtual';

const getAllDaysInMonthFormatted = (date: moment.Moment): string[] => {
  const daysInMonth = date.daysInMonth();
  const days: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(moment(date).date(day).format('D dd'));
  }
  return days;
};

const DaysBetweenDates = (startDate: moment.Moment, endDate: moment.Moment): [{ month: string; dates: string[] }[], allDates: string[]] => {
  const week: { month: string; dates: string[] }[] = [];
  const allDates: string[] = [];
  const totalMonths = endDate.diff(startDate, 'months');
  for (let i = 0; i <= totalMonths; i++) {
    const date = startDate.clone().add(i, 'months');
    const result = date.format('MMM YYYY');
    const dates = getAllDaysInMonthFormatted(date);
    const obj: { month: string; dates: string[] } = { month: result, dates };
    week.push(obj);
    allDates.push(...dates);
  }
  return [week, allDates];
};

type CalendarProps = {
  dayPixel: number;
  startDate: moment.Moment;
  endDate: moment.Moment;
  columnVirtualizer: Virtualizer<any, Element>;
};

function Calendar({ dayPixel, startDate, endDate, columnVirtualizer }: CalendarProps) {
  const [dates, setDates] = React.useState<{ month: string; dates: string[] }[] | null>(null);
  const [allDates, setAllDates] = React.useState<string[]>([]);

  useEffect(() => {
    const [dates, allDates] = DaysBetweenDates(startDate, endDate);
    setAllDates(allDates);
    setDates(dates);
  }, [startDate, endDate]);

  return (
    dates && (
      <Box className="sticky top-0 z-20 h-[60px] bg-[var(--dark-secondary,white)] ">
        <div className="-my-[1px] flex">
          {dates?.map((d) => (
            <Box
              key={d.month}
              className="  bg-[var(--dark-secondary,white)] [border-left:1px_solid_var(--common-border-color)]"
              minWidth={d.dates.length * dayPixel}
            >
              <Typography variant="caption" color="textSecondary" className="text-center" display="block">
                {d.month}
              </Typography>
            </Box>
          ))}
        </div>
        <div
          className="flex"
          style={{
            width: `${columnVirtualizer.getTotalSize()}px`,
            position: 'relative'
          }}
        >
          {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
            <Box
              key={virtualColumn.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: `100%`,
                transform: `translateX(${virtualColumn.start}px)`,
                width: dayPixel
              }}
            >
              <div className="bg-[var(--dark-secondary,white)] text-center [border-bottom:1px_solid_var(--common-border-color)] [border-left:1px_solid_var(--common-border-color)]">
                <Typography variant="body2" color={'textSecondary'} display="block">
                  {allDates[virtualColumn.index].split(' ')[0]}
                </Typography>
                <Typography variant="caption" color={'textSecondary'} display="block">
                  {allDates[virtualColumn.index].split(' ')[1]}
                </Typography>
              </div>
            </Box>
          ))}
          {/* {allDates.map((date) => (
            <div
              key={date}
              style={{
                minWidth: dayPixel,
                maxWidth: dayPixel,
                textAlign: 'center',
                float: 'left',
                borderLeft: '1px solid #dfdfdf'
              }}
              className="[border-bottom:1px_solid_var(--common-border-color)]"
            >
              <Typography variant="body2" color={'textSecondary'} display="block">
                {date.split(' ')[0]}
              </Typography>
              <Typography variant="caption" color={'textSecondary'} display="block">
                {date.split(' ')[1]}
              </Typography>
            </div>
          ))} */}
        </div>
      </Box>
    )
  );
}

export default memo(Calendar);

import dayjs, { Dayjs } from "dayjs";

type GetDaysBetweenDatesOutput = string | { [key: string]: string[] };

const getAllDaysInMonthFormatted = (date: Dayjs): string[] => {
  const daysInMonth = date.daysInMonth();
  const days: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(dayjs(date).date(day).format('D dd'));
  }

  return days;
};

const getQuarterDetails = (date: Dayjs): string => {
  const startOfQuarter = date.clone().startOf('quarter');
  const endOfQuarter = date.clone().endOf('quarter');

  const startMonth = startOfQuarter.format('MMM');
  const endMonth = endOfQuarter.format('MMM');
  const year = startOfQuarter.format('YYYY');

  return `${startMonth} - ${endMonth} ${year}`;
};

const getDifference = (startDate: Dayjs, endDate: Dayjs, type: 'quarter' | 'week' | 'month') => {
  const diff = endDate.diff(startDate, type);
  return diff;
};

export const getDaysBetweenDates = (
  view: 'month' | 'week' | 'quarter',
  startDate: Dayjs,
  endDate: Dayjs
): GetDaysBetweenDatesOutput[] => {
  const monthList: string[] = [];
  const weekList: { [key: string]: string[] }[] = [];
  const quarterList: string[] = [];

  switch (view) {
    case 'month': {
      const totalMonths = endDate.diff(startDate, 'month');
      for (let i = 0; i <= totalMonths; i++) {
        monthList.push(startDate.clone().add(i, 'month').format('MMM YYYY'));
      }
      return monthList;
    }
    case 'week': {
      const totalMonths = endDate.diff(startDate, 'month');
      for (let i = 0; i <= totalMonths; i++) {
        const date = startDate.clone().add(i, 'month');
        const result = date.format('MMM YYYY');
        const obj = { [result]: getAllDaysInMonthFormatted(date) };
        weekList.push(obj);
      }
      return weekList;
    }
    case 'quarter': {
      const totalQuarters = endDate.diff(startDate, 'quarter');
      for (let i = 0; i <= totalQuarters; i++) {
        quarterList.push(getQuarterDetails(startDate.clone().add(i, 'quarter')));
      }
      return quarterList;
    }
    default:
      throw new Error('Invalid view type');
  }
};

export function getTableRow<T>(
  startDate: Dayjs,
  endDate: Dayjs,
  dataStartDate: Dayjs,
  dataEndDate: Dayjs,
  renderer: (data: T) => React.ReactNode,
  data: T,
  view: 'month' | 'week' | 'quarter',
  index: number
) {
  const days = getDaysBetweenDates(view, startDate, endDate);
  let difference = getDifference(startDate, endDate, 'week');
  if (view === 'month') {
    difference = getDifference(startDate, endDate, 'month');
  }
  if (view === 'quarter') {
    difference = getDifference(startDate, endDate, 'quarter');
  }

  const row: React.ReactNode[] = [];

  switch (view) {
    case 'month': {
      for (let i = 0; i <= difference; i++) {
        row.push(
          <td key={i} className="border-b border-r border-[#eaeaea] dark:border-[#ffffff17]">
            {renderer(data)}
          </td>
        );
      }
      break;
    }
    case 'week': {
      for (let i = 0; i <= difference; i++) {
        row.push(
          <td key={i} className="border-b border-r border-[#eaeaea] dark:border-[#ffffff17]">
            {renderer(data)}
          </td>
        );
      }
      break;
    }
    case 'quarter': {
      for (let i = 0; i <= difference; i++) {
        row.push(
          <td key={i} className="border-b border-r border-[#eaeaea] dark:border-[#ffffff17]">
            {renderer(data)}
          </td>
        );
      }
      break;
    }
    default:
      throw new Error('Invalid view type');
  }

  return row;
}

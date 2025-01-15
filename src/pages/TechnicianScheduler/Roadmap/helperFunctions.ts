import dayjs from 'dayjs';

type TPriority = 'low' | 'medium' | 'high';

export const getPriority = (status: string = ''): TPriority => {
  const priority: TPriority[] = ['low', 'medium', 'high'];
  const priorityMap = {
    Assigned: 0
  };
  if (status) {
    return priority[priorityMap[status]] as TPriority;
  }

  return priority[Math.floor(Math.random() * priority.length)];
};

export const getColorFromPriority = (priority): string => {
  let color = '[border-left:9px_solid_#0273FF] dark:[border-left:9px_solid_#0273FF]';
  if (priority === 'low') {
    color = '[border-left:9px_solid_#0273FF] dark:[border-left:9px_solid_#0273FF]';
  }
  if (priority === 'medium') {
    color = '[border-left:9px_solid_orange] dark:[border-left:9px_solid_orange]';
  }
  if (priority === 'high') {
    color = '[border-left:9px_solid_#B66A11] dark:[border-left:9px_solid_#B66A11]';
  }
  return `${color} ${priority}`;
};

// export const getPositionOfDate = (taskStartDate, taskEndDate, totalDays, singleDayWidth, totalContainerWidth): React.CSSProperties => {
//   return {
//     left: (100 * dayjs(taskStartDate).diff(startDate, 'day')) / totalDay + '%',
//     right: (100 * endDate.diff(dayjs(taskEndDate), 'day')) / totalDay + '%'
//   } as React.CSSProperties;
// };

// export const getPositionOfDate = (taskStartDate, taskEndDate, rangeStartDate, rangeEndDate, totalDays, singleDayWidth) => {
//   const totalContainerWidth = totalDays * singleDayWidth;
//   const startDate = dayjs(taskStartDate);
//   const endDate = dayjs(taskEndDate);
//   const totalDuration = endDate.diff(startDate, 'day') + 1;
//   const leftPosition = startDate.diff(dayjs().startOf('day'), 'day') * singleDayWidth;
//   const rightPosition = leftPosition + totalDuration * singleDayWidth;
//   return { left: `${leftPosition}px`, right: `${totalContainerWidth - rightPosition}px` };
// };
export const getPositionOfDate = (taskStartDate, taskEndDate, rangeStartDate, singleDayWidth) => {
  const startDate = dayjs(taskStartDate);
  const endDate = dayjs(taskEndDate);
  const rangeStart = dayjs(rangeStartDate);
  const totalDuration = endDate.diff(startDate, 'day') + 1;
  const leftPosition = startDate.diff(rangeStart, 'day') * singleDayWidth;
  return { left: `${leftPosition}px`, width: `${Math.max(singleDayWidth * totalDuration, singleDayWidth)}px` };
};

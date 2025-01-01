import dayjs from "dayjs";

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
  let color = 'bg-[#EFF8FF] dark:bg-[#B0C4DE]';
  if (priority === 'low') {
    color = 'bg-[#EFF8FF] dark:bg-[#B0C4DE]';
  }
  if (priority === 'medium') {
    color = 'bg-[#FEF5D6] dark:bg-[#DAA520]';
  }
  if (priority === 'high') {
    color = 'bg-[#FFEEF3] dark:bg-[#FFB6C1]';
  }
  return color;
};

export const getPositionOfDate = (taskStartDate, taskEndDate, startDate, endDate, totalDay): React.CSSProperties => {
  return {
    left: (100 * dayjs(taskStartDate).diff(startDate, 'days')) / totalDay + '%',
    right: (100 * endDate.diff(dayjs(taskEndDate), 'days')) / totalDay + '%'
  } as React.CSSProperties;
};

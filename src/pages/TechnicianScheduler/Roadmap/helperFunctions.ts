import moment from 'moment';

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

export const getColorFromPriority = (priority): React.CSSProperties => {
  let color = { backgroundColor: '#EFF8FF' } as React.CSSProperties;
  if (priority === 'low') {
    color = { backgroundColor: '#EFF8FF' } as React.CSSProperties;
  }
  if (priority === 'medium') {
    color = { backgroundColor: '#FEF5D6' } as React.CSSProperties;
  }
  if (priority === 'high') {
    color = { backgroundColor: '#FFEEF3' } as React.CSSProperties;
  }
  return color;
};

export const getPositionOfDate = (taskStartDate, taskEndDate, startDate, endDate, totalDay): React.CSSProperties => {
  return {
    left: (100 * moment(taskStartDate).diff(startDate, 'days')) / totalDay + '%',
    right: (100 * endDate.diff(moment(taskEndDate), 'days')) / totalDay + '%'
  } as React.CSSProperties;
};

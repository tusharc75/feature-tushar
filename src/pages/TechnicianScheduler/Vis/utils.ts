import dayjs from 'dayjs';
import { Activity } from 'src/pages/TechnicianScheduler/Vis/types';

type TPriority = 'low' | 'medium' | 'high' | 'UnAvailable';

export const getPriority = (status: string = ''): TPriority => {
  const priority: TPriority[] = ['low', 'medium', 'high', 'UnAvailable'];
  const priorityMap = {
    Assigned: 0,
    UnAvailable: 3
  };
  if (status) {
    return priority[priorityMap[status]] as TPriority;
  }
  return 'low';
};

export const getColorFromPriority = (priority): string => {
  let color = '[border-left:5px_solid_#0273FF] dark:[border-left:5px_solid_#0273FF]';
  if (priority === 'low') {
    color = '[border-left:5px_solid_#0273FF] dark:[border-left:5px_solid_#0273FF]';
  }
  if (priority === 'medium') {
    color = '[border-left:5px_solid_orange] dark:[border-left:5px_solid_orange]';
  }
  if (priority === 'high') {
    color = '[border-left:5px_solid_#B66A11] dark:[border-left:5px_solid_#B66A11]';
  }
  if (priority === 'UnAvailable') {
    color = '!bg-red-700/70';
  }
  return `${color} ${priority}`;
};

export const hasDateOverlap = (
  schedules: Activity['technicianHistory'] | Activity['technicianUnavailability'],
  startDate: Dayjs,
  endDate: Dayjs
): boolean => {
  return schedules?.some((schedule) => {
    const scheduleStart = dayjs(schedule.startDate || schedule.reference?.estimateStartDate);
    const scheduleEnd = dayjs(schedule.endDate || schedule.reference?.estimateEndDate);
    return startDate.isSameOrBefore(scheduleEnd) && endDate.isSameOrAfter(scheduleStart);
  });
};

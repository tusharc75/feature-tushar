import dayjs, { Dayjs } from 'dayjs';
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

export const handleDragPreview = (event: React.DragEvent<HTMLElement>, callback = () => {}, options = { opacity: 0.8 }) => {
  const original = event.target as HTMLElement;
  if (!original) return;

  // Create an invisible drag image
  const img = new Image();
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=='; // 1x1 transparent svg

  // Set drag image to the invisible image
  event.dataTransfer?.setDragImage(img, 0, 0);

  // Clone the original element
  const clone = original.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.pointerEvents = 'none'; // So it doesn't block mouse events
  clone.style.opacity = `${options.opacity || 0.8}`;
  clone.style.zIndex = '9999';

  // Set clone size same as original
  const rect = original.getBoundingClientRect();
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;

  // Add clone to body
  document.body.appendChild(clone);

  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  // Move clone to initial cursor position
  moveClone(event.clientX, event.clientY);

  function moveClone(x: number, y: number) {
    window.requestAnimationFrame(() => {
      clone.style.left = `${x - offsetX}px`;
      clone.style.top = `${y - offsetY}px`;
    });
  }

  // dragover handler to move the clone
  function onDragOver(e: DragEvent) {
    e.preventDefault(); // Needed to allow drop event to fire
    moveClone(e.clientX + window.scrollX, e.clientY + window.scrollY);
  }

  // drop handler to cleanup
  function onDrop(e: DragEvent) {
    e.preventDefault();
    cleanup();
    classNamesCleanup();
  }

  // dragend handler to cleanup if drop not fired
  function onDragEnd(e: DragEvent) {
    cleanup();
  }

  function cleanup() {
    callback();
    if (clone.parentElement) clone.parentElement.removeChild(clone);
    window.removeEventListener('dragover', onDragOver);
    window.removeEventListener('drop', onDrop);
    window.removeEventListener('dragend', onDragEnd);
  }

  window.addEventListener('dragover', onDragOver);
  window.addEventListener('drop', onDrop);
  window.addEventListener('dragend', onDragEnd);
};

export const GROUP_HIGHLIGHT_CLASSES = ['bg-gray-200', 'dark:bg-gray-800'] as const;

export const classNamesCleanup = () => {
  const allElement = document.querySelectorAll('.vis-group');
  allElement.forEach((e) => e.classList.remove(...GROUP_HIGHLIGHT_CLASSES));
};
export const SHOW_MESSAGE_KEY = 'equipt-show-timeline-controls';

export function calculateRatio(a: number, b: number, c: number): number {
  if (b === 0 || c === 0) {
    throw new Error('Denominators cannot be zero.');
  }
  return c * (b / a);
}

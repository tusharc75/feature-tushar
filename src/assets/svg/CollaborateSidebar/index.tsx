import routes from 'src/components/Helpers/Routes';
import { AttachmentIcon, CalendarIcon, CaseIcon, EmailIcon, EventIcon, NoteIcon, ReminderIcon, TaskIcon, WorkSpaceIcon } from './icons';

export const IconEventMap = {
  Task: <TaskIcon />,
  Event: <EventIcon />,
  Case: <CaseIcon />,
  Note: <NoteIcon />,
  Email: <EmailIcon />,
  Attachment: <AttachmentIcon />,
  Calendar: <CalendarIcon />,
  [routes.workSpace.title]: <WorkSpaceIcon />,
  Collaborate: <WorkSpaceIcon />,
  Reminder: <ReminderIcon />
} as const;

export const getCollaborateIconBasedOnName = (name: string) => {
  if (!name) return;
  let icon = null;
  Object.keys(IconEventMap).forEach((key) => {
    const lowercase = key.toLocaleLowerCase();
    const singularAndPlural = [`${lowercase}`, `${lowercase}s`];
    if (singularAndPlural.includes(name.toLocaleLowerCase())) {
      console.log('name', name);
      icon = IconEventMap[key];
    }
  });
  return icon;
};

export * from './icons';

import { AttachmentIcon, CalendarIcon, CaseIcon, EmailIcon, EventIcon, NoteIcon, ReminderIcon, TaskIcon, WorkSpaceIcon } from './icons';

export const IconEventMap = {
  'task tasks': <TaskIcon />,
  'event events': <EventIcon />,
  'case cases': <CaseIcon />,
  'note notes': <NoteIcon />,
  'email emails': <EmailIcon />,
  'attachment attachments': <AttachmentIcon />,
  'calendar calendars ': <CalendarIcon />,
  'collaborate work space': <WorkSpaceIcon />,
  'reminder reminders': <ReminderIcon />
} as const;

export const getCollaborateIconBasedOnName = (name: string) => {
  if (!name) return;
  let icon = IconEventMap['collaborate work space'];
  Object.keys(IconEventMap).forEach((key) => {
    if (key.includes(name.toLocaleLowerCase())) {
      icon = IconEventMap[key];
    }
  });
  return icon;
};

export * from './icons';

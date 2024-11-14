import { ImgHTMLAttributes } from 'react';
import { cn } from 'src/constants/helpers';
import AttachmentImage from './attachment.png';
import CalendarImage from './calendar.png';
import CaseImage from './case.png';
import ChatImage from './chat.png';
import EmailImage from './email.png';
import EventImage from './event.png';
import HistoryImage from './history.png';
import NoteImage from './note.png';
import ReminderImage from './reminder.png';
import TaskImage from './task.png';
import WorkSpace from './workSpace.png';

type ImageProps = { size?: number } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>;

export const TaskIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={TaskImage} alt="Tasks" {...rest} />;
};

export const CalendarIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={CalendarImage} alt="Calendar" {...rest} />;
};

export const ReminderIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={ReminderImage} alt="Reminders" {...rest} />;
};

export const CaseIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={CaseImage} alt="Cases" {...rest} />;
};

export const NoteIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={NoteImage} alt="Notes" {...rest} />;
};

export const EmailIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={EmailImage} alt="Emails" {...rest} />;
};
export const WorkSpaceIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={WorkSpace} alt="Work Space" {...rest} />;
};

export const EventIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={EventImage} alt="Chat" {...rest} />;
};

export const AttachmentIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={AttachmentImage} alt="Attachments" {...rest} />;
};

export const HistoryIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={HistoryImage} alt="History" {...rest} />;
};

export const ChatBoxIcon = ({ size = 25, className, ...rest }: ImageProps) => {
  return <img className={cn('h-auto w-full', className)} width={size} height={size} src={ChatImage} alt="Chat" {...rest} />;
};

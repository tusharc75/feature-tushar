import useDesktopDM from 'src/components/DesktopDM/useDesktopDM';

export type WindowOpenState = 'fullyOpen' | 'partial' | null | undefined;
export type OpenedChat = { open: WindowOpenState; id: string; type: 'user' | 'chat' | 'genie' };

export type UIState = {
  mainWindow: WindowOpenState;
  openedChats: OpenedChat[];
};

export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  concatedName: string;
  avatar: string;
};

export type Chat = {
  _id?: string;
  brand?: string;
  members?: MessageUser[];
  type?: 'chat';
  createdBy?: CreatedBy;
  isOwner?: boolean;
  title?: string;
  to?: MessageUser;
  notifications?: number;
  recentMessage: RecentMessage;
};
export type RecentMessage = {
  message?: string;
  date?: Date;
  sender?: Sender;
};
export type Sender = {
  optionValue?: string;
  optionLabel?: string;
};

export type CreatedBy = {
  user?: string;
  date?: Date;
};

export type Message = {
  _id?: string;
  brand?: string;
  channel?: string;
  message?: string;
  parentId?: null;
  date?: Date;
  user?: MessageUser;
  attachments?: Attachment[];
  replies?: any[];
  reactions?: any[];
  pinned?: boolean;
  lastModified?: string;
};
export type Attachment = {
  _id: string;
  fileName: string;
  url: string;
};

export type MessageUser = {
  optionValue: string;
  optionLabel: string;
  avatar: string;
};

export type UseDesktopDM = ReturnType<typeof useDesktopDM>;

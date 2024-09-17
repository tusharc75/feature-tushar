export type TChannel = {
  _id: string;
  brand: string;
  title: string;
  description: string;
  access: string;
  members: string[];
  createdBy: CreatedBy;
  notifications?: number;
};

export type CreatedBy = {
  user: string;
  date: Date;
};

export type ChannelData = {
  _id: string;
  brand: string;
  title: string;
  description: string;
  access: string;
  members: Member[];
  createdBy: CreatedBy;
  updatedBy: CreatedBy;
};

export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  concatedName: string;
};

export type Member = {
  optionValue: string;
  optionLabel: string;
  avatar: string;
};

export type Message = {
  _id: string;
  brand: string;
  channel: string;
  message: string;
  parentId?: null | string;
  date: Date;
  user: MessageUser;
  replies: Message[];
  lastModified?: Date;
  avatar?: string;
  attachments?: any[];
  reactions?: any[];
};

export type MessageUser = {
  optionValue: string;
  optionLabel: string;
};

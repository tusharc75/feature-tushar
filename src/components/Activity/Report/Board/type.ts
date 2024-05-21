import StatusList from 'src/components/Activity/Helpers/statusList';

export type Column = {
  _id: string;
  status: Status;
  items: ColumnItem[];
};

export type ColumnItem = {
  _id: string;
  brand: string;
  name: string;
  description: string;
  status: Status;
  parentId: null;
  assignee: string[] | number;
  reporter: string;
  startDate: Date;
  dueDate: Date;
  relatedTo: ItemRelatedTo[];
  createdBy: AtedBy;
  position: number;
  updatedBy?: AtedBy;
  childTask: ChildTask[];
  type: Type;
  oldCreatedBy?: OldAtedBy[];
  oldUpdatedBy?: OldAtedBy[];
};

export type ChildTask = {
  _id: string;
  brand: string;
  name: string;
  description: string;
  status: Status;
  parentId: string;
  assignee: number;
  reporter: string;
  startDate: Date;
  dueDate: Date;
  relatedTo: ChildTaskRelatedTo[];
  createdBy: AtedBy;
  position: number;
};

export type AtedBy = {
  user: string;
  date: Date;
};

export type ChildTaskRelatedTo = {
  type: string;
  referenceId: string;
};

export type Status = (typeof StatusList)[number]['status'];

export type OldAtedBy = {
  user: string;
  name: string;
};

export type ItemRelatedTo = {
  type: string;
  referenceId: string;
  name: string;
  owner?: string;
  collaborator?: any[];
};

export enum Type {
  Task = 'Task'
}

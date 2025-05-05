export type Attachment = {
  _id?: string;
  name?: string;
  attachmentType?: string;
  singleLine2?: string;
  comment?: string;
  file?: File[];
  relatedTo?: RelatedTo[];
  brand?: string;
  type?: string;
  parentFolder?: null;
  canEdit?: boolean;
  createdBy?: AtedBy;
  deleteRequest?: DeleteRequest;
  updatedBy?: AtedBy;
  children?: any[];
};

export type AtedBy = {
  user?: User;
  date?: Date;
};

export type User = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  concatedName?: string;
};

export type DeleteRequest = {
  user?: string;
  comment?: string;
  date?: Date;
};

export type File = {
  name?: string;
  url?: string;
  date?: Date;
};

export type RelatedTo = {
  owner?: string;
  collaborator?: any[];
  type?: string;
  referenceId?: string;
  name?: string;
  index?: number;
};

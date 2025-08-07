import { isEmpty } from "lodash";

export type TFiles = {
  _id: string;
  name?: string;
  file?: File[];
  type: 'folder' | 'file';
  parentId?: null | string;
  createdBy?: CreatedBy;
  relatedTo?: RelatedTo[];
  updatedBy?: any;
  brand: string;
  deleteRequest?: DeleteRequest;
};

export type DeleteRequest = {
  user: User;
  comment?: string;
  date: Date;
};

export interface CreatedBy {
  user?: User;
  date?: Date;
}

export interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  concatedName?: string;
}

export interface RelatedTo {
  resource: string;
  referenceId: string;
  label?: string;
}

export type TNestedTree = {
  children: TNestedTree[];
} & TFiles;

export const unflatten = (items: TFiles[]): TNestedTree[] => {
  const tree: TNestedTree[] = [],
    mappedArr = {};

  // Build a hash table and map items to objects
  items.forEach(function (item) {
    const id = item._id;
    if (!mappedArr.hasOwnProperty(id)) {
      // in case of duplicates
      mappedArr[id] = item;
      mappedArr[id].children = [];
    }
  });

  // Loop over hash table
  for (const id in mappedArr) {
    if (mappedArr.hasOwnProperty(id)) {
      const mappedElem = mappedArr[id];

      if (mappedElem.parentId) {
        const parentId = mappedElem.parentId;
        mappedArr[parentId].children.push(mappedElem);
      } else {
        tree.push(mappedElem);
      }
    }
  }

  return tree;
};

const order = ['file', 'folder'];

export const sortFileStructure = (a, b) => {
  const aOrder = order.indexOf(a.type);
  const bOrder = order.indexOf(b.type);
  return aOrder - bOrder;
};

export const allAttachmentsAreFromUser = (attachments: any[], user: any) => {
  return attachments?.every((attachment) => {
    if (checkSuperAdminAccess(user, sidebarResource.attachment)) {
      return true;
    }
    return attachment?.createdBy?.user?._id === user?.user?._id;
  })
}

export const getTitle = (attachments: any[], user: any) => {
  return allAttachmentsAreFromUser(attachments, user)
    ? 'Delete'
    : attachments?.some(attachment => !isEmpty(attachment?.deleteRequest))
      ? `Delete request already sent to ${attachments?.map((e) => e?.createdBy?.user?.concatedName).join(', ')}`
      : 'Delete Request'
}

export type TFiles = {
  _id?: string;
  name?: string;
  file?: File[];
  type?: 'folder' | 'file';
  parentFolder?: null | string;
  canEdit?: boolean;
  createdBy?: CreatedBy;
  id?: string;
  relatedTo?: RelatedTo[];
  updatedBy?: any;
  brand?: string;
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

export interface File {
  name?: string;
  url?: string;
  date?: Date;
}

export interface RelatedTo {
  owner?: string;
  collaborator?: any[];
  type?: string;
  referenceId?: string;
  name?: string;
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

      if (mappedElem.parentFolder) {
        const parentId = mappedElem.parentFolder;
        mappedArr[parentId].children.push(mappedElem);
      } else {
        tree.push(mappedElem);
      }
    }
  }

  return tree;
};

export const unflattenNew = (items: TFiles[]): TNestedTree[] => {
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

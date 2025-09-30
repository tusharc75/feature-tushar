import { isEmpty } from "lodash";
import axiosInstance from "src/axios/axiosInstance";
import { checkSuperAdminAccess, sidebarResource } from "src/constants/helpers";

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

const order = ['folder', 'file'];

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

export const IMAGE_EXTENSIONS = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'heic', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
export const PDF_EXTENSION = ['pdf'];

export const download = async (file, toastConfig) => {
  toastConfig.setToastConfig({
    open: true,
    type: 'info',
    message: `Downloading, Please wait...`
  });

  axiosInstance().get(`/attachment-new/download?id=${file?._id}`, {
    responseType: 'blob',
    onDownloadProgress: (progressEvent) => {
      let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
      if (percentCompleted === 100) {
        toastConfig.setToastConfig({ open: true, type: 'success', message: `Downloaded successfully.` });
      }
    }
  })
    .then(({ data }) => {
      const blobUrl = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file?.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    }).catch(err => {
      toastConfig.setToastConfig(err);
    })
};

export async function renderTextFileFromUrl(objectUrl: string, container: HTMLDivElement): Promise<void> {
  try {
    const resp = await fetch(objectUrl);
    if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.statusText}`);
    const text = await resp.text();

    URL.revokeObjectURL(objectUrl);

    const lines = text.split(/\r\n|\n/);

    // clear & prepare container
    container.innerHTML = '';
    Object.assign(container.style, {
      overflow: 'auto',
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    });

    // wrapper flex container
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      display: 'grid',
      gridTemplateColumns: '50px 1fr',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap', // wrap text
      wordBreak: 'break-word', // break long words
      lineHeight: '1.4',
      width: '100%'
    });

    // populate lines
    lines.forEach((line, i) => {
      const numDiv = document.createElement('div');
      numDiv.textContent = String(i + 1);
      Object.assign(numDiv.style, {
        textAlign: 'right',
        marginRight: '1em',
        color: '#888',
        userSelect: 'none'
      });

      const textDiv = document.createElement('div');

      textDiv.textContent = line;
      wrapper.append(numDiv, textDiv);
    });

    container.appendChild(wrapper);
  } catch (err) {
    console.error('Error rendering text file:', err);
    container.textContent = 'Error loading file.';
  }
}

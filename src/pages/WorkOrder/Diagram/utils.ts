import { fileIcons } from 'src/assets/fileIcons';
import { FileIcon } from 'src/assets/fileIcons/icons';

export const getFileIcon = (fileName: string) => {
  let extension = fileName?.substring(fileName?.lastIndexOf('.'))?.toLowerCase();
  let data = fileIcons?.find((o) => o?.extensions?.indexOf(extension) >= 0);
  if (data && data?.icon) {
    return data.icon;
  } else {
    return FileIcon; // default icon if no icon is found for the file extension.
  }
};

export const getFileNameWithExtension = (file: { url: string; name: string }) => {
  const fileNameExtension = file?.name?.lastIndexOf('.');
  if (fileNameExtension > -1) {
    return file?.name;
  } else {
    const extension = file?.url?.substring(file?.url?.lastIndexOf('.')).toLowerCase();
    return `${file?.name}${extension}`;
  }
};

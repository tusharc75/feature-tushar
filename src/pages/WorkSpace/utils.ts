import moment from 'moment';

export function formatDateWithTodayYestarday(date: Date | string, options?: { onlyMonths?: boolean; dateFormat?: string }) {
  const { onlyMonths, dateFormat } = options || { onlyMonths: false };
  const now = moment();
  const inputDate = moment(date, dateFormat);

  if (onlyMonths) {
    if (inputDate.isSame(now, 'day')) {
      return `Today`;
    } else if (inputDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
      return `Yesterday`;
    } else {
      return inputDate.format('MMM Do');
    }
  }

  if (inputDate.isSame(now, 'day')) {
    return `Today at ${inputDate.format('h:mm A')}`;
  } else if (inputDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return `Yesterday at ${inputDate.format('h:mm A')}`;
  } else {
    return inputDate.format('MMM Do [at] h:mm A');
  }
}

export const isImageFile = (file: File) => {
  const imageExtentions = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png', 'eps', 'raw', 'cr2', 'nef', 'orf', 'sr2'];
  const fileExtention = file.name.split('.').pop();
  return imageExtentions.includes(fileExtention);
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = String(reader.result);
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

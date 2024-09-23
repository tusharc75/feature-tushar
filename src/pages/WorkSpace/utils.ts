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

function stringToHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // do a left shift operation on hash that multiplies hash by (2^4) (or 16)
    hash = str.charCodeAt(i) + ((hash << 4) - hash);
  }
  return hash;
}

function hashToColor(hash: number, lightMode: 'dark' | 'light' = 'light') {
  const hue = hash % 360;
  const saturation = 90;
  const lightness = lightMode ? 75 : 25; // 80% for light mode, 30% for dark mode
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getContrastColor(hslColor: string) {
  const [h, s, l] = hslColor.match(/\d+/g).map(Number);
  // Calculate luminance
  const luminance = (0.2126 * h + 0.7152 * s + 0.0722 * l) / 100;
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function getAvatarColor(username: string, lightMode: 'dark' | 'light' = 'light') {
  const hash = stringToHash(username);
  const backgroundColor = hashToColor(hash, lightMode);
  const textColor = getContrastColor(backgroundColor);
  return { color: textColor, backgroundColor };
}

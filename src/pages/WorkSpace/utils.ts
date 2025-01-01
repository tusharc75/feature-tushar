import dayjs from "dayjs";


export function formatDateWithTodayYestarday(date: Date | string, options?: { onlyMonths?: boolean; dateFormat?: string }) {
  const { onlyMonths, dateFormat } = options || { onlyMonths: false };
  const now = dayjs();
  const inputDate = dayjs(date, dateFormat);

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
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function hashToColor(hash: number, lightMode: 'dark' | 'light' = 'light') {
  let hue = Math.abs(hash % 360);
  const saturation = 90;
  const lightness = lightMode === 'light' ? 50 : 25;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function hslToLuminance(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  // Calculate luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastColor(hslColor: string) {
  const [h, s, l] = hslColor.match(/\d+/g).map(Number);
  const luminance = hslToLuminance(h, s, l);
  return luminance > 128 ? 'black' : 'white';
}

export function getAvatarColor(username: string, lightMode: 'dark' | 'light' = 'light') {
  const hash = stringToHash(username);
  const backgroundColor = hashToColor(hash, lightMode);
  const textColor = getContrastColor(backgroundColor);
  return { color: textColor, backgroundColor };
}

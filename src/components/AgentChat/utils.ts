import routes from 'src/components/Helpers/Routes';
import { getSubdomain } from 'src/constants/helpers';

const VISIBLE_IN = ['master.portal', 'uat.portal'];

export const checkDomain = () => {
  const url = window.location.origin;
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;
  const parts = hostname.split('.');
  if (hostname === 'localhost' || parts.includes('localhost')) {
    return true;
  }
  const subdomain = getSubdomain();
  if (!subdomain) return false;

  if (VISIBLE_IN.includes(subdomain?.toLowerCase())) {
    return true;
  }
  return false;
};

export const removeMongoDBObjectIdFromPath = (path: string): string => {
  const objectIdPattern = /\/[a-fA-F0-9]{24}/;
  return path.replace(objectIdPattern, '');
};
export const getPathTitleFromPath = (path: string): string => {
  const pathWithoutId = removeMongoDBObjectIdFromPath(path);
  let title = '';
  for (let route in routes) {
    if (routes[route].path === pathWithoutId) {
      title = routes[route].title;
      break;
    }
  }
  return title;
};

export const scrollToBottom = (container: HTMLElement | null) => {
  if (container) {
    container.scrollTo(0, container.scrollHeight);
  }
};

export function getRandomNumber(min: number, max: number): number {
  if (min > max) {
    const temp = min;
    min = max;
    max = temp;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

import { homeLink, homepageData } from 'src/pages/UserManual/constants';
import { TManualData } from 'src/pages/UserManual/type';

function getLastPart(url: string): string | null {
  const pos = url.indexOf(homeLink);
  if (pos === -1) {
    return '/';
  }
  const lastPart = url.substring(pos);
  return lastPart;
}

export const createURl = (url: string) => {
  if (!url) return '/';
  const origin = window.location.origin;
  const parsedUrl = new URL(`${origin}/${homeLink}${url}`);
  return getLastPart(parsedUrl.href);
};

export const getCurrentManualUrl = () => {
  return getLastPart(window.location.href);
};

export const getSectionFromUrl = (url: string = getCurrentManualUrl()): string[] => {
  const decodedURl = decodeURIComponent(url);
  const list = decodedURl.split('#')[0].split('/');
  const sections: string[] = [];
  for (const item of list) {
    if (item === homeLink.substring(1)) continue;
    if (item) sections.push(item);
  }
  return sections;
};

export const getPageDataByUrl = (data: TManualData[] = [], url?: string) => {
  const sections = getSectionFromUrl(url);
  if (sections.length === 0) return homepageData;
  if (sections.length === 2) {
    const pageData = data?.find((e) => e.sectionName === sections[0])?.resource?.find((e) => e.resourceLabel === sections[1])?.sections;
    return pageData;
  }
  return null;
};

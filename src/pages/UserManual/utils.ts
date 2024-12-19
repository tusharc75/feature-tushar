import { homeLink, homepageData } from 'src/pages/UserManual/constants';
import { TManualData } from 'src/pages/UserManual/type';

function getLastPart(url: string): string | null {
  const pos = url.indexOf(homeLink);
  if (pos === -1) {
    return '/';
  }
  const lastPart = url.substring(pos + homeLink.length);
  return decodeURIComponent(lastPart);
}


export const createURl = (url: string) => {
  if (!url) return '/';
  const cleanedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${homeLink}${encodeURI(cleanedUrl)}`;
};

export const getCurrentManualUrl = () => {
  return getLastPart(window.location.href);
};

export const getSectionFromUrl = (url: string = getCurrentManualUrl()): string[] => {
  const decodedUrl = decodeURIComponent(url);
  const list = decodedUrl.split('#')[0].split('/');
  const sections: string[] = list.filter((item) => item && item !== homeLink.substring(1));
  return sections;
};


export const getPageDataByUrl = (data: TManualData[] = [], url?: string) => {
  const sections = getSectionFromUrl(url);
  if (sections.length === 0) return homepageData;

  if (sections.length === 2) {
    const [sectionName, resourceLabel] = sections.map(decodeURIComponent);
    const pageData = data
      ?.find((e) => e.sectionName === sectionName)
      ?.resource?.find((e) => e.resourceLabel === resourceLabel)?.sections;
    return pageData;
  }
  return null;
};

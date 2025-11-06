import { HeadingNode, MenualData, Resource } from './types';

export const BASE_ROUTE = '/user-manual';
export const pageTitle = 'Equipt - User Manual';
export const HOME_RESOURCE_KEY = 'User Manual Home';

const emptyStableList = [];

export const homepageData: Resource = {
  _id: 'home-page',
  content: 'Welcome to the Equipt Portal User Manual',
  sectionName: 'Equipt Portal User Manual'
};

export const getSectionFromLocation = (location: Location): string[] => {
  if (!location) return emptyStableList;
  const decodedUrl = location.pathname;
  const list = decodedUrl
    .split('#')[0]
    .split('/')
    .map((d) => decodeURIComponent(d));
  const sections: string[] = list.filter((item) => item && item !== BASE_ROUTE.substring(1));
  return sections;
};

export const getPageDataByUrl = (data: MenualData, location: Location, setPageTitle: boolean = false) => {
  const sections = getSectionFromLocation(location);
  if (sections.length === 0) {
    if (data.has(HOME_RESOURCE_KEY)) {
      return data.get(HOME_RESOURCE_KEY)?.get(HOME_RESOURCE_KEY) || homepageData;
    }
    return homepageData;
  }

  if (sections.length === 2) {
    const [sectionName, resourceLabel] = sections.map(decodeURIComponent);
    const pageData = data.get(sectionName)?.get(resourceLabel);
    if (pageData && setPageTitle) {
      document.title = `${sections?.[0] ? sections?.[0] + ' | ' : ''} ${pageTitle}`;
    }
    return pageData;
  }
  return null;
};

export function makeSafeId(text: string, addPrefix = true, prefix = 'section-head-'): string {
  if (!text) {
    return text;
  }
  const newText = `${text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumerics with dashes
    .replace(/^-+|-+$/g, '')}`; // trim leading/trailing dashes
  return `${addPrefix ? prefix : ''}${newText}`;
}

export function createHeadingHierarchy(html: string): HeadingNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));

  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];
  const idCount: Record<string, number> = {};

  for (const el of headings) {
    const level = parseInt(el.tagName.substring(1), 10);
    let baseId = el.id || makeSafeId(el.textContent || '');
    let uniqueId = baseId;

    // Deduplicate IDs
    if (idCount[baseId] !== undefined) {
      idCount[baseId]++;
      uniqueId = `${baseId}-${idCount[baseId]}`;
    } else {
      idCount[baseId] = 0;
    }

    const node: HeadingNode = {
      level,
      text: el.textContent?.trim() || '',
      id: uniqueId,
      children: [],
      element: el.tagName.toLowerCase()
    };

    // Attach node in hierarchy
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}

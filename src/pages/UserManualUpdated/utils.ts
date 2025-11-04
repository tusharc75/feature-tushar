import { HeadingNode, MenualData, Resource } from './types';

export const BASE_ROUTE = '/user-manual';
export const pageTitle = 'Equipt - User Manual';

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
  if (sections.length === 0) return homepageData;

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

export function makeSafeId(text: string, addPrefix = true): string {
  if (!text) {
    return text;
  }
  const newText = `${text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumerics with dashes
    .replace(/^-+|-+$/g, '')}`; // trim leading/trailing dashes
  return `${addPrefix ? 'section-head-' : ''}${newText}`;
}

export function createHeadingHierarchy(html: string): HeadingNode[] {
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = Array.from(doc.body.querySelectorAll('h1, h2, h3, h4')) as HTMLHeadingElement[];

  const toLevel = (el: HTMLHeadingElement): number => Number(el.tagName.substring(1));

  const collectContentUntilNextHeading = (start: HTMLHeadingElement): string => {
    const parts: string[] = [];
    let node: Node | null = start.nextSibling;

    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') break;
      }
      parts.push(node instanceof Element ? node.outerHTML : (node.textContent ?? ''));
      node = node.nextSibling;
    }

    return parts.join('');
  };

  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  for (const h of headings) {
    const level = toLevel(h);
    const safeId = makeSafeId(h.textContent?.trim() ?? '');

    // Ensure the element has an id
    if (!h.id) h.id = safeId;

    const node: HeadingNode = {
      level,
      text: h.textContent?.trim() ?? '',
      id: h.id,
      children: [],
      contentHtml: collectContentUntilNextHeading(h),
      element: h.tagName.toLowerCase()
    };

    while (stack.length && stack[stack.length - 1].level >= level) {
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

import routes from 'src/components/Helpers/Routes';

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

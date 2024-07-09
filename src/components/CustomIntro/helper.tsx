export const getCurrentUrl = () => {
  const url = window.location.pathname;
  const search = window.location.search;
  const hexPattern = /^[0-9a-fA-F]{24}$/;
  const splittedUrl = url.split('/');
  const newUrl = splittedUrl
    .map((url) => {
      if (hexPattern.test(url)) {
        return ':id';
      } else {
        return url;
      }
    })
    .join('/');
  return `${newUrl}${search}`;
};

export function elemToSelector(el: HTMLElement) {
  if (el.tagName.toLowerCase() === 'html') {
    return 'HTML';
  }
  let selector = el.tagName.toLowerCase();
  selector += el.id ? `#${el.id}` : '';

  if (el.className) {
    const classes = el.className.split(/\s+/);
    for (const className of classes) {
      selector += `.${className}`;
    }
  }

  return elemToSelector(el.parentNode as HTMLElement) + ' > ' + selector;
}

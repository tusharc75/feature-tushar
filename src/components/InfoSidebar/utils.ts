export function replaceAllMongoIds(url: string = window.location.href, replaceWith = ':id'): string {
  const objectIdRegex = /([/=])([a-f\d]{24})(?=[/?#&=]|$)/gi;
  return url.replace(objectIdRegex, `$1${replaceWith}`);
}

export const applyStyles = (element: HTMLElement, styles: React.CSSProperties) => {
  Object.entries(styles).forEach(([key, value]) => {
    // Type assertion because element.style only accepts specific string values
    (element.style as any)[key] = value;
  });
};

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // Some browsers may throw if cross-origin restrictions are hit
    return true;
  }
}

export function generateUniqueMongoId(): string {
  // 4-byte (8 hex chars) Unix timestamp
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');

  // 16 random hex characters (8 bytes)
  const randomPart = crypto.getRandomValues(new Uint8Array(12)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');

  return timestamp + randomPart;
}

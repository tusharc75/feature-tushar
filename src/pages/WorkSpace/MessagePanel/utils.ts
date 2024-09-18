function stringToHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // do a left shift operation on hash that multiplies hash by (2^5) (or 32)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function hashToColor(hash: number, lightMode: 'dark' | 'light' = 'light') {
  const hue = hash % 360;
  const saturation = 80;
  const lightness = lightMode ? 80 : 30; // 80% for light mode, 30% for dark mode
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

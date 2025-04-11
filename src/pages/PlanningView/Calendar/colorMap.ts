import colors from 'tailwindcss/colors';

const colorList = [
  {
    dark: { bg: colors.orange[600], text: 'white' },
    light: { bg: colors.orange[600], text: 'white' }
  },
  {
    dark: { bg: colors.lime[600], text: 'white' },
    light: { bg: colors.lime[500], text: 'white' }
  },
  {
    dark: { bg: colors.emerald[600], text: 'white' },
    light: { bg: colors.emerald[500], text: 'white' }
  },
  {
    dark: { bg: colors.blue[600], text: 'white' },
    light: { bg: colors.blue[500], text: 'white' }
  },
  {
    dark: { bg: colors.purple[600], text: 'white' },
    light: { bg: colors.purple[500], text: 'white' }
  },
  {
    dark: { bg: colors.rose[600], text: 'white' },
    light: { bg: colors.rose[500], text: 'white' }
  },
  {
    dark: { bg: colors.slate[600], text: 'white' },
    light: { bg: colors.slate[500], text: 'white' }
  },
  {
    dark: { bg: colors.stone[600], text: 'white' },
    light: { bg: colors.stone[500], text: 'white' }
  }
] as const;

export type SingleColor = (typeof colorList)[number];

export const getColorByIndex = (index: number) => {
  const colorIndex = index % colorList.length;
  return colorList[colorIndex];
};

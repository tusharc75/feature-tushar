import colors from 'tailwindcss/colors';

const colorList = [
  {
    dark: { bg: colors.amber[500], text: 'black' },
    light: { bg: colors.amber[400], text: 'black' }
  },
  {
    dark: { bg: colors.teal[400], text: 'white' },
    light: { bg: colors.teal[400], text: 'white' }
  },
  {
    dark: { bg: colors.sky[400], text: 'white' },
    light: { bg: colors.sky[400], text: 'white' }
  },
  {
    dark: { bg: colors.violet[500], text: 'white' },
    light: { bg: colors.violet[400], text: 'white' }
  },
  {
    dark: { bg: colors.fuchsia[500], text: 'white' },
    light: { bg: colors.fuchsia[400], text: 'white' }
  },
  {
    dark: { bg: colors.lime[400], text: 'black' },
    light: { bg: colors.lime[300], text: 'black' }
  },
  {
    dark: { bg: colors.rose[500], text: 'white' },
    light: { bg: colors.rose[400], text: 'white' }
  },
  {
    dark: { bg: colors.cyan[400], text: 'black' },
    light: { bg: colors.cyan[300], text: 'black' }
  }
] as const;

export type SingleColor = (typeof colorList)[number];

export const getColorByIndex = (index: number) => {
  const colorIndex = index % colorList.length;
  return colorList[colorIndex];
};

import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReactNode } from 'react';
import { getDesignTokens } from 'src/constants/AppConfig';
import { InitialStateFastContext } from 'src/StateProvider/fastContext';

interface ColorModeInterface {
  children: ReactNode;
  theme: InitialStateFastContext['themeColor'];
}

export default function RootProvider({ children, theme }: ColorModeInterface) {
  const darkModeTheme = createTheme(getDesignTokens(theme));

  return (
    <>
      <CssBaseline />
      <ThemeProvider theme={darkModeTheme}>{children}</ThemeProvider>
    </>
  );
}

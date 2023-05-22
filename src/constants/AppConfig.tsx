import { ThemeProvider, createTheme, useTheme } from '@material-ui/core/styles';
import React, { ReactNode, useEffect } from 'react';
import { useStore, THEME } from 'src/StateProvider/fastContext';

const LOCAL_STORE_NAME = 'app_color_mode';

const getThemeFromLocal = () => localStorage?.getItem(LOCAL_STORE_NAME);
const setThemeToLocal = (theme: string) => localStorage.setItem(LOCAL_STORE_NAME, theme);

interface ColorContextInterface {
  theme: 'light' | 'dark';
  toggle: () => void;
}

const ColormodeContext = React.createContext<ColorContextInterface | null>(null);

interface ColorModeInterface {
  children: ReactNode;
}
type ThemeColor = 'dark' | 'light';

export default function ColorModeProvider({ children }: ColorModeInterface) {
  const [theme, setStore] = useStore((store) => store[THEME]);

  useEffect(() => {
    // const localTheme = getThemeFromLocal();
    // if (localTheme) {
    //   const theme = localTheme as ThemeColor;
    //   setTheme(theme);
    // } else {
    //   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    //   setThemeToLocal(prefersDark ? 'dark' : 'light');
    //   setTheme(prefersDark ? 'dark' : 'light');
    // }
    setStore({ [THEME]: 'light' });
  }, []);

  useEffect(() => {
    applyTheme();
  }, [theme]);

  const applyTheme = () => {
    let newTheme;
    const root = document.getElementsByTagName('html')[0];
    if (theme === 'dark') {
      setThemeToLocal('dark');
      root.setAttribute('data-mode', 'dark');
    }
    if (theme === 'light') {
      setThemeToLocal('light');
      root.setAttribute('data-mode', 'light');
    }

    if (newTheme) {
      root.style.cssText = newTheme.join(';');
    }
    return () => {
      const root = document.getElementsByTagName('html')[0];
      root.removeAttribute('data-mode');
    };
  };

  const toggle = () => {
    setStore({ [THEME]: theme === 'dark' ? 'light' : 'dark' });
  };

  const darkModeTheme = createTheme(getDesignTokens(theme));

  return (
    <ColormodeContext.Provider
      value={{
        theme,
        toggle
      }}
    >
      <ThemeProvider theme={darkModeTheme}>{children}</ThemeProvider>
    </ColormodeContext.Provider>
  );
}

const getDesignTokens = (mode: ThemeColor) => ({
  typography: {
    fontFamily: [
      'Poppins',
      'Nunito',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(',')
  },
  palette: {
    mode,
    type: mode,
    ...(mode === 'light'
      ? {
          primary: {
            light: '#091823', //"#003f57",
            main: '#163340' //"#003f57",
          },
          secondary: {
            light: '#047d1c',
            main: '#047d1c',
            dark: '#047d1c'
          },
          error: {
            light: '#e57373',
            main: '#f44336',
            dark: '#d32f2f',
            contrastText: '#fff'
          },
          info: {
            light: '#75e2dd',
            main: '#2196f3',
            dark: '#1976d2'
          },
          success: {
            light: '#81c784',
            main: '#4caf50',
            dark: '#388e3c'
          }
        }
      : {
          primary: {
            light: '#fff', //"#003f57",
            main: '#fff' //"#003f57",
          },
          secondary: {
            light: '#047d1c',
            main: '#047d1c',
            dark: '#047d1c'
          },
          error: {
            light: '#e57373',
            main: '#f44336',
            dark: '#d32f2f',
            contrastText: '#fff'
          },
          info: {
            light: '#75e2dd',
            main: '#2196f3',
            dark: '#1976d2'
          },
          success: {
            light: '#81c784',
            main: '#4caf50',
            dark: '#388e3c'
          },
          background: {
            paper: '#0e0e23'
          }
        })
  }
});

const useAppTheme = () => {
  const { theme, toggle } = React.useContext(ColormodeContext) as ColorContextInterface;
  return [theme, toggle] as ['light' | 'dark', () => void];
};

export { useAppTheme, useTheme };

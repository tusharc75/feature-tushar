import { createMuiTheme } from "@material-ui/core/styles";

export const theme = createMuiTheme({
  typography: {
    fontFamily: [
      'Nunito',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  palette: {
    primary: {
      light:  "#091823", //"#003f57",
      main:  "#163340",//"#003f57",
      // dark: "#115293"
    },
    secondary: {  //  Dark Color
      // main: "#212121",
      light: "#e33371",
      main: "#047d1c",
      dark: "#9a0036"
    },
    error: {
      light: '#e57373',
      main: '#f44336',
      dark: '#d32f2f',
      
      contrastText: '#fff'
    },
    info: {
      light: "#75e2dd",
      main: "#2196f3",
      dark: "#1976d2"
    },
    success: {
      light: "#81c784",
      main: "#4caf50",
      dark: "#388e3c"
    }
    // darkBg: "#09445A",
    // lightBg: "#91A2A9",
    // textDark: "#082D3A",
    // textLight: "#91A2A9",
  },

});

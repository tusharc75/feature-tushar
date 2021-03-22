import { createMuiTheme } from "@material-ui/core/styles";

export const theme = createMuiTheme({
    palette: {
        primary: {
            light: "#4791db",
            main: "#09445A",
            // dark: "#115293"
        },
        secondary: {  //  Dark Color
            // main: "#212121",
            light: "#e33371",
            main: "#dc004e",
            dark: "#9a0036"
        },
        error: {
            light: '#e57373',
            main: '#f44336',
            dark: '#d32f2f',

            contrastText: '#fff'
        },
        info: {
            light: "#64b5f6",
            main: "#2196f3",
            dark: "#1976d2"
        },
        success: {
            light: "#81c784",
            main: "#4caf50",
            dark: "#388e3c"
        },
        // darkBg: "#09445A",
        // lightBg: "#91A2A9",
        // textDark: "#082D3A",
        // textLight: "#91A2A9",
    },

});

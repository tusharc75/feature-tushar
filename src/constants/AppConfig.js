import { createMuiTheme } from '@material-ui/core/styles'


export const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#09445A'
        },
        error: {
            light: '#e57373',
            main: '#f44336',
            dark: '#d32f2f',
            contrastText: '#fff'
        },
        darkBg: '#09445A',
        lightBg: '#91A2A9',
        textDark: '#082D3A',
        textLight: '#91A2A9'
    }
})

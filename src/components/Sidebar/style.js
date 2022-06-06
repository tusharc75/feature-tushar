import { makeStyles } from '@material-ui/core/styles';
const drawerWidth = 240;

export default makeStyles((theme) => ({
    root: {
        display: 'flex'
    },

    hide: { display: 'none' },

    appBar: {
        zIndex: theme.zIndex.drawer + 1
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap'
    },
    drawerOpen: {
        overflowY: 'auto',

        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    drawerClose: {
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        width: '48px',
        [theme.breakpoints.down('sm')]: {
            width: 0,
            borderRight: 'none !important'
        }
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: theme.spacing(0),
        borderBottom: '2px solid #f5f8f9'
    },
    menuIcon: {
        width: 22
    },
    drawerIcon: {
        width: 18
    },
    heading: {
        fontWeight: 'normal',
        marginLeft: theme.spacing(2)
    },
    nested: {
        paddingLeft: theme.spacing(4)
    },
    sidebarUser: {
        padding: '1.5rem 1rem 1rem',
        background: '#fff',
        color: '#153d77',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        height: '8rem'
    },

}));
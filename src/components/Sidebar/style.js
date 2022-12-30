import { makeStyles } from '@material-ui/core/styles';
const drawerWidth = 306;
const closedDrawerWidth = 66;

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
    whiteSpace: 'nowrap',
    borderRight: '0 !important',
    '& span': {
      fontWeight: '500'
    }
  },
  drawerOpen: {
    borderRight: '0 !important',
    overflowY: 'auto',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    '& span': {
      fontWeight: '500'
    },
    '& .wordWrap': {
      '& span': {
        /* word-break: break-all, */
        display: 'block',
        wordWrap: 'break-word',
        whiteSpace: 'normal'
      }
    }
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: `${closedDrawerWidth}px`,
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      width: 0,
      borderRight: 'none !important'
    },
    '& .wordWrap': {
      '& span': {
        /* word-break: break-all, */
        display: 'block',
        wordWrap: 'normal',
        whiteSpace: 'nowrap'
      }
    },
    '& span': {
      /* word-break: break-all, */
      display: 'block',
      wordWrap: 'normal',
      whiteSpace: 'nowrap'
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
    width: 22
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
  }
}));

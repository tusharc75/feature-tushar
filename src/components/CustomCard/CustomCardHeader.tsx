import { Theme } from '@mui/material';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { red } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    maxWidth: 345
  },
  media: {
    height: 0,
    paddingTop: '56.25%' // 16:9
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest
    })
  },
  expandOpen: {
    transform: 'rotate(180deg)'
  },
  avatar: {
    backgroundColor: red[500]
  }
}));

export default function CustomCardHeader({ title, action }) {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardHeader
        action={action}
        // <IconButton aria-label="settings">
        //     <MoreVertIcon />
        // </IconButton>
        title={title}
      />
    </Card>
  );
}

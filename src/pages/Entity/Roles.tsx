import { makeStyles } from '@mui/styles';
import List from '@mui/material/List';
import { Theme, Typography } from '@mui/material';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from 'react-router-dom';

import BoxWithBorder from '../../components/BoxWithBorder';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
    width: '100%'
  },
  text: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    marginRight: 50
  },
  list: {
    width: '100%',
    padding: 0
  }
}));

const Roles = ({ unassignRole, data, permissions }) => {
  const classes = useStyles();

  return (
    <div className={classes.demo}>
      <List disablePadding>
        {data && data.length
          ? data.map((obj) => (
              <BoxWithBorder style={{ marginBottom: '8px' }} key={obj._id}>
                <ListItem disableGutters className={classes.list}>
                  <ListItemText
                    primary={
                      <Typography className={classes.text}>
                        <Link className="link" to={`/role/detail/${obj._id}`}>
                          {obj.name || ''}
                        </Link>
                      </Typography>
                    }
                    secondary={
                      <Typography color="textSecondary" className={classes.text}>
                        {obj.description || ''}
                      </Typography>
                    }
                  />
                  {permissions?.entity?.isUpdate && (
                    <ListItemSecondaryAction title={obj.permission ? "Default role can't be un-assigned" : 'Un-assign'}>
                      <IconButton size="small" disabled={obj?.permission} edge="end" aria-label="delete" onClick={() => unassignRole(obj)}>
                        <DeleteIcon color={obj?.permission ? 'disabled' : 'error'} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              </BoxWithBorder>
            ))
          : null}
      </List>
    </div>
  );
};

export default Roles;

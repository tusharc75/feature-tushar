import { Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { makeStyles } from '@mui/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import BoxWithBorder from '../../components/BoxWithBorder';
import CopyToClipboard from '../../components/Helpers/CopyToClipboard';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
    width: '100%'
  },
  title: {
    margin: theme.spacing(4, 0, 2)
  },
  list: {
    width: '100%',
    padding: 0
  }
}));

const AssignedUsers = (props) => {
  const { user, unassignEntity, permissions, selectedEntity, type } = props;
  const classes = useStyles();

  return (
    <div className={classes.demo}>
      <List disablePadding>
        {user && user.length
          ? user.map((obj) => (
              <BoxWithBorder key={obj._id} style={{ marginBottom: '8px' }}>
                <ListItem disableGutters className={classes.list}>
                  <ListItemText
                    primary={
                      <Typography className="flex justify-between">
                        <a href={`/user/detail/${obj._id}`} className="link" target="_blank" rel="noreferrer">
                          {`${obj.firstName} ${obj.lastName}` || ''}
                        </a>
                      </Typography>
                    }
                    secondary={
                      <div className="mr-1 flex items-center">
                        <span className=" truncate">{obj.email}</span>
                        <CopyToClipboard textToCopy={obj.email} className="ml-1 cursor-pointer" />
                      </div>
                    }
                  />
                  {permissions?.role?.isUpdate && (
                    <IconButton
                      title={selectedEntity === obj._id ? "Primary user can't be unassigned" : 'Unassign User'}
                      size="small"
                      disabled={selectedEntity === obj._id}
                      edge="end"
                      aria-label="delete"
                      onClick={() => unassignEntity(obj)}
                    >
                      <DeleteIcon color={selectedEntity === obj._id ? 'disabled' : 'error'} />
                    </IconButton>
                  )}
                </ListItem>
              </BoxWithBorder>
            ))
          : null}
      </List>
    </div>
  );
};

export default AssignedUsers;

import { makeStyles } from '@mui/styles';
import { Typography, List, ListItem, ListItemSecondaryAction, ListItemText, IconButton, Theme } from '@mui/material';
import { Link } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import BoxWithBorder from '../../components/BoxWithBorder';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1
  },
  demo: {
    backgroundColor: theme.palette.background.paper
  },
  title: {
    margin: theme.spacing(4, 0, 2)
  }
}));

interface props {
  unassignRole: Function;
  data: any;
  permissions: any;
}

const UserRoles = ({ data, unassignRole, permissions }: props) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.demo}>
        <List style={{ padding: 0 }}>
          {data && data.length
            ? data.map((obj: any, i: string) => (
                <BoxWithBorder key={i} style={{ padding: '0px' }}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography title={obj.name || ''} className={permissions?.role?.isRead ? 'link text-truncate' : 'text-truncate'}>
                          {permissions?.role?.isRead ? <Link to={`/role/detail/${obj._id}`}>{obj.name || ''}</Link> : <span>{obj.name || ''}</span>}
                        </Typography>
                      }
                      secondary={
                        <Typography color="textSecondary" title={obj.description || ''} className="text-truncate">
                          {obj.description || ''}
                        </Typography>
                      }
                    />
                    {permissions?.user?.isUpdate && (
                      <ListItemSecondaryAction>
                        <HtmlTooltip title={'Unassign Role'}>
                          <IconButton size="small" edge="end" aria-label="delete" onClick={() => unassignRole(obj)}>
                            <DeleteIcon color={'error'} />
                          </IconButton>
                        </HtmlTooltip>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                </BoxWithBorder>
              ))
            : null}
        </List>
      </div>
    </div>
  );
};

export default UserRoles;

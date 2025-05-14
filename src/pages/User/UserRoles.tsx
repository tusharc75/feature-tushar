import { makeStyles } from '@mui/styles';
import { Typography, List, ListItem, ListItemText, IconButton, Theme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { FiExternalLink } from 'react-icons/fi';
import routes from 'src/components/Helpers/Routes';

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
        <List sx={{ padding: 0 }}>
          {data && data.length
            ? data.map((obj: any, i: string) => (
              <ListItem key={i} className="border-b border-r">
                <ListItemText
                  primary={
                    <div className="flex items-center gap-1">
                      <Typography variant='subtitle2' title={obj.name || ''} className={'text-truncate'}>
                        <span>{obj.name || ''}</span>
                      </Typography>
                      {permissions?.role?.isRead &&
                        <IconButton
                          size="small"
                          onClick={() => {
                            window.open(`${routes.roleDetail.path}/${obj._id}`);

                          }}
                        >
                          <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                        </IconButton>
                      }
                    </div>
                  }
                  secondary={
                    <Typography variant='caption' title={obj.description || ''} className="text-truncate">
                      {obj.description || ''}
                    </Typography>
                  }
                />
                {permissions?.user?.isUpdate && (
                  <HtmlTooltip title={data.length === 1 ? 'Cannot be unassigned as one role required for the user.' : 'Unassign Role'}>
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label="delete"
                      disabled={data.length === 1 ? true : false}
                      onClick={() => unassignRole(obj)}>
                      <DeleteIcon color={data.length === 1 ? 'disabled' : 'error'} fontSize='small' />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </ListItem>
            ))
            : null}
        </List>
      </div>
    </div>
  );
};

export default UserRoles;

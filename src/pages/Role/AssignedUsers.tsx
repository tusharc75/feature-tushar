import { Theme, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import { makeStyles } from '@mui/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import CopyToClipboardButton from 'src/components/CopyToClipboardButton';
import BoxWithBorder from '../../components/BoxWithBorder';
import { roleTypes, userType } from '../../constants/helpers';

const useStyles = makeStyles((theme: Theme) => ({
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

const AssignedUsers = ({ unassignRole, data, currentUser, permissions, type }) => {
  const classes = useStyles();

  return (
    <div className={classes.demo}>
      <List disablePadding>
        {data && data.length
          ? data.map((obj) => (
              <BoxWithBorder key={obj._id} style={{ marginBottom: '8px' }}>
                <ListItem disableGutters className={classes.list}>
                  <div className="flex items-end gap-1">
                    <ListItemText
                      primary={
                        <Typography>
                          <p className="link" onClick={() => window.open(`/user/detail/${obj._id}`)}>
                            {`${obj.firstName} ${obj.lastName}` || ''}
                          </p>
                        </Typography>
                      }
                      secondary={obj.email}
                    />
                    <CopyToClipboardButton smallIcon text={obj.email} />
                  </div>

                  {permissions?.role?.isUpdate && (
                    <ListItemSecondaryAction
                      title={
                        currentUser === obj._id
                          ? "Primary user can't be unassigned"
                          : obj.userType && obj.userType === userType.brandAdmin
                            ? 'Brand Admin Can not be deleted'
                            : 'Unassign User'
                      }
                    >
                      {type === roleTypes.find((d) => d.key === 'Global')?.value && (
                        <IconButton
                          size="small"
                          disabled={currentUser === obj._id || (obj.userType && obj.userType === userType.brandAdmin)}
                          edge="end"
                          aria-label="delete"
                          onClick={() => unassignRole(obj)}
                        >
                          <DeleteIcon
                            color={currentUser === obj._id || (obj.userType && obj.userType === userType.brandAdmin) ? 'disabled' : 'error'}
                          />
                        </IconButton>
                      )}
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

export default AssignedUsers;

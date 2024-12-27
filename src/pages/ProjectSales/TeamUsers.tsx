import { makeStyles } from '@mui/styles';
import { List, ListItem, ListItemText, IconButton, Theme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Delete } from '@mui/icons-material';
import BoxWithBorder from '../../components/BoxWithBorder';
import CopyToClipboard from '../../components/Helpers/CopyToClipboard';
import { isMobile } from 'react-device-detect';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
    width: '100%'
  },
  title: {
    display: 'flex',
    alignItems: 'center'
  },
  list: {
    width: '100%',
    padding: 0,
    alignItems: 'start',
    gap: 5
  },
  '@media only screen and (max-width: 560px)': {
    title: {
      justifyContent: 'space-between'
    }
  }
}));

const TeamUsers = ({ data, permissions, managerId, removeUser }) => {
  const classes = useStyles();

  return (
    <div className={classes.demo}>
      <List disablePadding>
        <Grid container>
          {data && data.length
            ? data.map((obj) => (
                <Grid size={{xs:isMobile ? 12 : 6}} key={obj._id}>
                  <BoxWithBorder key={obj._id} style={{ margin: '8px' }}>
                    <ListItem disableGutters className={classes.list}>
                      <ListItemText
                        primary={
                          <div className={`mb-1 flex min-h-[30px] max-w-full items-center justify-between gap-2`}>
                            <p className="link line-clamp-1" onClick={() => window.open(`/user/detail/${obj._id}`)}>
                              {`${obj.firstName} ${obj.lastName}` || ''}
                            </p>
                            {managerId === obj._id && (
                              <>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    fontWeight: 600
                                  }}
                                  className=" max-w-full rounded-[4px] bg-[#EFFBF9] p-[1px_6px] text-sm text-[#298B88] dark:bg-[rgb(70,70,108)] dark:text-white"
                                >
                                  Manager
                                </span>
                                {/* <Chip
                                  variant="outlined"
                                  size="small"
                                  label="Manager"
                                  color="secondary"
                                /> */}
                              </>
                            )}
                            {permissions?.projectSales?.isUpdate && managerId !== obj._id && (
                              <IconButton
                                title={`Remove ${obj.firstName}`}
                                size="small"
                                edge="end"
                                aria-label="delete"
                                style={{ margin: 0 }}
                                onClick={() => removeUser(obj)}
                              >
                                <Delete color="error" />
                              </IconButton>
                            )}
                          </div>
                        }
                        secondary={
                          <div className="mr-2 flex gap-2">
                            <span className=" line-clamp-1">{obj.email || ''}</span>
                            <CopyToClipboard textToCopy={obj.email || ''} />
                          </div>
                        }
                      />
                    </ListItem>
                  </BoxWithBorder>
                </Grid>
              ))
            : null}
        </Grid>
      </List>
    </div>
  );
};

export default TeamUsers;

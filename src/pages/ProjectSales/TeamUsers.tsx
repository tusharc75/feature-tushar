import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, List, ListItem, ListItemSecondaryAction, ListItemText, IconButton, Chip, Grid } from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import { Link } from 'react-router-dom';

import BoxWithBorder from '../../components/BoxWithBorder';
import CopyToClipboard from '../../components/Helpers/CopyToClipboard';
import { isMobile, isTablet } from 'react-device-detect';

const useStyles = makeStyles((theme) => ({
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
                <Grid item xs={isMobile ? 12 : 6} key={obj._id}>
                  <BoxWithBorder key={obj._id} style={{ margin: '8px' }}>
                    <ListItem disableGutters className={classes.list}>
                      <ListItemText
                        primary={
                          <div className={`flex gap-2 justify-between max-w-full mb-1 min-h-[30px] items-center`}>
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
                                  className=" max-w-full dark:bg-[rgb(70,70,108)] bg-[#EFFBF9] text-sm text-[#298B88] dark:text-white rounded-[4px] p-[1px_6px]"
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
                          <div className="flex gap-2">
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

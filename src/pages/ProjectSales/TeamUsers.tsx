import { makeStyles } from "@material-ui/core/styles";
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Chip,
  Grid,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { Link } from "react-router-dom";

import BoxWithBorder from "../../components/BoxWithBorder";
import CopyToClipboard from "../../components/Helpers/CopyToClipboard";
import { isMobile, isTablet } from 'react-device-detect';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
    width: "100%",
  },
  title: {
    display: "flex",
    alignItems: "center",
  },
  list: {
    width: "100%",
    padding: 0,
  },
  "@media only screen and (max-width: 560px)":{
    title:{
      justifyContent:"space-between"
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
                <Grid item xs={isMobile ? 12 : 6} >
                  <BoxWithBorder key={obj._id} style={{ margin: "8px" }}>
                    <ListItem disableGutters className={classes.list}>
                      <ListItemText
                        primary={
                          <Typography className={`${classes.title} ""`}>
                            <Link
                              className="link"
                              to={`/user/detail/${obj._id}`}
                            >
                              {`${obj.firstName} ${obj.lastName}` || ""}
                            </Link>

                            {managerId === obj._id && (
                              <>
                                <Box mr={1} title="Project" />
                                <Chip
                                  variant="outlined"
                                  size="small"
                                  label="Manager"
                                  color="secondary"
                                />
                              </>
                            )}
                          </Typography>
                        }
                        secondary={
                          <>
                            {obj.email || ""}
                            <CopyToClipboard textToCopy={obj.email || ""} />
                          </>
                        }
                      />

                      {permissions?.projectStrategy?.isUpdate &&
                        managerId !== obj._id && (
                          <ListItemSecondaryAction>
                            <IconButton
                              title={`Remove ${obj.firstName}`}
                              size="small"
                              edge="end"
                              aria-label="delete"
                              onClick={() => removeUser(obj)}
                            >
                              <Delete color="error" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
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

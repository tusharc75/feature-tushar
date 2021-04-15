import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import { Typography } from "@material-ui/core";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import { Link } from "react-router-dom";

import BoxWithBorder from "../../components/BoxWithBorder";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
    width: "100%",
  },
  text: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
    marginRight: 50,
  },
  list: {
    width: "100%",
    padding: 0,
  },
}));

const Roles = ({ unassignRole, data, permissions }) => {
  const classes = useStyles();

  return (
    <div className={classes.demo}>
      <List disablePadding>
        {data && data.length
          ? data.map((obj) => (
              <BoxWithBorder style={{ marginBottom: "8px" }} key={obj._id}>
                <ListItem disableGutters className={classes.list}>
                  <ListItemText
                    primary={
                      <Typography className={classes.text}>
                        <Link
                          className="accountNameLink"
                          to={`/role/detail/${obj._id}`}
                        >
                          {obj.name || ""}
                        </Link>
                      </Typography>
                    }
                    secondary={
                      <Typography
                        color="textSecondary"
                        className={classes.text}
                      >
                        {obj.description || ""}
                      </Typography>
                    }
                  />
                  {permissions.entity.isUpdate && (
                    <ListItemSecondaryAction
                      title={
                        obj.permission
                          ? "Default role can't be un-assigned"
                          : "Un-assign"
                      }
                    >
                      <IconButton
                        size="small"
                        disabled={obj?.permission}
                        edge="end"
                        aria-label="delete"
                        onClick={() => unassignRole(obj)}
                      >
                        <DeleteIcon
                          color={obj?.permission ? "disabled" : "error"}
                        />
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

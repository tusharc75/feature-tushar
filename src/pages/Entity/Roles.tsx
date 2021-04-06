import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import { Typography, Tooltip } from "@material-ui/core";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import FormGroup from "@material-ui/core/FormGroup";
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
  title: {
    margin: theme.spacing(4, 0, 2),
  },
  list: {
    width: "100%",
    padding: 0,
  },
}));

const Roles = ({ onDeleteGlobalRole, data }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <FormGroup row>
        <div className={classes.demo}>
          <List disablePadding>
            {data && data.length
              ? data.map((obj) => {
                  return (
                    <BoxWithBorder styles={{ padding: "0px", margin: "8px" }}>
                      <ListItem disableGutters className={classes.list}>
                        <ListItemText
                          primary={
                            <Link
                              className="accountNameLink"
                              to={`/role/detail/${obj._id}`}
                            >
                              <Typography> {obj.name || ""}</Typography>
                            </Link>
                          }
                          secondary={obj.description || ""}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Unassign Role">
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => onDeleteGlobalRole(obj)}
                            >
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </BoxWithBorder>
                  );
                })
              : null}
          </List>
        </div>
      </FormGroup>
    </div>
  );
};

export default Roles;

import { makeStyles } from "@material-ui/core/styles";
import {
  Typography,
  Tooltip,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import BoxWithBorder from "../../components/BoxWithBorder";
import { PERMISSION } from "../../constants/Roles"

const rolesPermissions = [PERMISSION.superAdmin, PERMISSION.brandAdmin]
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
  },
}));

interface props {
  unassignRole: Function;
  data: any;
}

const UserRoles = ({ data, unassignRole }: props) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.demo}>
        <List style={{ padding: 0 }}>
          {data && data.length
            ? data.map((obj: any, i: string) => (
              <BoxWithBorder
                key={i}
                style={{ padding: "0px", margin: "8px" }}
              >
                <ListItem className={classes.list}>
                  <ListItemText
                    primary={<Typography> {obj.name || ""}</Typography>}
                    secondary={obj.description || ""}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Unassign Role">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => unassignRole(obj)}
                        disabled={rolesPermissions.indexOf(obj?.permission) >= 0}
                      >
                        <DeleteIcon
                          color={rolesPermissions.indexOf(obj?.permission) >= 0 ? "disabled" : "error"} />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
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

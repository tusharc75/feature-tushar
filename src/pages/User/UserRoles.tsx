import { makeStyles } from "@material-ui/core/styles";
import {
  Typography,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import DeleteIcon from "@material-ui/icons/Delete";
import BoxWithBorder from "../../components/BoxWithBorder";
import { PERMISSION } from "../../constants/Roles";

const rolesPermissions = [PERMISSION.superAdmin, PERMISSION.brandAdmin];
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
                <BoxWithBorder
                  key={i}
                  style={{ padding: "0px", margin: "8px" }}
                >
                  <ListItem className={classes.list}>
                    <ListItemText
                      primary={
                        <Typography
                          title={obj.name || ""}
                          className="text-truncate"
                        >
                          <Link to={`/role/detail/${obj._id}`}>
                            {obj.name || ""}
                          </Link>
                        </Typography>
                      }
                      secondary={
                        <Typography
                          color="textSecondary"
                          title={obj.description || ""}
                          className="text-truncate"
                        >
                          {obj.description || ""}
                        </Typography>
                      }
                    />
                    {permissions.user.isUpdate && (
                      <ListItemSecondaryAction title="Unassign Role"
                        // title={
                        //   rolesPermissions.indexOf(obj?.permission) >= 0
                        //     ? ""
                        //     : "Unassign Role"
                        // }
                      >
                        <IconButton
                          size="small"
                          edge="end"
                          aria-label="delete"
                          onClick={() => unassignRole(obj)}
                          // disabled={
                          //   rolesPermissions.indexOf(obj?.permission) >= 0
                          // }
                        >
                          <DeleteIcon color="error"
                            // color={
                            //   rolesPermissions.indexOf(obj?.permission) >= 0
                            //     ? "disabled"
                            //     : "error"
                            // }
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
    </div>
  );
};

export default UserRoles;

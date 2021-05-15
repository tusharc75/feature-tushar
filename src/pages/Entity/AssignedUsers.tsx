import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import { Typography } from "@material-ui/core";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import { Link } from "react-router-dom";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import BoxWithBorder from "../../components/BoxWithBorder";
import CopyToClipboard from "../../components/Helpers/CopyToClipboard";

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

const AssignedUsers = ({   data,
  unassignEntity,
  permissions,
  selectedEntity,
  type }) => {
  const classes = useStyles();

  return (
    <div className={classes.demo}>
      <List disablePadding>
        {data && data.length
          ? data.map((obj) => (
            <BoxWithBorder key={obj._id} style={{ margin: "8px" }}>
              <ListItem disableGutters className={classes.list}>
                <div>
                  <ListItemText
                    primary={
                      <Typography>
                        <Link
                          className="link"
                          to={`/user/detail/${obj._id}`}
                        >
                          {`${obj.firstName} ${obj.lastName}` || ""}
                        </Link>
                      </Typography>
                    }
                    secondary={obj.email}
                  />
                </div>

                <CopyToClipboard textToCopy={obj.email} className="ml-1 mt-4" />

                
                {permissions.role.isUpdate && (
                  <ListItemSecondaryAction
                    title={
                      selectedEntity === obj._id
                        ? "Primary user can't be unassigned"
                        : "Unassign User"
                    }
                  >
                    <IconButton
                      size="small"
                      disabled={selectedEntity === obj._id}
                      edge="end"
                      aria-label="delete"
                      onClick={() => unassignEntity(obj)}
                    >
                      <DeleteIcon
                        color={selectedEntity === obj._id ? "disabled" : "error"}
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

export default AssignedUsers;

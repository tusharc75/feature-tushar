import { useState, useEffect, useContext } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@material-ui/core";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import Loader from "../Loader";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const AssignUserDialog = ({
  usersDialogOpen,
  onSuccess,
  handleCloseDialog,
  roleIds,
  assignedUsers
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isAssigning, setAssigning] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    console.log(JSON.stringify(assignedUsers))
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data } }) => {
        setUsers(data.filter(user => !assignedUsers.some(item => item?._id === user?._id)).map(obj => ({ ...obj, isChecked: false })))
        setLoadingUsers(false);
      })
      .catch((error) => {
        setLoadingUsers(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);


  const handleAssignRoles = async () => {
    if (selectedUsers.length) {
      setAssigning(true);

      const dataObj = {
        users: selectedUsers,
        roles: roleIds,
      };

      await axiosInstance()
        .put(`/user/assign-role`, dataObj)
        .then(() => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: "Roles assigned successfully",
            type: "success",
            open: true,
          });

          onSuccess();
        })
        .catch((error) => {
          setAssigning(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={usersDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title="Assign Users" />
      <CustomDialogContent>
        {loadingUsers ? (
          <Loader text="Loading Users" />
        ) : users.length ? (
          <List style={{ padding: 0 }}>
            {users.map((user) => (
              <ListItem divider key={user._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => {
                      user.isChecked = e.target.checked
                      setSelectedUsers(users.filter(r => r.isChecked).map(obj => obj._id))
                    }
                    }
                    checked={user.isChecked}
                    inputProps={{
                      "aria-labelledby": `checkbox-list-label-${user._id}`,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>All Users has been assigned</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          disabled={isAssigning}
          onClick={handleCloseDialog}
          color="primary"
          size="small" 
        >
          Cancel
        </Button>
        <Button
          disabled={!selectedUsers.length || isAssigning}
          onClick={handleAssignRoles}
          color="primary"
          size="small" 
        >
          {isAssigning ? <CircularProgress size={22} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignUserDialog;

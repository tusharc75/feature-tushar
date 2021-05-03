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
import Loader from "../../components/Loader";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const AssignTeamUsers = ({
  usersDialogOpen,
  onSuccess,
  handleCloseDialog,
  ids,
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isAssigning, setAssigning] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data } }) => {
        setUsers(data);
        setLoadingUsers(false);
      })
      .catch((error) => {
        setLoadingUsers(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleUserSelection = (e, id) => {
    let tempSelectedUsers = [...selectedUsers];
    let curIndex = tempSelectedUsers.indexOf(id);
    if (e.target.checked) {
      if (curIndex < 0) tempSelectedUsers = [...tempSelectedUsers, id];
    } else if (curIndex >= 0) {
      tempSelectedUsers.splice(curIndex, 1);
    }
    setSelectedUsers(tempSelectedUsers);
  };

  const handleAssignUsers = async () => {
    if (selectedUsers.length) {
      setAssigning(true);

      const dataObj = {
        users: selectedUsers,
        roles: ids,
      };

      //   await axiosInstance()
      //     .post(`/role/assign-role`, dataObj)
      //     .then(() => {
      //       setAssigning(false);
      //       toastConfig.setToastConfig({
      //         message: "Roles assigned successfully",
      //         type: "success",
      //         open: true,
      //       });

      //       onSuccess();
      //     })
      //     .catch((error) => {
      //       setAssigning(false);
      //       toastConfig.setToastConfig(error);
      //     });
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
            {users.map((role) => (
              <ListItem divider key={role._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => handleUserSelection(e, role._id)}
                    checked={selectedUsers.indexOf(role._id) >= 0}
                    inputProps={{
                      "aria-labelledby": `checkbox-list-label-${role._id}`,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${role.firstName} ${role.lastName}`}
                  secondary={role.email}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No Users</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          disabled={isAssigning}
          onClick={handleCloseDialog}
          color="primary"
        >
          Cancel
        </Button>
        <Button
          disabled={!selectedUsers.length || isAssigning}
          onClick={handleAssignUsers}
          color="primary"
        >
          {isAssigning ? <CircularProgress size={22} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignTeamUsers;

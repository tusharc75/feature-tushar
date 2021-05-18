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
import { roleTypes } from "../../constants/helpers";

const AssignRolesDialog = ({
  rolesDialogOpen,
  onSuccess,
  handleCloseDialog,
  userIds,
  assignedRoles
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const globalRole = roleTypes.filter((obj) => obj.key === "Global")[0].value;
  useEffect(() => {
    setLoadingRoles(true);
    axiosInstance()
      .get(`/role`)
      .then(({ data: { data } }) => {
        assignedRoles ?
          setRoles(data.filter(role => role?.type === globalRole && !assignedRoles.some(item => item?._id === role?._id)).map(obj => ({ ...obj, isChecked: false })))
          :
          setRoles(data.filter(role => role?.type === globalRole).map(obj => ({ ...obj, isChecked: false })))
        setLoadingRoles(false)
      })
      .catch((error) => {
        setLoadingRoles(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleAssignRoles = async () => {
    if (selectedRoles.length) {
      setAssigning(true);

      const dataObj = {
        users: userIds,
        roles: selectedRoles,
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
      open={rolesDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title="Assign roles" />
      <CustomDialogContent>
        {loadingRoles ? (
          <Loader text="Loading Roles" />
        ) : roles.length ? (
          <List style={{ padding: 0 }}>
            {roles.map((role) => (
              <ListItem divider key={role._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => {
                      role.isChecked = e.target.checked
                      setSelectedRoles(roles.filter(r => r.isChecked).map(obj => obj._id))
                    }
                    }
                    checked={role.isChecked}
                    inputProps={{
                      "aria-labelledby": `checkbox-list-label-${role._id}`,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={role.name}
                  secondary={role.description}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>All Roles has been assigned</Typography>
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
          disabled={!selectedRoles.length || isAssigning}
          onClick={handleAssignRoles}
          color="primary"
        >
          {isAssigning ? <CircularProgress size={22} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignRolesDialog;

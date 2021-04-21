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
        setRoles(data.filter((d) => d.type === globalRole))
        setLoadingRoles(false)
      })
      .catch((error) => {
        setLoadingRoles(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleRoleSelection = (e, id) => {
    let tempSelectedRoles = [...selectedRoles];
    let curIndex = tempSelectedRoles.indexOf(id);
    if (e.target.checked) {
      if (curIndex < 0) tempSelectedRoles = [...tempSelectedRoles, id];
    } else if (curIndex >= 0) {
      tempSelectedRoles.splice(curIndex, 1);
    }
    setSelectedRoles(tempSelectedRoles);
  };

  const handleAssignRoles = async () => {
    if (selectedRoles.length) {
      setAssigning(true);

      const dataObj = {
        users: userIds,
        roles: selectedRoles,
      };

      await axiosInstance()
        .post(`/role/assign-role`, dataObj)
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
                    onChange={(e) => handleRoleSelection(e, role._id)}
                    checked={selectedRoles.indexOf(role._id) >= 0}
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
          <Typography>No Roles</Typography>
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

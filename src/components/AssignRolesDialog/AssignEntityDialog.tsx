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

const AssignEntityDialog = ({
  entitiesDialogOpen,
  onSuccess,
  handleCloseDialog,
  roleIds,
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [users, setEntities] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [isAssigning, setAssigning] = useState(false);

  useEffect(() => {
    setLoadingEntities(true);
    axiosInstance()
      .get(`/entity`)
      .then(({ data: { data } }) => {
        setEntities(data);
        setLoadingEntities(false);
      })
      .catch((error) => {
        setLoadingEntities(false);
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleEntitySelection = (e, id) => {
    let tempSelectedEntities = [...selectedEntities];
    let curIndex = tempSelectedEntities.indexOf(id);
    if (e.target.checked) {
      if (curIndex < 0) tempSelectedEntities = [...tempSelectedEntities, id];
    } else if (curIndex >= 0) {
      tempSelectedEntities.splice(curIndex, 1);
    }
    setSelectedEntities(tempSelectedEntities);
  };

  const handleAssignRoles = async () => {
    if (selectedEntities.length) {
      setAssigning(true);

      const dataObj = {
        entities: selectedEntities,
        roles: roleIds,
      };

      await axiosInstance()
        .put(`/entity/add-role`, dataObj)
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
      open={entitiesDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title="Assign Entities" />
      <CustomDialogContent>
        {loadingEntities ? (
          <Loader text="Loading Entities" />
        ) : users.length ? (
          <List style={{ padding: 0 }}>
            {users.map((entity) => (
              <ListItem divider key={entity._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => handleEntitySelection(e, entity._id)}
                    checked={selectedEntities.indexOf(entity._id) >= 0}
                    inputProps={{
                      "aria-labelledby": `checkbox-list-label-${entity._id}`,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={entity.entityName}
                  secondary={entity.address || ""}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No Entities</Typography>
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
          disabled={!selectedEntities.length || isAssigning}
          onClick={handleAssignRoles}
          color="primary"
        >
          {isAssigning ? <CircularProgress size={22} /> : "Save"}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignEntityDialog;

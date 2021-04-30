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
  ids,
  type,
  assignedEntity
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedData, setSelectedData] = useState([]);
  const [isAssigning, setAssigning] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    axiosInstance()
      .get(`/${type}`)
      .then(({ data: { data } }) => {
        if (type === "role") {
          assignedEntity ?
            setData(data.filter(role => role?.type === 2 && !assignedEntity.some(item => item?._id === role?._id)))
            :
            setData(data.filter((d) => d.type === 2));
        } else {
         
          assignedEntity ?
          setData(data.filter(entity => !assignedEntity.some(item => item?._id === entity?._id)))
          :
          setData(data);
        }
        setLoadingData(false);
      })
      .catch((error) => {
        setLoadingData(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleEntitySelection = (e, id) => {
    let tempSelectedEntities = [...selectedData];
    let curIndex = tempSelectedEntities.indexOf(id);
    if (e.target.checked) {
      if (curIndex < 0) tempSelectedEntities = [...tempSelectedEntities, id];
    } else if (curIndex >= 0) {
      tempSelectedEntities.splice(curIndex, 1);
    }
    setSelectedData(tempSelectedEntities);
  };

  const handleAssignRoles = async () => {
    if (selectedData.length) {
      setAssigning(true);
      let dataObj: any;
      if (type === "entity") {
        dataObj = {
          entities: selectedData,
          roles: ids,
        };
      } else {
        dataObj = {
          entities: ids,
          roles: selectedData,
        };
      }

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
        {loadingData ? (
          <Loader text="Loading Entities" />
        ) : data.length ? (
          <List style={{ padding: 0 }}>
            {data.map((d) => (
              <ListItem divider key={d._id}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    onChange={(e) => handleEntitySelection(e, d._id)}
                    checked={selectedData.indexOf(d._id) >= 0}
                    inputProps={{
                      "aria-labelledby": `checkbox-list-label-${d._id}`,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={type === "entity" ? d.entityName : d.name || ""}
                  secondary={type === "role" ? d.description : d.address || ""}
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
          disabled={!selectedData.length || isAssigning}
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

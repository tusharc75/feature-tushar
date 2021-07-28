import { useState, useEffect, useContext } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  FormControl,
  FormControlLabel,
  Grid,
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
import SearchBox from "../Helpers/SearchBox";

const AssignRolesDialog = ({
  rolesDialogOpen,
  onSuccess,
  handleCloseDialog,
  userIds,
  assignedRoles,
  isRenderedFromUserSetUp = false,
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [roles, setRoles] = useState([]);
  const [rolesConst, setRolesConst] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [search, setSearch] = useState("");
  const globalRole = roleTypes.filter((obj) => obj.key === "Global")[0].value;
  useEffect(() => {
    setLoadingRoles(true);
    axiosInstance()
      .get(`/role`)
      .then(({ data: { data } }) => {
        if (assignedRoles) {
          setRoles(data.filter(role => role?.type === globalRole && !assignedRoles.some(item => item?._id === role?._id)).map(obj => ({ ...obj, isChecked: false })))
          setRolesConst(data.filter(role => role?.type === globalRole && !assignedRoles.some(item => item?._id === role?._id)).map(obj => ({ ...obj, isChecked: false })))
        } else {
          setRoles(data.filter(role => role?.type === globalRole).map(obj => ({ ...obj, isChecked: false })))
          setRolesConst(data.filter(role => role?.type === globalRole).map(obj => ({ ...obj, isChecked: false })))
        }
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

  const handleSearch = (e) => {
    let value = e.target.value;
    setSearch(value);
    let result = [];
    result = rolesConst.filter((data) => {
      return data.name.toLowerCase().search(value.toLowerCase()) != -1 || data.description.toLowerCase().search(value.toLowerCase()) != -1;
    });
    setRoles(result)
  };

  return (
    // <Dialog
    //   fullWidth
    //   maxWidth="xs"
    //   open={rolesDialogOpen}
    //   onClose={handleCloseDialog}
    //   aria-labelledby="assign-roles-dialog"
    // >
    <>
      {!isRenderedFromUserSetUp && <CustomDialogHeader title="Assign roles" />}
      <CustomDialogContent>
        {loadingRoles ? (
          <Loader text="Loading Roles" />
        ) : rolesConst.length ? (
          <>
            <Grid container>
              <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-2">
                <FormControl component="fieldset">
                  <FormControlLabel
                    value="top"
                    control={
                      <Checkbox
                        // edge="start"
                        onChange={(e) => {
                          roles.forEach((data) => data.isChecked = e.target.checked)
                          setSelectedRoles(roles.filter(r => r.isChecked).map(obj => obj._id))
                        }
                        }
                        checked={roles.every(x => x.isChecked)}
                        inputProps={{
                          "aria-labelledby": `checkbox-list-label-select-all`,
                        }}
                      />}
                    label="Select All"
                  />
                </FormControl>

              </Grid>
              <Grid item xs={12} md={6} sm={6} container justify="flex-end">
                <SearchBox
                  onSearch={handleSearch}
                  searchbox="terms_header_search_bar"
                  width="300px"
                  value={search}
                />
              </Grid>
            </Grid>
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
          </>
        ) : (
          <Typography>All Roles has been assigned</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        {!isRenderedFromUserSetUp && 
        <Button
          disabled={isAssigning}
          onClick={handleCloseDialog}
          color="primary"
          size="small"
        >
          Cancel
        </Button>}
        <Button
          disabled={!selectedRoles.length || isAssigning}
          onClick={handleAssignRoles}
          color="primary"
          size="small"
          variant="contained"
        >
          {isAssigning ? <CircularProgress size={22} /> : isRenderedFromUserSetUp ? "Save & Continue" : "Save"}
        </Button>
      </CustomDialogFooter>
      
    {/* // </Dialog> */}
    </>
  );
};

export default AssignRolesDialog;

import { useState, useEffect, useContext } from "react";
import {
    Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  FormControl,
  FormGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Grid,
  Paper,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@material-ui/core";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import Loader from "../../components/Loader";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { roleTypes } from "../../constants/helpers";
import { Skeleton } from "@material-ui/lab";
import { startCase } from "lodash";

const approvalProcessLabels = {
    "approveAccount":false,
    "convertLeadToOpportunity":false,
    "doaSetup":false,
    "viewAndRestoreTrash":false
}

const ApprovalProcessDialog = ({
  openApprovalProcessDialog,
  onSuccess,
  handleCloseDialog,
  userIds,
  hasPermissionToUpdateApprovalProcess,
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [roles, setRoles] = useState([]);
  const [userPermissions, setUserPermissions] = useState({
    "approveAccount":false,
    "convertLeadToOpportunity":false,
    "doaSetup":false,
    "viewAndRestoreTrash":false
})
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const globalRole = roleTypes.filter((obj) => obj.key === "Global")[0].value;
  useEffect(() => {
    
    // eslint-disable-next-line
  }, []);

  const handleSetApprovalProcess = () => {
    
    const newData = {
        _ids: userIds,
        "approveAccount": userPermissions.approveAccount, 
        "convertLeadToOpportunity": userPermissions.convertLeadToOpportunity, 
        "doaSetup": userPermissions.doaSetup, 
        "viewAndRestoreTrash": userPermissions.viewAndRestoreTrash
      };
      // setHasPermissionToUpdateApprovalProcess(false);
      axiosInstance()
        .put("/user/permission-setups", newData)
        .then(({ data }) => {
          // setHasPermissionToUpdateApprovalProcess(permissions.user.isUpdate && user?.user?.userType === userType.brandAdmin);
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          onSuccess()

        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
  }

  const handleChangePermissions = (e) => {
    setUserPermissions((prevState) => ({ ...prevState, [e.target.name]: e.target.checked }));
    
  };




  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={openApprovalProcessDialog}
      onClose={handleCloseDialog}
      aria-labelledby="set-approval-dialog"
    >
      <CustomDialogHeader title="Set Approval Process" onClose={handleCloseDialog}/>
      <CustomDialogContent>
        
        <Grid item xs={12} sm={12} md={12} lg={12}>
            <Paper className="fixedRightPanel">
              <Box padding={2}>
                <FormControl component="fieldset" fullWidth>
                  <FormGroup>
                     
                     { Object.keys(approvalProcessLabels).map((key) => (
                        <Tooltip title={!hasPermissionToUpdateApprovalProcess ? `You do not have permission to update ${startCase(key)}` : ""}>
                          <FormControlLabel
                            key={key}
                            control={
                              <Switch
                                checked={userPermissions[key]}
                                name={key}
                                disabled={!hasPermissionToUpdateApprovalProcess}
                                onChange={handleChangePermissions}
                              />
                            }
                            label={key === "doaSetup" ? "DOA Setup" : startCase(key)}
                          />
                        </Tooltip>
                      ))}
                    
                  </FormGroup>
                </FormControl>
              </Box>
            </Paper>
          </Grid>
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
          onClick={handleSetApprovalProcess}
          color="primary"
          size="small" 
          variant="contained"
        >
            Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ApprovalProcessDialog;

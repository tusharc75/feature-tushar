import { useState, useContext } from "react";
import {
    Box,
    Button,
    FormControl,
    FormGroup,
    Grid,
    Paper,
    Tooltip,
    Switch,
    FormControlLabel,
} from "@material-ui/core";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { startCase } from "lodash";

const approvalProcessLabels = {
    "approveAccount": false,
    "convertLeadToOpportunity": false,
    "doaSetup": false,
    "viewAndRestoreTrash": false
}

const ApprovalProcessDialog = ({
    openApprovalProcessDialog,
    onSuccess,
    handleCloseDialog,
    userIds,
    hasPermissionToUpdateApprovalProcess,
    isRenderedFromUserSetUp = false
}) => {
    const toastConfig = useContext(CustomToastContext);
    const [userPermissions, setUserPermissions] = useState({
        "approveAccount": false,
        "convertLeadToOpportunity": false,
        "doaSetup": false,
        "viewAndRestoreTrash": false
    })

    const handleSetApprovalProcess = () => {
        const newData = {
            _ids: userIds,
            "approveAccount": userPermissions.approveAccount,
            "convertLeadToOpportunity": userPermissions.convertLeadToOpportunity,
            "doaSetup": userPermissions.doaSetup,
            "viewAndRestoreTrash": userPermissions.viewAndRestoreTrash
        };

        axiosInstance()
            .put("/user/permission-setups", newData)
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
                onSuccess(newData)

            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    const handleChangePermissions = (e) => {
        setUserPermissions((prevState) => ({ ...prevState, [e.target.name]: e.target.checked }));

    };

    return (
        <>
            {!isRenderedFromUserSetUp && <CustomDialogHeader title="Set Approval Process" onClose={handleCloseDialog} />}

            <CustomDialogContent>

                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Paper className="fixedRightPanel">
                        <Box padding={2}>
                            <FormControl component="fieldset" fullWidth>
                                <FormGroup>

                                    {Object.keys(approvalProcessLabels).map((key) => (
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
                {!isRenderedFromUserSetUp &&
                    <Button
                        onClick={handleCloseDialog}
                        color="primary"
                        size="small"
                    >
                        Cancel
                    </Button>
                }
                <Button
                    onClick={handleSetApprovalProcess}
                    color="primary"
                    size="small"
                    variant="contained"
                >
                    {isRenderedFromUserSetUp ? "Save & Continue" : "Save"}
                </Button>
            </CustomDialogFooter>
        </>
    );
};

export default ApprovalProcessDialog;

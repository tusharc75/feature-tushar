import React, { useState, useEffect, useContext } from "react";
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    makeStyles,
    Typography,
} from "@material-ui/core";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import Loader from "../Loader";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { startCase } from "lodash";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import { roleTypes } from "../../constants/helpers";

const useStyles = makeStyles((theme) => ({

    button: {
        marginTop: theme.spacing(1),
        marginRight: theme.spacing(1),
    },
    actionsContainer: {
        marginBottom: theme.spacing(2),
    },
    resetContainer: {
        padding: theme.spacing(3),
    },
}));

const AssignRegionalRolesUserDialog = ({
    entitiesDialogOpen,
    onSuccess,
    handleCloseDialog,
    ids,
    assignedUsers
}) => {
    const toastConfig = useContext(CustomToastContext);
    const [entity, setEntity] = useState([]);
    const [user, setUser] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState([]);
    const [selectedUser, setSelectedUser] = useState([]);
    const [isAssigning, setAssigning] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const steps = [`Select User`, 'Select Entity']
    const classes = useStyles();

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    useEffect(() => {
        setLoadingData(true);
        axiosInstance()
            .get(`/user`)
            .then(({ data: { data } }) => {
                setUser(data.filter(user => !assignedUsers.some(item => item?._id === user?._id)).map(obj => ({ ...obj, isChecked: false })));
                setLoadingData(false);
            })
            .catch((error) => {
                setLoadingData(false);
                toastConfig.setToastConfig(error);
            });

        axiosInstance()
            .get(`/entity`)
            .then(({ data: { data } }) => {
                setEntity(data.map(obj => ({ ...obj, isChecked: false })));
                setLoadingData(false);
            })
            .catch((error) => {
                setLoadingData(false);
                toastConfig.setToastConfig(error);
            });
        // eslint-disable-next-line
    }, []);


    const handleAssignEntity = async () => {

        let dataObj = {
            users: selectedUser,
            entities: selectedEntity,
            roles: ids[0],
        };

        await axiosInstance()
            .put(`/user/assign-regional-role`, dataObj)
            .then(() => {
                setAssigning(false);
                toastConfig.setToastConfig({
                    message: `User assigned successfully`,
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

    function getStepContent(step: number) {
        switch (step) {
            case 0:
                return <List style={{ padding: 0 }}>
                    {user.map((d) => (
                        <ListItem divider key={d._id}>
                            <ListItemIcon>
                                <Checkbox
                                    edge="start"
                                    onChange={(e) => {
                                        d.isChecked = e.target.checked
                                        setSelectedUser(user.filter(d => d.isChecked).map(obj => obj._id))
                                    }
                                    }
                                    checked={d.isChecked}
                                    inputProps={{
                                        "aria-labelledby": `checkbox-list-label-${d._id}`,
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={`${d.firstName} ${d.lastName}` || ""}
                                secondary={d.email || ""}
                            />
                        </ListItem>
                    ))}
                </List>
            case 1:
                return <List style={{ padding: 0 }}>
                    {entity.map((d) => (
                        <ListItem divider key={d._id}>
                            <ListItemIcon>
                                <Checkbox
                                    edge="start"
                                    onChange={(e) => {
                                        d.isChecked = e.target.checked
                                        setSelectedEntity(entity.filter(r => r.isChecked).map(obj => obj._id))
                                    }
                                    }
                                    checked={d.isChecked}
                                    inputProps={{
                                        "aria-labelledby": `checkbox-list-label-${d._id}`,
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={d.entityName || ""}
                                secondary={d.address || ""}
                            />
                        </ListItem>
                    ))}
                </List>

            default:
                return 'Unknown step';
        }
    }

    return (
        <Dialog
            fullWidth
            maxWidth="sm"
            open={entitiesDialogOpen}
            onClose={handleCloseDialog}
            aria-labelledby="assign-roles-dialog"
        >
            <CustomDialogHeader title={`Assign  User`} />
            <CustomDialogContent>
                {(loadingData ? (
                    <Loader text={`Loading User`} />
                ) : user.length ? (
                    <Stepper activeStep={activeStep} orientation="vertical">
                        {steps.map((label, index) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                                <StepContent>
                                    <Typography>{getStepContent(index)}</Typography>
                                    <div className={classes.actionsContainer}>
                                        <div>
                                            <Button
                                                size="small"
                                                disabled={activeStep === 0}
                                                onClick={handleBack}
                                                className={classes.button}
                                            >
                                                Back
                                                </Button>
                                            {(activeStep !== steps.length - 1) &&
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={handleNext}
                                                    disabled={selectedEntity.some(item => item?.isChecked)}
                                                    className={classes.button}
                                                >
                                                    Next
                      </Button>
                                            }
                                        </div>
                                    </div>
                                </StepContent>
                            </Step>
                        ))}
                    </Stepper>
                ) : (
                    <Typography>{`All user has been assigned`}</Typography>
                ))}
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
                    disabled={!selectedEntity?.length || !selectedUser?.length}
                    onClick={handleAssignEntity}
                    color="primary"
                    size="small"
                >
                    {isAssigning ? <CircularProgress size={22} /> : "Save"}
                </Button>
            </CustomDialogFooter>
        </Dialog>
    );
};

export default AssignRegionalRolesUserDialog;

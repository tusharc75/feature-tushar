import { useState } from 'react'
import {
    Dialog,
    Stepper,
    StepLabel,
    Step,
    Typography,
    makeStyles,
    createStyles,
    Theme,
} from "@material-ui/core";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import ApprovalProcessDialog from './ApprovalProcessDialog';
import { useData } from '../../StateProvider/Provider';
import { userType } from '../../constants/helpers';
import AssignRolesDialog from '../../components/AssignRolesDialog/AssignRolesDialog';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import DoaDialog from '../DoaSetup/ManageDoa/ManageDoaDialog';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
        },
        backButton: {
            marginRight: theme.spacing(1),
        },
        instructions: {
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1),
        },
    }),
);

const stepsLabel = ["Set Approval Process", "Assign Company Wide Role", "Assign Regional Roles", "Assign DOA"]

const UserSetupDialog = ({ open, close, onSuccess, userIds, isDisable = false, userPermissions = null, fetchUsers, userList, selectedRecords }) => {
    const [activeStep, setActiveStep] = useState(0)
    
    const { state: { user, permissions }, } = useData();
    const classes = useStyles();

    const getStepContent = (step: Number) => {
        switch (step) {
            case 0:
                return (
                    <ApprovalProcessDialog
                        openApprovalProcessDialog={open}
                        hasPermissionToUpdateApprovalProcess={permissions.user.isUpdate && user?.user?.userType === userType.brandAdmin}
                        onSuccess={() =>
                            setActiveStep((prevStep) => prevStep + 1)
                            
                        }
                        handleCloseDialog={close}
                        userIds={userIds}
                        isRenderedFromUserSetUp={true}
                    />
                )

            case 1:
                return (
                    <AssignRolesDialog
                        rolesDialogOpen={open}
                        handleCloseDialog={close}
                        userIds={userIds}
                        assignedRoles={null}
                        onSuccess={() => {
                            setActiveStep((prevStep) => prevStep + 1)
                            
                        }}
                        isRenderedFromUserSetUp={true}
                    />
                )
            case 2:
                return (
                    <AssignEntityDialog
                        entitiesDialogOpen={open}
                        handleCloseDialog={close}
                        type="entity"
                        ids={userIds}
                        assignedEntity={[]}
                        regionalRole={false}
                        onSuccess={() => {
                            setActiveStep((prevStep) => prevStep + 1)
                            
                        }}
                        isRenderedFromUserSetUp={true}
                    />
                )
            case 3:
                return (
                    <DoaDialog
                        userList={userList.filter(user => !selectedRecords.some(item => item?._id === user?.id))}
                        doa={[]}
                        doaCurrency={null}
                        userSelected={userIds}
                        open={open}
                        from={"UserListPage"}
                        onSuccess={() => {
                            close();
                            fetchUsers();
                        }}
                        onClose={close}
                        isRenderedFromUserSetUp={true}
                    />
                )
            default:
                return "Unknown step";
        }
    }
    return (
        <Dialog
            fullWidth
            maxWidth="md"
            open={open}
            onClose={close}
            aria-labelledby="set-approval-dialog"
        >
            <CustomDialogHeader title="User Setup" onClose={onSuccess} />
            <CustomDialogContent>
                <div className={classes.root}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {stepsLabel.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <div>
                        {activeStep === stepsLabel.length ? (
                            <div>
                                <Typography className={classes.instructions}>All steps completed</Typography>
                            </div>
                        ) : (
                            <div>
                                <Typography className={classes.instructions}>{getStepContent(activeStep)}</Typography>
                                
                            </div>
                        )}
                    </div>
                </div>

            </CustomDialogContent>
        </Dialog>
    )
}

export default UserSetupDialog

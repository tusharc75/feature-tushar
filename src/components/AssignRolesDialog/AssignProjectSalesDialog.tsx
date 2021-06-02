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
import { customerAccount, customerContact, opportunity } from "../../constants/helpers"
import { kebabCase, startCase } from "lodash";
const AssignProjectSalesDialog = ({
    projectSalesDialogOpen,
    onSuccess,
    handleCloseDialog,
    assignedProjectSales,
    type,
}) => {
    const toastConfig = useContext(CustomToastContext);
    const [projectSales, setProjectSales] = useState([]);
    const [loadingProjectSales, setLoadingProjectSales] = useState(false);
    const [selectedProjectSales, setSelectedProjectSales] = useState([]);
    const [isAssigning, setAssigning] = useState(false);
    const [resource, setResource] = useState(null);
    const [id, setId] = useState(null);

    useEffect(() => {
        setLoadingProjectSales(true);
        if (type.some(item => item?.type === customerContact.contactResource)) {
            setResource("customerContacts")
            setId(type.find(item => item.type === customerContact.contactResource).id)
        }
        else if (type.some(item => item?.type === customerAccount.accountResource)) {
            setResource("customerAccounts")
            setId(type.find(item => item.type === customerAccount.accountResource).id)
        }
        else {
            setResource("opportunities")
            setId(type.find(item => item.type === opportunity.opportunityResource).id)
        }
        debugger
        let api = type.some(item => item?.type === customerContact.contactResource) ?
            `/project-sales?filterById=[{"field": "staticData.customerAccount", "term": "${type.find(item => item.type === customerAccount.accountResource).id}"}]`
            : `/project-sales`
        axiosInstance()
            .get(api)
            .then(({ data: { data } }) => {
                setProjectSales(data.filter(projectSales => !assignedProjectSales.some(item => item?._id === projectSales?._id)).map(obj => ({ ...obj, isChecked: false })))
                setLoadingProjectSales(false);
            })
            .catch((error) => {
                setLoadingProjectSales(false);
                toastConfig.setToastConfig(error);
            });
        // eslint-disable-next-line
    }, []);


    const handleAssignProjectSales = async () => {
        if (selectedProjectSales.length) {
            setAssigning(true);
            debugger
            const dataObj = {
                [resource]: [id],
                "_ids": selectedProjectSales,
            };

            axiosInstance()
                .put(`/project-sales/add-${kebabCase(resource)}`, dataObj)
                .then(() => {
                    setAssigning(false);
                    toastConfig.setToastConfig({
                        message: `${startCase(type)} added successfully`,
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
            open={projectSalesDialogOpen}
            onClose={handleCloseDialog}
            aria-labelledby="assign-roles-dialog"
        >
            <CustomDialogHeader title="Assign Project Sales" />
            <CustomDialogContent>
                {loadingProjectSales ? (
                    <Loader text="Loading ProjectSales" />
                ) : projectSales.length ? (
                    <List style={{ padding: 0 }}>
                        {projectSales.map((projectSale) => (
                            <ListItem divider key={projectSale._id}>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        onChange={(e) => {
                                            projectSale.isChecked = e.target.checked
                                            setSelectedProjectSales(projectSales.filter(r => r.isChecked).map(obj => obj._id))
                                        }
                                        }
                                        checked={projectSale.isChecked}
                                        inputProps={{
                                            "aria-labelledby": `checkbox-list-label-${projectSale._id}`,
                                        }}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={projectSale.projectName}
                                    secondary={projectSale.projectManager?.optionLabel}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography>All Project Sales has been assigned</Typography>
                )}
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
                    disabled={!selectedProjectSales.length || isAssigning}
                    onClick={handleAssignProjectSales}
                    color="primary"
                    size="small"
                >
                    {isAssigning ? <CircularProgress size={22} /> : "Save"}
                </Button>
            </CustomDialogFooter>
        </Dialog>
    );
};

export default AssignProjectSalesDialog;



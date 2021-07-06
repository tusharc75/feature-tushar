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
import { customerAccount, customerContact, opportunity } from "../../constants/helpers"
import { startCase } from "lodash";
import SearchBox from "../Helpers/SearchBox";
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
    const [projectSalesConst, setProjectSalesConst] = useState([]);
    const [isAssigning, setAssigning] = useState(false);
    const [resource, setResource] = useState(null);
    const [id, setId] = useState(null);
    const [addAPI, setAddAPI] = useState(null);
    const [search, setSearch] = useState("");


    useEffect(() => {
        setLoadingProjectSales(true);
        if (type.some(item => item?.type === customerContact.contactResource)) {
            setResource(customerContact.contactResource)
            setId(type.find(item => item.type === customerContact.contactResource).id)
            setAddAPI("customer-contacts")
        }
        else if (type.some(item => item?.type === opportunity.opportunityResource)) {
            setResource(opportunity.opportunityResource)
            setId(type.find(item => item.type === opportunity.opportunityResource).id)
            setAddAPI("opportunities")
        }
        else {
            setResource(customerAccount.accountResource)
            setId(type.find(item => item.type === customerAccount.accountResource).id)
            setAddAPI("customer-accounts")

        }
        let api = type.some(item => item?.type === customerContact.contactResource) ?
            `/project-sales?filterById=[{"field": "staticData.customerAccount", "term": "${type.find(item => item.type === customerAccount.accountResource).id}"}]`
            : `/project-sales`
        axiosInstance()
            .get(api)
            .then(({ data: { data } }) => {
                setProjectSales(data.filter(projectSales => !assignedProjectSales.some(item => item?._id === projectSales?._id)).map(obj => ({ ...obj, isChecked: false })))
                setProjectSalesConst(data.filter(projectSales => !assignedProjectSales.some(item => item?._id === projectSales?._id)).map(obj => ({ ...obj, isChecked: false })))
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
            const dataObj = {
                [resource]: [id],
                "_ids": selectedProjectSales,
            };

            axiosInstance()
                .put(`/project-sales/add-${addAPI}`, dataObj)
                .then(() => {
                    setAssigning(false);
                    toastConfig.setToastConfig({
                        message: `${startCase(resource)} added successfully`,
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
        let value = e.target.value.toLowerCase();
        setSearch(value);
        let result = [];
        result = projectSalesConst.filter((data) => {
            return data.projectName.search(value) != -1 || data.projectManager?.optionLabel.search(value) != -1;
        });
        setProjectSales(result)
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
                ) : projectSalesConst.length ? (
                    <>
                        <Grid container>
                            <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
                                <FormControl component="fieldset">
                                    <FormControlLabel
                                        value="top"
                                        control={
                                            <Checkbox
                                                edge="start"
                                                onChange={(e) => {
                                                    projectSales.forEach((project) => project.isChecked = e.target.checked)
                                                    setSelectedProjectSales(projectSales.filter(r => r.isChecked).map(obj => obj._id))
                                                }
                                                }
                                                checked={projectSales.every(x => x.isChecked)}
                                                inputProps={{
                                                    "aria-labelledby": `checkbox-list-label-select-all`,
                                                }}
                                            />}
                                        label="Select all Project"
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
                    </>
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
                    variant="contained"
                >
                    {isAssigning ? <CircularProgress size={22} /> : "Save"}
                </Button>
            </CustomDialogFooter>
        </Dialog>
    );
};

export default AssignProjectSalesDialog;



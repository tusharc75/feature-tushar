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
    Typography,
    TextField
} from "@material-ui/core";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import Loader from "../../components/Loader";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import _ from 'lodash'
import Autocomplete from '@material-ui/lab/Autocomplete';

export default function AssignSupplierContactsDialog({
    opportunityId,
    open,
    title,
    onSuccess,
    handleCloseDialog,
    contacts,
    assignedContacts,
    contactType,
    supplierAccountOptions
}) {
    const toastConfig = useContext(CustomToastContext);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isAssigning, setAssigning] = useState(false);

    const [currentContacts, setCurrentContacts] = useState(contacts.supplierContacts)

    const [selectedSupplierAccounts, setSelectedSupplierAccounts] = useState([])

    useEffect(() => {
        let selectedSupplierAccounts = []
        const updatedContacts = [];
        currentContacts.map(d => {
            d["isChecked"] = assignedContacts.length > 0 ? assignedContacts.some(item => item?._id === d?._id) : false;
            if (d["isChecked"] && selectedSupplierAccounts.indexOf(d?.accountName?.optionValue) < 0) {
                selectedSupplierAccounts.push(d.accountName.optionValue)
            }
            updatedContacts.push(d);
        })
        setSelectedSupplierAccounts(selectedSupplierAccounts)
        setCurrentContacts(updatedContacts)
    }, []);

    const handleContactSelection = (e, id) => {
        const indexOfContactToChange = currentContacts.findIndex(d => d._id == id);
        currentContacts[indexOfContactToChange].isChecked = e.target.checked;
        setCurrentContacts([...currentContacts]);
    };

    const getFilteredIds = (data) => {
        return _.cloneDeep(data).filter(f => f.isChecked).map(m => m._id)
    }
    const isDataAvailable = (fieldKey) => {
        return (contacts && contacts?.[fieldKey] && contacts[fieldKey].length)
    }
    const handleAssignContacts = async () => {
        setAssigning(true);

        const dataToSave = {
            _id: opportunityId,
            supplierContacts: contactType === "supplier" ? getFilteredIds(currentContacts) : isDataAvailable("supplierContacts") ? getFilteredIds(contacts.supplierContacts) : [],
            customerContacts: contactType === "customer" ? getFilteredIds(currentContacts) : isDataAvailable("customerContacts") ? getFilteredIds(contacts.customerContacts) : []
        };

        await axiosInstance()
            .put(`/opportunity/add-contacts`, dataToSave)
            .then(({ data }) => {
                setAssigning(false);
                toastConfig.setToastConfig({
                    message: data.message,
                    type: "success",
                    open: true,
                });

                onSuccess();
            })
            .catch((error) => {
                setAssigning(false);
                toastConfig.setToastConfig(error);
            });
    };
    const RenderListItem = ({ contact }) => (
        <ListItem divider key={contact._id}>
            <ListItemIcon>
                <Checkbox
                    edge="start"
                    onChange={(e) => handleContactSelection(e, contact._id)}
                    checked={contact.isChecked}
                    inputProps={{
                        "aria-labelledby": `checkbox-list-label-${contact._id}`,
                    }}
                />
            </ListItemIcon>
            <ListItemText
                primary={[contact.firstName, contact.middleName, contact.lastName].filter(f => f).join(" ")}
            // secondary={role.email}
            />
        </ListItem>
    )
    const handleSupplierAccountChange = (e, option) => {
        let selectedAccounts = []
        option.forEach(currentOption => {
            if (currentOption.optionValue) {
                selectedAccounts.push(currentOption.optionValue)
            }
        })
        setSelectedSupplierAccounts(selectedAccounts)

        const updatedContacts = [];
        currentContacts.map(d => {
            if (d["isChecked"] && selectedAccounts.indexOf(d?.accountName?.optionValue) < 0) {
                d["isChecked"] = false
            }
            updatedContacts.push(d);
        })
        setCurrentContacts(updatedContacts)
    }

    return (
        <Dialog
            fullWidth
            maxWidth="xs"
            open={open}
            onClose={handleCloseDialog}
            aria-labelledby="assign-roles-dialog"
        >
            <CustomDialogHeader title={title} />
            <CustomDialogContent>
                {loadingUsers ? (
                    <Loader text="Loading Contacts" />
                ) : <>
                    {
                        contactType === "supplier" ?
                            < Autocomplete
                                id="combo-box-demo"
                                size="small"
                                multiple={true}
                                options={supplierAccountOptions}
                                value={supplierAccountOptions.filter(o => selectedSupplierAccounts.indexOf(o.optionValue) >= 0)}
                                getOptionLabel={(option) => option["optionLabel"] || ''}
                                style={{ padding: '10px 5px' }}
                                renderInput={(params) => <TextField {...params} label="Supplier Accounts" variant="outlined" />}
                                onChange={handleSupplierAccountChange}
                            /> : null
                    }
                    {
                        currentContacts.length ? (
                            <List style={{ padding: 0 }}>
                                {currentContacts.filter(contact => selectedSupplierAccounts.indexOf(contact.accountName.optionValue) >= 0)
                                    .map((contact) => <RenderListItem contact={contact} />)}
                            </List>
                        ) : (
                            <Typography>No Contacts found to add</Typography>
                        )
                    }
                </>
                }
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
                    onClick={handleAssignContacts}
                    color="primary"
                >
                    {isAssigning ? <CircularProgress size={22} /> : "Save"}
                </Button>
            </CustomDialogFooter>
        </Dialog>
    );
};


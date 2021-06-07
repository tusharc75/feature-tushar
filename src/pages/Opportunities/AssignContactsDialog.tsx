import React, { useState, useContext } from "react";
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
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import Loader from "../../components/Loader";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { cloneDeep } from 'lodash'

export default function AssignContactsDialog({
    opportunityId,
    open,
    title,
    onSuccess,
    handleCloseDialog,
    // roleIds,
    contacts,
    assignedContacts,
    contactType,
    notToBeRemovedContacts
}) {
    const toastConfig = useContext(CustomToastContext);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isAssigning, setAssigning] = useState(false);

    const [currentContacts, setCurrentContacts] = useState(contacts.customerContacts)

    const handleContactSelection = (e, id) => {
        const indexOfContactToChange = currentContacts.findIndex(d => d._id === id);
        currentContacts[indexOfContactToChange].isChecked = e.target.checked;
        setCurrentContacts([...currentContacts]);
    };

    const getFilteredIds = (data) => {
        return cloneDeep(data).filter(f => f.isChecked).map(m => m._id)
    }
    const isDataAvailable = (fieldKey) => {
        return (contacts && contacts?.[fieldKey] && contacts[fieldKey].length)
    }
    const handleAssignContacts = async () => {
        // allContacts.filter(f => f.isChecked).map(m => m._id)
        setAssigning(true);

        const dataToSave = {
            _id: opportunityId,
            supplierContact: contactType === "supplier" ? getFilteredIds(currentContacts) : isDataAvailable("supplierContacts") ? getFilteredIds(contacts.supplierContacts) : [],
            customerContact: contactType === "customer" ? getFilteredIds(currentContacts) : isDataAvailable("customerContacts") ? getFilteredIds(contacts.customerContacts) : [],
            notToBeRemoved: contacts && contacts?.notToBeRemoved ? contacts.notToBeRemoved : null
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
                ) : currentContacts.length ? (
                    <List style={{ padding: 0 }}>
                        {currentContacts.map((contact) => {
                            return <ListItem divider key={contact._id}>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        disabled={notToBeRemovedContacts.indexOf(contact._id) >= 0 ? true : false}
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
                        }
                        )}
                    </List>
                ) : (
                    <Typography>No Contacts found to add</Typography>
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
                    onClick={handleAssignContacts}
                    color="primary"
                    size="small" 
                >
                    {isAssigning ? <CircularProgress size={22} /> : "Save"}
                </Button>
            </CustomDialogFooter>
        </Dialog>
    );
};


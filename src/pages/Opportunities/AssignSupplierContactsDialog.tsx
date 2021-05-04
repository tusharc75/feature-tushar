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
    contactType,
    supplierAccountOptions,
    onGetSupplierAccountsContacts,
    handleContactSelection,
    currentContacts,
    selectedSupplierAccountsList,
    loadingSupplierAccounts,
    onUpdateOpportunity
}) {
    const toastConfig = useContext(CustomToastContext);
    const [isAssigning, setAssigning] = useState(false);
    const [selectedSupplierAccounts, setSelectedSupplierAccounts] = useState([]);

    useEffect(() => {
        setSelectedSupplierAccounts(selectedSupplierAccountsList)
    }, [])

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
                onUpdateOpportunity(selectedSupplierAccounts)
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
        onGetSupplierAccountsContacts(false, true, option)
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
                {loadingSupplierAccounts ? (
                    <Loader text="Loading Contacts" />
                ) : <>
                    {
                        currentContacts.length ? (
                            <List style={{ padding: 0 }}>
                                {currentContacts.map((contact) => <RenderListItem contact={contact} />)}
                            </List>
                        ) : (
                            <Typography style={{ margin: '20px' }}>No Contacts found to add</Typography>
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


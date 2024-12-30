import {
  Checkbox,
  Dialog,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cloneDeep } from 'lodash';
import { useContext, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import SearchBox from '../../components/Helpers/SearchBox';
import Loader from '../../components/Loader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
  const [loadingUsers] = useState(false);
  const [isAssigning, setAssigning] = useState(false);
  const [currentContactsConst] = useState(contacts.customerContacts);
  const [, setSelectedContacts] = useState([]);
  const [currentContacts, setCurrentContacts] = useState(contacts.customerContacts);
  const [search, setSearch] = useState('');
  const handleContactSelection = (e, id) => {
    const indexOfContactToChange = currentContacts.findIndex((d) => d._id === id);
    currentContacts[indexOfContactToChange].isChecked = e.target.checked;
    setCurrentContacts([...currentContacts]);
  };

  const getFilteredIds = (data) => {
    return cloneDeep(data)
      .filter((f) => f.isChecked)
      .map((m) => m._id);
  };
  const isDataAvailable = (fieldKey) => {
    return contacts && contacts?.[fieldKey] && contacts[fieldKey].length;
  };
  const handleAssignContacts = async () => {
    // allContacts.filter(f => f.isChecked).map(m => m._id)
    setAssigning(true);

    const dataToSave = {
      _id: opportunityId,
      supplierContact:
        contactType === 'supplier'
          ? getFilteredIds(currentContacts)
          : isDataAvailable('supplierContacts')
            ? getFilteredIds(contacts.supplierContacts)
            : [],
      customerContact:
        contactType === 'customer'
          ? getFilteredIds(currentContacts)
          : isDataAvailable('customerContacts')
            ? getFilteredIds(contacts.customerContacts)
            : [],
      notToBeRemoved: contacts && contacts?.notToBeRemoved ? contacts.notToBeRemoved : null
    };

    await axiosInstance()
      .put(`/opportunity/add-contacts`, dataToSave)
      .then(({ data }) => {
        setAssigning(false);
        toastConfig.setToastConfig({
          message: data.message,
          type: 'success',
          open: true
        });

        onSuccess();
      })
      .catch((error) => {
        setAssigning(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    let value = e.target.value;
    setSearch(value);
    let result = [];
    result = currentContactsConst.filter((data) => {
      return (
        data.firstName.toLowerCase().search(value.toLowerCase()) != -1 ||
        data.middleName.toLowerCase().search(value.toLowerCase()) != -1 ||
        data.lastName.toLowerCase().search(value.toLowerCase()) != -1
      );
    });
    setCurrentContacts(result);
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
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
        ) : currentContactsConst.length ? (
          <>
            <Grid container>
              <Grid size={{xs:12, md:6, sm:6}} className="d-flex align-items-center gap-1">
                <FormControl component="fieldset">
                  <FormControlLabel
                    value="top"
                    control={
                      <Checkbox
                        edge="start"
                        onChange={(e) => {
                          currentContacts.forEach((contact) => (contact.isChecked = e.target.checked));
                          setSelectedContacts(currentContacts.filter((r) => r.isChecked).map((obj) => obj._id));
                        }}
                        checked={currentContacts.every((x) => x.isChecked)}
                        inputProps={{
                          'aria-labelledby': `checkbox-list-label-select-all`
                        }}
                      />
                    }
                    label="Select All"
                  />
                </FormControl>
              </Grid>
              <Grid size={{xs:12, md:6, sm:6}} container justifyContent="flex-end">
                <SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
              </Grid>
            </Grid>
            <List style={{ padding: 0 }}>
              {currentContacts.map((contact) => {
                return (
                  <ListItem divider key={contact._id}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        disabled={notToBeRemovedContacts.indexOf(contact._id) >= 0 ? true : false}
                        onChange={(e) => {
                          handleContactSelection(e, contact._id);
                          // contact.isChecked = e.target.checked
                          // setCurrentContacts(currentContacts.filter(r => r.isChecked).map(obj => obj._id))}
                        }}
                        checked={contact.isChecked}
                        inputProps={{
                          'aria-labelledby': `checkbox-list-label-${contact._id}`
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={[contact.firstName, contact.middleName, contact.lastName].filter((f) => f).join(' ')}
                      // secondary={role.email}
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        ) : (
          <Typography>No Contacts found to add</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton
          onClick={handleCloseDialog}
          buttonType='transparent'
        >
          Cancel
        </ThemeButton>
        <ThemeButton
          onClick={handleAssignContacts}
          isLoading={isAssigning}
          buttonType='theme'
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
}

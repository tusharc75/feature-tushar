import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import Loader from '../Loader';
import { ListingPageHeader } from '../PageHeaders';
import { CustomDialogTransition } from 'src/constants/helpers';

const AssignUserDialog = ({ usersDialogOpen, onSuccess, handleCloseDialog, roleIds, assignedUsers, selectedEntity }) => {
  const toastConfig = useContext(CustomToastContext);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isAssigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');
  const [usersConst, setUsersConst] = useState([]);

  useEffect(() => {
    setLoadingUsers(true);
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data } }) => {
        setUsers(data.filter((user) => !assignedUsers.some((item) => item?._id === user?._id)).map((obj) => ({ ...obj, isChecked: false })));
        setUsersConst(data.filter((user) => !assignedUsers.some((item) => item?._id === user?._id)).map((obj) => ({ ...obj, isChecked: false })));
        setLoadingUsers(false);
      })
      .catch((error) => {
        setLoadingUsers(false);
        toastConfig.setToastConfig(error);
      });
    // eslint-disable-next-line
  }, []);

  const handleAssignRoles = async () => {
    if (selectedUsers.length) {
      setAssigning(true);

      const dataObj = {
        users: selectedUsers,
        roles: roleIds,
        entity: selectedEntity
      };

      await axiosInstance()
        .put(`/user/assign-role`, dataObj)
        .then(() => {
          setAssigning(false);
          toastConfig.setToastConfig({
            message: 'Roles assigned successfully',
            type: 'success',
            open: true
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
    let value = e.target.value;
    setSearch(value);
    let result = [];
    result = usersConst.filter((data) => {
      return data.concatedName.toLowerCase().search(value.toLowerCase()) !== -1 || data.email.toLowerCase().search(value.toLowerCase()) !== -1;
    });
    setUsers(result);
  };

  const leftSideContents = () => {
    return (
      <>
        <FormControl component="fieldset">
          <FormControlLabel
            value="top"
            className="m-0"
            control={
              <Checkbox
                edge="start"
                onChange={(e) => {
                  users.forEach((user) => (user.isChecked = e.target.checked));
                  setSelectedUsers(users.filter((r) => r.isChecked).map((obj) => obj._id));
                }}
                checked={users.every((x) => x.isChecked)}
                inputProps={{
                  'aria-labelledby': `checkbox-list-label-select-all`
                }}
              />
            }
            label="Select all users"
          />
        </FormControl>
      </>
    );
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="xs"
      open={usersDialogOpen}
      onClose={handleCloseDialog}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title="Assign Users" showRequiredLabel={false} />
      <CustomDialogContent>
        {loadingUsers ? (
          <Loader text="Loading Users" />
        ) : usersConst.length ? (
          <>
            <ListingPageHeader
              showSearchInMobile={true}
              leftSideContents={leftSideContents()}
              searchValue={search}
              onSearch={handleSearch}
              isActionButtonVisible={false}
              isAddButtonVisible={false}
              setQueryString={false}
            />
            <List style={{ padding: 0 }}>
              {users.map((user) => (
                <ListItem divider key={user._id}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      onChange={(e) => {
                        user.isChecked = e.target.checked;
                        setSelectedUsers(users.filter((r) => r.isChecked).map((obj) => obj._id));
                      }}
                      checked={user.isChecked}
                      inputProps={{
                        'aria-labelledby': `checkbox-list-label-${user._id}`
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={`${user?.firstName} ${user?.lastName}`} />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography>All Users has been assigned</Typography>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={isAssigning} onClick={handleCloseDialog} color="primary" size="small">
          Cancel
        </Button>
        <Button disabled={!selectedUsers.length || isAssigning} onClick={handleAssignRoles} color="primary" size="small" variant="contained">
          {isAssigning ? <CircularProgress size={22} /> : 'Save'}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignUserDialog;

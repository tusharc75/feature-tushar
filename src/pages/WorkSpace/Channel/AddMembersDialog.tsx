import { useState, useEffect, useContext } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const AddMemberDialog = ({ onClose, channelId, onSuccess, ignoreIds }) => {
  const [users, setUsers] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    fetchUsers();
  }, [channelId]);

  const fetchUsers = async () => {
    try {
      let api = '/user';
      if (ignoreIds?.length) {
        api += `?ignoreIds=${JSON.stringify(ignoreIds)}`;
      }
      const { data } = await axiosInstance().get(api);
      setUsers(data.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleToggle = (userId) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(userId)
        ? prevSelectedUsers.filter((id) => id !== userId)
        : [...prevSelectedUsers, userId]
    );
  };

  const handleAddMembers = async () => {
    try {
      const { data } = await axiosInstance().put(`/work-space/channel/${channelId}`, { userIds: selectedUsers });
      onSuccess();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Members</DialogTitle>
      <DialogContent>
        {users ? <List>
          {users.map((user) => (
            <ListItem key={user._id} button onClick={() => handleToggle(user._id)}>
              <ListItemText primary={user.firstName + " " + user.lastName} />
              <ListItemSecondaryAction>
                <Checkbox
                  edge="end"
                  onChange={() => handleToggle(user._id)}
                  checked={selectedUsers.includes(user._id)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List> :
          <>
            <CommonSkeleton lenArray={[...Array(2).keys()]} />
          </>
        }
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleAddMembers} color="primary" variant="contained">
          Add Members
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMemberDialog;

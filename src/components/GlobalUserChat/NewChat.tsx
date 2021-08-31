import { useState, Fragment } from 'react';
import { Avatar, TextField, Box, Button } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

import axiosInstance from '../../axios/axiosInstance';

const NewChat = (props) => {
  const { setNewChat, setSelectedChat, users, userId } = props;

  const [newUsers, setNewUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  const createRoom = () => {
    const chatData = { users: newUsers.map((d) => d.id) };

    if (newUsers.length > 1) {
      chatData['group'] = groupName;
    }

    axiosInstance()
      .post('/chatter/user-to-user', chatData)
      .then(({ data: { data } }) => {
        setNewChat(false);
        const chatData = {
          ...data,
          id: data._id,
          chatTitle: data.group
            ? data.group
            : data.users
                .filter((d) => d._id !== userId)
                .map((_d) => `${_d.firstName} ${_d.lastName}`)
                .join(', ')
        };

        setSelectedChat(chatData);
      })
      .catch(() => {});
  };

  return (
    <div className="new-chatbox">
      <div>
        <Autocomplete
          id="User-select"
          limitTags={2}
          fullWidth
          options={users}
          autoHighlight
          multiple
          size="small"
          getOptionLabel={(option) => option.name}
          renderOption={(option) => (
            <Fragment>
              <Avatar src={option.avatar} />
              <Box component="span" mr={2} />
              {option.name}
            </Fragment>
          )}
          value={newUsers}
          onChange={(_, newVal) => setNewUsers(newVal)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select recipients"
              variant="outlined"
              inputProps={{
                ...params.inputProps,
                autoComplete: 'new-password' // disable autocomplete and autofill
              }}
            />
          )}
        />
        <Box my={1} />
        <TextField
          disabled={newUsers.length < 2}
          size="small"
          fullWidth
          label="Group Name"
          variant="outlined"
          onChange={(e) => setGroupName(e.target.value.trim())}
          error={newUsers.length > 1 && groupName && groupName.length < 4}
          helperText={newUsers.length > 1 && groupName && 'Name must be at least 4 characters'}
        />
      </div>

      <div className="new-chat-btn">
        <Button disabled={!newUsers.length || (newUsers.length > 1 && !groupName)} fullWidth color="primary" variant="outlined" onClick={createRoom}>
          Start Chatting
        </Button>
      </div>
    </div>
  );
};

export default NewChat;

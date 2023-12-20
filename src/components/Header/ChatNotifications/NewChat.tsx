import { Button, Chip, CircularProgress, List, TextField } from '@material-ui/core';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Search } from '@material-ui/icons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { SingleUser } from './listITems';

const NewChat = ({ setSelectedChat, userId, closeAndOpenChat }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const [users, setUsers] = useState<null | any[]>(null);
  const [searchValue, setSearchValue] = useState('');
  const [newUsers, setNewUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const filteredUsers = useMemo(() => users?.filter((d) => d.name.toLowerCase().includes(searchValue.toLowerCase())) || [], [searchValue, users]);

  const fetchUsersList = useCallback(() => {
    axiosInstance()
      .get('/user?limit=0')
      .then(({ data: { data } }) => {
        const allUsers = data.filter((d) => d._id !== userId).map((d) => ({ id: d._id, avatar: d.avatar || '', name: d.concatedName }));
        setUsers(allUsers);
      })
      .catch((err) => {});
  }, [userId]);

  const createRoom = () => {
    const chatData = { users: newUsers.map((d) => d.id) };

    if (newUsers.length > 1) {
      chatData['group'] = groupName;
    }

    axiosInstance()
      .post('/chatter/user-to-user', chatData)
      .then(({ data: { data } }) => {
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
        closeAndOpenChat();
        setSelectedChat(chatData);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  const handleClick = (d) => {
    setNewUsers((prev) => {
      const isExist = prev.find((p) => p.id === d.id);
      if (isExist) {
        return prev.filter((p) => p.id !== d.id);
      } else {
        return [...prev, d];
      }
    });
  };

  return (
    <div className="new-chatbox">
      {newUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {newUsers.map((user) => {
            return <Chip label={user.name} onDelete={() => handleClick(user)} />;
          })}
        </div>
      )}
      <div className="relative mb-[26px]">
        <Search className="[color:var(--new-theme-color)] absolute top-1/2 left-[12px] [transform:translateY(-50%)]" />
        <input
          className="w-full p-[10px_10px_10px_40px] bg-transparent [border:1px_solid_var(--common-border-color)] rounded-[5px] outline-transparent focus-within:outline-[var(--common-border-color)]"
          title="Search name"
          placeholder="Search name"
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      <h4 className="text-[var(--primary-text)] mb-3 font-semibold text-[14px]">Quick Contacts</h4>
      {!users ? (
        <div className="min-h-[300px] flex justify-center items-center">
          <CircularProgress />
        </div>
      ) : (
        <List component="ul" aria-label="chat" className="max-h-[300px] overflow-auto mb-3">
          {filteredUsers.map((user) => {
            const selected = Boolean(newUsers.find((d) => d.id === user.id));
            return <SingleUser data={user} handleClick={handleClick} key={user.id} selected={selected} />;
          })}
        </List>
      )}
      <>
        {newUsers.length > 1 && (
          <TextField
            disabled={newUsers.length < 2}
            size="small"
            fullWidth
            label="Group Name"
            variant="outlined"
            onChange={(e) => setGroupName(e.target.value.trim())}
            error={newUsers.length > 1 && groupName && groupName.length < 4}
            helperText={newUsers.length > 1 && groupName && 'Name must be at least 4 characters'}
            className="mb-3"
          />
        )}
        <Button disabled={!newUsers.length || (newUsers.length > 1 && !groupName)} fullWidth color="primary" variant="contained" onClick={createRoom}>
          Start Chatting
        </Button>
      </>
    </div>
  );
};

export default NewChat;

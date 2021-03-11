import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { GetUsers } from "../../../axios/activity";
import Chip from '@material-ui/core/Chip';
var _ = require('lodash');

export const UserDropdown = ({ name, label, value, multiple, touched, errors, setFieldValue }) => {

    const [users, setUsers] = React.useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        await GetUsers()
            .then(({ data }) => {
                let userData = []
                for (var _user of data) {
                    userData.push({ userId: _user._id, name: _user.firstName + " " + _user.lastName })
                }
                setUsers(userData)
            })
            .catch((err) => {
            });
    };


    const setParticipants = (value) => {
        let content = ""
        if (value) {
            if (multiple == true) {
                let userIdList = []
                for (var val of value) {
                    userIdList.push({ userId: val.userId })
                }
                content = userIdList;
            }
            else {
                content = value.userId
            }
        }
        setFieldValue(name, content)
    };


    return <Autocomplete
        multiple={multiple}
        name={name}
        options={users ? users : []}
        getOptionLabel={(option) => (option ? option.name : "")}
        filterSelectedOptions={false}
        onChange={(e, value) => setParticipants(value)}
        value={(users && multiple === true) ? users.filter((data) => _.flatMap(value, (nameObj) => _.map(nameObj, (userId) => { return userId })).includes(data.userId)) :
            users ? users.filter((data) => data.userId === value).length > 0 ? users.filter((data) => data.userId === value)[0] : [] : []}
        renderTags={(value, getTagProps) =>
            value.map((option, index) => (
                <Chip variant="outlined" label={option && option.name} {...getTagProps({ index })} />
            ))
        }
        renderInput={(params) => (
            <TextField
                {...params}
                variant="outlined"
                label={label}
                placeholder={label}
                error={touched[name] && Boolean(errors[name])}
                helperText={touched[name] && errors[name]}
                margin="dense"
            />
        )}
    />
}
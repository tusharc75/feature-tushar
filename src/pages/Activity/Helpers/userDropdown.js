import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { GetUsers } from "../../../axios";
import Skeleton from '@material-ui/lab/Skeleton';
import Chip from '@material-ui/core/Chip';
var _ = require('lodash');

export const UserDropdown = ({ referenceId, name, label, placeholder, value, onChange, multiple }) => {

    const [users, setUsers] = React.useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        await GetUsers()
            .then(({ data }) => {
                let userData = []
                for (var value of data) {
                    userData.push({ userId: value._id, name: value.firstName + " " + value.lastName })
                }
                setUsers(userData)
            })
            .catch((err) => {
            });
    };


    const setParticipants = (value) => {
        let content = null
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
        onChange(referenceId, { field: name, content: content })
    };

    return users ?
        <Autocomplete
            multiple={multiple}
            name={name}
            options={users}
            getOptionLabel={(option) => option.name}
            filterSelectedOptions={false}
            onChange={(e, value) => setParticipants(value)}
            defaultValue={multiple === true ? users.filter((data) => _.flatMap(value, (nameObj) => _.map(nameObj, (userId) => { return userId })).includes(data.userId)) :
                (users.filter((data) => data.userId === value).length > 0 && users.filter((data) => data.userId === value)[0])}
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
                    margin="dense"
                    placeholder={placeholder}
                />
            )}
        />
        : < Skeleton animation="wave" height={52} />
}
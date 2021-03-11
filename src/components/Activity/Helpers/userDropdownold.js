import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import { Autocomplete } from 'formik-material-ui-lab';
import { Formik, Form, Field } from "formik";
import { GetUsers } from "../../../axios";


export const UserDropdown = ({ name, label, errors, touched, setFieldValue }) => {

    const [users, setUsers] = React.useState([]);

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

    return users && <Field
        name={name}
        component={Autocomplete}
        options={users}
        getOptionLabel={(option) => option.name}
        renderInput={(params) => (
            <TextField
                {...params}
                error={touched[name] || Boolean(errors[name])}
                helperText={touched[name] || errors[name]}
                label={label}
                variant="outlined"
                margin="dense"
            />
        )}
        onChange={(e) => setFieldValue(name, e.target.value)}
    />
}
import React, { useState, useRef, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Autocomplete from '@material-ui/lab/Autocomplete';
import axiosInstance from '../../../axios/axiosInstance'

export const SignatureUser = ({ values, setFieldValue }) => {

    const [users, setUsers] = useState([]);

    useEffect(() => {
        axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=User`).then(({ data: { data } }) => {
            setUsers(data["User"])
        })
            .catch((error) => {
            });
    }, []);

    return (
        <Box pt={2} pb={2}>
            <Autocomplete
                disableCloseOnSelect={false}
                options={users}
                fullWidth
                multiple
                size="small"
                value={values?.signatureUsers ? users?.filter((data: any) => values?.signatureUsers?.includes(data.optionValue)) : []}
                getOptionLabel={(option) => option.optionLabel}
                getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                onChange={(_, newVal: any) => {
                    setFieldValue('signatureUsers', newVal?.map((val) => val.optionValue));
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Signature Users"
                        name="signatureUsers"
                        variant="outlined"
                    />
                )}
            />
        </Box>
    );
};

import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import Autocomplete from '@material-ui/lab/Autocomplete';

export const ShowFieldDependentOn = ({ name, values, setFieldValue, fields, _id }) => {
    console.log(values, 'values')
    const [options, setOptions] = useState([]);
    useEffect(() => {
        const checkboxFields = fields.filter((field) => field?.type === 'checkBox')?.map((field) => ({
            optionLabel: field?.fieldLabel || "",
            optionValue: field?.fieldName || ""
        }))
        setOptions(checkboxFields);
    }, [fields])

    return (
        <Box pt={2} pb={2}>
            <Box mt={1}>
                <Autocomplete
                    id="tags-filled"
                    options={options}
                    getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                    getOptionSelected={(option: any, val) => option.optionValue === val}
                    value={options.find((option) => option.optionValue === values[name]) || null}
                    onChange={(e, val) => {
                        setFieldValue(name, val.optionValue);
                    }}
                    renderInput={(params) => <TextField {...params} margin="dense" variant="outlined" label="Show Field Dependent On" placeholder="Show Field Dependent On" />}
                />
            </Box>
        </Box>
    );
};
import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import { checkFormula } from "../../../constants/formulaUtility";
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import Autocomplete from '@material-ui/lab/Autocomplete';


export const Option = ({ values, setFieldValue }) => {

    const onChangeValue = (index, value) => {
        let data = [...values["option"]]
        data[index].optionLabel = value
        data[index].optionValue = value
        setFieldValue("option", data)
    };

    const AddRemoveValue = (type, index) => {
        let data = [...values["option"]]
        if (type === "add") {
            data.splice((index + 1), 0, { optionLabel: "Option " + (data.length + 1), optionValue: "Option " + (data.length + 1) });
        }
        else {
            if (data.length !== 1) {
                data.splice(index, 1);
            }
        }
        setFieldValue("option", data)
    };


    return (<Box pt={2} pb={2}>
        <Typography variant="body2">Options</Typography>
        <Box border={1} mt={1} p={1} bgcolor="grey.100" borderColor="grey.300" maxHeight={300} style={{ overflow: "auto" }}>
            {values["option"] && values["option"].map((data, index) => (
                <Box key={index} bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" >
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <TextField
                                id="standard-basic"
                                variant="outlined"
                                margin="dense"
                                fullWidth
                                style={{ margin: 0 }}
                                value={data.optionLabel}
                                onChange={(e) => onChangeValue(index, e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <IconButton aria-label="setting" onClick={() => AddRemoveValue("add", index)} >
                                <AddCircleOutlineIcon fontSize="small" />
                            </IconButton>
                            <IconButton aria-label="setting" onClick={() => AddRemoveValue("remove", index)} >
                                <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
            ))}
        </Box>
        {(values["type"] === "dropDown" && !values["lookup"]) &&
            <Box mt={1}>
                <Autocomplete
                    id="tags-filled"
                    options={values["option"] && values["option"]}
                    getOptionLabel={(option: any) => (option ? option.optionLabel : "")}
                    getOptionSelected={(option: any, val) => option.optionValue === val}
                    value={values["option"] && values["option"].filter((data) => data.optionValue === values["defaultDropdownOption"]).length
                        ? values["option"] && values["option"].filter((data) => data.optionValue === values["defaultDropdownOption"])[0]
                        : ""
                    }
                    onChange={(e, val) => { setFieldValue("defaultDropdownOption", val && val.optionValue ? val.optionValue : "") }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            variant="outlined"
                            label="Default Option"
                            placeholder="Default Option" />
                    )}
                />
            </Box>
        }
    </Box>);
}
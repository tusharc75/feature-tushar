import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FieldList from '../FieldList';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { camelCase, UnCamelCase } from "../../../constants/helpers";

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
        },
    },
};

export const Vlokup = ({ fields, values, setFieldValue, }) => {

    const onChangeValue = (index, fieldName, value) => {
        let data = [...values["option"]]
        data[index][fieldName] = value
        setFieldValue("option", data)
    };

    const AddRemoveValue = (type, index) => {
        let data = [...values["option"]]
        if (type === "add") {
            data.splice((index + 1), 0, { optionLabel: "" });
        }
        else {
            if (data.length !== 1) {
                data.splice(index, 1);
            }
        }
        setFieldValue("option", data)
    };


    return (
        <Box marginTop={2}> 
            <FormControl variant="outlined" fullWidth margin="dense">
                <InputLabel htmlFor="filled-age-native-simple">Releted To</InputLabel>
                <Select
                    inputProps={{
                        name: 'reletedTo',
                        id: "demo-simple-select-outlined"
                    }}
                    margin="dense"
                    label="Releted To"
                    multiple
                    name="reletedTo"
                    value={values["reletedTo"]}
                    onChange={(e) => setFieldValue("reletedTo", e.target.value)}
                    renderValue={(selected: any) => selected.join(', ')}
                    MenuProps={MenuProps}
                >
                    {fields && fields.map((_field) => (
                        <MenuItem key={_field.fieldName} value={_field.fieldName}>
                            <Checkbox color="primary" checked={values["reletedTo"].indexOf(_field.fieldName) > -1} />
                            <ListItemText primary={_field.fieldLabel} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box marginTop={1} marginBottom={2}>
                <Typography variant="body2">Options</Typography>
                <Box border={1} mt={1} p={1} bgcolor="grey.100" borderColor="grey.300" maxHeight={300} style={{ overflow: "auto" }}>
                    <Box bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" width={"100%"} >
                        <Box display="flex" flexDirection="row">
                            <Box minWidth={100} pl={2}>
                                <Typography variant="body2">Action</Typography>
                            </Box>
                            <Box minWidth={200} pl={1}>
                                <Typography variant="body2">Option Label</Typography>
                            </Box>
                            {values["reletedTo"] && values["reletedTo"].map((_row) => (
                                <Box minWidth={200} pl={1}>
                                    <Typography variant="body2">{UnCamelCase(_row)}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    {values["option"] && values["option"].map((data, index) => (
                        <Box key={index} bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" width={"100%"} >
                            <Box display="flex" flexDirection="row" >
                                <Box minWidth={100}>
                                    <IconButton aria-label="setting" onClick={() => AddRemoveValue("add", index)} >
                                        <AddCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton aria-label="setting" onClick={() => AddRemoveValue("remove", index)} >
                                        <RemoveCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Box minWidth={200} maxWidth={200} pl={1}>
                                    <TextField
                                        id="standard-basic"
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                        style={{ margin: 0 }}
                                        value={data.optionLabel}
                                        onChange={(event) => onChangeValue(index, "optionLabel", event.target.value)}
                                    />
                                </Box>
                                {values["reletedTo"] && values["reletedTo"].map((_row) => (
                                    <Box minWidth={200} maxWidth={200} pl={1}>
                                        <TextField
                                            id="standard-basic"
                                            variant="outlined"
                                            margin="dense"
                                            fullWidth
                                            style={{ margin: 0 }}
                                            value={data[_row]}
                                            onChange={(event) => onChangeValue(index, _row, event.target.value)}
                                        />
                                    </Box>))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
            <FormControlLabel
                control={
                    <Checkbox
                        name="isvlookupReverse"
                        checked={values["isvlookupReverse"]}
                        onChange={(e) => setFieldValue("isvlookupReverse", e.target.checked)}
                        color="primary"
                    />
                }
                label="Vlookup Reverse"
            />
        </Box>
    );
}
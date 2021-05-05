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
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
        },
    },
};

const useStyles = makeStyles((theme) => ({
    tdWidth: {
        maxWidth: 100,
        minWidth: 100
    },
}));


export const Converter = ({ fields, values, setFieldValue, }) => {

    const onChangeValue = (index, fieldName, value) => {
        let data = [...values["option"]]
        data[index][fieldName] = value
        setFieldValue("option", data)
    };


    const handleChangeUnit = (value) => {
        setFieldValue("units", value)
        let data = [...values["option"]]
        let newOptions = []
        value.forEach((_unit, index) => {
            let row = {}
            value.forEach((__unit, i) => {
                row[__unit] = (data && data[index] && data[index][__unit]) ? data[index][__unit] : ""
            })
            newOptions.push(row)
        });
        setFieldValue("option", newOptions)
    }


    const classes = useStyles();
    return (
        <Box marginTop={2}>
            <Autocomplete
                multiple
                id="tags-filled"
                options={[]}
                value={values["units"] ? values["units"] : []}
                freeSolo
                renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
                onChange={(e, value) => handleChangeUnit(value)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Units"
                        placeholder="Units" />
                )}
            />
            {(values["units"] && values["units"].length > 0) &&
                <Box marginTop={1} border={1} p={1} borderColor="grey.300" maxHeight={300} style={{ overflow: "auto" }} >
                    <table>
                        <thead>
                            <tr>
                                <th>
                                </th>
                                {values["units"] && values["units"].map((_unit, index) => (
                                    <th key={index} className={classes.tdWidth}>{_unit}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {values["units"] && values["units"].map((_unit, i) => (
                                <tr key={i}>
                                    <th style={{ paddingRight: 10 }}>
                                        {_unit}
                                    </th>
                                    {values["units"] && values["units"].map((_unit, index) => (
                                        <td className={classes.tdWidth} key={index}>
                                            <TextField
                                                id="standard-basic"
                                                variant="outlined"
                                                margin="dense"
                                                fullWidth
                                                style={{ margin: 0 }}
                                                value={values["option"] && values["option"][i] && values["option"][i][_unit]}
                                                onChange={(event) => onChangeValue(i, _unit, event.target.value)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>}
            {(values["units"] && values["units"].length > 0) && <Box mt={1}>
                <FormControl variant="outlined" fullWidth margin="dense">
                    <InputLabel htmlFor="filled-age-native-simple">Display Units</InputLabel>
                    <Select
                        inputProps={{
                            name: 'inputFields',
                            id: "demo-simple-select-outlined"
                        }}
                        margin="dense"
                        label="Display Units"
                        multiple
                        name="displayUnits"
                        value={values["displayUnits"] ? values["displayUnits"] : []}
                        onChange={(e) => setFieldValue("displayUnits", e.target.value)}
                        renderValue={(selected: any) => selected.join(', ')}
                        MenuProps={MenuProps}
                    >
                        {values["units"] && values["units"].map((_unit) => (
                            <MenuItem key={_unit} value={_unit}>
                                <Checkbox color="primary" checked={values["displayUnits"] && values["displayUnits"].indexOf(_unit) > -1} />
                                <ListItemText primary={_unit} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            }
        </Box>
    );
}
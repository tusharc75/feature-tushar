import React, { useState, useRef, useEffect } from 'react';
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
import Chip from '@material-ui/core/Chip';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { camelCase } from "./../../../constants/helpers";
import { Tooltip } from '@material-ui/core'

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
        },
    },
};

export const MultipleFormula = ({ fields, values, setFieldValue }) => {

    const onChangeValue = (index, fieldName, value) => {
        let data = values["formulaoption"] ? values["formulaoption"] : {}
        data[fieldName] = value
        setFieldValue("formulaoption", data)
    };

    const handleAddInputField = (field) => {
        navigator.clipboard.writeText(field)
    }

    return (<Box>
        <FormControl variant="outlined" fullWidth margin="dense">
            <Autocomplete
                multiple
                id="tags-filled"
                options={fields && fields.map((_field) => { return _field.fieldName })}
                getOptionLabel={(option) => option}
                value={values["formulaFields"] ? values["formulaFields"] : []}
                freeSolo
                renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
                onChange={(e, value) => setFieldValue("formulaFields", value)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Formula Fields"
                        placeholder="Formula Fields" />
                )}
            />
        </FormControl>
        <FormControl variant="outlined" fullWidth margin="dense">
            <Autocomplete
                multiple
                id="tags-filled"
                options={fields && fields.map((_field) => { return _field.fieldName })}
                getOptionLabel={(option) => option}
                value={values["formulainputFields"] ? values["formulainputFields"] : []}
                freeSolo
                renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
                onChange={(e, value) => setFieldValue("formulainputFields", value)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Input Parameters"
                        placeholder="Input Parameters" />
                )}
            />
        </FormControl>
        {(values["formulainputFields"] && values["formulainputFields"].length > 0) &&
            <Box pt={0.5} pb={0.5}>
                {values["formulainputFields"].map((_field) => (
                    <Tooltip title="Copied to clipboard" >
                        <Chip className="ml-1 cursor-pointer" key={_field} label={_field} onClick={() => handleAddInputField(_field)} />
                    </Tooltip>
                ))}
            </Box>}
        {(values["formulaFields"] && values["formulaFields"].length > 0) &&
            <Box marginTop={1} border={1} p={1} borderColor="grey.300" maxHeight={300} style={{ overflow: "auto" }} >
                <table style={{ width: "100%" }}>
                    <tbody >
                        {values["formulaFields"] && values["formulaFields"].map((_field, i) => (
                            <tr key={i} >
                                <td className="pt-2" style={{ paddingRight: 10, width: "50px" }}>
                                    {_field}
                                </td>
                                <td className="pt-2">
                                    <TextField
                                        id="standard-basic"
                                        variant="outlined"
                                        margin="dense"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Formula (return field1 + field2)"
                                        style={{ margin: 0 }}
                                        onKeyPress={(event) => { event.stopPropagation(); }}
                                        value={values["formulaoption"] && values["formulaoption"][_field] && values["formulaoption"][_field]}
                                        onChange={(event) => onChangeValue(i, _field, event.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>}
    </Box>
    );
}
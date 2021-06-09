import React, { useState, useRef } from 'react';
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
import Grid from '@material-ui/core/Grid';

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
        },
    },
};

export const Formula = ({ fields, values, setFieldValue }) => {

    const [formulaError, setFormulaError] = useState(null);
    const inputRef = useRef<any>();


    const handleCheckSyntax = () => {
        if (values["formula"] && values["formula"] !== "") {
            let inputValues = {}
            values["inputFields"] && values["inputFields"].forEach(_input => {
                inputValues[_input] = 1;
            })
            if (checkFormula(values["formula"], inputValues)) {
                setFormulaError("Valid Formula")
            }
            else {
                setFormulaError("Invalid Formula")
            }
        }
    }

    const handleAddInputField = (field) => {
        let pushPosition = inputRef.current.selectionStart
        var new_formula = [values["formula"].slice(0, pushPosition), field, values["formula"].slice(pushPosition)].join('');
        setFieldValue("formula", new_formula)
        inputRef.current.focus();
    }

    return (<Box>
        <FormControl variant="outlined" fullWidth margin="dense">
            <Autocomplete
                multiple
                id="tags-filled"
                options={fields && fields.map((_field) => { return _field.fieldName })}
                getOptionLabel={(option) => option}
                value={values["inputFields"] ? values["inputFields"] : []}
                freeSolo
                renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
                onChange={(e, value) => setFieldValue("inputFields", value)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Input Parameters"
                        placeholder="Input Parameters" />
                )}
            />
            {/* <InputLabel htmlFor="filled-age-native-simple">Input Parameters</InputLabel>
            <Select
                inputProps={{
                    name: 'inputFields',
                    id: "demo-simple-select-outlined"
                }}
                margin="dense"
                label="Input Parameters"
                multiple
                name="inputFields"
                value={values["inputFields"]}
                onChange={(e) => setFieldValue("inputFields", e.target.value)}
                renderValue={(selected: any) => selected.join(', ')}
                MenuProps={MenuProps}
            >
                {fields && fields.map((_field) => (
                    <MenuItem key={_field.fieldName} value={_field.fieldName}>
                        <Checkbox color="primary" checked={values["inputFields"] && values["inputFields"].indexOf(_field.fieldName) > -1} />
                        <ListItemText primary={_field.fieldLabel} />
                    </MenuItem>
                ))}
            </Select> */}
        </FormControl>
        {(values["inputFields"] && values["inputFields"].length > 0) &&
            <Box pt={0.5} pb={0.5}>
                {values["inputFields"].map((_field) => (
                    <Chip className="ml-1 cursor-pointer" key={_field} label={_field} onClick={() => handleAddInputField(_field)} />
                ))}
            </Box>}
        <Box pt={0.5}>
            <TextField
                id="standard-basic"
                name="formula"
                variant="outlined"
                label="Formula"
                margin="dense"
                fullWidth
                multiline
                rows={4}
                type="text"
                placeholder="Formula (return field1 + field2)"
                inputRef={inputRef}
                value={values["formula"]}
                onKeyPress={(event) => { event.stopPropagation(); }}
                onChange={(e) => { setFieldValue("formula", e.target.value) }}
            />
            <Grid container>
                <Grid item xs={6}>
                    {formulaError && <Typography variant="caption" display="block">{formulaError} </Typography>}
                    <Button size="small" onClick={handleCheckSyntax} color="primary">Check Syntax</Button>
                </Grid>
                <Grid item xs={6}>
                    {values["type"] === "currencyAmount" &&
                        <FormControl fullWidth margin="dense" variant="outlined">
                            <InputLabel id="demo-simple-select-outlined-label">Formula applied on Currency</InputLabel>
                            <Select
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                value={values["formulaOnCurrency"]}
                                onChange={(e) => setFieldValue("formulaOnCurrency", e.target.value)}
                                label="Formula applied on Currency"
                                name="formulaOnCurrency"
                            >
                                {values["displayCurrency"] && values["displayCurrency"].map((_currency) => (
                                    <MenuItem value={_currency}>{_currency}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    }
                </Grid>
            </Grid>
        </Box>
    </Box>
    );
}
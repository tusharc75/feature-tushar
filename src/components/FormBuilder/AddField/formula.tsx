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

export const Formula = ({ fields, values, setFieldValue, _id }) => {

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
        if (!values["formula"]) {
            values["formula"] = ""
        }
        var new_formula = [values["formula"].slice(0, pushPosition), field, values["formula"].slice(pushPosition)].join('');
        setFieldValue("formula", new_formula)
        inputRef.current.focus();
    }

    const convertLabeltoValue = (value) => {
        const result = []
        value.forEach((_v) => {
            if (fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v).length) {
                result.push(fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v)[0].fieldName)
            }
            else {
                result.push(_v)
            }
        })
        return result;
    }

    const convertValuetoLabel = (value) => {
        const result = []
        value.forEach((_v) => {
            if (fields.filter((data) => data.fieldName === _v).length) {
                result.push(fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v)[0].fieldLabel)
            }
            else {
                result.push(_v)
            }
        })
        return result;
    }


    return (<Box>
        <FormControl variant="outlined" fullWidth margin="dense">
            <Autocomplete
                multiple
                id="tags-filled"
                options={fields && (fields.filter((_f) => _f._id !== _id)).map((_field) => { return _field.fieldLabel })}
                getOptionLabel={(option) => option}
                value={values["inputFields"] ? convertValuetoLabel(values["inputFields"]) : []}
                freeSolo
                renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                }
                onChange={(e, value) => setFieldValue("inputFields", convertLabeltoValue(value))}
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
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
    }

    return (<Box>
        <FormControl variant="outlined" fullWidth margin="dense">
            <InputLabel htmlFor="filled-age-native-simple">Input Parameters</InputLabel>
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
                        <Checkbox color="primary" checked={values["inputFields"].indexOf(_field.fieldName) > -1} />
                        <ListItemText primary={_field.fieldLabel} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        <Box pt={0.5} pb={0.5}>
            {values["inputFields"] && values["inputFields"].map((_field) => (
                <Chip className="ml-1 cursor-pointer" key={_field} label={_field} onClick={() => handleAddInputField(_field)} />
            ))}
        </Box>
        <Box pt={1}>
            <TextField
                id="standard-basic"
                name="formula"
                variant="outlined"
                label="Formula"
                margin="dense"
                fullWidth
                multiline
                rows={8}
                inputRef={inputRef}
                value={values["formula"]}
                onChange={(e) => setFieldValue("formula", e.target.value)}
            />
            {formulaError && <Typography variant="caption" display="block">{formulaError} </Typography>}
            <Button onClick={handleCheckSyntax} color="primary">Check Syntax</Button>
        </Box>
    </Box>
    );
}
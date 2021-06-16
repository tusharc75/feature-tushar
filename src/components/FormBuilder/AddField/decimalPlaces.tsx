import React, { useState, useRef } from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';


export const DecimalPlaces = ({ values, setFieldValue }) => {
    return (<FormControl fullWidth margin="dense" variant="outlined">
        <InputLabel id="demo-simple-select-outlined-label">Number of decimal places</InputLabel>
        <Select
            labelId="demo-simple-select-outlined-label"
            id="demo-simple-select-outlined"
            value={values["decimalPlaces"]}
            onChange={(e) => setFieldValue("decimalPlaces", e.target.value)}
            label="Number of decimal places"
            name="decimalPlaces"
        >
            <MenuItem value={0}>0</MenuItem>
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={3}>3</MenuItem>
            <MenuItem value={4}>4</MenuItem>
        </Select>
    </FormControl>
    );
}
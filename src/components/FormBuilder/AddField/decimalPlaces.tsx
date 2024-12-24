import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export const DecimalPlaces = ({ values, setFieldValue }) => {
  return (
    <FormControl fullWidth margin="dense" variant="outlined">
      <InputLabel id="demo-simple-select-outlined-label">Number of decimal places</InputLabel>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="demo-simple-select-outlined"
        value={values['decimalPlaces'] || 0}
        onChange={(e) => setFieldValue('decimalPlaces', e.target.value)}
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
};

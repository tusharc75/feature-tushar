import React, { useState, useEffect } from 'react';

import { Button, TextField, DialogContent, DialogContentText, DialogTitle, Slide, Box, IconButton, Grid, Chip } from '@material-ui/core';
import { DatePicker, KeyboardDatePicker, KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateUtils from '@date-io/date-fns';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { getUniqueCurrencies } from 'src/constants/helpers';

export const inputTypes = {
  singleLine: 'singleLine',
  dropDown: 'dropDown',
  currency: 'currency',
  dateTime: 'dateTime',
  multiSelect: 'multiSelect'
};

const FromTypesSimple = ({ field, value = null, onChange = (event, val, index) => {}, disabled = false, index = 0, ...others }) => {
  const fieldType = field?.type;
  //   const [value, setValue] = useState(null);
  const [currencyData, setCurrencyData] = React.useState([]);

  const getCurrencys = async () => {
    const arr = await getUniqueCurrencies();
    const sortedArr = arr.sort((a, b) =>
      a?.name?.toUpperCase() < b?.name?.toUpperCase() ? -1 : a?.name?.toUpperCase() > b?.name?.toUpperCase() ? 1 : 0
    );

    setCurrencyData(sortedArr);
  };

  useEffect(() => {
    if (fieldType === inputTypes.currency) {
      getCurrencys();
    }
  }, []);

  return (
    <>
      {fieldType === inputTypes.dropDown && (
        <Autocomplete
          fullWidth
          size="small"
          value={value}
          {...others}
          onChange={(event: any, newValue: any) => {
            // setValue(newValue);
            onChange(event, { [field.fieldName]: newValue, type: fieldType, name: field.fieldLabel }, index);
          }}
          getOptionLabel={(option) => option.optionLabel}
          id="controllable-states-demo"
          options={field?.option}
          disabled={disabled}
          renderInput={(params) => <TextField name={field?.fieldName} fullWidth {...params} label={field?.fieldLabel} variant="outlined" />}
        />
      )}
      {fieldType === inputTypes.multiSelect && (
        <Autocomplete
          fullWidth
          multiple
          size="small"
          {...others}
          value={value || []}
          onChange={(event: any, newValue: any) => {
            // setValue(newValue);
            onChange(event, { [field.fieldName]: newValue, type: fieldType, name: field.fieldLabel }, index);
          }}
          getOptionLabel={(option: any) => option.optionLabel}
          id="controllable-states-demo"
          options={field?.option}
          disabled={disabled}
          renderInput={(params) => <TextField name={field?.fieldName} fullWidth {...params} label={field?.fieldLabel} variant="outlined" />}
        />
      )}
      {fieldType === inputTypes.singleLine && (
        <TextField
          fullWidth
          size="small"
          type={'search'}
          value={value}
          name={field?.fieldName}
          variant="outlined"
          {...others}
          label={field?.fieldLabel}
          onChange={(event: any) => {
            // setValue(event.target.value);
            onChange(event, { [field.fieldName]: event.target.value, type: fieldType, name: field.fieldLabel }, index);
          }}
          id="controllable-states-demo"
          disabled={disabled}
        />
      )}
      {fieldType === inputTypes.currency && (
        <Autocomplete
          fullWidth
          size="small"
          value={value}
          {...others}
          onChange={(event: any, newValue: any) => {
            // setValue(newValue);
            onChange(event, { [field.fieldName]: newValue, type: fieldType, name: field.fieldLabel }, index);
          }}
          getOptionLabel={(option: any) => (option ? `${option.currencyCode} - ${option.currencyName} - (${option.symbolNative})` : '')}
          id="controllable-states-demo"
          options={currencyData}
          disabled={disabled}
          renderInput={(params) => <TextField name={field?.fieldName} fullWidth {...params} label={field?.fieldLabel} variant="outlined" />}
        />
      )}
      {fieldType === inputTypes.dateTime && (
        <MuiPickersUtilsProvider utils={DateUtils}>
          <KeyboardDateTimePicker
            {...others}
            autoOk
            fullWidth
            size="small"
            clearable
            variant="inline"
            inputVariant="outlined"
            ampm={false}
            value={value}
            name={field?.fieldName}
            label={field?.fieldLabel}
            onChange={(date) => {
              //   setValue(date);
              onChange(null, { [field.fieldName]: date, type: fieldType, name: field.fieldLabel }, index);
            }}
            onError={console.error}
            disablePast
            format="yyyy/MM/dd HH:mm"
            InputLabelProps={{
              shrink: true
            }}
          />
        </MuiPickersUtilsProvider>
      )}
    </>
  );
};

export default FromTypesSimple;

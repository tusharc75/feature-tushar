import { Autocomplete, TextField } from '@mui/material';
import React, { useEffect } from 'react';
import { getUniqueCurrencies } from 'src/constants/helpers';

const CurrencyAutocomplete = (prop) => {
  const {
    value,
    name,
    helperText,
    error,
    label,
    touched,
    errors,
    fullWidth,
    limitTags ,
    placeholder,
    onChange,
    ...rest
  } = prop;

  const [currencyData, setCurrencyData] = React.useState([]);

  useEffect(() => {
    const sortedArr = getUniqueCurrencies().sort((a, b) =>
      a?.name?.toUpperCase() < b?.name?.toUpperCase() ? -1 : a?.name?.toUpperCase() > b?.name?.toUpperCase() ? 1 : 0
    );

    console.log(sortedArr);
    setCurrencyData(sortedArr);
  }, []);

  return (
    <Autocomplete
    {...rest}
    limitTags={2}
    fullWidth
    value={
        currencyData.find((data) => data.currencyCode === value) || null
      }
    options={currencyData}
    getOptionLabel={(option: any) => (option ? `${option.currencyCode} - ${option.currencyName} - (${option.symbolNative})` : '')}
    isOptionEqualToValue={(option: any, val) => option.currencyCode === val}
    onChange={onChange}
    renderInput={(params) => (
      <TextField
        {...params}
        variant="outlined"
        name={name}
        label={label}
        error={error}
        helperText={helperText}
      />
    )}
    renderOption={(props, option: any) => {
      const { currencyCode, currencyName, symbolNative } = option;
      return (
        <li {...props}>
          {`${currencyCode} - ${currencyName} - (${symbolNative})`}
        </li>
      );
    }}
  />
  );
};

export default CurrencyAutocomplete;

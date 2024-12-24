import React, { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import NumberFormat from 'react-number-format';
import { generateUniqueId, getUniqueCurrencies } from '../constants/helpers';

interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const CustomFormat = (props: NumberFormatCustomProps | any) => {
  const { inputRef, onChange, ...other } = props;
  return <NumberFormat {...other} getInputRef={inputRef} isNumericString />;
};

function CurrencyInput({
  inputTextLabel,
  value,
  minValue = 1,
  currencySymbol,
  maxValue = 999999999999,
  isRequired = false,
  onChange,
  allowDecimal = false,
  ...rest
}) {
  const inputNumberRef = useRef(null);
  const uniqueId = generateUniqueId();

  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const ignoreScroll = (e) => {
      e.preventDefault();
    };
    inputNumberRef.current && inputNumberRef.current.addEventListener('wheel', ignoreScroll);
  }, [inputNumberRef]);

  return (
    <TextField
      fullWidth
      id={uniqueId}
      name={uniqueId}
      label={inputTextLabel}
      ref={inputNumberRef}
      value={inputValue}
      {...rest}
      InputProps={{
        inputComponent: CustomFormat as any,
        startAdornment: (
          <InputAdornment position="start">{getUniqueCurrencies().find((val) => currencySymbol === val.currencyCode)?.symbolNative}</InputAdornment>
        ),
        inputProps: {
          allowNegative: false,
          min: minValue,
          max: maxValue,
          onValueChange: (values) => {
            if ((isRequired === true && values.value === '') || parseInt(values.value) < minValue || parseInt(values.value) > maxValue) {
              setInputValue(minValue?.toString());
            } else {
              if (allowDecimal) {
                onChange(values.value);
                setInputValue(values.value?.toString());
              } else {
                const value = values.value.replace(/[^0-9]/g, '');
                onChange(value);
                setInputValue(value?.toString());
              }
            }
          }
        }
      }}
    />
  );
}

export default CurrencyInput;

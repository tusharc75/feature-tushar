import React, { useEffect, useRef } from 'react';
import {
  Checkbox,
  FormControlLabel,
  TextField,

} from '@material-ui/core';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { handleAutoCalculation, optionConverter } from '../../constants/formulaUtility';
import NumberFormat from 'react-number-format';
import {
  dateFormatForInputControl,
  formatAmountWithCurrency
} from '../../constants/helpers';
import { Autocomplete } from '@material-ui/lab';


interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const CustomFormat = (props: NumberFormatCustomProps | any) => {
  const { inputRef, onChange, selectedCurrencyCode, ...other } = props;

  if (selectedCurrencyCode) {
    const { amountWithouCurrencyCode } = formatAmountWithCurrency(selectedCurrencyCode, 123456789);

    if (amountWithouCurrencyCode === '12,34,56,789') {
      return <NumberFormat {...other} getInputRef={inputRef} isNumericString thousandSeparator thousandsGroupStyle="lakh" />;
    } else if (amountWithouCurrencyCode === '1,2345,6789') {
      return <NumberFormat {...other} getInputRef={inputRef} isNumericString thousandSeparator thousandsGroupStyle="wan" />;
    } else {
      return <NumberFormat {...other} getInputRef={inputRef} isNumericString thousandSeparator thousandsGroupStyle="thousand" />;
    }
  } else {
    return <NumberFormat {...other} getInputRef={inputRef} isNumericString />;
  }
};

const FormTypes = (props) => {
  const {
    type,
    label,
    name,
    values,
    options,
    setFieldValue,
    onChange,
    fields,
    fieldData,
    setValues,
    required,
    ...rest
  } = props;

  const inputNumberRef = useRef(null);

  const getLabel = (label) => {
    return label ? (label.length > 35 ? label.substr(0, 35) + '...' : label) : '';
  };

  const handleChange = (name, value) => {
    const result = handleAutoCalculation(fieldData, fields, values, name, '', '', value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue([x], result[x]);
      }
    }
  };


  return type === 'singleLine' ? (
    <TextField
      {...rest}
      disabled={fieldData?.isUneditable || rest?.disabled}
      variant="outlined"
      type="text"
      label={getLabel(label)}
      name={name}
      value={values[name]}
      required={required}
      onChange={onChange ? onChange : (e) => handleChange(name, e.target.value.trimStart())}
    />
  ) : type === 'multiLine' ? (
    <TextField
      {...rest}
      variant="outlined"
      type="text"
      multiline
      label={getLabel(label)}
      name={name}
      rows={3}
      value={values[name]}
      required={required}
      onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.value.trimStart())}
    />
  ) : type === 'number' ? (
    <TextField
      {...rest}
      variant="outlined"
      label={getLabel(label)}
      name={name}
      value={values[name]}
      ref={inputNumberRef}
      required={required}
      onChange={onChange ? onChange : (e) => handleChange(name, e.target.value)}
      InputProps={{
        inputComponent: CustomFormat as any,
        inputProps: {
          allowNegative: false,
          onValueChange: (values) => {
            handleChange(name, values.value);
          },
        },
      }}
    />
  )
    : type === "dropDown" ? (
      <Autocomplete
        {...rest}
        options={options}
        getOptionLabel={(option: any) => (option ? option : '')}
        getOptionSelected={(option: any, val) => option === val}
        value={
          options.filter((data) => data === values[name]).length ? options.filter((data) => data === values[name])[0] : ''
        }
        onChange={(e, val) => {
          handleChange(name, val && val ? val : '');
        }
        }
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        forcePopupIcon={true}
        renderInput={(params) => (
          <TextField
            {...params}
            name={name}
            label={getLabel(label)}
            required={required}
            variant="outlined"
            style={{ outline: "1px solid white" }}
          />
        )}
      />
    )
      : type === 'checkBox' || type === "passFail" ? (
        <FormControlLabel
          control={
            <Checkbox
              {...rest}
              name={name}
              checked={values[name]}
              required={required}
              onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.checked)}
              color="secondary"
            />
          }
          label={label}
        />
      ) : type === 'date' ? (
        <MuiPickersUtilsProvider utils={DateUtils}>
          <KeyboardDatePicker
            {...rest}
            disabled={fieldData?.isUneditable || rest?.disabled}
            clearable
            autoOk
            variant="inline"
            inputVariant="outlined"
            value={values[name]}
            name={name}
            label={getLabel(label)}
            required={required}
            onChange={onChange ? onChange : (date) => handleChange(name, date ? date : '')}
            // onChange={(date) => setFieldValue(name, date ? date : "")}
            format={dateFormatForInputControl}
            InputLabelProps={{
              shrink: true
            }}
          />
        </MuiPickersUtilsProvider>
      ) : null;
};

export default FormTypes;

import { IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import { copyTextToClipboard, getUniqueCurrencies } from 'src/constants/helpers';
import { handleAutoCalculation } from 'src/constants/formulaUtility';
import { find, result } from 'lodash';
import { ClipboardEvent } from 'react';
import CopyToClipboardButton from 'src/components/CopyToClipboardButton';

const FormTypes = (props) => {
  const {
    values,
    onChange,
    fieldData,
    name,
    required,
    options,
    currency,
    unit,
    errors,
    disabled,
    fields,
    setValues,
    setFieldValue,
    enableCopy = false,
    ...rest
  } = props;

  const handleChange = (name, value) => {
    const result = handleAutoCalculation(fieldData, fields, values, name, '', '', value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue(x, result[x]);
      }
    }
  };

  const handleCurrencyChange = (name, _currency, value) => {
    const result = handleAutoCalculation(fieldData, fields, values, name, _currency, '', value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue([x], result[x]);
      }
    }
  };

  const handleConverterChange = (name, _unit, value) => {
    const result = handleAutoCalculation(fieldData, fields, values, name, '', _unit, value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue([x], result[x]);
      }
    }
  };

  const handleCurrencyChangeWithConverterChange = (name, _currency, _unit, value) => {
    const result = handleAutoCalculation(fieldData, fields, values, name, _currency, _unit, value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue([x], result[x]);
      }
    }
  };

  return fieldData?.type === 'singleLine' ? (
    <TextField
      {...rest}
      margin="dense"
      disabled={disabled}
      variant="outlined"
      type={'text'}
      autoComplete="off"
      required={required}
      name={name}
      value={values[name]}
      error={Boolean(errors[`${values._id}_${name}`])}
      helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
      onChange={onChange ? onChange : (e) => handleChange(name, e.target.value.trimStart())}
    />
  ) : fieldData?.type === 'multiLine' ? (
    <TextField
      {...rest}
      variant="outlined"
      type="text"
      multiline
      name={name}
      autoComplete="off"
      required={required}
      disabled={disabled}
      rows={1}
      value={values[name]}
      margin="dense"
      error={Boolean(errors[`${values._id}_${name}`])}
      helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
      onChange={onChange ? onChange : (e) => handleChange(name, e.target.value)}
    />
  ) : fieldData?.type === 'dropDown' ? (
    <Autocomplete
      size="small"
      fullWidth
      options={options}
      disabled={disabled}
      value={options.find((data) => data.optionValue === values[name]) ? options.find((data) => data.optionValue === values[name]) : ''}
      getOptionLabel={(option: any) => option?.optionLabel || ''}
      getOptionSelected={(option: any, val) => (option ? option?.optionValue == val?.optionValue : false)}
      onChange={
        onChange
          ? onChange
          : (e, val) => {
              handleChange(name, val?.optionValue);
            }
      }
      renderInput={(params) => (
        <TextField
          {...params}
          {...rest}
          error={Boolean(errors[`${values._id}_${name}`])}
          helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
          margin="dense"
          variant="outlined"
        />
      )}
    />
  ) : fieldData?.type === 'multiSelect' ? (
    <MultiSelect {...{ options, disabled, values, name, onChange, handleChange, rest, errors, enableCopy, ...rest }} />
  ) : fieldData?.type === 'currencyAmount' ? (
    <TextField
      {...rest}
      variant="outlined"
      margin="dense"
      name={name}
      required={required}
      disabled={disabled}
      value={values[name] ? values[name].toLocaleString(undefined, { maximumFractionDigits: fieldData?.decimalPlaces }) : values[name]}
      error={Boolean(errors[`${values._id}_${name}`])}
      helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
      onChange={
        onChange
          ? onChange
          : (e) => {
              if (e.target.value === '' || /^[0-9.,]+$/.test(e.target.value)) {
                if (fieldData?.isConverter) {
                  handleCurrencyChangeWithConverterChange(
                    name,
                    currency,
                    unit,
                    e.target.value === ''
                      ? 0
                      : e.target.value.slice(-1) === '.' || e?.target?.value?.slice(-2) === '.0'
                        ? e.target.value.replace(/,/g, '')
                        : parseFloat(e.target.value.replace(/,/g, ''))
                  );
                } else if (fieldData.displayCurrency.length > 1) {
                  handleCurrencyChange(name, currency, e.target.value === '' ? 0 : e.target.value.replace(/,/g, ''));
                } else {
                  handleChange(name, e.target.value === '' ? 0 : e.target.value.replace(/,/g, ''));
                }
              }
            }
      }
      autoComplete="off"
      onBlur={(e) => {
        if (e.target.value === '' || /^[0-9.,]+$/.test(e.target.value)) {
          if (fieldData?.isConverter) {
            handleCurrencyChangeWithConverterChange(
              name,
              currency,
              unit,
              e.target.value === ''
                ? 0
                : e.target.value.slice(-1) === '.' || e?.target?.value?.slice(-2) === '.0'
                  ? e.target.value.replace(/,/g, '')
                  : parseFloat(e.target.value.replace(/,/g, ''))
            );
          } else if (fieldData.displayCurrency.length > 1) {
            handleCurrencyChange(name, currency, e.target.value === '' ? 0 : e.target.value.replace(/,/g, ''));
          } else {
            handleChange(name, e.target.value === '' ? 0 : e.target.value.replace(/,/g, ''));
          }
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {result(
              find(getUniqueCurrencies(), function (obj) {
                return obj.currencyCode === currency;
              }),
              'symbolNative'
            )}
          </InputAdornment>
        ),
        inputProps: { min: 0 },
        readOnly: fieldData && fieldData.isUneditable ? true : false
      }}
    />
  ) : fieldData?.type === 'converter' ? (
    <TextField
      {...rest}
      variant="outlined"
      type="number"
      margin="dense"
      name={name}
      required={required}
      autoComplete="off"
      disabled={disabled}
      value={values[name]}
      error={Boolean(errors[`${values._id}_${name}`])}
      helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
      onChange={
        onChange
          ? onChange
          : (e) => handleConverterChange(name, unit, e.target.value === '' ? '' : parseFloat(e.target.value.replace(/[^0-9\.]/g, '')))
      }
      InputProps={{
        inputProps: { min: 0 },
        readOnly: fieldData && fieldData.isUneditable ? true : false
      }}
    />
  ) : fieldData?.type === 'decimal' ? (
    <TextField
      {...rest}
      variant="outlined"
      margin="dense"
      type="number"
      disabled={disabled}
      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
      required={required}
      name={name}
      value={values[name]}
      error={Boolean(errors[`${values._id}_${name}`])}
      helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
      onChange={
        onChange
          ? onChange
          : (e) => {
              handleChange(name, e.target.value === '' ? '' : parseFloat(parseFloat(e.target.value)?.toFixed(fieldData?.decimalPlaces || 0)));
            }
      }
      InputProps={{
        inputProps: { min: 0 },
        readOnly: fieldData && fieldData.isUneditable ? true : false
      }}
    />
  ) : fieldData?.type === 'percent' ? (
    <TextField
      {...rest}
      type="number"
      variant="outlined"
      margin="dense"
      autoComplete="off"
      disabled={disabled}
      required={required}
      name={name}
      value={values[name]}
      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
      error={Boolean(errors[`${values._id}_${name}`])}
      helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
      InputProps={{
        endAdornment: '%',
        inputProps: { min: 0 },
        readOnly: fieldData && fieldData.isUneditable ? true : false
      }}
      onChange={
        onChange
          ? onChange
          : (e) => {
              handleChange(
                name,
                e.target.value === ''
                  ? 0
                  : parseFloat(parseFloat(e.target.value)?.toFixed(fieldData?.decimalPlaces === undefined ? 2 : fieldData?.decimalPlaces))
              );
            }
      }
    />
  ) : fieldData?.type === 'vlookupDropdown' ? (
    <TextField
      {...rest}
      variant="outlined"
      type={'text'}
      margin="dense"
      autoComplete="off"
      disabled={disabled}
      required={required}
      name={name}
      value={values[name]}
      error={Boolean(errors[`${values._id}_${name}`])}
      helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
      onChange={onChange ? onChange : (e) => handleChange(name, e.target.value.trimStart())}
    />
  ) : fieldData?.type === 'formula' ? (
    <TextField
      {...rest}
      disabled={disabled}
      variant="outlined"
      margin="dense"
      type={fieldData?.returnType === 'decimal' ? 'number' : 'text'}
      name={name}
      autoComplete="off"
      required={required}
      value={values[name]}
      error={Boolean(errors[`${values._id}_${name}`])}
      helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
      onChange={
        onChange
          ? onChange
          : (e) => {
              if (fieldData?.returnType === 'decimal') {
                handleChange(name, parseFloat(e.target.value.replace(/[^0-9\.]/g, '')));
              } else {
                handleChange(name, e.target.value);
              }
            }
      }
      InputProps={{
        inputProps: { min: 0 },
        readOnly: fieldData && fieldData.isUneditable ? true : false
      }}
    />
  ) : null;
};

export default FormTypes;

const MultiSelect = ({ options, disabled, values, name, onChange, handleChange, errors, enableCopy, ...rest }) => {
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>): any[] => {
    const serializedData = e.clipboardData.getData('text');
    if (!serializedData) return;
    let value: { name: string; value: any[] } | string = serializedData;
    try {
      value = JSON.parse(serializedData) as { name: string; value: any[] };
    } catch (error) {}

    if (typeof value === 'string' || !value) {
      // Allow pasting of normal text.
      return;
    } else {
      // else prevent any content from being pasted into the textbox.
      e.preventDefault();
    }

    // Prevent pasting if the field name does not match.
    if (value?.name !== name) {
      return;
    }
    if (!Array.isArray(value?.value) || value?.value?.length === 0 || !value?.value[0]?.optionLabel) {
      return [];
    }
    e.preventDefault();
    return value.value;
  };

  const value =
    options.filter((data) => values[name]?.includes(data.optionValue))?.length > 0
      ? options.filter((data) => values[name]?.includes(data.optionValue))
      : [];

  const dataToCopy = { name, value };

  return (
    <div className="flex items-center gap-2">
      <Autocomplete
        size="small"
        fullWidth
        multiple
        options={options}
        disabled={disabled}
        limitTags={1}
        value={value}
        getOptionLabel={(option: any) => option?.optionLabel || ''}
        getOptionSelected={(option: any, val) => (option ? option?.optionValue === val?.optionValue : false)}
        onChange={
          onChange
            ? onChange
            : (e, val) => {
                handleChange(name, val ? val : []);
              }
        }
        renderInput={(params) => (
          <TextField
            {...params}
            {...rest}
            error={Boolean(errors[`${values._id}_${name}`])}
            helperText={Boolean(errors[`${values._id}_${name}`]) && errors[`${values._id}_${name}`]}
            margin="dense"
            variant="outlined"
            onPaste={(e) => {
              const data = handlePaste(e);
              if (!data) return;
              handleChange(name, data);
            }}
          />
        )}
      />
      {enableCopy && (
        <span className="">
          <CopyToClipboardButton text={JSON.stringify(dataToCopy)} size="small" />
        </span>
      )}
    </div>
  );
};

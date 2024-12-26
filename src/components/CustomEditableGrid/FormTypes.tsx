import { Box, Checkbox, FormControlLabel, InputAdornment, TextField } from '@mui/material';
import { arrayToDropwdownOption, dateFormatForInputControl, getUniqueCurrencies } from 'src/constants/helpers';
import Autocomplete from '@mui/material/Autocomplete';
import { useEffect, useState } from 'react';
import CustomDateTimePicker from 'src/components/CustomDateTimePicker';
import CustomDatePicker from 'src/components/CustomDatePicker';

const FormTypes = (props) => {
  const tempProps = { ...props, id: props.id ? props.id : props.fieldData ? props.fieldData.split(' ').join('-') : 'field' };
  const { values, onChange, fieldData, currency, touched, errors, ...others } = tempProps;

  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (fieldData?.fieldName === 'unit') {
      setOptions(arrayToDropwdownOption(values?.[`${values.type}Detail`].unit));
    } else if (fieldData?.fieldName === 'pricingMethod') {
      setOptions(arrayToDropwdownOption(values?.[`${values.type}Detail`].pricingMethod));
    } else {
      setOptions(fieldData?.option);
    }
  }, [fieldData?.fieldName]);

  return fieldData?.type === 'singleLine' ? (
    <TextField
      style={{ paddingRight: 1 }}
      disabled={fieldData?.isUneditable}
      variant="outlined"
      type="text"
      label={fieldData?.fieldLabel}
      required={fieldData?.required}
      name={`${fieldData?.fieldName}`}
      value={values[fieldData?.fieldName]}
      error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
      helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
      margin="dense"
      onChange={(e) => onChange(fieldData?.fieldName, e.target.value.trimStart())}
      {...others}
    />
  ) : fieldData?.type === 'multiLine' ? (
    <TextField
      style={{ paddingRight: 1 }}
      variant="outlined"
      type="text"
      multiline
      label={fieldData?.label}
      name={`${fieldData?.fieldName}`}
      required={fieldData?.required}
      rows={3}
      value={values[fieldData?.fieldName]}
      margin="dense"
      error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
      helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
      onChange={(e) => onChange(fieldData?.fieldName, e.target.value)}
      {...others}
    />
  ) : fieldData?.type === 'percent' ? (
    <TextField
      style={{ paddingRight: 1 }}
      type="number"
      variant="outlined"
      label={fieldData?.label}
      required={fieldData?.required}
      name={`${fieldData?.fieldName}`}
      value={values[fieldData?.fieldName]}
      InputProps={{
        endAdornment: '% ',
        inputProps: { min: 0 },
        readOnly: fieldData && fieldData?.isUneditable ? true : false
      }}
      margin="dense"
      error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
      helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
      onChange={(e) => onChange(fieldData?.fieldName, parseFloat(e.target.value))}
      {...others}
    />
  ) : fieldData?.type === 'currencyAmount' ? (
    <TextField
      style={{ paddingRight: 1 }}
      type="number"
      variant="outlined"
      label={fieldData?.label}
      required={fieldData?.required}
      name={`${fieldData?.fieldName}`}
      value={values[fieldData?.fieldName]}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">{getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative}</InputAdornment>
        )
      }}
      margin="dense"
      error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
      helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
      onChange={(e) => onChange(fieldData?.fieldName, parseFloat(e.target.value))}
      {...others}
    />
  ) : fieldData?.type === 'dropDown' ? (
    <Autocomplete
      size="small"
      fullWidth
      options={options}
      value={
        options.find((data) => data.optionValue === values[fieldData?.fieldName])
          ? options.find((data) => data.optionValue === values[fieldData?.fieldName])
          : ''
      }
      getOptionLabel={(option: any) => option?.optionLabel || ''}
      isOptionEqualToValue={(option: any, val) => (option ? option?.optionValue == val?.optionValue : false)}
      onChange={(e, val) => onChange(fieldData?.fieldName, val?.optionValue)}
      renderInput={(params) => (
        <TextField
          style={{ paddingRight: 1 }}
          {...params}
          error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
          helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
          margin="dense"
          label={fieldData?.label}
          variant="outlined"
          {...others}
        />
      )}
    />
  ) : fieldData?.type === 'decimal' ? (
    <TextField
      style={{ paddingRight: 1 }}
      variant="outlined"
      type="number"
      label={fieldData?.label}
      required={fieldData?.required}
      name={`${fieldData?.fieldName}`}
      value={values[fieldData?.fieldName]}
      margin="dense"
      error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
      helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
      onChange={(e) => onChange(fieldData?.fieldName, parseFloat(e.target.value))}
      InputProps={{
        inputProps: { min: 0 },
        readOnly: fieldData && fieldData?.isUneditable ? true : false
      }}
      {...others}
    />
  ) : fieldData?.type === 'checkBox' ? (
    <FormControlLabel
      control={
        <Checkbox
          required={fieldData?.required}
          name={`${fieldData?.fieldName}`}
          checked={values[fieldData?.fieldName]}
          onChange={(e) => onChange(fieldData?.fieldName, e.target.value)}
          color="secondary"
        />
      }
      label={fieldData?.label}
      {...others}
    />
  ) : fieldData?.type === 'date' ? (
    <Box className='pr-1'>
      <CustomDatePicker
        disabled={fieldData?.isUneditable}
        required={fieldData?.required}
        value={values[fieldData?.fieldName]}
        name={`${fieldData?.fieldName}`}
        label={fieldData?.label}
        onChange={(date) => onChange(fieldData?.fieldName, date)}
        margin="dense"
        error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
        helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
        {...others}
      />
    </Box>
  ) : fieldData?.type === 'dateTime' ? (
    <Box className='pr-1'>
      <CustomDateTimePicker
        required={fieldData?.required}
        value={values[fieldData?.fieldName]}
        name={`${fieldData?.fieldName}`}
        label={fieldData?.label}
        onChange={(date) => onChange(fieldData?.fieldName, date)}
        onError={console.error}
        margin="dense"
        error={touched[`${values._id}_${fieldData?.fieldName}`] && Boolean(errors[`${values._id}_${fieldData?.fieldName}`])}
        helperText={touched[`${values._id}_${fieldData?.fieldName}`] && errors[`${values._id}_${fieldData?.fieldName}`]}
        {...others}
      />
    </Box>
  ) : null;
};

export default FormTypes;

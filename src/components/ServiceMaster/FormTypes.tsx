import React, { useEffect, useRef } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  TextField,
  Typography,

} from '@material-ui/core';
import DateUtils from '@date-io/date-fns';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import InfoIcon from '@material-ui/icons/Info';
import { handleAutoCalculation, optionConverter } from '../../constants/formulaUtility';
import NumberFormat from 'react-number-format';
import {
  documentUploadMaxSize,
  dateFormatForInputControl,
  formatAmountWithCurrency
} from '../../constants/helpers';
import HtmlTooltip from '../CustomTooltipTitle';
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

const InfoLabel = ({ children, info, isTooltip, doNotShowInfoTooltip = false, warningMessage, warningTooltip }) =>
  isTooltip && info ? (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={11} sm={11} md={11}>
        {children}
        {warningTooltip && <Box ml={1}>
          <Typography variant="caption" color="secondary">{warningMessage}</Typography>
        </Box>}
      </Grid>
      <Grid item xs={1} sm={1} md={1}>
        <HtmlTooltip title={<Typography>{info}</Typography>}>
          <InfoIcon color="disabled" />
        </HtmlTooltip>
      </Grid>
    </Grid>
  ) : doNotShowInfoTooltip ? (
    <>
      {children}
      {warningTooltip && <Box ml={1}>
        <Typography variant="caption" color="secondary">{warningMessage}</Typography>
      </Box>}
    </>
  ) : (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={12} sm={12} md={12}>
        {children}
        {warningTooltip && <Box ml={1}>
          <Typography variant="caption" color="secondary">{warningMessage}</Typography>
        </Box>}
      </Grid>
      {/* <Grid item xs={1} sm={1} md={1}>
        <InfoIcon style={{ opacity: 0 }} color="disabled" />
      </Grid> */}
    </Grid>
  );

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

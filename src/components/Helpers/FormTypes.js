import React from "react";
import PropTypes from "prop-types";
import {
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Radio,
} from "@material-ui/core";
import {
  TextField,
  Select,
  Switch,
  CheckboxWithLabel,
  RadioGroup,
} from "formik-material-ui";
import { Field } from "formik";
import NumberFormat from "react-number-format";

// for currency
const NumberFormatCustom = (props) => {
  const { inputRef, ...other } = props;

  return <NumberFormat {...other} isNumericString getInputRef={inputRef} />;
};

const CurrencyFormat = (props) => {
  const { inputRef, ...other } = props;

  return (
    <NumberFormat
      {...other}
      thousandSeparator
      isNumericString
      prefix="$"
      getInputRef={inputRef}
    />
  );
};

const FormTypes = (props) => {
  const { fieldData, ...rest } = props;

  return {
    singleLine: (
      <Field
        fullWidth
        variant="outlined"
        type="text"
        component={TextField}
        name={fieldData.fieldName}
        label={fieldData.fieldLabel}
        {...rest}
      />
    ),
    dropDown: (
      <Field
        fullWidth
        variant="outlined"
        component={TextField}
        type="text"
        select
        name={fieldData.fieldName}
        label={fieldData.fieldLabel}
        {...rest}
      >
        {fieldData.option
          ? fieldData.option.map((option, i) => (
              <MenuItem key={i} value={option.optionLabel}>
                {option.optionLabel}
              </MenuItem>
            ))
          : ""}
      </Field>
    ),
    multiSelect: (
      <FormControl {...rest} fullWidth variant="outlined">
        <InputLabel htmlFor={fieldData.fieldName}>
          {fieldData.fieldLabel}
        </InputLabel>
        <Field
          label={fieldData.fieldLabel}
          component={Select}
          type="text"
          name={fieldData.fieldName}
          multiple={true}
          inputProps={{ name: fieldData.fieldName, id: fieldData.fieldName }}
        >
          {fieldData.option
            ? fieldData.option.map((option) => (
                <MenuItem
                  key={option.order}
                  value={
                    option.optionValue ? option.optionValue : option.optionLabel
                  }
                >
                  {option.optionLabel}
                </MenuItem>
              ))
            : ""}
        </Field>
      </FormControl>
    ),
    switch: (
      <FormControlLabel
        control={
          <Field
            component={Switch}
            type="checkbox"
            name={fieldData.fieldName}
            {...rest}
          />
        }
        label={fieldData.fieldLabel}
      />
    ),
    email: (
      <Field
        fullWidth
        variant="outlined"
        component={TextField}
        type="email"
        name={fieldData.fieldName}
        label={fieldData.fieldLabel}
        {...rest}
      />
    ),
    mobileNumber: (
      <Field
        fullWidth
        variant="outlined"
        type="tel"
        component={TextField}
        name={fieldData.fieldName}
        label={fieldData.fieldLabel}
        {...rest}
      />
    ),
    number: (
      <Field
        fullWidth
        variant="outlined"
        component={TextField}
        label={fieldData.fieldLabel}
        name={fieldData.fieldName}
        InputProps={{
          inputComponent: NumberFormatCustom,
        }}
        {...rest}
      />
    ),
    multiLine: (
      <Field
        fullWidth
        variant="outlined"
        component={TextField}
        type="text"
        multiline
        name={fieldData.fieldName}
        label={fieldData.fieldLabel}
        {...rest}
      />
    ),
    currency: (
      <Field
        fullWidth
        variant="outlined"
        component={TextField}
        label={fieldData.fieldLabel}
        name={fieldData.fieldName}
        InputProps={{
          inputComponent: CurrencyFormat,
        }}
        {...rest}
      />
    ),
    checkBox: (
      <Field
        component={CheckboxWithLabel}
        type="checkbox"
        Label={{ label: fieldData.fieldLabel }}
        name={fieldData.fieldName}
        {...rest}
      />
    ),
    radio: (
      <Field component={RadioGroup} name={fieldData.fieldName}>
        {fieldData.option
          ? fieldData.option.map((option, i) => (
              <FormControlLabel
                key={i}
                value={option.radioName}
                control={<Radio />}
                label={option.radioLabel}
              />
            ))
          : ""}
      </Field>
    ),
  }[fieldData.type];
};

FormTypes.propTypes = {
  fieldData: PropTypes.object.isRequired,
};

export default FormTypes;

import PropTypes from "prop-types";
import {
  TextField,
  Switch,
  FormControlLabel,
  Checkbox,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import MuiPhoneInput from "material-ui-phone-number";

const FormTypes = (props) => {
  const {
    type,
    label,
    name,
    errors,
    values,
    options,
    touched,
    setFieldValue,
    onChange,
    ...rest
  } = props;

  return type === "singleLine" ? (
    <TextField
      {...rest}
      variant="outlined"
      type="text"
      label={label}
      name={name}
      value={values[name]}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
      onChange={(e) => setFieldValue(name, e.target.value)}
    />
  ) : type === "number" ? (
    <TextField
      {...rest}
      variant="outlined"
      type="number"
      label={label}
      name={name}
      value={values[name]}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
      onChange={(e) => setFieldValue(name, e.target.value)}
    />
  ) : type === "email" ? (
    <TextField
      {...rest}
      variant="outlined"
      type="email"
      label={label}
      name={name}
      value={values[name]}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
      onChange={(e) => setFieldValue(name, e.target.value)}
    />
  ) : type === "password" ? (
    <TextField
      {...rest}
      variant="outlined"
      type="password"
      label={label}
      name={name}
      value={values[name]}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
      onChange={(e) => setFieldValue(name, e.target.value)}
    />
  ) : type === "mobileNumber" ? (
    <MuiPhoneInput
      {...rest}
      defaultCountry={"us"}
      disableAreaCodes
      enableLongNumbers
      countryCodeEditab={false}
      disableCountryCode
      variant="outlined"
      label={label}
      name={name}
      value={values[name]}
      onChange={(val) => setFieldValue(name, val)}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
    />
  ) : type === "dropDown" ? (
    <Autocomplete
      {...rest}
      options={options?.map((opt) => opt.optionLabel)}
      getOptionLabel={(option) => option}
      getOptionSelected={(option, val) => option === val}
      value={values[name]}
      onChange={(e, val) => setFieldValue(name, val)}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          label={label}
          variant="outlined"
          error={touched.language && Boolean(errors.language)}
          helperText={touched.language && errors.language}
        />
      )}
    />
  ) : type === "multiSelect" ? (
    <Autocomplete
      {...rest}
      multiple
      options={options?.map((opt) => opt.optionLabel)}
      getOptionLabel={(option) => option}
      value={values[name]}
      getOptionSelected={(option, val) => option === val}
      onChange={(e, value) => setFieldValue(name, value)}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={label}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
        />
      )}
    />
  ) : type === "switch" ? (
    <FormControlLabel
      control={
        <Switch
          name={name}
          checked={values[name]}
          onChange={
            onChange ? onChange : (e) => setFieldValue(name, e.target.value)
          }
          color="secondary"
        />
      }
      label={values[name] ? "Active" : "Inactive"}
    />
  ) : type === "checkbox" ? (
    <FormControlLabel
      control={
        <Checkbox
          name={name}
          checked={values[name]}
          onChange={
            onChange ? onChange : (e) => setFieldValue(name, e.target.value)
          }
          color="secondary"
        />
      }
      label={label}
    />
  ) : type === "radio" ? (
    <FormControl component="fieldset">
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup
        aria-label="gender"
        name={name}
        value={values[name]}
        onChange={(e) => setFieldValue(name, e.target.value)}
      >
        {options.map((opt) => (
          <FormControlLabel
            key={opt.order}
            value={opt.optionLabel}
            control={<Radio />}
            label={opt.optionLabel}
          />
        ))}
      </RadioGroup>
    </FormControl>
  ) : type === "multiLine" ? (
    <TextField
      {...rest}
      variant="outlined"
      type="text"
      label={label}
      name={name}
      rows={4}
      value={values[name]}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
      onChange={(e) => setFieldValue(name, e.target.value)}
      multiline
    />

    // <Field
    //   fullWidth
    //   variant="outlined"
    //   component={TextField}
    //   type="text"
    //   multiline
    //   name={fieldData.fieldName}
    //   label={fieldData.fieldLabel}
    //   {...rest}
    // />
  ) : null;
  //  type === "currency" ? (
  //   <Field
  //     fullWidth
  //     variant="outlined"
  //     component={TextField}
  //     label={fieldData.fieldLabel}
  //     name={fieldData.fieldName}
  //     InputProps={{
  //       inputComponent: CurrencyFormat,
  //     }}
  //     {...rest}
  //   />
  // ) : null;
};

FormTypes.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  errors: PropTypes.object,
  touched: PropTypes.object,
  values: PropTypes.object,
  setFieldValue: PropTypes.func,
};

export default FormTypes;

import React from "react";
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
  Grid,
  Typography,
  useTheme,
} from "@material-ui/core";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import { Autocomplete } from "@material-ui/lab";
import MuiPhoneInput from "material-ui-phone-number";
import parse from "autosuggest-highlight/parse";
import throttle from "lodash/throttle";

const autocompleteService = { current: null };

const FormTypes = (props) => {
  const theme = useTheme();
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
  const [optionsList, setOptions] = React.useState([]);
  const [value, setValue] = React.useState(null);

  const fetch = React.useMemo(
    () =>
      throttle((request, callback) => {
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 200),
    []
  );

  React.useEffect(() => {
    let active = true;

    if (type === "location") {
      if (!autocompleteService.current && window.google) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      if (!autocompleteService.current) {
        return undefined;
      }

      if (values.address === "") {
        setOptions(value ? [value] : []);
        return undefined;
      }

      fetch({ input: values.address }, (results) => {
        if (active) {
          let newOptions = [];
          if (value) {
            newOptions = [value];
          }
          if (results) {
            newOptions = [...newOptions, ...results];
          }
          setOptions(newOptions);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [type, value, values.address, fetch]);

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
      onChange={
        onChange ? onChange : (e) => setFieldValue(name, e.target.value)
      }
    />
  ) : type === "multiLine" ? (
    <TextField
      {...rest}
      variant="outlined"
      type="text"
      multiline
      label={label}
      name={name}
      value={values[name]}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
      onChange={
        onChange ? onChange : (e) => setFieldValue(name, e.target.value)
      }
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
      onChange={
        onChange ? onChange : (e) => setFieldValue(name, e.target.value)
      }
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
      onChange={
        onChange ? onChange : (e) => setFieldValue(name, e.target.value)
      }
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
      onChange={
        onChange ? onChange : (e) => setFieldValue(name, e.target.value)
      }
    />
  ) : type === "mobileNumber" ? (
    <MuiPhoneInput
      {...rest}
      defaultCountry={"us"}
      disableAreaCodes
      countryCodeEditable={true}
      variant="outlined"
      label={label}
      name={name}
      value={values[name]}
      onChange={onChange ? onChange : (val) => setFieldValue(name, val)}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
    />
  ) : type === "dropDown" ? (
    <Autocomplete
      {...rest}
      options={options}
      getOptionLabel={(option) => (option ? option.optionLabel : "")}
      getOptionSelected={(option, val) =>
        option.optionLabel === val.optionLabel
      }
      value={values[name]}
      onChange={onChange ? onChange : (e, val) => setFieldValue(name, val)}
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
      options={options}
      getOptionLabel={(option) => (option ? option.optionLabel : "")}
      value={values[name]}
      getOptionSelected={(option, val) =>
        option.optionLabel === val.optionLabel
      }
      onChange={onChange ? onChange : (e, value) => setFieldValue(name, value)}
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
            onChange ? onChange : (e) => setFieldValue(name, e.target.checked)
          }
          color="secondary"
        />
      }
      label={values[name] ? "Inactive" : "Active"}
    />
  ) : type === "checkBox" ? (
    <FormControlLabel
      control={
        <Checkbox
          name={name}
          checked={values[name]}
          onChange={
            onChange ? onChange : (e) => setFieldValue(name, e.target.checked)
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
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
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
  ) : type === "location" ? (
    <Autocomplete
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.description
      }
      filterOptions={(x) => x}
      options={optionsList}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      onChange={(event, newValue) => {
        setOptions(newValue ? [newValue, ...optionsList] : optionsList);
        setValue(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setFieldValue(name, newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={label}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          {...rest}
        />
      )}
      renderOption={(option) => {
        const matches =
          option.structured_formatting.main_text_matched_substrings;
        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length])
        );

        return (
          <Grid container alignItems="center">
            <Grid item>
              <LocationOnIcon
                style={{
                  color: theme.palette.text.secondary,
                  marginRight: theme.spacing(2),
                }}
              />
            </Grid>
            <Grid item xs>
              {parts.map((part, index) => (
                <span
                  key={index}
                  style={{ fontWeight: part.highlight ? 700 : 400 }}
                >
                  {part.text}
                </span>
              ))}

              <Typography variant="body2" color="textSecondary">
                {option.structured_formatting.secondary_text}
              </Typography>
            </Grid>
          </Grid>
        );
      }}
    />
  ) : null;
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

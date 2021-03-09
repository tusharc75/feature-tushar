import React, { Fragment } from "react";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@material-ui/core";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import InfoIcon from "@material-ui/icons/Info";
import { Autocomplete } from "@material-ui/lab";
import MuiPhoneInput from "material-ui-phone-number";
import parse from "autosuggest-highlight/parse";
import throttle from "lodash/throttle";
import currencies from "../../constants/currency_with_country.json";
import { withStyles } from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";
import AddCircleIcon from "@material-ui/icons/AddCircle";

const InfoLabel = ({ children, info, isTooltip }) =>
  isTooltip ? (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={11} sm={11} md={11}>
        {children}
      </Grid>
      <Grid item xs={1} sm={1} md={1}>
        <Tooltip title={info}>
          <InfoIcon color="disabled" />
        </Tooltip>
      </Grid>
    </Grid>
  ) : (
    <>{children}</>
  );

const autocompleteService = { current: null };

const RedSwitch = withStyles({
  switchBase: {
    color: red[500],
    "&$checked": {
      color: red[500],
    },
    "&$checked + $track": {
      backgroundColor: red[500],
    },
  },
  checked: {},
  track: {},
})(Switch);

const GreenSwitch = withStyles({
  switchBase: {
    color: green[500],
    "&$checked": {
      color: green[500],
    },
    "&$checked + $track": {
      backgroundColor: green[500],
    },
  },
  checked: {},
  track: {},
})(Switch);

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
    required,
    isTooltip,
    ...rest
  } = props;
  const [optionsList, setOptions] = React.useState([]);
  const [value, setValue] = React.useState(null);
  const [currencyData, setCurrencyData] = React.useState([]);

  const fetch = React.useMemo(
    () =>
      throttle((request, callback) => {
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 200),
    []
  );

  React.useEffect(() => {
    const sortedArr = currencies.sort((a, b) =>
      a.name.toUpperCase() < b.name.toUpperCase()
        ? -1
        : a.name.toUpperCase() > b.name.toUpperCase()
        ? 1
        : 0
    );
    setCurrencyData(sortedArr);
  }, []);

  React.useEffect(() => {
    let active = true;

    if (type === "location") {
      if (!autocompleteService.current && window.google) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      if (!autocompleteService.current) {
        return undefined;
      }

      if (values[name] === "") {
        setOptions(value ? [value] : []);
        return undefined;
      }

      fetch({ input: values[name] }, (results) => {
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
  }, [type, value, values[name], fetch]);

  const handleUploadFile = (event) => {
    const file = event.target.files[0];
    const size = event.target.files[0].size;
    getBase64(file, (result) => {
      setFieldValue(name, result);
    });
  };

  const getBase64 = (file, cb) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      cb(reader.result);
    };
    reader.onerror = function (error) {};
  };

  return type === "singleLine" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="text"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
      />
    </InfoLabel>
  ) : type === "url" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="url"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
      />
    </InfoLabel>
  ) : type === "name" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="text"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={(e) => {
          const regex = /^[a-zA-Z]+$/i;
          if (e.target.value === "" || regex.test(e.target.value)) {
            setFieldValue(name, e.target.value);
          }
        }}
      />
    </InfoLabel>
  ) : type === "multiLine" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="text"
        multiline
        label={label}
        name={name}
        required={required}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
      />
    </InfoLabel>
  ) : type === "number" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="number"
        label={label}
        name={name}
        required={required}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
      />
    </InfoLabel>
  ) : type === "email" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="email"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={
          errors[name] === "Email already exists"
            ? touched[name] || errors[name]
            : touched[name] && errors[name]
        }
        helperText={
          errors[name] === "Email already exists"
            ? touched[name] || errors[name]
            : touched[name] && errors[name]
        }
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
      />
    </InfoLabel>
  ) : type === "password" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="password"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
      />
    </InfoLabel>
  ) : type === "mobileNumber" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <MuiPhoneInput
        {...rest}
        defaultCountry={"us"}
        disableAreaCodes
        countryCodeEditable={false}
        variant="outlined"
        required={required}
        label={label}
        name={name}
        value={values[name]}
        onChange={onChange ? onChange : (val) => setFieldValue(name, val)}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
      />
    </InfoLabel>
  ) : type === "dropDown" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        options={options}
        getOptionLabel={(option) => (option ? option.optionLabel : "")}
        getOptionSelected={(option, val) =>
          option.optionValue === val.optionValue
        }
        value={values[name]}
        onChange={
          onChange ? onChange : (e, val) => setFieldValue(name, val ? val : {})
        }
        renderInput={(params) => (
          <TextField
            {...params}
            name={name}
            label={label}
            variant="outlined"
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
          />
        )}
      />
    </InfoLabel>
  ) : type === "currency" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        fullWidth
        value={values[name]}
        options={currencyData}
        getOptionLabel={(option) =>
          Object.entries(option).length
            ? `${option.currencyCode} - ${option.name}`
            : ""
        }
        onChange={(e, val) => setFieldValue(name, val ? val : {})}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            name={name}
            label={label}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
          />
        )}
        renderOption={(option) => {
          const { currencyCode, name, countryCode } = option;
          return (
            <Grid container alignItems="center">
              <Grid item>
                <Avatar
                  variant="rounded"
                  src={`https://lipis.github.io/flag-icon-css/flags/4x3/${countryCode.toLowerCase()}.svg`}
                  style={{ marginRight: 20, width: "40px", height: "30px" }}
                />
              </Grid>
              <Grid item xs>
                <Typography>{currencyCode}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {name}
                </Typography>
              </Grid>
            </Grid>
          );
        }}
      />
    </InfoLabel>
  ) : type === "multiSelect" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        multiple
        options={options}
        getOptionLabel={(option) => (option ? option.optionLabel : "")}
        value={values[name] ? values[name] : []}
        getOptionSelected={(option, val) =>
          option.optionValue === val.optionValue
        }
        onChange={
          onChange ? onChange : (e, value) => setFieldValue(name, value)
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={label}
            name={name}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
          />
        )}
      />
    </InfoLabel>
  ) : type === "switch" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <FormControlLabel
        control={
          values[name] ? (
            <RedSwitch
              name={name}
              checked={values[name]}
              onChange={
                onChange
                  ? onChange
                  : (e) => setFieldValue(name, e.target.checked)
              }
            />
          ) : (
            <GreenSwitch
              name={name}
              checked={values[name]}
              onChange={
                onChange
                  ? onChange
                  : (e) => setFieldValue(name, e.target.checked)
              }
            />
          )
        }
        label={label}
      />
    </InfoLabel>
  ) : type === "checkBox" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <FormControlLabel
        control={
          <Checkbox
            name={name}
            checked={values[name] ? values[name] : false}
            onChange={
              onChange ? onChange : (e) => setFieldValue(name, e.target.checked)
            }
            color="secondary"
          />
        }
        label={label}
      />
    </InfoLabel>
  ) : type === "radio" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
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
    </InfoLabel>
  ) : type === "location" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        getOptionLabel={(option) =>
          typeof option === "string" ? option : option.description
        }
        filterOptions={(x) => x}
        options={optionsList}
        autoComplete
        includeInputInList
        filterSelectedOptions
        value={values[name]}
        onChange={
          onChange
            ? onChange
            : (event, newValue) => {
                setOptions(newValue ? [newValue, ...optionsList] : optionsList);
                setValue(newValue);
              }
        }
        onInputChange={(event, newInputValue) => {
          setFieldValue(name, newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            name={name}
            label={label}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
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
    </InfoLabel>
  ) : type === "imageUpload" ? (
    <Fragment>
      <Box display="flex" flexDirection="row">
        <Box>
          <Avatar
            src={values[name]}
            style={{ width: 70, height: 70 }}
            alt="org_logo"
          />
        </Box>
        <Box>
          <IconButton
            color="primary"
            size="small"
            aria-label="upload picture"
            component="span"
          >
            <AddCircleIcon />
            <input
              name="logo_image_id"
              onChange={handleUploadFile}
              accept="image/x-png,image/gif,image/jpeg"
              style={{ opacity: "0", position: "absolute", zindex: -1 }}
              type="file"
            />
          </IconButton>
          {/* <Button variant="outlined" size="small" color="primary" component="span">Upload Logo
        </Button> */}
        </Box>
      </Box>
    </Fragment>
  ) : type === "url" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="url"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
      />
    </InfoLabel>
  ) : type === "date" ? (
    <InfoLabel info={label} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="date"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
      />
    </InfoLabel>
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

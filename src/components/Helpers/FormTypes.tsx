import React, { Fragment } from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
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
import _ from "lodash";
import DateUtils from "@date-io/date-fns";
import {
  KeyboardDatePicker,
  KeyboardDateTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import InfoIcon from "@material-ui/icons/Info";
import DeleteIcon from "@material-ui/icons/Delete";
import { Autocomplete } from "@material-ui/lab";
import MuiPhoneInput from "material-ui-phone-number";
import parse from "autosuggest-highlight/parse";
import throttle from "lodash/throttle";
import currencies from "../../constants/currency_with_country.json";
import { withStyles } from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import { getFormulaValue } from "../../constants/formulaUtility";
import NumberFormat from "react-number-format";
import moment from "moment";
import { yyyyMMDD } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";

interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const withValueLimit = (inputObj, limitVal) => {
  const { value } = inputObj;
  if (value <= limitVal) return inputObj;
};

const CustomFormat = (props: NumberFormatCustomProps) => {
  const { inputRef, onChange, ...other } = props;
  return (
    <NumberFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.formattedValue,
          },
        });
      }}
      isNumericString
    />
  );
};

const InfoLabel = ({ children, info, isTooltip }) =>
  isTooltip && info ? (
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
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={11} sm={11} md={11}>
        {children}
      </Grid>
      <Grid item xs={1} sm={1} md={1}>
        <InfoIcon style={{ opacity: 0 }} color="disabled" />
      </Grid>
    </Grid>
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
    tooltipMessage,
    fields,
    ...rest
  } = props;

  const [optionsList, setOptions] = React.useState([]);
  const [value, setValue] = React.useState(null);
  const [currencyData, setCurrencyData] = React.useState([]);
  const [isUploading, setUploading] = React.useState(false);
  const { setToastConfig } = React.useContext(CustomToastContext);

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

  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];

      getImageUrl(file);
    }
  };

  const handleUploadFile = (ev) => {
    if (ev.target.files && ev.target.files.length) {
      const file = ev.target.files[0];
      getFileUrl(file);
    }
  };

  // For public upload
  const getImageUrl = (file) => {
    let formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    axiosInstance()
      .post("/user/upload-public", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(({ data }) => {
        setFieldValue(name, data.fileUrl);

        setUploading(false);
      })
      .catch((err) => {
        setUploading(false);
        setToastConfig(err);
      });
  };

  // for public upload
  const getFileUrl = (file) => {
    let formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    axiosInstance()
      .post("/user/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(({ data }) => {
        setFieldValue(name, data.fileName);
        setUploading(false);
      })
      .catch((err) => {
        setUploading(false);
        setToastConfig(err);
      });
  };

  const handleChange = (name, value) => {
    setFieldValue(name, value);
    if (type === "vlookupDropdown") {
      handleVlookup(name, value);
    } else {
      handleFormula(name, value);
    }
  };

  const handleFormula = (name, value) => {
    if (fields && fields.filter((_f) => _f.type === "formula").length) {
      fields
        .filter((_f) => _f.type === "formula")
        .forEach((_data) => {
          if (_data.inputFields.includes(name)) {
            let inputFields = {};
            _data.inputFields.forEach((_input) => {
              if (name === _input) {
                inputFields[_input] = value;
              } else {
                inputFields[_input] = values[_input] ? values[_input] : "";
              }
            });
            let calValue = getFormulaValue(
              _data.formula,
              inputFields,
              _data.returnType,
              _data.decimalPlaces
            );
            setFieldValue(_data.fieldName, calValue);
            handleFormula(_data.fieldName, calValue);
          }
        });
    }
  };

  const handleVlookup = (name, value) => {
    if (options && options.length) {
      let result = options.filter((data) => data.optionValue === value);
      if (result.length) {
        for (var x in result[0]) {
          if (x !== "optionLabel" && x !== "optionValue") {
            setFieldValue(x, result[0][x]);
          }
        }
      }
    }
  };

  return type === "singleLine" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
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
          onChange
            ? onChange
            : (e) => setFieldValue(name, e.target.value.trimStart())
        }
      />
    </InfoLabel>
  ) : type === "name" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
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
          const regex = /^[a-zA-Z ]+$/i;
          if (e.target.value === "" || regex.test(e.target.value.trim())) {
            setFieldValue(name, e.target.value);
          }
        }}
      />
    </InfoLabel>
  ) : type === "multiLine" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
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
          onChange
            ? onChange
            : (e) => setFieldValue(name, e.target.value.trimStart())
        }
      />
    </InfoLabel>
  ) : type === "number" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        label={label}
        name={name}
        required={required}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange ? onChange : (e) => setFieldValue(name, e.target.value)
        }
        InputProps={{
          inputComponent: CustomFormat as any,
          inputProps: {
            allowNegative: false,
          },
        }}
      />
    </InfoLabel>
  ) : type === "decimal" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        InputProps={{
          inputComponent: CustomFormat as any,
          inputProps: {
            decimalScale: 2,
            onValueChange: (values: any) =>
              setFieldValue(name, values.formattedValue),
          },
        }}
        onChange={
          onChange
            ? onChange
            : (e) => {
              handleChange(
                name,
                e.target.value == "" ? null : parseFloat(e.target.value)
              );
            }
        }
      />
    </InfoLabel>
  ) : type === "percent" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        InputProps={{
          inputComponent: CustomFormat as any,
          inputProps: {
            isAllowed: (props) => withValueLimit(props, 100),
            decimalScale: 2,
            onValueChange: (values: any) =>
              setFieldValue(name, values.formattedValue),
          },
          endAdornment: "%",
        }}
        onChange={
          onChange
            ? onChange
            : (e) => {
              handleChange(
                name,
                e.target.value == "" ? null : parseFloat(e.target.value)
              );
            }
        }
      />
    </InfoLabel>
  ) : type === "formula" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="text"
        label={label}
        name={name}
        required={required}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
      />
    </InfoLabel>
  ) : type === "email" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="email"
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
  ) : type === "password" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
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
  ) : type === "dropDown" || type === "lookup" || type === "vlookupDropdown" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        options={options}
        getOptionLabel={(option: any) => (option ? option.optionLabel : "")}
        getOptionSelected={(option: any, val) => option.optionValue === val}
        value={
          options.filter((data) => data.optionValue === values[name]).length
            ? options.filter((data) => data.optionValue === values[name])[0]
            : ""
        }
        onChange={
          onChange
            ? onChange
            : (e, val) =>
              handleChange(
                name,
                val && val.optionValue ? val.optionValue : ""
              )
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        fullWidth
        value={
          currencyData.filter((data) => data.currencyCode === values[name])
            .length
            ? currencyData.filter(
              (data) => data.currencyCode === values[name]
            )[0]
            : ""
        }
        options={currencyData}
        getOptionLabel={(option: any) =>
          option ? `${option.currencyCode} - ${option.name}` : ""
        }
        getOptionSelected={(option: any, val) => option.currencyCode === val}
        onChange={(e, val) =>
          setFieldValue(name, val && val.currencyCode ? val.currencyCode : "")
        }
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        multiple
        options={options}
        getOptionLabel={(option: any) => (option ? option.optionLabel : "")}
        value={options.filter((data: any) =>
          values[name].includes(data.optionValue)
        )}
        getOptionSelected={(option: any, val: any) =>
          option.optionValue === val.optionValue
        }
        onChange={
          onChange
            ? onChange
            : (e, value: any[]) =>
              setFieldValue(
                name,
                value.map((val) => val.optionValue)
              )
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <FormControlLabel
        control={
          <Checkbox
            required={required}
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
    </InfoLabel>
  ) : type === "radio" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <FormControl component="fieldset" required={required}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        getOptionLabel={(option: any) =>
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
        renderOption={(option: any) => {
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
        <Box position="relative">
          <Avatar
            src={values[name]}
            style={{ width: 70, height: 70 }}
            alt="org_logo"
          />
          <Box
            title={values[name] ? values[name] : "No picture selected"}
            display="flex"
            justifyContent="center"
            alignItems="center"
            position="absolute"
            top="0"
            right="0"
            width="100%"
            height="100%"
          >
            {isUploading && <CircularProgress size={22} />}
          </Box>
        </Box>
        <Box>
          <label htmlFor={name}>
            <IconButton
              title="Add picture"
              color="primary"
              size="small"
              aria-label="upload picture"
              component="span"
            >
              <AddCircleIcon />
              <input
                disabled={isUploading}
                id={name}
                name={name}
                onChange={handleUploadImage}
                accept="image/x-png,image/gif,image/jpeg"
                style={{
                  opacity: "0",
                  position: "absolute",
                  zIndex: -1,
                }}
                type="file"
              />
            </IconButton>
          </label>
          {
            <IconButton
              disabled={Boolean(!values[name])}
              title="Remove picture"
              color="secondary"
              size="small"
              aria-label="delete picture"
              component="span"
              onClick={() => setFieldValue(name, "")}
            >
              <DeleteIcon />
            </IconButton>
          }
        </Box>
      </Box>
    </Fragment>
  ) : type === "fileUpload" ? (
    <Fragment>
      <Box display="flex" alignItems="center">
        <input
          disabled={isUploading}
          id={name}
          name={name}
          onChange={handleUploadFile}
          style={{ display: "none" }}
          type="file"
        />
        <label htmlFor={name}>
          <Button
            disabled={isUploading}
            variant="contained"
            color="primary"
            component="span"
          >
            Upload File
          </Button>
        </label>
        <Box marginX={1} />

        <Box flex="1">
          <p className="text-truncate">
            {values[name]
              ? values[name]
              : isUploading
                ? "Uploading..."
                : "No file choosen"}
          </p>
        </Box>
        <IconButton
          disabled={Boolean(!values[name])}
          title="Remove File"
          color="secondary"
          size="small"
          aria-label="delete picture"
          component="span"
          onClick={() => setFieldValue(name, "")}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Fragment>
  ) : type === "url" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <MuiPickersUtilsProvider utils={DateUtils}>
        <KeyboardDatePicker
          clearable
          {...rest}
          required={required}
          variant="inline"
          inputVariant="outlined"
          value={values[name]}
          name={name}
          label={label}
          defaultValue={new Date()}
          onChange={(date) => setFieldValue(name, date)}
          format="MM/dd/yyyy"
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </MuiPickersUtilsProvider>
    </InfoLabel>
  ) : type === "dateTime" ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <MuiPickersUtilsProvider utils={DateUtils}>
        <KeyboardDateTimePicker
          {...rest}
          required={required}
          variant="inline"
          inputVariant="outlined"
          ampm={false}
          value={values[name]}
          name={name}
          label={label}
          defaultValue={new Date("2018-01-01T00:00:00.000Z")}
          onChange={(date) => setFieldValue(name, date)}
          onError={console.log}
          disablePast
          format="yyyy/MM/dd HH:mm"
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </MuiPickersUtilsProvider>
    </InfoLabel>
  ) : null;
};

export default FormTypes;

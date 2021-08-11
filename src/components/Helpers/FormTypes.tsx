import React, { Fragment, useContext, useEffect, useRef } from 'react';
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
  useTheme
} from '@material-ui/core';
import { result, find, throttle } from 'lodash';
import DateUtils from '@date-io/date-fns';
import { DatePicker, KeyboardDatePicker, KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import InfoIcon from '@material-ui/icons/Info';
import DeleteIcon from '@material-ui/icons/Delete';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import MuiPhoneInput from 'material-ui-phone-number';
import parse from 'autosuggest-highlight/parse';
import { withStyles } from '@material-ui/core/styles';
import { green, red } from '@material-ui/core/colors';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { getFormulaValue, handleAutoCalculation } from '../../constants/formulaUtility';
import NumberFormat from 'react-number-format';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import InputAdornment from '@material-ui/core/InputAdornment';
import {
  imageUploadMaxSize,
  documentUploadMaxSize,
  dateFormatForInputControl,
  getUniqueCurrencies,
  documentUploadSupportExtensions,
  formatAmountWithCurrency
} from '../../constants/helpers';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import AddDisplayTypeDialog from '../productBuilder/AddDisplayTypeDialog';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import CreditCardIcon from '@material-ui/icons/CreditCard';
import { useLocation, useHistory } from 'react-router-dom'

const filter = createFilterOptions();

interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const withValueLimit = (inputObj, limitVal) => {
  const { value } = inputObj;
  if (value <= limitVal) return inputObj;
};

const formatDecimal = (value, decimalPlaces) => {
  if (value === '') {
    return 0;
  }
  // && isNaN(value)
  // else if (parseFloat(value) < 0) {
  //   return 0;
  // }
  else {
    return parseFloat(value.toFixed(decimalPlaces));
  }
};

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

const InfoLabel = ({ children, info, isTooltip, doNotShowInfoTooltip = false }) =>
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
  ) : doNotShowInfoTooltip ? (
    <>{children}</>
  ) : (
    <Grid container spacing={1} alignItems="center">
      <Grid item xs={12} sm={12} md={12}>
        {children}
      </Grid>
      {/* <Grid item xs={1} sm={1} md={1}>
        <InfoIcon style={{ opacity: 0 }} color="disabled" />
      </Grid> */}
    </Grid>
  );

const autocompleteService = { current: null };

const RedSwitch = withStyles({
  switchBase: {
    color: red[500],
    '&$checked': {
      color: red[500]
    },
    '&$checked + $track': {
      backgroundColor: red[500]
    }
  },
  checked: {},
  track: {}
})(Switch);

const GreenSwitch = withStyles({
  switchBase: {
    color: green[500],
    '&$checked': {
      color: green[500]
    },
    '&$checked + $track': {
      backgroundColor: green[500]
    }
  },
  checked: {},
  track: {}
})(Switch);

const FormTypes = (props) => {
  const theme = useTheme();
  const {
    addAdditionalOption,
    productTemplateId,
    priceTemplateId,
    lookup,
    type,
    label,
    _id: fieldId,
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
    fieldData,
    doNotShowInfoTooltip,
    startAdornment,
    accept,
    usePublicUrlforFileUpload = false,
    doNotShowUploadedFile = false,
    uploadFileUrl = '',
    onAppendData = null,
    fileUploadMaxSize = { ...documentUploadMaxSize },
    isMultipleUpload = false,
    imageOrFileUploadCompletePercentage,
    addDisplayType,
    removeDisplayType,
    setValues,
    canEdit = true,
    customError = {},
    handleRemoveField,
    showErrorMessage = false,
    selectedCurrencyCode = null,
    ...rest
  } = props;
  const [optionsList, setOptions] = React.useState([]);
  const [option, setOptionsList] = React.useState([]);
  const [value, setValue] = React.useState(null);
  const [currencyData, setCurrencyData] = React.useState([]);
  const [isImgUploading, setImgUploading] = React.useState(false);
  const [isFileUploading, setFileUploading] = React.useState(false);
  const [fileUploadProgress, setFileUploadProgress] = React.useState(0);
  const [imageUploadProgress, setImageUploadProgress] = React.useState(0);
  const { setToastConfig } = useContext(CustomToastContext);

  const [isExtraDispayType, setIsExtraDispayType] = React.useState(false);
  const [displayType, setDisplayType] = React.useState(null);

  const inputNumberRef = useRef(null);

  const { id } = useHistory()
  const { pathnames } = useLocation()

  useEffect(() => {
    setOptionsList(options)
  }, [options])

  useEffect(() => {
    const ignoreScroll = (e) => {
      e.preventDefault();
    };
    inputNumberRef.current && inputNumberRef.current.addEventListener('wheel', ignoreScroll);
  }, [inputNumberRef]);

  const fetch = React.useMemo(
    () =>
      throttle((request, callback) => {
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 200),
    []
  );

  React.useEffect(() => {
    const sortedArr = getUniqueCurrencies().sort((a, b) =>
      a.name.toUpperCase() < b.name.toUpperCase() ? -1 : a.name.toUpperCase() > b.name.toUpperCase() ? 1 : 0
    );
    setCurrencyData(sortedArr);
  }, []);

  React.useEffect(() => {
    let active = true;

    if (type === 'location') {
      if (!autocompleteService.current && window.google) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      if (!autocompleteService.current) {
        return undefined;
      }

      if (values[name] === '') {
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

      //  1048576 = 1 MB
      if (file.size > imageUploadMaxSize.size) {
        setToastConfig({
          open: true,
          type: 'error',
          message: `Image must be less than ${imageUploadMaxSize.text} size`
        });
      } else {
        getImageUrl(file);
      }

      event.target.value = '';
    }
  };

  const getLabel = (label) => {
    return label ? (label.length > 35 ? label.substr(0, 35) + '...' : label) : '';
  };

  const handleUploadFile = (ev) => {
    if (ev.target.files && ev.target.files.length) {
      let files = ev.target.files;
      // const file = ev.target.files[0];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > fileUploadMaxSize.size) {
          setToastConfig({
            open: true,
            type: 'error',
            message: `file must be less than ${fileUploadMaxSize.text} size`
          });
          break;
        }
        getFileUrl(file);
      }
      ev.target.value = '';
    }
  };

  // For public upload
  const getImageUrl = (file) => {
    setImageUploadProgress(0);
    let formData = new FormData();
    formData.append('file', file);
    setImgUploading(true);
    if (imageOrFileUploadCompletePercentage) {
      imageOrFileUploadCompletePercentage(1);
    }
    axiosInstance()
      .post('/user/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pE) => {
          const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
          setImageUploadProgress(completedPercent);
          if (imageOrFileUploadCompletePercentage) {
            imageOrFileUploadCompletePercentage(completedPercent);
          }
          if (completedPercent === 100) {
            setTimeout(() => {
              setImageUploadProgress(0);
              if (imageOrFileUploadCompletePercentage) {
                imageOrFileUploadCompletePercentage(0);
              }
            }, 4000);
          }
        }
      })
      .then(({ data }) => {
        setFieldValue(name, data.fileUrl);
        setImgUploading(false);
      })
      .catch((err) => {
        setImgUploading(false);
        setToastConfig(err);
        setImageUploadProgress(0);
        if (imageOrFileUploadCompletePercentage) {
          imageOrFileUploadCompletePercentage(0);
        }
      });
  };

  // for private upload
  const getFileUrl = (file) => {
    setFileUploadProgress(0);
    let formData = new FormData();
    formData.append('file', file);
    setFileUploading(true);
    let uploadUrl = usePublicUrlforFileUpload ? '/user/upload-public' : uploadFileUrl ? uploadFileUrl : '/user/upload';
    if (imageOrFileUploadCompletePercentage) {
      imageOrFileUploadCompletePercentage(1);
    }
    axiosInstance()
      .post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pE) => {
          const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
          setFileUploadProgress(completedPercent);

          if (completedPercent === 100) {
            setTimeout(() => {
              setFileUploadProgress(0);
            }, 4000);
          }
        }
      })
      .then(({ data }) => {
        if (imageOrFileUploadCompletePercentage) {
          imageOrFileUploadCompletePercentage(0);
        }
        if (uploadFileUrl) {
          onAppendData(data);
        } else {
          setFieldValue(name, usePublicUrlforFileUpload ? data.fileUrl : data.fileName);
        }
        setFileUploading(false);
      })
      .catch((err) => {
        setFileUploading(false);
        setToastConfig(err);
        setFileUploadProgress(0);
        if (imageOrFileUploadCompletePercentage) {
          imageOrFileUploadCompletePercentage(0);
        }
      });
  };

  const addFieldOption = (optionData) => {

    const data = {
      _id: productTemplateId || priceTemplateId
        ? fieldData._id
        : fieldData
          ? fieldData._id
          : fieldId,
      option: [optionData]
    }

    console.log(data)

    if (productTemplateId && priceTemplateId) {
      data["productTemplate"] = productTemplateId
      data["priceTemplate"] = productTemplateId
    } else if (!priceTemplateId && productTemplateId) {
      data["productTemplate"] = productTemplateId
    } else if (priceTemplateId && !productTemplateId) {
      data["priceTemplate"] = priceTemplateId
    }


    axiosInstance().post("field/add-field-option", data)
  }

  const handleChange = (name, value) => {
    const result = handleAutoCalculation(fieldData, fields, values, name, '', '', value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue([x], result[x]);
      }
    }
    //setFieldValue(name, value);
    // if (fieldData && fieldData.isMulitFormula) {
    //   handleMulitFormula(fieldData, { [name]: value });
    // }
    // if (type === "vlookupDropdown") {
    //   handleVlookup(name, value);
    // }
    // handleFormula(name, value, { [name]: value });
    // handleCheckVlookupReverse(name, value);
  };

  const handleConverterChange = (name, _unit, value) => {
    let fieldName = name + '_' + _unit.toLowerCase();
    const result = handleAutoCalculation(fieldData, fields, values, fieldName, '', _unit, value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue([x], result[x]);
      }
    }
    // setFieldValue(fieldName, value);
    // handleFormula(fieldName, value, { fieldName: value });
    // handleConverter(fieldData, name, _unit, value);
  };

  const handleCurrencyChange = (name, _currency, value) => {
    let fieldName = name + '_' + _currency.toLowerCase();
    const result = handleAutoCalculation(fieldData, fields, values, fieldName, _currency, '', value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue([x], result[x]);
      }
    }
    // setFieldValue(fieldName, value);
    // handleFormula(fieldName, value, { fieldName: value });
    // handleCurrency(fieldData, name, _currency, value);
  };

  const handleCurrencyChangeWithConverterChange = (name, _currency, _unit, value) => {
    let fieldName = name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
    const result = handleAutoCalculation(fieldData, fields, values, fieldName, _currency, _unit, value);
    if (setValues && Object.keys(result).length > 1) {
      setValues({ ...values, ...result });
    } else {
      for (var x in result) {
        setFieldValue([x], result[x]);
      }
    }
    //setFieldValue(fieldName, value);
    //handleFormula(fieldName, value, {});
    //handleCurrencyConverter(fieldData, name, _currency, _unit, value);
  };

  const handleAddDisplayType = (displayType, field, displayValue) => {
    if (displayType === 'currency') {
      field.displayCurrency.push(displayValue);
    } else if (displayType === 'converter') {
      field.displayUnits.push(displayValue);
    }

    if (field.type !== 'currencyAmount' && (field.type === 'converter' || field.isConverter === true)) {
      let _fieldName = field.fieldName + '_' + field.displayUnits[0].toLowerCase();
      handleConverterChange(field.fieldName, field.displayUnits[0], values[_fieldName]);
    } else if (field.type === 'currencyAmount' && (field.type === 'converter' || field.isConverter === true)) {
      let _fieldName = field.fieldName + '_' + field.displayCurrency[0].toLowerCase() + '_' + field.displayUnits[0].toLowerCase();
      handleCurrencyChangeWithConverterChange(field.fieldName, field.displayCurrency[0], field.displayUnits[0], values[_fieldName]);
    } else if (field.type === 'currencyAmount') {
      let _fieldName = field.fieldName + '_' + field.displayCurrency[0].toLowerCase();
      handleCurrencyChange(field.fieldName, field.displayCurrency[0], values[_fieldName]);
    }
    if (addDisplayType) {
      addDisplayType(displayType, field, displayValue);
    }
    setIsExtraDispayType(false);

    // if (displayType === "currency") {
    //   if (field.isConverter) {
    //     let _fieldName = field.fieldName + "_" + field.displayCurrency[0].toLowerCase() + "_" + field.displayUnits[0].toLowerCase();
    //     field.displayCurrency.push(displayValue)
    //     handleCurrencyConverter(field, field.fieldName, field.displayCurrency[0], field.displayUnits[0], values[_fieldName]);
    //   }
    //   else {
    //     let _fieldName = field.fieldName + "_" + field.displayCurrency[0].toLowerCase();
    //     field.displayCurrency.push(displayValue)
    //     handleCurrency(field, field.fieldName, field.displayCurrency[0], values[_fieldName])
    //   }
    // }
    // else if (displayType === "converter") {
    //   let _fieldName = field.fieldName + "_" + field.displayUnits[0].toLowerCase();
    //   field.displayUnits.push(displayValue)
    //   handleConverter(field, field.fieldName, field.displayUnits[0], values[_fieldName])
    // }
    // else if (displayType === "currencyConverter") {
    //   let _fieldName = field.fieldName + "_" + field.displayCurrency[0].toLowerCase() + "_" + field.displayUnits[0].toLowerCase();
    //   if (displayValue.currency) {
    //     field.displayCurrency.push(displayValue.currency)
    //   }
    //   if (displayValue.unit) {
    //     field.displayUnits.push(displayValue.unit)
    //   }
    //   handleCurrencyConverter(field, field.fieldName, field.displayCurrency[0], field.displayUnits[0], values[_fieldName]);
    // }
  };

  const handleRemoveDisplayType = (displayType, field, displayValue) => {
    if (removeDisplayType) {
      if (displayType === 'currency') {
        field.displayCurrency = field.displayCurrency.filter((e) => e !== displayValue);
        if (field.isConverter) {
          let _fieldName = field.fieldName + '_' + displayValue.toLowerCase() + '_' + field.displayUnits[0].toLowerCase();
          setFieldValue(_fieldName, 0);
        } else {
          let _fieldName = field.fieldName + '_' + displayValue.toLowerCase();
          setFieldValue(_fieldName, 0);
        }
      } else if (displayType === 'converter') {
        field.displayUnits = field.displayUnits.filter((e) => e !== displayValue);
        let _fieldName = field.fieldName + '_' + displayValue.toLowerCase();
        setFieldValue(_fieldName, 0);
      }
      removeDisplayType(displayType, field, displayValue);
    }
  };

  return type === 'singleLine' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="text"
        label={getLabel(label)}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={onChange ? onChange : (e) => handleChange(name, e.target.value.trimStart())}
      />
    </InfoLabel>
  ) : type === 'name' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="text"
        label={getLabel(label)}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={(e) => {
          const regex = /^[a-zA-Z ]+$/i;
          if (e.target.value === '' || regex.test(e.target.value.trim())) {
            setFieldValue(name, e.target.value.trim());
          }
        }}
      />
    </InfoLabel>
  ) : type === 'multiLine' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="text"
        multiline
        label={getLabel(label)}
        name={name}
        required={required}
        rows={3}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.value.trimStart())}
      />
    </InfoLabel>
  ) : type === 'number' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        label={getLabel(label)}
        name={name}
        required={required}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        ref={inputNumberRef}
        onChange={onChange ? onChange : (e) => handleChange(name, e.target.value)}
        InputProps={{
          inputComponent: CustomFormat as any,
          inputProps: {
            allowNegative: false,
            onValueChange: (values) => {
              handleChange(name, values.value);
            },
            selectedCurrencyCode: selectedCurrencyCode
          },
          startAdornment: startAdornment
        }}
      />
    </InfoLabel>
  ) : type === 'percent' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        type="number"
        variant="outlined"
        label={getLabel(label)}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        InputProps={{
          endAdornment: '%',
          inputProps: { min: 0 },
          readOnly: fieldData && fieldData.isUneditable ? true : false
        }}
        ref={inputNumberRef}
        onChange={
          onChange
            ? onChange
            : (e) => {
              handleChange(name, parseFloat(e.target.value));
            }
        }
      />
    </InfoLabel>
  ) : type === 'formula' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type={fieldData.returnType === 'decimal' ? 'number' : 'text'}
        label={getLabel(label)}
        name={name}
        required={required}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={
          onChange
            ? onChange
            : (e) => {
              if (fieldData.returnType === 'decimal') {
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
    </InfoLabel>
  ) : type === 'email' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="email"
        label={getLabel(label)}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.value)}
      />
    </InfoLabel>
  ) : type === 'password' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="password"
        label={getLabel(label)}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.value)}
      />
    </InfoLabel>
  ) : type === 'mobileNumber' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <MuiPhoneInput
        {...rest}
        defaultCountry={'us'}
        disableAreaCodes
        countryCodeEditable={false}
        variant="outlined"
        required={required}
        label={getLabel(label)}
        name={name}
        value={values[name]}
        onChange={onChange ? onChange : (val) => setFieldValue(name, val)}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
      />
    </InfoLabel>
  ) : type === 'dropDown' && fieldData && fieldData.isDependentDropdown ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} doNotShowInfoTooltip={doNotShowInfoTooltip}>
      <Autocomplete
        {...rest}
        options={option.filter((_f) => _f[fieldData.dropdowDependentOn] === values[fieldData.dropdowDependentOn])}
        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
        getOptionSelected={(option: any, val) => option.optionValue === val}
        value={
          option.filter((data) => data.optionValue === values[name]).length
            ? values[fieldData.dropdowDependentOn] === ''
              ? ''
              : option.filter((data) => data.optionValue === values[name])[0]
            : ''
        }
        onChange={
          onChange
            ? onChange
            : (e, val) => {
              handleChange(name, val && val.optionValue ? val.optionValue : '');
            }
        }
        renderInput={(params) => (
          <TextField
            {...params}
            name={name}
            label={getLabel(label)}
            variant="outlined"
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
          />
        )}
      />
    </InfoLabel>
  ) : type === 'dropDown' || type === 'lookup' || (type === 'vlookupDropdown' && fieldData && fieldData.isvlookupReverse) ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} doNotShowInfoTooltip={doNotShowInfoTooltip}>
      <Autocomplete
        {...rest}
        options={option}
        freeSolo={type === 'dropDown' && !lookup}
        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
        getOptionSelected={(option: any, val) => option.optionValue === val}
        value={
          option.filter((data) => data.optionValue === values[name]).length ? option.filter((data) => data.optionValue === values[name])[0] : ''
        }
        onChange={
          onChange
            ? onChange
            : (e, val) => {
              if (setFieldValue) {
                if (!lookup) {
                  if (typeof val === 'string' && /^[a-zA-Z ]*$/.test(val)) {

                    const newOption = {
                        order: option.length,
                        default: false,
                        optionLabel: val,
                        optionValue: val
                      }
                      
                      if (!option?.find(o => o?.optionValue.includes(val)) && (addAdditionalOption ||fieldData?.addAdditionalOption)) {
                        addFieldOption(newOption)
                        setOptionsList([...option, newOption]);
                    }
                    if (addAdditionalOption) {
                      handleChange(name, val);
                    }
                  } else if (val && val.inputValue && /^[a-zA-Z ]*$/.test(val.inputValue)) {
                    const newOption = {
                        order: option.length,
                        default: false,
                        optionLabel: val.inputValue,
                        optionValue: val.inputValue
                      }
                      if (!option?.find(o => o?.optionValue.includes(val.inputValue)) && (addAdditionalOption ||fieldData?.addAdditionalOption)) {
                        setOptionsList([...option, newOption]);
                        addFieldOption(newOption)
                    }
                    if (addAdditionalOption) {
                      handleChange(name, val.inputValue);
                    }
                  } else {
                    if (val) {
                      const newOption = {
                        ...val,
                        optionLabel: val.optionValue,
                      }
                      if (!option?.find(o => o?.optionValue.includes(val.optionValue)) && (addAdditionalOption ||fieldData?.addAdditionalOption)) {
                        addFieldOption(newOption)
                        setOptionsList([newOption, ...option]);
                      }
                      handleChange(name, val && val.optionValue ? val.optionValue : '');

                    }
                  }
                } else {
                  handleChange(name, val && val.optionValue ? val.optionValue : '');
                }
              }
            }
        }
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          if (params.inputValue !== '' && !option.find(o => o?.optionValue.includes(params.inputValue))
            && !lookup && (addAdditionalOption || fieldData?.addAdditionalOption)) {
            filtered.push({
              order: option.length,
              default: false,
              optionLabel: `Add "${params.inputValue}"`,
              optionValue: params.inputValue
            })
          }

          return filtered
        }}
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
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
          />
        )}
      />
    </InfoLabel>
  ) : type === 'vlookupDropdown' && fieldData && !fieldData.isvlookupReverse ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="text"
        label={getLabel(label)}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={onChange ? onChange : (e) => handleChange(name, e.target.value.trimStart())}
      />
    </InfoLabel>
  ) : type === 'converter' || (type === 'decimal' && fieldData && fieldData.isConverter) ? (
    fieldData.displayUnits &&
    Array.isArray(fieldData.displayUnits) &&
    fieldData.displayUnits.map((_unit, i) => (
      <Grid key={_unit} item xs={12} sm={6} md={6}>
        <Box display="flex">
          <Box flexGrow={1}>
            <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
              <TextField
                {...rest}
                variant="outlined"
                type="number"
                label={label + ' ' + _unit}
                name={name + '_' + _unit.toLowerCase()}
                required={required}
                value={values[name + '_' + _unit.toLowerCase()]}
                error={touched[name + '_' + _unit.toLowerCase()] && Boolean(errors[name + '_' + _unit.toLowerCase()])}
                helperText={touched[name + '_' + _unit.toLowerCase()] && errors[name + '_' + _unit.toLowerCase()]}
                ref={inputNumberRef}
                onChange={onChange ? onChange : (e) => handleConverterChange(name, _unit, parseFloat(e.target.value.replace(/[^0-9\.]/g, '')))}
                InputProps={{
                  inputProps: { min: 0 },
                  readOnly: fieldData && fieldData.isUneditable ? true : false
                }}
              />
            </InfoLabel>
          </Box>
          {i === 0 && fieldData.displayUnits.length !== fieldData.units.length && (
            <Box>
              <Tooltip title="Add Converter" className="formActionButton">
                <IconButton
                  onClick={() => {
                    setIsExtraDispayType(true);
                  }}
                  color="primary"
                  size="small"
                >
                  <SwapHorizIcon />
                </IconButton>
              </Tooltip>
              {(fieldData.leval === 'product-custom' ||
                fieldData.leval === 'product-builder-custom' ||
                fieldData.leval === 'price-builder-custom') && (
                  <Tooltip title="Remove">
                    <IconButton onClick={() => handleRemoveField(fieldData)} color="primary" size="small">
                      <HighlightOffIcon color="error" />
                    </IconButton>
                  </Tooltip>
                )}
              {isExtraDispayType && (
                <AddDisplayTypeDialog
                  handleAddDisplayType={handleAddDisplayType}
                  displayType="converter"
                  fieldData={fieldData}
                  handleClose={() => setIsExtraDispayType(false)}
                />
              )}
            </Box>
          )}
          {fieldData.fieldChanges && fieldData.fieldChanges.displayUnits && fieldData.fieldChanges.displayUnits.includes(_unit) && (
            <Box>
              <Tooltip title="Remove" className="formActionButton">
                <IconButton onClick={() => handleRemoveDisplayType('converter', fieldData, _unit)} color="primary" size="small">
                  <HighlightOffIcon color="error" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Grid>
    ))
  ) : type === 'currencyAmount' ? (
    fieldData.displayCurrency &&
    Array.isArray(fieldData.displayCurrency) &&
    fieldData.displayCurrency.map((_currency, i) =>
      fieldData.isConverter && fieldData.displayUnits.length ? (
        fieldData.displayUnits.map((_unit, j) => (
          <Grid key={_unit} item xs={12} sm={6} md={6}>
            <Box display="flex">
              <Box flexGrow={1}>
                <InfoLabel info={tooltipMessage} doNotShowInfoTooltip={doNotShowInfoTooltip} isTooltip={isTooltip}>
                  <TextField
                    {...rest}
                    variant="outlined"
                    //type="number"
                    label={label + ' ' + _currency + '/' + _unit}
                    name={name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()}
                    required={required}
                    value={values[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()] ?
                      values[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()].toLocaleString() :
                      values[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()]}
                    error={
                      touched[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()] &&
                      Boolean(errors[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()])
                    }
                    helperText={
                      touched[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()] &&
                      errors[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()]
                    }
                    ref={inputNumberRef}
                    onChange={
                      onChange
                        ? onChange
                        : (e) => {
                          if (e.target.value === '' || /^[0-9.,]+$/.test(e.target.value)) {
                            handleCurrencyChangeWithConverterChange(
                              name,
                              _currency,
                              _unit,
                              e.target.value === ''
                                ? 0
                                : e.target.value.slice(-1) === '.'
                                  ? e.target.value.replace(/,/g, '')
                                  : parseFloat(e.target.value.replace(/,/g, ''))
                            );
                          }
                        }
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {result(
                            find(getUniqueCurrencies(), function (obj) {
                              return obj.currencyCode === _currency;
                            }),
                            'symbolNative'
                          )}
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, max: 9999999999 },
                      readOnly: fieldData && fieldData.isUneditable ? true : false
                    }}
                  />
                </InfoLabel>
              </Box>
              {i === 0 && j === 0 && (
                <Box>
                  <Tooltip title="Add Currency" className="formActionButton">
                    <IconButton
                      onClick={() => {
                        setIsExtraDispayType(true);
                        setDisplayType('currency');
                      }}
                      color="primary"
                      size="small"
                    >
                      <CreditCardIcon />
                    </IconButton>
                  </Tooltip>
                  {(fieldData.leval === 'product-custom' ||
                    fieldData.leval === 'product-builder-custom' ||
                    fieldData.leval === 'price-builder-custom') && (
                      <Tooltip title="Remove">
                        <IconButton onClick={() => handleRemoveField(fieldData)} color="primary" size="small">
                          <HighlightOffIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    )}
                  {fieldData.displayUnits.length !== fieldData.units.length && (
                    <Tooltip title="Add Converter" className="formActionButton">
                      <IconButton
                        onClick={() => {
                          setIsExtraDispayType(true);
                          setDisplayType('converter');
                        }}
                        color="primary"
                        size="small"
                      >
                        <SwapHorizIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {isExtraDispayType && (
                    <AddDisplayTypeDialog
                      handleAddDisplayType={handleAddDisplayType}
                      displayType={displayType}
                      fieldData={fieldData}
                      handleClose={() => {
                        setIsExtraDispayType(false);
                        setDisplayType(null);
                      }}
                    />
                  )}
                </Box>
              )}
              {i === 0 && fieldData.fieldChanges && fieldData.fieldChanges.displayUnits && fieldData.fieldChanges.displayUnits.includes(_unit) && (
                <Box>
                  <Tooltip title="Remove" className="formActionButton">
                    <IconButton onClick={() => handleRemoveDisplayType('converter', fieldData, _unit)} color="primary" size="small">
                      <HighlightOffIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {j === 0 &&
                fieldData.fieldChanges &&
                fieldData.fieldChanges.displayCurrency &&
                fieldData.fieldChanges.displayCurrency.includes(_currency) && (
                  <Box>
                    <Tooltip title="Remove" className="formActionButton">
                      <IconButton onClick={() => handleRemoveDisplayType('currency', fieldData, _currency)} color="primary" size="small">
                        <HighlightOffIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
            </Box>
          </Grid>
        ))
      ) : (
        <Grid key={_currency} item xs={12} sm={6} md={6}>
          <Box display="flex">
            <Box flexGrow={1}>
              <InfoLabel info={tooltipMessage} doNotShowInfoTooltip={doNotShowInfoTooltip} isTooltip={isTooltip}>
                <TextField
                  {...rest}
                  variant="outlined"
                  //type="number"
                  label={label + ' ' + _currency}
                  name={name + '_' + _currency.toLowerCase()}
                  required={required}
                  value={values[name + '_' + _currency.toLowerCase()] ?
                    values[name + '_' + _currency.toLowerCase()].toLocaleString()
                    : values[name + '_' + _currency.toLowerCase()]}
                  error={touched[name + '_' + _currency.toLowerCase()] && Boolean(errors[name + '_' + _currency.toLowerCase()])}
                  helperText={touched[name + '_' + _currency.toLowerCase()] && errors[name + '_' + _currency.toLowerCase()]}
                  ref={inputNumberRef}
                  onChange={
                    onChange
                      ? onChange
                      : (e) => {
                        if (e.target.value === '' || /^[0-9.,]+$/.test(e.target.value)) {
                          if (fieldData.displayCurrency.length > 1) {
                            handleCurrencyChange(
                              name,
                              _currency,
                              e.target.value === ''
                                ? 0
                                : e.target.value.slice(-1) === '.'
                                  ? e.target.value.replace(/,/g, '')
                                  : parseFloat(e.target.value.replace(/,/g, ''))
                            );
                          } else {
                            handleChange(
                              name + '_' + _currency.toLowerCase(),
                              e.target.value === ''
                                ? 0
                                : e.target.value.slice(-1) === '.'
                                  ? e.target.value.replace(/,/g, '')
                                  : parseFloat(e.target.value.replace(/,/g, ''))
                            );
                          }
                        }
                      }
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {result(
                          find(getUniqueCurrencies(), function (obj) {
                            return obj.currencyCode === _currency;
                          }),
                          'symbolNative'
                        )}
                      </InputAdornment>
                    ),
                    inputProps: { min: 0 },
                    readOnly: fieldData && fieldData.isUneditable ? true : false
                  }}
                />
              </InfoLabel>
            </Box>
            {i === 0 && (
              <Box>
                <Tooltip title="Add Currency" className="formActionButton">
                  <IconButton
                    onClick={() => {
                      setIsExtraDispayType(true);
                    }}
                    color="primary"
                    size="small"
                  >
                    <CreditCardIcon />
                  </IconButton>
                </Tooltip>
                {(fieldData.leval === 'product-custom' ||
                  fieldData.leval === 'product-builder-custom' ||
                  fieldData.leval === 'price-builder-custom') && (
                    <Tooltip title="Remove">
                      <IconButton onClick={() => handleRemoveField(fieldData)} color="primary" size="small">
                        <HighlightOffIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  )}
                {isExtraDispayType && (
                  <AddDisplayTypeDialog
                    handleAddDisplayType={handleAddDisplayType}
                    displayType="currency"
                    fieldData={fieldData}
                    handleClose={() => setIsExtraDispayType(false)}
                  />
                )}
              </Box>
            )}
            {fieldData.fieldChanges && fieldData.fieldChanges.displayCurrency && fieldData.fieldChanges.displayCurrency.includes(_currency) && (
              <Box>
                <Tooltip title="Remove" className="formActionButton">
                  <IconButton onClick={() => handleRemoveDisplayType('currency', fieldData, _currency)} color="primary" size="small">
                    <HighlightOffIcon color="error" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Grid>
      )
    )
  ) : type === 'decimal' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="number"
        label={label}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        ref={inputNumberRef}
        onChange={
          onChange
            ? onChange
            : (e) => {
              handleChange(name, parseFloat(e.target.value));
            }
        }
        InputProps={{
          inputProps: { min: 0 },
          readOnly: fieldData && fieldData.isUneditable ? true : false
        }}
      />
    </InfoLabel>
  ) : type === 'currency' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        fullWidth
        value={
          currencyData.filter((data) => data.currencyCode === values[name]).length
            ? currencyData.filter((data) => data.currencyCode === values[name])[0]
            : ''
        }
        options={currencyData}
        getOptionLabel={(option: any) => (option ? `${option.currencyCode} - ${option.currencyName} - (${option.symbolNative})` : '')}
        getOptionSelected={(option: any, val) => option.currencyCode === val}
        onChange={onChange ? onChange : (e, val) => setFieldValue(name, val && val.currencyCode ? val.currencyCode : '')}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            name={name}
            label={getLabel(label)}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
          />
        )}
        renderOption={(option) => {
          const { currencyCode, currencyName, symbolNative } = option;
          return `${currencyCode} - ${currencyName} - (${symbolNative})`;
        }}
      // renderOption={(option) => {
      //   const { currencyCode, name, countryCode, symbolNative } = option;
      //   return (
      //     <Grid container alignItems="center">
      //       <Grid item>
      //         <Avatar
      //           variant="rounded"
      //           src={`https://lipis.github.io/flag-icon-css/flags/4x3/${countryCode.toLowerCase()}.svg`}
      //           style={{ marginRight: 20, width: "40px", height: "30px" }}
      //         />
      //       </Grid>
      //       <Grid item xs>
      //         <Typography>
      //           {currencyCode} ({symbolNative})
      //         </Typography>
      //         <Typography variant="body2" color="textSecondary">
      //           {name}
      //         </Typography>
      //       </Grid>
      //     </Grid>
      //   );
      // }}
      />
    </InfoLabel>
  ) : type === 'multiSelect' ? (
    <InfoLabel info={tooltipMessage} doNotShowInfoTooltip={doNotShowInfoTooltip} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        multiple
        freeSolo={!lookup}
        disableCloseOnSelect={true}
        options={option}
        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
        value={values[name] ? option.filter((data: any) => values[name].includes(data.optionValue)) : []}
        getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
        onChange={
          onChange
            ? onChange
            : (e, value: any, reason) => {
              if (setFieldValue) {
                if (!lookup) {
                  if (reason === 'clear') {
                    setFieldValue(name, []);
                  } else if (reason === 'remove-option' && values[name].length === 1) {
                    setFieldValue(name, []);
                  }
                  value.forEach((val) => {
                    if (typeof val === 'string' && /^[a-zA-Z ]*$/.test(val)) {
                      const newOption = {
                        order: option.length,
                        default: false,
                        optionLabel: val,
                        optionValue: val
                      }
                      
                      if (!option?.find(o => o?.optionValue.includes(val)) && (addAdditionalOption ||fieldData?.addAdditionalOption)) {
                        addFieldOption(newOption)
                        setOptionsList([...option, newOption]);
                      }
                      if (addAdditionalOption) {
                        setFieldValue(name, [...values[name], val]);
                      }
                    } else if (val && val.inputValue && /^[a-zA-Z ]*$/.test(val.inputValue)) {
                      const newOption = {
                        order: option.length,
                        default: false,
                        optionLabel: val.inputValue,
                        optionValue: val.inputValue
                      }
                      
                      if (!option?.find(o => o?.optionValue.includes(val)) && (addAdditionalOption ||fieldData?.addAdditionalOption)) {
                        addFieldOption(newOption)
                        setOptionsList([...option, newOption]);
                      }
                      if (addAdditionalOption) {
                        setFieldValue(name, [...values[name], val.inputValue]);
                      }
                    } else {
                      if (val) {
                        const newOption = {
                          ...val,
                          optionLabel: val.optionValue,
                        }
                        if (!option?.find(o => o?.optionValue.includes(val.optionValue)) && (addAdditionalOption ||fieldData?.addAdditionalOption)) {
                          addFieldOption(newOption)
                          setOptionsList([newOption, ...option]);
                        }

                        setFieldValue(name, value.filter(v => v.optionValue).map((val) => val.optionValue));
                      }
                    }
                  });
                } else {
                  setFieldValue(
                    name,
                    value.map((val) => val.optionValue)
                  );
                }
              }

            }
        }
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          if (params.inputValue !== '' && !option.find(o => o?.optionValue.includes(params.inputValue))
            && !lookup && (addAdditionalOption || fieldData?.addAdditionalOption)) {
            filtered.push({
              order: option.length,
              default: false,
              optionLabel: `Add "${params.inputValue}"`,
              optionValue: params.inputValue
            })
          }

          return filtered
        }}
        forcePopupIcon={true}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={getLabel(label)}
            name={name}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
            style={{ whiteSpace: 'nowrap' }}
          />
        )}
      />
    </InfoLabel>
  ) : type === 'switch' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <FormControlLabel
        control={
          values[name] ? (
            <RedSwitch name={name} checked={values[name]} onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.checked)} />
          ) : (
            <GreenSwitch name={name} checked={values[name]} onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.checked)} />
          )
        }
        label={getLabel(label)}
      />
    </InfoLabel>
  ) : type === 'checkBox' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <FormControlLabel
        control={
          <Checkbox
            required={required}
            name={name}
            checked={values[name]}
            onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.checked)}
            color="secondary"
          />
        }
        label={label}
      />
    </InfoLabel>
  ) : type === 'radio' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <FormControl component="fieldset" required={required}>
        <FormLabel component="legend">{label}</FormLabel>
        <RadioGroup aria-label="gender" name={name} value={values[name]} onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.value)}>
          {options.map((opt) => (
            <FormControlLabel key={opt.order} value={opt.optionLabel} control={<Radio />} label={opt.optionLabel} />
          ))}
        </RadioGroup>
      </FormControl>
    </InfoLabel>
  ) : type === 'location' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <Autocomplete
        {...rest}
        getOptionLabel={(option: any) => (typeof option === 'string' ? option : option.description)}
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
            label={getLabel(label)}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
          />
        )}
        renderOption={(option: any) => {
          const matches = option.structured_formatting.main_text_matched_substrings;
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
                    marginRight: theme.spacing(2)
                  }}
                />
              </Grid>
              <Grid item xs>
                {parts.map((part, index) => (
                  <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
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
  ) : type === 'imageUpload' ? (
    <Fragment>
      <Typography color="textSecondary">{label}</Typography>
      <Box display="flex" flexDirection="row" mt={1}>
        <Box position="relative">
          <Avatar src={values[name]} style={{ width: 70, height: 70 }} alt="org_logo" />
          <Box display="flex" justifyContent="center" alignItems="center" position="absolute" top="0" right="0" width="100%" height="100%">
            {isImgUploading && (
              <>
                <CircularProgress variant="determinate" value={imageUploadProgress} />
                <Box top={0} left={0} bottom={0} right={0} position="absolute" display="flex" alignItems="center" justifyContent="center">
                  <Typography variant="caption" component="div" color="textSecondary">{`${imageUploadProgress}%`}</Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>
        <Box>
          <label htmlFor={name}>
            <IconButton title="Add picture" color="primary" size="small" aria-label="upload picture" component="span">
              <AddCircleIcon />
              <input
                onClick={(e: any) => (e.target.value = null)}
                disabled={isImgUploading}
                id={name}
                name={name}
                onChange={handleUploadImage}
                accept="image/x-png,image/gif,image/jpeg"
                style={{
                  opacity: '0',
                  position: 'absolute',
                  zIndex: -1
                }}
                type="file"
              />
            </IconButton>
          </label>

          <IconButton
            disabled={Boolean(!values[name])}
            title="Remove picture"
            color="secondary"
            size="small"
            aria-label="delete picture"
            component="span"
            onClick={() => setFieldValue(name, '')}
          >
            <DeleteIcon />
          </IconButton>
          {isTooltip && Boolean(tooltipMessage) && (
            <IconButton size="small">
              <Tooltip title={tooltipMessage}>
                <InfoIcon color="disabled" />
              </Tooltip>
            </IconButton>
          )}
          <Box flex="1">
            <Typography
              variant="body2"
              className="text-truncate"
              style={{
                marginLeft: '4px',
                display: touched[name] && Boolean(errors[name]) ? '' : 'none'
              }}
              color={touched[name] && Boolean(errors[name]) ? 'error' : 'textPrimary'}
            >
              {touched[name] && Boolean(errors[name]) ? errors[name] : null}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Fragment>
  ) : type === 'fileUpload' ? (
    <Fragment>
      <Box display="flex" alignItems="center">
        {/* <Typography color="textSecondary">{label}</Typography> */}
        {isTooltip && Boolean(tooltipMessage) && (
          <IconButton size="small">
            <Tooltip title={tooltipMessage}>
              <InfoIcon color="disabled" />
            </Tooltip>
          </IconButton>
        )}
        <Box mr={1} />
        <input
          disabled={isFileUploading || !canEdit}
          id={name}
          name={name}
          onChange={handleUploadFile}
          style={{ display: 'none' }}
          onClick={(e: any) => (e.target.value = null)}
          type="file"
          accept={accept || documentUploadSupportExtensions}
          multiple={isMultipleUpload}
        />
        <label htmlFor={name}>
          <Button
            disabled={isFileUploading || !canEdit}
            variant="contained"
            color="primary"
            size="small"
            component="span"
            startIcon={isFileUploading && <CircularProgress size={15} />}
          >
            {isFileUploading ? 'Uploading File' : required ? 'Upload File *' : 'Upload File'}
          </Button>
        </label>
        {showErrorMessage ? (
          <>
            <Box ml={1} />
            <Box flex="1" className="text-truncate">
              <Typography variant="body2" className="text-truncate" color={'error'}>
                {touched[name] && Boolean(errors[name]) ? errors[name] || 'No file choosen' : null}
              </Typography>
            </Box>
          </>
        ) : null}
        {doNotShowUploadedFile ? null : (
          <>
            <Box ml={1} />

            <Box flex="1" className="text-truncate">
              <Typography variant="body2" className="text-truncate" color={touched[name] && Boolean(errors[name]) ? 'error' : 'textPrimary'}>
                {isFileUploading
                  ? `Uploading... ${fileUploadProgress}%`
                  : values[name]
                    ? values[name]
                    : touched[name] && Boolean(errors[name])
                      ? errors[name]
                      : 'No file choosen'}
              </Typography>
            </Box>
            {values[name] ? (
              <IconButton
                disabled={Boolean(!values[name])}
                title="Remove File"
                size="small"
                aria-label="delete picture"
                component="span"
                onClick={() => setFieldValue(name, '')}
              >
                <DeleteIcon color="error" />
              </IconButton>
            ) : null}
          </>
        )}
      </Box>
    </Fragment>
  ) : type === 'url' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <TextField
        {...rest}
        variant="outlined"
        type="url"
        label={getLabel(label)}
        required={required}
        name={name}
        value={values[name]}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
        onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.value)}
      />
    </InfoLabel>
  ) : type === 'date' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <MuiPickersUtilsProvider utils={DateUtils}>
        <KeyboardDatePicker
          {...rest}
          clearable
          required={required}
          variant="inline"
          inputVariant="outlined"
          value={values[name]}
          name={name}
          label={getLabel(label)}
          onChange={onChange ? onChange : (date) => setFieldValue(name, date ? date : '')}
          // onChange={(date) => setFieldValue(name, date ? date : "")}
          error={customError[name] || (touched[name] && Boolean(errors[name]))}
          helperText={customError[name] || (touched[name] && errors[name])}
          format={dateFormatForInputControl}
          InputLabelProps={{
            shrink: true
          }}
        />
      </MuiPickersUtilsProvider>
    </InfoLabel>
  ) : type === 'dateTime' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <MuiPickersUtilsProvider utils={DateUtils}>
        <KeyboardDateTimePicker
          {...rest}
          clearable
          required={required}
          variant="inline"
          inputVariant="outlined"
          ampm={false}
          value={values[name] || new Date('2018-01-01T00:00:00.000Z')}
          name={name}
          label={getLabel(label)}
          onChange={(date) => setFieldValue(name, date)}
          onError={console.log}
          disablePast
          format="yyyy/MM/dd HH:mm"
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          InputLabelProps={{
            shrink: true
          }}
        />
      </MuiPickersUtilsProvider>
    </InfoLabel>
  ) : type === 'year' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip}>
      <MuiPickersUtilsProvider utils={DateUtils}>
        <DatePicker
          {...rest}
          autoOk
          clearable
          required={required}
          variant="inline"
          inputVariant="outlined"
          value={values[name] || new Date()}
          name={name}
          label={getLabel(label)}
          views={['year']}
          onChange={(date) => setFieldValue(name, date)}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          InputLabelProps={{
            shrink: true
          }}
        />
      </MuiPickersUtilsProvider>
    </InfoLabel>
  ) : null;
};

export default FormTypes;

import React, { Fragment, useContext, useEffect, useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
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
  Typography,
  useTheme,
  Dialog,
  ImageList,
  ImageListItem,
  ImageListItemBar, makeStyles,
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
import { handleAutoCalculation, optionConverter } from '../../constants/formulaUtility';
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
import AddDisplayTypeDialog from '../productBuilder/AddDisplayTypeDialog';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import CreditCardIcon from '@material-ui/icons/CreditCard';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import HtmlTooltip from '../CustomTooltipTitle';
import ImageCropTool from '../ImageCropTool';


const filter = createFilterOptions();

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

const autocompleteService = { current: null };

const useStyles = makeStyles(() => ({
  noBorder: {
    border: "none",
  },
}));
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

const AddOptionDialog = ({ addFieldOption, options, setOptions, setOpen }) => {
  //const [values, setValues] = React.useState([]);
  const [inputVal, setInputVal] = React.useState("")
  const [error, setError] = React.useState(null)

  const handleChange = (val) => {
    val = val.trimStart()
    setInputVal(val)

    if (error) {
      setError(null)
    }
  }

  const onSave = () => {
    const val = inputVal.trimEnd().toLowerCase()

    const foundSame = options.find(o => o.optionLabel.toLowerCase() === val) || null;
    if (foundSame) {
      setError(`"${val}" already exists in the options`)
    } else {
      setError(null)
      const order = options.length
      const newOption = { order: order, default: false, optionLabel: inputVal, optionValue: inputVal }
      addFieldOption([newOption])
      setOptions([...options, newOption])
      setOpen(false)
    }
  }

  return (
    <div>
      <Dialog fullWidth maxWidth="sm" open keepMounted onClose={() => setOpen(false)}>
        <CustomDialogHeader onClose={() => setOpen(false)} title="Add New Option" />
        <CustomDialogContent>
          <TextField
            size="small"
            fullWidth
            value={inputVal}
            onChange={(event) => handleChange(event.target.value)}
            variant="outlined"
            label="Options"
            style={{ whiteSpace: 'nowrap' }}
            margin="dense"
            placeholder="New Option"
            error={Boolean(error)}
            helperText={error}
          />
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button variant="outlined" color="primary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={!Boolean(inputVal)} color="primary" onClick={onSave}>
            Save
          </Button>
        </CustomDialogFooter>
      </Dialog>
    </div>
  );
};

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
    isWarningTooltip,
    warningTooltipMessage,
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

  const [image, setImage] = React.useState<any>("");
  const [imageFileName, setImageFileName] = React.useState<any>("");
  const [readingImage, setReadingImage] = React.useState<any>(false);
  const [optionsList, setOptions] = React.useState([]);
  const [option, setOptionsList] = React.useState([]);
  const [optionSaveDialog, setOptionSaveDialog] = React.useState(false);
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

  useEffect(() => {
    setOptionsList(options);
  }, [options]);

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
  const getImageUrl = (file, multiple = null) => {
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
        if (!multiple) {
          setFieldValue(name, data.fileUrl);
        } else {
          if (values[name]) {
            setImage("")
            setFieldValue(name, [...values[name], data.fileUrl]);
            setImageFileName("")
          } else {
            let currentData = values[name] ? values[name] : []
            setImage("")
            setFieldValue(name, [...currentData, data.fileUrl]);
            setImageFileName("")
          }
        }
        setImgUploading(false);
      })
      .catch((err) => {
        if (multiple) {
          setImage("")
          setImageFileName("")
        }
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
    if (fieldData && fieldData.isDependentDropdown) {
      if (Array.isArray(optionData)) {
        optionData[0][fieldData.dropdowDependentOn] = values[fieldData.dropdowDependentOn];
      }
      else {
        optionData[fieldData.dropdowDependentOn] = values[fieldData.dropdowDependentOn];
      }
    }
    const data = {
      _id: productTemplateId || priceTemplateId ? fieldData._id : fieldData ? fieldData._id : fieldId,
      option: Array.isArray(optionData) ? optionData : [optionData]
    };
    if (productTemplateId && priceTemplateId) {
      data['productTemplate'] = productTemplateId;
      data['priceTemplate'] = productTemplateId;
    } else if (!priceTemplateId && productTemplateId) {
      data['productTemplate'] = productTemplateId;
    } else if (priceTemplateId && !productTemplateId) {
      data['priceTemplate'] = priceTemplateId;
    }
    axiosInstance().post('field/add-field-option', data);
  };

  const readImageFile = (e) => {
    setReadingImage(true)
    const file = e.target.files[0];
    setImageFileName(file.name.toString().split('.')[0])
    let reader = new FileReader();


    reader.onload = async (e) => {
      const result = await e.target?.result
      setImage(result);
      setReadingImage(false)
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  }

  const removeImage = (img) => {
    const updatedArr = values[name].filter((i) => i !== img);
    setFieldValue(name, updatedArr);
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
          //setFieldValue(_fieldName, 0);
        } else {
          let _fieldName = field.fieldName + '_' + displayValue.toLowerCase();
          setFieldValue(_fieldName, 0);
        }
      } else if (displayType === 'converter') {
        field.displayUnits = field.displayUnits.filter((e) => e !== displayValue);
        let _fieldName = field.fieldName + '_' + displayValue.toLowerCase();
        //setFieldValue(_fieldName, 0);
      }
      removeDisplayType(displayType, field, displayValue);
    }
  };

  return type === 'singleLine' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
              handleChange(name, e.target.value ? parseFloat(e.target.value) : 0);
            }
        }
      />
    </InfoLabel>
  ) : type === 'formula' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
      <MuiPhoneInput
        {...rest}
        defaultCountry={'us'}
        disableAreaCodes
        countryCodeEditable
        variant="outlined"
        required={required}
        label={getLabel(label)}
        name={name}
        value={values[name]}
        onChange={onChange ? onChange : (val) => {
          if (val === '+') {
            setFieldValue(name, "")
          } else {
            setFieldValue(name, val)
          }

        }}
        error={touched[name] && Boolean(errors[name])}
        helperText={touched[name] && errors[name]}
      />
    </InfoLabel>
  ) : type === 'freeStyleMultiSelect' ? (
    <InfoLabel info={tooltipMessage} doNotShowInfoTooltip={doNotShowInfoTooltip} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
      <Autocomplete
        {...rest}
        multiple
        disableCloseOnSelect={true}
        freeSolo
        options={[]}
        renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            margin="dense"
            label={getLabel(label)}
            name={name}
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            required={required}
          />
        )}
        value={values[name]}
        onBlur={(e: any) => {
          if (e.target.value && e.target.value.trim() !== '') {
            setFieldValue(name, [...values[name], e.target.value]);
          }
        }}
        onChange={(e, value: any) => {
          let valuesToInsert = [];
          for (var val of value) {
            if (val && val.trim() !== '') {
              valuesToInsert.push(val);
            }
          }
          setFieldValue(name, valuesToInsert);
        }}
      />
    </InfoLabel>
  ) : type === 'dropDown' || type === 'lookup' || (type === 'vlookupDropdown' && fieldData && fieldData.isvlookupReverse) ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage} doNotShowInfoTooltip={doNotShowInfoTooltip}>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={!lookup && (addAdditionalOption || fieldData?.addAdditionalOption) ? 10 : 12}>
          <Autocomplete
            {...rest}
            options={fieldData && fieldData.isDependentDropdown ?
              option.filter((_f) => _f[fieldData.dropdowDependentOn] === values[fieldData.dropdowDependentOn]) :
              option}
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
                        };

                        if (!option?.find((o) => o?.optionValue.includes(val)) && (addAdditionalOption || fieldData?.addAdditionalOption)) {
                          addFieldOption(newOption);
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
                        };
                        if (
                          !option?.find((o) => o?.optionValue.includes(val.inputValue)) &&
                          (addAdditionalOption || fieldData?.addAdditionalOption)
                        ) {
                          setOptionsList([...option, newOption]);
                          addFieldOption(newOption);
                        }
                        if (addAdditionalOption) {
                          handleChange(name, val.inputValue);
                        }
                      } else {
                        if (val) {
                          const newOption = {
                            ...val,
                            optionLabel: val.optionValue
                          };
                          if (
                            !option?.find((o) => o?.optionValue.includes(val.optionValue)) &&
                            (addAdditionalOption || fieldData?.addAdditionalOption)
                          ) {
                            addFieldOption(newOption);
                            setOptionsList([newOption, ...option]);
                          }
                          handleChange(name, val && val.optionValue ? val.optionValue : '');
                        }
                        //  This else was not there, so In budget create dialog if I was removing the selected dropdown value, the value did not get clear
                        else {
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

              if (
                params.inputValue !== '' &&
                !option.find((o) => o?.optionValue.includes(params.inputValue)) &&
                !lookup &&
                (addAdditionalOption || fieldData?.addAdditionalOption)
              ) {
                filtered.push({
                  order: option.length,
                  default: false,
                  optionLabel: `Add "${params.inputValue}"`,
                  optionValue: params.inputValue
                });
              }

              return filtered;
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
                style={{ outline: "1px solid white" }}
                error={touched[name] && Boolean(errors[name])}
                helperText={touched[name] && errors[name]}
                required={required}



              />
            )}
          />
        </Grid>
        {!lookup && (addAdditionalOption || fieldData?.addAdditionalOption) && (
          <Grid item xs={2}>
            <IconButton onClick={() => setOptionSaveDialog(true)} size="small" color="primary">
              <AddCircleIcon />
            </IconButton>

            {optionSaveDialog && <AddOptionDialog addFieldOption={addFieldOption} options={option} setOptions={setOptionsList} setOpen={setOptionSaveDialog} />}
          </Grid>
        )}
      </Grid>
    </InfoLabel>
  ) : type === 'vlookupDropdown' && fieldData && !fieldData.isvlookupReverse ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
            <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
              {fieldData.isDropdown ?
                <Autocomplete
                  {...rest}
                  options={optionConverter(option, fieldData.units, fieldData.unitoption, fieldData.dropdownOnConverter, _unit)}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  getOptionSelected={(option: any, val) => option.optionValue === val}
                  value={
                    optionConverter(option, fieldData.units, fieldData.unitoption, fieldData.dropdownOnConverter, _unit)
                      .filter((data) => data.optionValue.toString() === values[name + '_' + _unit.toLowerCase()]?.toString()).length
                      ? optionConverter(option, fieldData.units, fieldData.unitoption, fieldData.dropdownOnConverter, _unit)
                        .filter((data) => data.optionValue.toString() === values[name + '_' + _unit.toLowerCase()]?.toString())[0] : ''
                  }
                  onChange={onChange ? onChange : (e, val) =>
                    handleConverterChange(name, _unit, val && parseFloat(val.optionValue))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      name={name + '_' + _unit.toLowerCase()}
                      label={label + ' ' + _unit}
                      variant="outlined"
                      error={touched[name + '_' + _unit.toLowerCase()] && Boolean(errors[name + '_' + _unit.toLowerCase()])}
                      helperText={touched[name + '_' + _unit.toLowerCase()] && errors[name + '_' + _unit.toLowerCase()]}
                      required={required}
                    />
                  )}
                />
                : <TextField
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
                  onChange={onChange ? onChange : (e) => handleConverterChange(name, _unit,
                    e.target.value === "" ? "" : parseFloat(e.target.value.replace(/[^0-9\.]/g, '')))}
                  InputProps={{
                    inputProps: { min: 0 },
                    readOnly: fieldData && fieldData.isUneditable ? true : false
                  }}
                />
              }
            </InfoLabel>
          </Box>
          {i === 0 && fieldData.displayUnits.length !== fieldData.units.length && (
            <Box>
              <HtmlTooltip title="Add Converter" className="formActionButton">
                <IconButton
                  onClick={() => {
                    setIsExtraDispayType(true);
                  }}
                  color="primary"
                  size="small"
                >
                  <SwapHorizIcon />
                </IconButton>
              </HtmlTooltip>
              {(fieldData.leval === 'product-custom' ||
                fieldData.leval === 'product-builder-custom' ||
                fieldData.leval === 'price-builder-custom') && (
                  <HtmlTooltip title="Remove">
                    <IconButton onClick={() => handleRemoveField(fieldData)} color="primary" size="small">
                      <HighlightOffIcon color="error" />
                    </IconButton>
                  </HtmlTooltip>
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
              <HtmlTooltip title="Remove" className="formActionButton">
                <IconButton onClick={() => handleRemoveDisplayType('converter', fieldData, _unit)} color="primary" size="small">
                  <HighlightOffIcon color="error" />
                </IconButton>
              </HtmlTooltip>
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
                <InfoLabel info={tooltipMessage} doNotShowInfoTooltip={doNotShowInfoTooltip} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
                  <TextField
                    {...rest}
                    variant="outlined"
                    //type="number"
                    label={label + ' ' + _currency + '/' + _unit}
                    name={name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()}
                    required={required}
                    value={
                      values[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()]
                        ? values[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()].toLocaleString()
                        : values[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()]
                    }
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
                  <HtmlTooltip title="Add Currency" className="formActionButton">
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
                  </HtmlTooltip>
                  {(fieldData.leval === 'product-custom' ||
                    fieldData.leval === 'product-builder-custom' ||
                    fieldData.leval === 'price-builder-custom') && (
                      <HtmlTooltip title="Remove">
                        <IconButton onClick={() => handleRemoveField(fieldData)} color="primary" size="small">
                          <HighlightOffIcon color="error" />
                        </IconButton>
                      </HtmlTooltip>
                    )}
                  {fieldData.displayUnits.length !== fieldData.units.length && (
                    <HtmlTooltip title="Add Converter" className="formActionButton">
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
                    </HtmlTooltip>
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
                  <HtmlTooltip title="Remove" className="formActionButton">
                    <IconButton onClick={() => handleRemoveDisplayType('converter', fieldData, _unit)} color="primary" size="small">
                      <HighlightOffIcon color="error" />
                    </IconButton>
                  </HtmlTooltip>
                </Box>
              )}
              {j === 0 &&
                fieldData.fieldChanges &&
                fieldData.fieldChanges.displayCurrency &&
                fieldData.fieldChanges.displayCurrency.includes(_currency) && (
                  <Box>
                    <HtmlTooltip title="Remove" className="formActionButton">
                      <IconButton onClick={() => handleRemoveDisplayType('currency', fieldData, _currency)} color="primary" size="small">
                        <HighlightOffIcon color="error" />
                      </IconButton>
                    </HtmlTooltip>
                  </Box>
                )}
            </Box>
          </Grid>
        ))
      ) : (
        <Grid key={_currency} item xs={12} sm={6} md={6}>
          <Box display="flex">
            <Box flexGrow={1}>
              <InfoLabel info={tooltipMessage} doNotShowInfoTooltip={doNotShowInfoTooltip} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
                <TextField
                  {...rest}
                  variant="outlined"
                  //type="number"
                  label={label + ' ' + _currency}
                  name={name + '_' + _currency.toLowerCase()}
                  required={required}
                  value={
                    values[name + '_' + _currency.toLowerCase()]
                      ? values[name + '_' + _currency.toLowerCase()].toLocaleString()
                      : values[name + '_' + _currency.toLowerCase()]
                  }
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
                {fieldData.hideConverter ? null :
                  <HtmlTooltip title="Add Currency" className="formActionButton">
                    <IconButton
                      onClick={() => {
                        setIsExtraDispayType(true);
                      }}
                      color="primary"
                      size="small"
                    >
                      <CreditCardIcon />
                    </IconButton>
                  </HtmlTooltip>
                }
                {(fieldData.leval === 'product-custom' ||
                  fieldData.leval === 'product-builder-custom' ||
                  fieldData.leval === 'price-builder-custom') && (
                    <HtmlTooltip title="Remove">
                      <IconButton onClick={() => handleRemoveField(fieldData)} color="primary" size="small">
                        <HighlightOffIcon color="error" />
                      </IconButton>
                    </HtmlTooltip>
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
                <HtmlTooltip title="Remove" className="formActionButton">
                  <IconButton onClick={() => handleRemoveDisplayType('currency', fieldData, _currency)} color="primary" size="small">
                    <HighlightOffIcon color="error" />
                  </IconButton>
                </HtmlTooltip>
              </Box>
            )}
          </Box>
        </Grid>
      )
    )
  ) : type === 'decimal' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
              handleChange(name, e.target.value === "" ? "" : parseFloat(e.target.value));
            }
        }
        InputProps={{
          inputProps: { min: 0 },
          readOnly: fieldData && fieldData.isUneditable ? true : false
        }}
      />
    </InfoLabel>
  ) : type === 'currency' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} doNotShowInfoTooltip={doNotShowInfoTooltip} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={!lookup && (addAdditionalOption || fieldData?.addAdditionalOption) ? 10 : 12}>
          <Autocomplete
            {...rest}
            multiple
            freeSolo={!lookup}
            disableCloseOnSelect={true}
            options={fieldData && fieldData.isDependentDropdown ?
              option.filter((_f) => _f[fieldData.dropdowDependentOn] === values[fieldData.dropdowDependentOn]) :
              //  Some times for resource dropdown we are not getting optionLabel, and multi-select breaks
              option.filter(f => f.optionLabel)}
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
                          };

                          if (!option?.find((o) => o?.optionValue.includes(val)) && (addAdditionalOption || fieldData?.addAdditionalOption)) {
                            addFieldOption(newOption);
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
                          };

                          if (!option?.find((o) => o?.optionValue.includes(val)) && (addAdditionalOption || fieldData?.addAdditionalOption)) {
                            addFieldOption(newOption);
                            setOptionsList([...option, newOption]);
                          }
                          if (addAdditionalOption) {
                            setFieldValue(name, [...values[name], val.inputValue]);
                          }
                        } else {
                          if (val) {
                            const newOption = {
                              ...val,
                              optionLabel: val.optionValue
                            };
                            if (
                              !option?.find((o) => o?.optionValue.includes(val.optionValue)) &&
                              (addAdditionalOption || fieldData?.addAdditionalOption)
                            ) {
                              addFieldOption(newOption);
                              setOptionsList([newOption, ...option]);
                            }

                            setFieldValue(
                              name,
                              value.filter((v) => v.optionValue).map((val) => val.optionValue)
                            );
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

              if (
                params.inputValue !== '' &&
                !option.find((o) => o?.optionValue.includes(params.inputValue)) &&
                !lookup &&
                (addAdditionalOption || fieldData?.addAdditionalOption)
              ) {
                filtered.push({
                  order: option.length,
                  default: false,
                  optionLabel: `Add "${params.inputValue}"`,
                  optionValue: params.inputValue
                });
              }

              return filtered;
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
        </Grid>
        {!lookup && (addAdditionalOption || fieldData?.addAdditionalOption) && (
          <Grid item xs={2}>
            <IconButton onClick={() => setOptionSaveDialog(true)} size="small" color="primary">
              <AddCircleIcon />
            </IconButton>
            {optionSaveDialog && <AddOptionDialog addFieldOption={addFieldOption} options={option} setOptions={setOptionsList} setOpen={setOptionSaveDialog} />}
          </Grid>
        )}
      </Grid>
    </InfoLabel>
  ) : type === 'switch' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
      <FormControlLabel
        control={
          <Checkbox
            {...rest}
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
          const matches = option.structured_formatting.main_text_matched_substrings || [];
          const parts = parse(
            option.structured_formatting.main_text,
            matches?.map((match) => [match.offset, match.offset + match.length])
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
                {parts?.map((part, index) => (
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
            className={Boolean(!values[name]) ? "" : "errorColor"}
            size="small"
            aria-label="delete picture"
            component="span"
            onClick={() => setFieldValue(name, '')}
          >
            <DeleteIcon />
          </IconButton>
          {isTooltip && Boolean(tooltipMessage) && (
            <IconButton size="small">
              <HtmlTooltip title={tooltipMessage}>
                <InfoIcon color="disabled" />
              </HtmlTooltip>
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
            <HtmlTooltip title={tooltipMessage}>
              <InfoIcon color="disabled" />
            </HtmlTooltip>
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
        onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.value.trim())}
      />
    </InfoLabel>
  ) : type === 'date' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
      <MuiPickersUtilsProvider utils={DateUtils}>
        <KeyboardDatePicker
          {...rest}
          clearable
          autoOk
          required={required}
          variant="inline"
          inputVariant="outlined"
          value={values[name]}
          name={name}
          label={getLabel(label)}
          onChange={onChange ? onChange : (date) => handleChange(name, date ? date : '')}
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
      <MuiPickersUtilsProvider utils={DateUtils}>
        <KeyboardDateTimePicker
          {...rest}
          autoOk
          clearable
          required={required}
          variant="inline"
          inputVariant="outlined"
          ampm={false}
          value={values[name] || new Date('2018-01-01T00:00:00.000Z')}
          name={name}
          label={getLabel(label)}
          onChange={(date) => setFieldValue(name, date)}
          onError={console.error}
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
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
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
  ) : type === 'colorPicker' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
      <Box display="flex" alignItems="center">
        <Typography color="textSecondary">{label}</Typography>
        <Box ml={2} display='flex' alignContent="center">
          <input type="color" name={name} value={values[name]} onChange={(e) => setFieldValue(name, e.target.value)} />
        </Box>
      </Box>
      {touched[name] && Boolean(errors[name]) && (
        <Typography variant="caption" color='error'>
          {errors[name]}
        </Typography>)
      }
    </InfoLabel>
  ) : type === 'multiImageUpload' ? (
    <InfoLabel info={tooltipMessage} isTooltip={isTooltip} warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip} warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}>
      <Typography color="textSecondary">{label}</Typography>
      <input
        accept="image/*"
        style={{ display: "none" }}
        id="multiple-images-button"
        multiple
        type="file"
        onChange={readImageFile}
      />
      <label htmlFor="multiple-images-button">
        <Button disabled={readingImage} variant="contained" color="primary" component="span">
          Upload
        </Button>
      </label>
      <Box mt={1}>
        <Typography color="textSecondary">{values[name]?.length > 0 ? "Images Preview" : "No Images"}</Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="space-arounf" overflow="hidden">
          <ImageList style={{ flexWrap: "nowrap", transform: 'translateZ(0)' }}>
            {values[name] ? values[name].map((item, i) => (
              <ImageListItem style={{ height: '100px', width: "33.3%" }} key={item}>
                <img src={item} alt={`demo ${i + 1}`} />
                <ImageListItemBar
                  title={''}
                  actionIcon={
                    <IconButton onClick={() => removeImage(item)} aria-label={`demo ${i + 1}`}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  }
                />
              </ImageListItem>
            )) : null}
          </ImageList>
        </Box>
      </Box>
      <Dialog fullWidth maxWidth="md" open={Boolean(image) || isImgUploading} onClose={() => {
        if (!isImgUploading) {
          setImage("")
        }
      }}>
        <CustomDialogHeader onClose={() => {
          if (!isImgUploading) {
            setImage("")
          }
        }} title="Edit Image" />
        <CustomDialogContent>
          <ImageCropTool
            image={image}
            setImage={setImage}
            getImageUrl={getImageUrl}
            isImgUploading={isImgUploading}
            imageUploadProgress={imageUploadProgress}
            imageFileName={imageFileName}
          />
        </CustomDialogContent>
      </Dialog>
    </InfoLabel>
  ) : null;
};

export default FormTypes;

import { Image } from '@mui/icons-material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid2';
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import InputAdornment from '@mui/material/InputAdornment';
import parse from 'autosuggest-highlight/parse';
import { find, isArray, result, throttle } from 'lodash';
import MuiPhoneInput from 'material-ui-phone-number';
import React, { Fragment, useContext, useEffect, useRef } from 'react';
import NumberFormat from 'react-number-format';
import GroupSignature from 'src/components/Helpers/FormTypes/GroupSignature';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { handleAutoCalculation, optionConverter } from '../../constants/formulaUtility';
import {
  checkValue,
  CustomDialogTransition,
  documentUploadMaxSize,
  documentUploadSupportExtensions,
  formatAmountWithCurrency,
  getUniqueCurrencies,
  imageUploadMaxSize
} from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../CustomTooltipTitle';
import { LOGIC } from '../FormBuilder/helper';
import ImageCropTool from '../ImageCropTool';
import AddDisplayTypeDialog from '../productBuilder/AddDisplayTypeDialog';
import Counter from './FormTypes/Counter';
import DataList from './FormTypes/DataList';
import Description from './FormTypes/Description';
import Dropdown from './FormTypes/Dropdown';
import RichTextEditor from './FormTypes/RichTextEditor';
import Signature from './FormTypes/Signature';
import CustomDateTimePicker from 'src/components/CustomDateTimePicker';
import CustomDatePicker from 'src/components/CustomDatePicker';
import CurrencyAutocomplete from './CurrencyAutocomplete';

type MultiFileType = {
  fileName: string;
  size: string | number;
};
type ReturnMultiFileType = string | void | MultiFileType;

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

const InfoLabel = ({ children, info, isTooltip, doNotShowInfoTooltip = false, warningMessage, warningTooltip }) => (
  <div className="form-types">
    {isTooltip && info ? (
      <Grid container spacing={1}>
        <Grid style={{ flexGrow: 1 }}>
          {children}
          {warningTooltip && (
            <Box ml={1}>
              <Typography variant="caption" color="secondary">
                {warningMessage}
              </Typography>
            </Box>
          )}
        </Grid>
        <Grid>
          <Box>
            <HtmlTooltip title={<Typography>{info}</Typography>}>
              <InfoIcon color="disabled" />
            </HtmlTooltip>
          </Box>
        </Grid>
      </Grid>
    ) : doNotShowInfoTooltip ? (
      <>
        {children}
        {warningTooltip && (
          <Box ml={1}>
            <Typography variant="caption" color="secondary">
              {warningMessage}
            </Typography>
          </Box>
        )}
      </>
    ) : (
      <Grid container spacing={1} alignItems="center">
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          {children}
          {warningTooltip && (
            <Box ml={1}>
              <Typography variant="caption" color="secondary">
                {warningMessage}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    )}
  </div>
);

const autocompleteService = { current: null };

const AddOptionDialog = ({ addFieldOption, options, setOptions, setOpen, label, name, handleChange, isMultiple = false, values }) => {
  const [inputVal, setInputVal] = React.useState('');
  const [error, setError] = React.useState(null);

  const handleChangeText = (val) => {
    val = val.trimStart();
    setInputVal(val);

    if (error) {
      setError(null);
    }
  };

  const onSave = () => {
    const val = inputVal.trimEnd().toLowerCase();
    const foundSame = options.find((o) => o.optionLabel.toLowerCase() === val) || null;
    if (foundSame) {
      setError(`"${val}" already exists in the options`);
    } else {
      setError(null);
      const order = options.length;
      const newOption = { order: order, default: false, optionLabel: inputVal, optionValue: inputVal };
      addFieldOption([newOption]);
      setOptions([...options, newOption]);
      handleChange(name, isMultiple ? [...values[name], inputVal] : inputVal);
      setOpen(false);
    }
  };

  return (
    <div>
      <Dialog TransitionComponent={CustomDialogTransition} fullWidth maxWidth="sm" open keepMounted onClose={() => setOpen(false)}>
        <CustomDialogHeader onClose={() => setOpen(false)} title={'Add New ' + label} />
        <CustomDialogContent>
          <TextField
            size="small"
            fullWidth
            value={inputVal}
            onChange={(event) => handleChangeText(event.target.value)}
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
          <ThemeButton buttonType="transparent" onClick={() => setOpen(false)}>
            Cancel
          </ThemeButton>
          <ThemeButton buttonType="theme" disabled={!Boolean(inputVal)} onClick={onSave}>
            Save
          </ThemeButton>
        </CustomDialogFooter>
      </Dialog>
    </div>
  );
};

export const isSectionVisible = (section, fieldsData, values, fromDetailsPage = false) => {
  let fieldData = section?.sectionFields?.find((field) => field?.sectionProperties?.visibilityCondition?.length > 0);
  if (fromDetailsPage) {
    const newData = section?.sectionFields?.find((field) => field?.fieldData?.sectionProperties?.visibilityCondition?.length > 0);
    fieldData = newData ? newData.fieldData : undefined;
  }
  if (fieldData) {
    let visible = false;
    let show = true;
    fieldData?.sectionProperties?.visibilityCondition?.forEach((condition, i) => {
      if (condition?.logic === LOGIC.AND) {
        condition?.fields?.forEach((field) => {
          if (field?.fieldName && field?.value) {
            if (!checkValue(fieldsData, field?.fieldName, values[field?.fieldName], field?.value)) {
              show = false;
              return;
            }
          }
        });
      } else if (condition?.logic === LOGIC.OR) {
        let count = 0;
        condition?.fields?.forEach((field) => {
          if (field?.fieldName && field?.value) {
            if (checkValue(fieldsData, field?.fieldName, values[field?.fieldName], field?.value)) {
              return;
            } else {
              count = count + 1;
            }
          }
        });

        if (count === condition?.fields?.length) {
          show = false;
        }
      }
      if (!show) {
        visible = false;
        return;
      }
      if (i === fieldData?.sectionProperties?.visibilityCondition?.length - 1) {
        visible = show;
      }
    });
    return visible;
  }
  return true;
};

export const isFieldVisible = (fieldData, fields, values) => {
  if (fieldData?.visibilityCondition?.length > 0) {
    let visible = false;
    let show = true;
    fieldData?.visibilityCondition?.forEach((condition, i) => {
      if (condition?.logic === LOGIC.AND) {
        condition?.fields?.forEach((field) => {
          if (field?.fieldName && field?.value) {
            if (!checkValue(fields, field?.fieldName, values[field?.fieldName], field?.value)) {
              show = false;
              return;
            }
          }
        });
      } else if (condition?.logic === LOGIC.OR) {
        let count = 0;
        condition?.fields?.forEach((field) => {
          if (field?.fieldName && field?.value) {
            if (checkValue(fields, field?.fieldName, values[field?.fieldName], field?.value)) {
              return;
            } else {
              count = count + 1;
            }
          }
        });

        if (count === condition?.fields?.length) {
          show = false;
        }
      }

      if (!show) {
        visible = false;
        return;
      }

      if (i === fieldData?.visibilityCondition?.length - 1) {
        visible = show;
      }
    });
    return visible;
  }
  return true;
};

const FormTypes = (props) => {
  const theme = useTheme();
  const tempProps = {
    ...props,
    id: props.id ? props.id : props.label ? `field-${props.label.toLowerCase().split(' ').join('-')}` : 'custom-field',
    dataType: props.type
  };
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
    selectedCurrencyCode = null,
    setFields,
    fromFilter = false,
    ...rest
  } = tempProps;

  const [image, setImage] = React.useState<any>('');
  const [imageFileName, setImageFileName] = React.useState<any>('');
  const [readingImage, setReadingImage] = React.useState<any>(false);
  const [optionsList, setOptions] = React.useState([]);
  const [option, setOptionsList] = React.useState([]);
  const [optionSaveDialog, setOptionSaveDialog] = React.useState(false);
  const [value, setValue] = React.useState(null);
  const [isImgUploading, setImgUploading] = React.useState(false);
  const [isFileUploading, setFileUploading] = React.useState(false);
  const [fileUploadProgress, setFileUploadProgress] = React.useState(0);
  const [imageUploadProgress, setImageUploadProgress] = React.useState(0);
  const { setToastConfig } = useContext(CustomToastContext);

  const [isExtraDispayType, setIsExtraDispayType] = React.useState(false);
  const [displayType, setDisplayType] = React.useState(null);

  const inputNumberRef = useRef(null);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    setOptionsList(options);
  }, [options]);

  const [allFields, setAllFields] = React.useState(fields);

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
    let active = true;
    if (type === 'location' || type === 'gpsLocation') {
      if (!autocompleteService.current && window.google) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      if (!autocompleteService.current) {
        return undefined;
      }
      if (type === 'gpsLocation') {
        if (!values[name] || values[name]?.locationName === '') {
          return undefined;
        }
        fetch({ input: values[name]?.locationName }, (results) => {
          if (active) {
            setOptions(results ?? []);
          }
        });
      } else {
        if (values[name] === '') {
          return undefined;
        }
        fetch({ input: values[name] }, (results) => {
          if (active) {
            setOptions(results ?? []);
          }
        });
      }
    }
    return () => {
      active = false;
    };
  }, [type, values[name], fetch]);

  const fetchPlaceDetails = (placeId) => {
    return new Promise((resolve, reject) => {
      if (!window.google) return reject({});

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));

      service.getDetails({ placeId }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
          const locationData = {
            locationName: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          };
          resolve(locationData);
        } else {
          reject({});
        }
      });
    });
  };

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

  const handleUploadFile = async (ev, isMultiple = false) => {
    if (ev.target.files && ev.target.files.length) {
      let files = ev.target.files;

      let urls: any = values[name] ? values[name] : [];

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
        let url: ReturnMultiFileType;
        try {
          url = await getFileUrl(file, isMultiple);
        } catch (error) {
          setToastConfig({
            open: true,
            type: 'error',
            message: error.message
          });
        }
        if (!url) return;
        if (isMultiple) {
          urls.push(url);
        } else {
          urls = url;
        }
      }
      setFieldValue(name, urls);
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
            setImage('');
            setFieldValue(name, [...values[name], data.fileUrl]);
            setImageFileName('');
          } else {
            let currentData = values[name] ? values[name] : [];
            setImage('');
            setFieldValue(name, [...currentData, data.fileUrl]);
            setImageFileName('');
          }
        }
        setImgUploading(false);
      })
      .catch((err) => {
        if (multiple) {
          setImage('');
          setImageFileName('');
        }
        setImgUploading(false);
        setToastConfig(err);
        setImageUploadProgress(0);
        if (imageOrFileUploadCompletePercentage) {
          imageOrFileUploadCompletePercentage(0);
        }
      });
  };

  // const getFileUrl = (file, isMultiple = false) => {
  //   setFileUploadProgress(0);
  //   let formData = new FormData();
  //   formData.append('file', file);
  //   setFileUploading(true);
  //   let uploadUrl = usePublicUrlforFileUpload ? '/user/upload-public' : uploadFileUrl ? uploadFileUrl : '/user/upload';
  //   if (imageOrFileUploadCompletePercentage) {
  //     imageOrFileUploadCompletePercentage(1);
  //   }
  //   axiosInstance()
  //     .post(uploadUrl, formData, {
  //       headers: { 'Content-Type': 'multipart/form-data' },
  //       onUploadProgress: (pE) => {
  //         const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
  //         setFileUploadProgress(completedPercent);

  //         if (completedPercent === 100) {
  //           setTimeout(() => {
  //             setFileUploadProgress(0);
  //           }, 4000);
  //         }
  //       }
  //     })
  //     .then(({ data }) => {
  //       if (imageOrFileUploadCompletePercentage) {
  //         imageOrFileUploadCompletePercentage(0);
  //       }
  //       if (uploadFileUrl) {
  //         onAppendData(data);
  //       } else {
  //         // if (isMultiple) {
  //         //   let currentData = values[name] ? values[name] : [];
  //         //   setFieldValue(name, [...currentData, { fileName: usePublicUrlforFileUpload ? data.fileUrl : data.fileName, size: file.size }]);
  //         // } else {
  //         //   setFieldValue(name, usePublicUrlforFileUpload ? data.fileUrl : data.fileName);
  //         // }
  //         if (isMultiple) {
  //           return { fileName: usePublicUrlforFileUpload ? data.fileUrl : data.fileName, size: file.size };
  //         } else {
  //           return usePublicUrlforFileUpload ? data.fileUrl : data.fileName;
  //         }
  //       }
  //       setFileUploading(false);
  //     })
  //     .catch((err) => {
  //       setFileUploading(false);
  //       setToastConfig(err);
  //       setFileUploadProgress(0);
  //       if (imageOrFileUploadCompletePercentage) {
  //         imageOrFileUploadCompletePercentage(0);
  //       }
  //     });
  // };

  // for private upload
  const getFileUrl = async (file, isMultiple = false): Promise<ReturnMultiFileType> => {
    setFileUploadProgress(0);
    let formData = new FormData();
    formData.append('file', file);
    setFileUploading(true);
    let uploadUrl = usePublicUrlforFileUpload ? '/user/upload-public' : uploadFileUrl ? uploadFileUrl : '/user/upload';
    if (imageOrFileUploadCompletePercentage) {
      imageOrFileUploadCompletePercentage(1);
    }
    try {
      const { data } = await axiosInstance().post(uploadUrl, formData, {
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
      });
      if (imageOrFileUploadCompletePercentage) {
        imageOrFileUploadCompletePercentage(0);
      }
      if (uploadFileUrl) {
        onAppendData(data);
      } else {
        if (isMultiple) {
          return { fileName: usePublicUrlforFileUpload ? data.fileUrl : data.fileName, size: file.size };
        } else {
          return usePublicUrlforFileUpload ? data.fileUrl : data.fileName;
        }
      }
    } catch (error) {
      setToastConfig(error);
    } finally {
      setFileUploadProgress(0);
      if (imageOrFileUploadCompletePercentage) {
        imageOrFileUploadCompletePercentage(0);
      }
      setFileUploading(false);
    }
  };

  const addFieldOption = (optionData) => {
    if (fieldData && fieldData?.isDependentDropdown) {
      if (Array.isArray(optionData)) {
        optionData[0][fieldData?.dropdowDependentOn] = values[fieldData?.dropdowDependentOn];
      } else {
        optionData[fieldData?.dropdowDependentOn] = values[fieldData?.dropdowDependentOn];
      }
    }
    const data = {
      _id: productTemplateId || priceTemplateId ? fieldData?._id : fieldData ? fieldData?._id : fieldId,
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
    setReadingImage(true);
    const file = e.target.files[0];
    setImageFileName(file.name.toString().split('.')[0]);
    let reader = new FileReader();

    reader.onload = async (e) => {
      const result = await e.target?.result;
      setImage(result);
      setReadingImage(false);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

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
        setFieldValue(x, result[x]);
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

  const getLookUpDisplayValue = (fieldData, values) => {
    var label: any = '';
    const lookUpField = fields?.find((e) => e.fieldName === fieldData?.lookUpField);
    if (lookUpField && values[lookUpField?.fieldName]) {
      const option = lookUpField?.option?.find((e) => e.optionValue === values[lookUpField?.fieldName]);
      if (option) {
        label = option[fieldData?.lookUpFieldDisplay] || '';
      }
    }
    return isArray(label) ? label?.map((e) => e?.optionLabel)?.toString() : label?.optionLabel || label;
  };

  return fieldData?.hiddenField ? null : !fieldData || isFieldVisible(fieldData, fields, values) ? (
    type === 'singleLine' || (type === 'lookUpDisplay' && fromFilter) ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          disabled={fieldData?.isUneditable || rest?.disabled}
          variant="outlined"
          type={fromFilter ? 'search' : 'text'}
          label={getLabel(label)}
          required={required}
          name={name}
          value={values[name]}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          onChange={onChange ? onChange : (e) => handleChange(name, e.target.value.trimStart())}
        />
      </InfoLabel>
    ) : type === 'lookUpDisplay' && !fromFilter ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          disabled={true}
          variant="outlined"
          type={'text'}
          label={getLabel(label)}
          required={false}
          name={name}
          value={getLookUpDisplayValue(fieldData, values)}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
        />
      </InfoLabel>
    ) : type === 'name' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          variant="outlined"
          type={fromFilter ? 'search' : 'text'}
          label={getLabel(label)}
          required={required}
          name={name}
          value={values[name]}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          onChange={(e) => {
            const regex = /^[a-zA-Z ]+$/i;
            if (e.target.value === '' || regex.test(e.target.value.trim())) {
              handleChange(name, e.target.value.trim());
            }
          }}
        />
      </InfoLabel>
    ) : type === 'multiLine' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          variant="outlined"
          type={fromFilter ? 'search' : 'text'}
          multiline
          label={getLabel(label)}
          name={name}
          required={required}
          rows={3}
          value={values[name]}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          onChange={onChange ? onChange : (e) => handleChange(name, e.target.value.trimStart())}
        />
      </InfoLabel>
    ) : type === 'number' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
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
          slotProps={{
            input: {
              inputComponent: CustomFormat as any,
              inputProps: {
                allowNegative: false,
                onValueChange: (values) => {
                  handleChange(name, values.value);
                },
                selectedCurrencyCode: selectedCurrencyCode
              }
            }
          }}
        />
      </InfoLabel>
    ) : type === 'currencyNumber' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
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
          slotProps={{
            input: {
              inputComponent: CustomFormat as any,
              allowNegative: false,
              onValueChange: (values) => {
                handleChange(name, values.value);
              },
              selectedCurrencyCode: selectedCurrencyCode,
              startAdornment: startAdornment ? (
                startAdornment
              ) : (
                <InputAdornment position="start">
                  {result(
                    find(getUniqueCurrencies(), function (obj) {
                      return obj.currencyCode === (user?.user?.brandCurrency || 'USD');
                    }),
                    'symbolNative'
                  )}
                </InputAdornment>
              )
            }
          }}
        />
      </InfoLabel>
    ) : type === 'percent' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          type="number"
          variant="outlined"
          label={getLabel(label)}
          required={required}
          name={name}
          value={values[name]}
          onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          slotProps={{
            input: {
              endAdornment: '%',
              inputProps: { min: 0 },
              readOnly: fieldData && fieldData?.isUneditable ? true : false
            }
          }}
          ref={inputNumberRef}
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
          // onChange={
          //   onChange
          //     ? onChange
          //     : (e) => {
          //       handleChange(name, e.target.value ?
          //         parseFloat((parseFloat(e.target.value)?.toFixed(fieldData?.decimalPlaces === undefined ? 2 : fieldData?.decimalPlaces))) : 0);
          //     }
          // }
        />
      </InfoLabel>
    ) : type === 'email' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          variant="outlined"
          type={fromFilter ? 'search' : 'email'}
          label={getLabel(label)}
          required={required}
          name={name}
          value={values[name]}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          onChange={onChange ? onChange : (e) => handleChange(name, e.target.value)}
        />
      </InfoLabel>
    ) : type === 'password' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
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
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
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
          onChange={
            onChange
              ? onChange
              : (val) => {
                  // check to see if the value has only country code
                  // 5 is choosen here because some country code has 4 digit and "+"
                  if (val?.length < 5) {
                    handleChange(name, '');
                  } else {
                    handleChange(name, val);
                  }
                }
          }
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
        />
      </InfoLabel>
    ) : type === 'freeStyleMultiSelect' ? (
      <InfoLabel
        info={tooltipMessage}
        doNotShowInfoTooltip={doNotShowInfoTooltip}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <Autocomplete
          {...rest}
          limitTags={2}
          multiple
          disableCloseOnSelect={true}
          freeSolo
          options={[]}
          ChipProps={{
            style: {
              maxWidth: 330
            }
          }}
          renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              margin="dense"
              size="small"
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
              handleChange(name, [...values[name], e.target.value]);
            }
          }}
          onChange={(e, value: any) => {
            let valuesToInsert = [];
            for (var val of value) {
              if (val && val.trim() !== '') {
                valuesToInsert.push(val);
              }
            }
            handleChange(name, valuesToInsert);
          }}
        />
      </InfoLabel>
    ) : (type === 'dropDown' || type === 'multiSelect') && fieldData?.dataList ? (
      <>
        <DataList
          InfoLabel={InfoLabel}
          fieldData={fieldData}
          rest={rest}
          values={values}
          type={type}
          label={label}
          name={name}
          getLabel={getLabel}
          touched={touched}
          errors={errors}
          required={required}
          setFieldValue={setFieldValue}
          fields={allFields}
        />
      </>
    ) : (type === 'dropDown' || type === 'multiSelect') && (lookup || fieldData?.lookup) ? (
      <>
        <Dropdown
          InfoLabel={InfoLabel}
          fieldData={fieldData}
          rest={rest}
          option={option}
          values={values}
          type={type}
          onChange={onChange}
          label={label}
          name={name}
          setOptionsList={(data) => {
            setOptionsList(data);
            const tempallFields = [...allFields];
            tempallFields?.forEach((e) => {
              if (e.fieldName === name) {
                e.option = data;
              }
            });
            setAllFields(tempallFields);
          }}
          handleChange={handleChange}
          getLabel={getLabel}
          touched={touched}
          errors={errors}
          required={required}
          setFieldValue={setFieldValue}
          fields={allFields}
        />
      </>
    ) : type === 'dropDown' ||
      type === 'lookup' ||
      (type === 'vlookupDropdown' && fieldData && fieldData?.isvlookupReverse) ||
      (type === 'formula' && fieldData && fieldData?.isDropdown) ? (
      <>
        <InfoLabel
          info={tooltipMessage}
          isTooltip={isTooltip}
          warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
          warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
          doNotShowInfoTooltip={doNotShowInfoTooltip}
        >
          <div className="flex items-center gap-1">
            <div className="flex-grow">
              <Autocomplete
                {...rest}
                limitTags={2}
                disabled={fieldData?.isUneditable || rest?.disabled}
                options={
                  fieldData && fieldData?.isDependentDropdown
                    ? option.filter((_f) => _f[fieldData?.dropdowDependentOn] === values[fieldData?.dropdowDependentOn])
                    : option.filter((f) => f.optionLabel)
                }
                freeSolo={type === 'dropDown' && !lookup}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                value={
                  option.filter((data) => data.optionValue === values[name]).length
                    ? option.filter((data) => data.optionValue === values[name])[0]
                    : ''
                }
                onChange={
                  onChange
                    ? onChange
                    : (e, val: any) => {
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
                              if (addAdditionalOption || fieldData?.addAdditionalOption) {
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
                              if (addAdditionalOption || fieldData?.addAdditionalOption) {
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
                    style={{ outline: '1px solid white' }}
                    error={touched[name] && Boolean(errors[name])}
                    helperText={touched[name] && errors[name]}
                    required={required}
                  />
                )}
              />
            </div>

            {!lookup && (addAdditionalOption || fieldData?.addAdditionalOption) && (
              <div className="flex-shrink-0">
                <HtmlTooltip title={`Add ${fieldData?.fieldLabel}`}>
                  <IconButton onClick={() => setOptionSaveDialog(true)} size="small" color="primary">
                    <AddCircleIcon />
                  </IconButton>
                </HtmlTooltip>

                {optionSaveDialog && (
                  <AddOptionDialog
                    values={values}
                    handleChange={handleChange}
                    name={name}
                    label={label}
                    addFieldOption={addFieldOption}
                    options={option}
                    setOptions={setOptionsList}
                    setOpen={setOptionSaveDialog}
                  />
                )}
              </div>
            )}
          </div>
        </InfoLabel>
      </>
    ) : type === 'vlookupDropdown' && fieldData && !fieldData?.isvlookupReverse ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          variant="outlined"
          type={fromFilter ? 'search' : 'text'}
          label={getLabel(label)}
          required={required}
          name={name}
          value={values[name]}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          onChange={onChange ? onChange : (e) => handleChange(name, e.target.value.trimStart())}
        />
      </InfoLabel>
    ) : type === 'converter' || (type === 'decimal' && fieldData && fieldData?.isConverter) ? (
      fieldData?.displayUnits &&
      Array.isArray(fieldData?.displayUnits) &&
      fieldData?.displayUnits.map((_unit, i) => (
        <Grid key={_unit} size={{ xs: 12, sm: 6, md: 6 }}>
          <Box display="flex">
            <Box flexGrow={1}>
              <InfoLabel
                info={tooltipMessage}
                isTooltip={isTooltip}
                warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
                warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
              >
                {fieldData?.isDropdown ? (
                  <Autocomplete
                    {...rest}
                    limitTags={2}
                    options={optionConverter(
                      option,
                      fieldData?.units,
                      fieldData?.unitoption,
                      fieldData?.dropdownOnConverter,
                      _unit,
                      fieldData?.decimalPlaces
                    )}
                    getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                    isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                    value={
                      optionConverter(
                        option,
                        fieldData?.units,
                        fieldData?.unitoption,
                        fieldData?.dropdownOnConverter,
                        _unit,
                        fieldData.decimalPlaces
                      ).filter((data) => data.optionValue.toString() === values[name + '_' + _unit.toLowerCase()]?.toString()).length
                        ? optionConverter(
                            option,
                            fieldData?.units,
                            fieldData?.unitoption,
                            fieldData?.dropdownOnConverter,
                            _unit,
                            fieldData?.decimalPlaces
                          ).filter((data) => data.optionValue.toString() === values[name + '_' + _unit.toLowerCase()]?.toString())[0]
                        : ''
                    }
                    onChange={onChange ? onChange : (e, val: any) => handleConverterChange(name, _unit, val && parseFloat(val.optionValue))}
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
                ) : (
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
                    onChange={
                      onChange
                        ? onChange
                        : (e) => handleConverterChange(name, _unit, e.target.value === '' ? '' : parseFloat(e.target.value.replace(/[^0-9\.]/g, '')))
                    }
                    slotProps={{
                      input: {
                        inputProps: { min: 0 },
                        readOnly: fieldData && fieldData?.isUneditable ? true : false
                      }
                    }}
                  />
                )}
              </InfoLabel>
            </Box>
            {i === 0 && fieldData?.displayUnits?.length !== fieldData?.units?.length && (
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
                {(fieldData?.leval === 'product-custom' ||
                  fieldData?.leval === 'product-builder-custom' ||
                  fieldData?.leval === 'price-builder-custom') && (
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
            {fieldData?.fieldChanges && fieldData?.fieldChanges?.displayUnits && fieldData?.fieldChanges?.displayUnits?.includes(_unit) && (
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
      fieldData?.displayCurrency && Array.isArray(fieldData?.displayCurrency) ? (
        fieldData?.displayCurrency?.map((_currency, i) =>
          fieldData?.isConverter && fieldData?.displayUnits?.length ? (
            fieldData?.displayUnits?.map((_unit, j) => (
              <Grid key={_unit} size={{ xs: 12, sm: 6, md: 6 }}>
                <Box display="flex">
                  <Box flexGrow={1}>
                    <InfoLabel
                      info={tooltipMessage}
                      doNotShowInfoTooltip={doNotShowInfoTooltip}
                      isTooltip={isTooltip}
                      warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
                      warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
                    >
                      <TextField
                        {...rest}
                        variant="outlined"
                        //type="number"
                        label={label + ' ' + _currency + '/' + _unit}
                        name={name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()}
                        required={required}
                        value={
                          values[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()]
                            ? values[name + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()].toLocaleString(undefined, {
                                maximumFractionDigits: fieldData?.decimalPlaces
                              })
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
                                      : e.target.value.slice(-1) === '.' || e?.target?.value?.slice(-2) === '.0'
                                        ? e.target.value.replace(/,/g, '')
                                        : parseFloat(e.target.value.replace(/,/g, ''))
                                  );
                                }
                              }
                        }
                        slotProps={{
                          input: {
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
                            readOnly: fieldData && fieldData?.isUneditable ? true : false
                          }
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
                      {(fieldData?.leval === 'product-custom' ||
                        fieldData?.leval === 'product-builder-custom' ||
                        fieldData?.leval === 'price-builder-custom') && (
                        <HtmlTooltip title="Remove">
                          <IconButton onClick={() => handleRemoveField(fieldData)} color="primary" size="small">
                            <HighlightOffIcon color="error" />
                          </IconButton>
                        </HtmlTooltip>
                      )}
                      {fieldData?.displayUnits?.length !== fieldData?.units?.length && (
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
                  {i === 0 &&
                    fieldData?.fieldChanges &&
                    fieldData?.fieldChanges?.displayUnits &&
                    fieldData?.fieldChanges?.displayUnits?.includes(_unit) && (
                      <Box>
                        <HtmlTooltip title="Remove" className="formActionButton">
                          <IconButton onClick={() => handleRemoveDisplayType('converter', fieldData, _unit)} color="primary" size="small">
                            <HighlightOffIcon color="error" />
                          </IconButton>
                        </HtmlTooltip>
                      </Box>
                    )}
                  {j === 0 &&
                    fieldData?.fieldChanges &&
                    fieldData?.fieldChanges?.displayCurrency &&
                    fieldData?.fieldChanges?.displayCurrency?.includes(_currency) && (
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
            <Grid key={_currency} size={{ xs: 12, sm: 6, md: 6 }}>
              <Box display="flex">
                <Box flexGrow={1}>
                  <InfoLabel
                    info={tooltipMessage}
                    doNotShowInfoTooltip={doNotShowInfoTooltip}
                    isTooltip={isTooltip}
                    warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
                    warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
                  >
                    <TextField
                      {...rest}
                      variant="outlined"
                      //type="number"
                      label={label + ' ' + _currency}
                      name={name + '_' + _currency.toLowerCase()}
                      required={required}
                      value={
                        values[name + '_' + _currency.toLowerCase()]
                          ? values[name + '_' + _currency.toLowerCase()].toLocaleString(undefined, {
                              maximumFractionDigits: fieldData?.decimalPlaces
                            })
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
                                if (fieldData?.displayCurrency?.length > 1) {
                                  handleCurrencyChange(name, _currency, e.target.value === '' ? 0 : e.target.value.replace(/,/g, ''));
                                } else {
                                  handleChange(name + '_' + _currency.toLowerCase(), e.target.value === '' ? 0 : e.target.value.replace(/,/g, ''));
                                }
                              }
                            }
                      }
                      onBlur={(e) => {
                        if (e.target.value === '' || /^[0-9.,]+$/.test(e.target.value)) {
                          if (fieldData?.displayCurrency?.length > 1) {
                            handleCurrencyChange(
                              name,
                              _currency,
                              e.target.value === '' ? 0 : parseFloat(parseFloat(e.target.value.replace(/,/g, ''))?.toFixed(fieldData?.decimalPlaces))
                            );
                          } else {
                            handleChange(
                              name + '_' + _currency.toLowerCase(),
                              e.target.value === '' ? 0 : parseFloat(parseFloat(e.target.value.replace(/,/g, ''))?.toFixed(fieldData?.decimalPlaces))
                            );
                          }
                        }
                      }}
                      slotProps={{
                        input: {
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
                          readOnly: fieldData && fieldData?.isUneditable ? true : false
                        }
                      }}
                    />
                  </InfoLabel>
                </Box>
                {i === 0 && (
                  <Box>
                    {fieldData?.hideConverter ? null : (
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
                    )}
                    {(fieldData?.leval === 'product-custom' ||
                      fieldData?.leval === 'product-builder-custom' ||
                      fieldData?.leval === 'price-builder-custom') && (
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
                {fieldData?.fieldChanges &&
                  fieldData?.fieldChanges?.displayCurrency &&
                  fieldData?.fieldChanges?.displayCurrency?.includes(_currency) && (
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
      ) : null
    ) : type === 'decimal' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          variant="outlined"
          type="number"
          onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
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
                  handleChange(name, e.target.value === '' ? '' : parseFloat(parseFloat(e.target.value)?.toFixed(fieldData?.decimalPlaces || 0)));
                }
          }
          slotProps={{
            input: {
              inputProps: { min: 0 },
              readOnly: fieldData && fieldData?.isUneditable ? true : false
            }
          }}
        />
        {rest?.isMinMaxValue && (
          <Typography
            variant="caption"
            style={{
              marginLeft: '4px'
            }}
            color={values[name] > rest?.maxValue || values[name] < rest?.minValue ? 'error' : 'secondary'}
          >
            {values[name] > rest?.maxValue || values[name] < rest?.minValue
              ? `Step is considered successful if the value is between ${rest?.minValue} and ${rest?.maxValue}`
              : `Valid value`}
          </Typography>
        )}
      </InfoLabel>
    ) : type === 'formula' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <TextField
          {...rest}
          disabled={fieldData?.isUneditable || rest?.disabled}
          variant="outlined"
          type={fieldData?.returnType === 'decimal' ? 'number' : 'text'}
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
                  if (fieldData?.returnType === 'decimal') {
                    handleChange(name, parseFloat(e.target.value.replace(/[^0-9\.]/g, '')));
                  } else {
                    handleChange(name, e.target.value);
                  }
                }
          }
          slotProps={{
            input: {
              inputProps: { min: 0 },
              readOnly: fieldData && fieldData?.isUneditable ? true : false
            }
          }}
        />
      </InfoLabel>
    ) : type === 'currency' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <CurrencyAutocomplete
          {...rest}
          required={true}
          value={values[name]}
          label={getLabel(label)}
          name={name}
          fullWidth={true}
          onChange={onChange ? onChange : (e, val: any) => handleChange(name, val && val.currencyCode ? val.currencyCode : '')}
          helperText={touched[name] && errors[name]}
          error={touched[name] && Boolean(errors[name])}
        />
      </InfoLabel>
    ) : type === 'multiSelect' ? (
      <InfoLabel
        info={tooltipMessage}
        doNotShowInfoTooltip={doNotShowInfoTooltip}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <Grid container className="gap-1" alignItems={'center'}>
          <Grid
            size={{
              xs: !lookup && (addAdditionalOption || fieldData?.addAdditionalOption) ? 10 : 12
            }}
          >
            <Autocomplete
              {...rest}
              limitTags={2}
              multiple
              freeSolo={!lookup}
              disableCloseOnSelect={true}
              ChipProps={{
                style: {
                  maxWidth: 330
                }
              }}
              options={[
                { optionValue: 'selectAll', optionLabel: 'Select All' },
                ...(fieldData && fieldData?.isDependentDropdown
                  ? option.filter((_f) => _f[fieldData?.dropdowDependentOn] === values[fieldData?.dropdowDependentOn])
                  : option.filter((f) => f.optionLabel))
              ]}
              getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
              value={values[name] ? option.filter((data: any) => values[name].includes(data.optionValue)) : []}
              isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
              onChange={
                onChange
                  ? (e, value: any, reason) => {
                      const isSelectedAll = value.some((val) => val.optionValue === 'selectAll');
                      if (isSelectedAll) {
                        onChange(
                          e,
                          option.filter((opt) => opt.optionValue !== 'selectAll'),
                          reason
                        );
                      } else {
                        onChange(e, value, reason);
                      }
                    }
                  : (e, value: any, reason: any) => {
                      if (setFieldValue) {
                        if (!lookup) {
                          if (reason === 'clear') {
                            setFieldValue(name, []);
                          } else if (reason === 'remove-option' && values[name].length === 1) {
                            setFieldValue(name, []);
                          }
                          let modValues = [];
                          if (!value.some((val) => val.optionValue === 'selectAll')) {
                            modValues = value;
                          } else {
                            modValues = option.filter((opt) => opt.optionValue !== 'selectAll');
                          }
                          modValues.forEach((val) => {
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
                              if (addAdditionalOption || fieldData?.addAdditionalOption) {
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
                              if (addAdditionalOption || fieldData?.addAdditionalOption) {
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
                                  modValues.filter((v) => v.optionValue).map((val) => val.optionValue)
                                );
                              }
                            }
                          });
                        } else {
                          if (value.some((val) => val.optionValue === 'selectAll')) {
                            setFieldValue(
                              name,
                              option.filter((opt) => opt.optionValue !== 'selectAll').map((val) => val.optionValue)
                            );
                          }
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
            <Grid size={{ xs: 2 }}>
              <Box>
                <IconButton onClick={() => setOptionSaveDialog(true)} size="small" color="primary">
                  <AddCircleIcon />
                </IconButton>
                {optionSaveDialog && (
                  <AddOptionDialog
                    values={values}
                    handleChange={handleChange}
                    name={name}
                    label={label}
                    addFieldOption={addFieldOption}
                    options={option}
                    setOptions={setOptionsList}
                    setOpen={setOptionSaveDialog}
                    isMultiple={Boolean(type === 'multiSelect')}
                  />
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </InfoLabel>
    ) : type === 'switch' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <FormControlLabel
          control={<Switch name={name} checked={values[name]} onChange={onChange ? onChange : (e) => handleChange(name, e.target.checked)} />}
          label={getLabel(label)}
        />
      </InfoLabel>
    ) : type === 'checkBox' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <FormControlLabel
          control={
            <Checkbox
              {...rest}
              required={required}
              name={name}
              checked={values[name]}
              onChange={onChange ? onChange : (e) => setFieldValue(name, e.target.checked)}
            />
          }
          label={label}
        />
      </InfoLabel>
    ) : type === 'radio' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <FormControl component="fieldset" required={required}>
          <FormLabel component="legend">{label}</FormLabel>
          <RadioGroup
            row={rest?.row}
            aria-label="gender"
            name={name}
            value={values[name]}
            onChange={onChange ? onChange : (e) => handleChange(name, e.target.value)}
          >
            {options.map((opt) => (
              <FormControlLabel key={opt.order} value={opt.optionLabel} disabled={rest?.disabled} control={<Radio />} label={opt.optionLabel} />
            ))}
          </RadioGroup>
          {touched[name] && errors[name] && <FormHelperText error={true}>{errors[name]}</FormHelperText>}
        </FormControl>
      </InfoLabel>
    ) : type === 'location' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <Autocomplete
          {...rest}
          limitTags={2}
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
            handleChange(name, newInputValue);
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
          renderOption={(props, option: any) => {
            const matches = option?.structured_formatting?.main_text_matched_substrings || [];
            const parts = parse(
              option?.structured_formatting.main_text,
              matches?.map((match) => [match?.offset, match?.offset + match?.length])
            );
            const { key, ...optionProps } = props;
            return (
              <Box key={key} component="li" {...optionProps}>
                <Grid container alignItems="center">
                  <Grid>
                    <LocationOnIcon
                      style={{
                        color: theme.palette.text.secondary,
                        marginRight: theme.spacing(2)
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 'auto' }}>
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
              </Box>
            );
          }}
        />
      </InfoLabel>
    ) : type === 'gpsLocation' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <Autocomplete
          {...rest}
          limitTags={2}
          getOptionLabel={(option: any) => (typeof option === 'string' ? option : option.description)}
          filterOptions={(x) => x}
          options={optionsList}
          autoComplete
          includeInputInList
          filterSelectedOptions
          value={values[name]?.locationName || value}
          onChange={
            onChange
              ? onChange
              : async (event, newValue: any) => {
                  setOptions(newValue ? [newValue, ...optionsList] : optionsList);
                  if (newValue && newValue.place_id) {
                    try {
                      const placeDetails = await fetchPlaceDetails(newValue.place_id);
                      handleChange(name, placeDetails);
                    } catch (error) {
                      handleChange(name, { locationName: newValue.description });
                    }
                  } else {
                    handleChange(name, { locationName: newValue.description });
                  }
                }
          }
          onInputChange={(event, newInputValue, reason) => {
            if (reason === 'input') {
              handleChange(name, { locationName: newInputValue });
              setValues(newInputValue);
            }
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
            const matches = option?.structured_formatting?.main_text_matched_substrings || [];
            const parts = parse(
              option?.structured_formatting.main_text,
              matches?.map((match) => [match?.offset, match?.offset + match?.length])
            );

            return (
              <Grid container alignItems="center">
                <Grid>
                  <LocationOnIcon
                    style={{
                      color: theme.palette.text.secondary,
                      marginRight: theme.spacing(2)
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 'auto' }}>
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
            <Avatar src={values[name]} style={{ width: 70, height: 70 }} alt="org_logo">
              <Image style={{ fontSize: 50 }} />
            </Avatar>
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
              className={Boolean(!values[name]) ? '' : 'errorColor'}
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
          </Box>
        </Box>
        {touched[name] && Boolean(errors[name]) && (
          <Box pt={1}>
            <Typography variant="body2" className="text-truncate" color={'error'}>
              {errors[name]}
            </Typography>
          </Box>
        )}
      </Fragment>
    ) : type === 'multiImageUpload' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <Typography color="textSecondary">{label}</Typography>
        <input accept="image/*" style={{ display: 'none' }} id="multiple-images-button" multiple={false} type="file" onChange={readImageFile} />
        <div className="flex items-center gap-2">
          <label htmlFor="multiple-images-button">
            <ThemeButton disabled={readingImage} buttonType="theme" component="span">
              Upload image(s)
            </ThemeButton>
          </label>
        </div>
        <Box mt={1}>
          <Box display="flex" flexWrap="wrap" justifyContent="space-arounf" overflow="hidden">
            <ImageList style={{ transform: 'translateZ(0)', width: '100%' }}>
              {values[name]
                ? values[name].map((item, i) => (
                    <ImageListItem style={{ height: '150px', width: '160px' }} key={item}>
                      <img src={item} alt={`demo ${i + 1}`} />
                      <ImageListItemBar
                        title={''}
                        actionIcon={
                          <IconButton onClick={() => removeImage(item)} aria-label={`demo ${i + 1}`}>
                            <DeleteIcon color="error" fontSize="small" />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))
                : null}
            </ImageList>
          </Box>
        </Box>
        <Dialog
          TransitionComponent={CustomDialogTransition}
          fullWidth
          maxWidth="md"
          open={Boolean(image) || isImgUploading}
          onClose={() => {
            if (!isImgUploading) {
              setImage('');
            }
          }}
        >
          <ImageCropTool
            image={image}
            setImage={setImage}
            getImageUrl={getImageUrl}
            isImgUploading={isImgUploading}
            imageUploadProgress={imageUploadProgress}
            imageFileName={imageFileName}
          />
        </Dialog>
        {touched[name] && Boolean(errors[name]) && (
          <Box>
            <Typography variant="body2" className="text-truncate" color={'error'}>
              {errors[name]}
            </Typography>
          </Box>
        )}
      </InfoLabel>
    ) : type === 'fileUpload' ? (
      <Fragment>
        <Box display="flex" alignItems="center" pb={(isTooltip && Boolean(tooltipMessage)) || label !== '' ? 0 : 0}>
          <Typography color="textSecondary">{label}</Typography>
          {isTooltip && Boolean(tooltipMessage) && (
            <Fragment>
              <IconButton size="small">
                <HtmlTooltip title={tooltipMessage}>
                  <InfoIcon color="disabled" />
                </HtmlTooltip>
              </IconButton>
              <Box mr={2} />
            </Fragment>
          )}
        </Box>
        <Box>
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
          <div className="flex items-center gap-2">
            <label htmlFor={name}>
              <ThemeButton
                disabled={isFileUploading || !canEdit}
                onClick={handleUploadFile}
                buttonType="theme"
                component="span"
                startIcon={isFileUploading && <CircularProgress size={15} />}
              >
                {isFileUploading ? 'Uploading...' : required ? 'Upload File *' : 'Upload File'}
              </ThemeButton>
            </label>
          </div>
          {doNotShowUploadedFile ? null : (
            <div className="flex items-center">
              <Box flex="1" className="text-truncate">
                <Typography variant="body2" className="text-truncate" color={'textPrimary'}>
                  {isFileUploading ? `Uploading... ${fileUploadProgress}%` : values[name] ? values[name] : ''}
                </Typography>
              </Box>
              {values[name] ? (
                <HtmlTooltip title="Remove">
                  <IconButton
                    disabled={Boolean(!values[name]) || isFileUploading}
                    size="small"
                    aria-label="delete picture"
                    component="span"
                    onClick={() => setFieldValue(name, '')}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </HtmlTooltip>
              ) : null}
            </div>
          )}
        </Box>
        {touched[name] && Boolean(errors[name]) && (
          <Box pt={1}>
            <Typography variant="body2" className="text-truncate" color={'error'}>
              {errors[name]}
            </Typography>
          </Box>
        )}
      </Fragment>
    ) : type === 'multiFileUpload' ? (
      <Fragment>
        <Box display="flex" alignItems="center" pb={(isTooltip && Boolean(tooltipMessage)) || label !== '' ? 0 : 0}>
          <Typography color="textSecondary">{label}</Typography>
          {isTooltip && Boolean(tooltipMessage) && (
            <Fragment>
              <IconButton size="small">
                <HtmlTooltip title={tooltipMessage}>
                  <InfoIcon color="disabled" />
                </HtmlTooltip>
              </IconButton>
              <Box mr={2} />
            </Fragment>
          )}
        </Box>
        <Box display="flex" alignItems="center">
          <Grid container spacing={1} alignItems="center">
            <Grid size={{ xs: 12, sm: 12, md: 12 }}>
              <input
                disabled={isFileUploading || !canEdit}
                id={name}
                name={name}
                onChange={(e) => handleUploadFile(e, true)}
                style={{ display: 'none' }}
                onClick={(e: any) => (e.target.value = null)}
                type="file"
                accept={accept || documentUploadSupportExtensions}
                multiple={true}
              />
              <div className="flex items-center gap-2">
                <label htmlFor={name}>
                  <ThemeButton component="span" disabled={isFileUploading || !canEdit} buttonType="theme" isLoading={isFileUploading}>
                    {isFileUploading ? 'Uploading File(s)' : required ? 'Upload File(s) *' : 'Upload File(s)'}
                  </ThemeButton>
                </label>
              </div>
              {touched[name] && Boolean(errors[name]) && (
                <Box pt={1}>
                  <Typography variant="body2" className="text-truncate" color={'error'}>
                    {errors[name]}
                  </Typography>
                </Box>
              )}
            </Grid>
            {doNotShowUploadedFile ? null : values[name] && isArray(values[name]) ? (
              <>
                {values[name]?.map((item, i) => (
                  <>
                    <div className="w-[calc(100%-60px)] flex-grow">
                      <Box ml={1} />
                      <Box flex="1" className="text-truncate">
                        <Typography variant="body2" className="text-truncate" color={'textPrimary'}>
                          {item?.fileName}
                        </Typography>
                      </Box>
                    </div>
                    <div style={{ maxWidth: 50 }}>
                      <HtmlTooltip title="Remove">
                        <IconButton
                          disabled={Boolean(!values[name])}
                          size="small"
                          aria-label="delete picture"
                          component="span"
                          onClick={() => {
                            setFieldValue(
                              name,
                              values[name].filter((d) => d.fileName !== item.fileName)
                            );
                          }}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </HtmlTooltip>
                    </div>
                  </>
                ))}
                {isFileUploading && (
                  <Grid size={{ xs: 10, sm: 10, md: 10 }}>
                    <Typography variant="body2" className="text-truncate" color={'textPrimary'}>
                      {`Uploading... ${fileUploadProgress}%`}
                    </Typography>
                  </Grid>
                )}
              </>
            ) : null}
          </Grid>
        </Box>
      </Fragment>
    ) : type === 'url' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
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
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <CustomDatePicker
          {...rest}
          disabled={fieldData?.isUneditable || rest?.disabled}
          required={required}
          value={values[name]}
          name={name}
          label={getLabel(label)}
          {...(fieldData?.restrictFutureDate ? { maxDate: new Date() } : {})}
          {...(fieldData?.restrictBackDate ? { minDate: new Date() } : {})}
          onChange={onChange ? onChange : (date) => handleChange(name, date ? date : '')}
          error={customError?.[name] ? customError[name] : touched[name] && Boolean(errors[name])}
          helperText={customError?.[name] ? customError[name] : touched[name] && errors[name]}
        />
      </InfoLabel>
    ) : type === 'dateTime' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <CustomDateTimePicker
          {...rest}
          required={required}
          variant="inline"
          inputVariant="outlined"
          ampm={false}
          value={values[name]}
          name={name}
          label={getLabel(label)}
          {...(fieldData?.restrictFutureDate ? { maxDateTime: new Date() } : {})}
          {...(fieldData?.restrictBackDate ? { minDateTime: new Date() } : {})}
          onChange={(date) => handleChange(name, date)}
          onError={console.error}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
        />
      </InfoLabel>
    ) : type === 'year' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <CustomDatePicker
          {...rest}
          required={required}
          value={values[name] || new Date()}
          name={name}
          label={getLabel(label)}
          views={['year']}
          onChange={(date) => handleChange(name, date)}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          inputFormat={'YYYY'}
        />
      </InfoLabel>
    ) : type === 'colorPicker' ? (
      <InfoLabel
        info={tooltipMessage}
        isTooltip={isTooltip}
        warningTooltip={isWarningTooltip || fieldData?.isWarningTooltip}
        warningMessage={warningTooltipMessage || fieldData?.warningTooltipMessage}
      >
        <Box display="flex" alignItems="center">
          <Typography color="textSecondary">{label}</Typography>
          <Box ml={2} display="flex" alignContent="center">
            <input type="color" name={name} value={values[name]} onChange={(e) => setFieldValue(name, e.target.value)} />
          </Box>
        </Box>
        {touched[name] && Boolean(errors[name]) && (
          <Typography variant="caption" color="error">
            {errors[name]}
          </Typography>
        )}
      </InfoLabel>
    ) : type === 'richTextEditor' ? (
      <RichTextEditor name={name} label={label} setFieldValue={setFieldValue} value={values[name]} />
    ) : type === 'signature' ? (
      <Signature
        label={label}
        values={values}
        name={name}
        touched={touched}
        errors={errors}
        isTooltip={isTooltip}
        tooltipMessage={tooltipMessage}
        setFieldValue={setFieldValue}
        required={required}
      />
    ) : type === 'groupSignature' ? (
      <GroupSignature
        label={label}
        touched={touched}
        errors={errors}
        values={values}
        name={name}
        setFieldValue={setFieldValue}
        fieldData={fieldData}
      />
    ) : type === 'counter' ? (
      <Counter label={label} values={values} name={name} setFieldValue={setFieldValue} fieldData={fieldData} touched={touched} errors={errors} />
    ) : type === 'description' ? (
      <Description fieldData={fieldData} />
    ) : null
  ) : null;
};

export default FormTypes;

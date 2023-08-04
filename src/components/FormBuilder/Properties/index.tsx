import React, { useState, Fragment, useRef, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FieldList from '../FieldList';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { object, string } from 'yup';
import { Formik, Form } from 'formik';
import { Vlookup } from '../AddField/vlookup';
import { Formula } from '../AddField/formula';
import { Converter } from '../AddField/converter';
import { Option } from '../AddField/option';
import { Currency } from '../AddField/currency';
import { SignatureUser } from '../AddField/signatureUser';
import { DecimalPlaces } from '../AddField/decimalPlaces';
import { MultipleFormula } from '../AddField/multipleformula';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Autocomplete } from '@material-ui/lab';
import FormTypes from '../../Helpers/FormTypes';
import { camelCase, isEqual } from 'lodash';
import { checkFormula } from '../../../constants/formulaUtility';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { ResourceDropdown } from './resourceDropdown';
import { MinMax } from '../AddField/minMax';
import { getLookupResource } from '../helper';
import FieldDependent from './FieldDependent';
import LookUpDisplay from './LookUpDisplay';
import { ShowFieldDependentOn } from '../AddField/showFieldDependentOn';

const FieldSchema = object().shape({
  fieldLabel: string().required('please enter field label')
});

export const Properties = ({ module, handleClose, fieldData, sectionId, section, setSection, extraFields, isCalculativeField }) => {
  const [initialValues, setInitialValues] = useState({ ...fieldData });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isInitialUpdated, setIsInitialUpdated] = useState({
    MultipleFormula: false,
    Currency: false,
    Converter: false
  });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [lookupResource, setLookupResource] = useState([]);

  //const [isChangeFieldName, setIsChangeFieldName] = useState(true);

  useEffect(() => {
    getLookupList();
  }, []);

  const getLookupList = async () => {
    const lookupResource = await getLookupResource();
    setLookupResource(lookupResource);
  };

  useEffect(() => {
    if (fieldData.type === 'dropDown' && !fieldData.lookup) {
      if (fieldData.option && fieldData.option.filter((data) => data.default === true).length) {
        setInitialValues({
          ...initialValues,
          defaultDropdownOption: fieldData.option.filter((data) => data.default === true)[0].optionValue
        });
      }
    }
  }, []);

  useEffect(() => {
    if (initialValues) {
      const values = initialValues;
      if (!values.isDefaultValue) {
        values.isDefaultValue = false;
        values.defaultValue = '';
      }
      if (
        !values.isColumnEditable &&
        fieldData.resource === 'Rental Management Product' &&
        module !== 'price-template' &&
        module !== 'product-template'
      ) {
        values.isColumnEditable = false;
      }
      if (!values.disableOnEdit && module !== 'price-template' && module !== 'product-template') {
        values.disableOnEdit = false;
      }
      if (!values.isWarningTooltip && module !== 'price-template' && module !== 'product-template') {
        values.isWarningTooltip = false;
        values.warningTooltipMessage = '';
      }
      if (!values.disableOnEdit && module !== 'price-template' && module !== 'product-template') {
        values.disableOnEdit = false;
      }
      if (!values.hiddenField && module !== 'price-template' && module !== 'product-template') {
        values.hiddenField = false;
      }
      if (!values.addAdditionalOption && (fieldData.type === 'multiSelect' || fieldData.type === 'dropDown')) {
        values.addAdditionalOption = false;
      }
      if (!values.addBulkOptions && (fieldData.type === 'multiSelect' || fieldData.type === 'dropDown')) {
        values.addBulkOptions = false;
      }
      if (!values.addManualOptionInExcel && fieldData.type === 'dropDown') {
        values.addManualOptionInExcel = false;
      }
      if (!values.isMinMaxValue && fieldData.type === 'decimal') {
        values.isMinMaxValue = false;
        values.minValue = 0;
        values.maxValue = 0;
        values.minValueServiceAdd = '';
        values.maxValueServiceAdd = '';
      }
      if (
        !values.unique &&
        (fieldData.type === 'multiLine' || fieldData.type === 'singleLine' || fieldData.type === 'mobileNumber' || fieldData.type === 'number')
      ) {
        values.unique = false;
      }
      if (
        !values.primaryField &&
        (fieldData.type === 'multiLine' || fieldData.type === 'singleLine' || fieldData.type === 'mobileNumber' || fieldData.type === 'number')
      ) {
        values.primaryField = false;
      }
      if (values.type === 'lookUpDisplay') {
        if (!values.lookUpField) {
          values.lookUpField = '';
        }
        if (!values.lookUpFieldDisplay) {
          values.lookUpFieldDisplay = '';
        }
      }
      if (values.type === 'process') {
        if (!values.showAdditionalInfoPopup) {
          values.showAdditionalInfoPopup = false;
        }

        if (!values.additionalInfoSection) {
          values.additionalInfoSection = '';
        }
        setInitialValues(values);
      }
      return () => setInitialValues(null);
    }
  }, [fieldData]);

  const fields = [];
  if (module === 'product-template' || module === 'price-template') {
    if (extraFields) {
      extraFields.forEach((_f) => {
        fields.push(_f);
      });
    }
  }

  section.forEach((_section) => {
    _section.field.forEach((_field) => {
      let ele = { ..._field };
      if (!ele.fieldName) {
        ele.fieldName = camelCase(ele.fieldLabel.replace(/[^a-zA-Z0-9]/g, ''));
      }
      if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
        if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
          ele.formulaUnits &&
            ele.formulaUnits.forEach((_unit) => {
              fields.push({
                ...ele,
                fieldLabel: ele.fieldLabel + ' (' + _unit + ')',
                fieldName: ele.fieldName + '_' + _unit.toLowerCase()
              });
            });
        } else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
          ele.displayCurrency &&
            ele.displayCurrency.forEach((_currency) => {
              ele.formulaUnits &&
                ele.formulaUnits.forEach((_unit) => {
                  fields.push({
                    ...ele,
                    fieldLabel: ele.fieldLabel + ' (' + _currency + '/' + _unit + ')',
                    fieldName: ele.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()
                  });
                });
            });
        } else if (ele.type === 'currencyAmount') {
          ele.displayCurrency &&
            ele.displayCurrency.forEach((_currency) => {
              fields.push({
                ...ele,
                fieldLabel: ele.fieldLabel + ' (' + _currency + ')',
                fieldName: ele.fieldName + '_' + _currency.toLowerCase()
              });
            });
        }
      } else {
        fields.push(ele);
      }
    });
  });

  const handleSave = (values) => {
    let data = [...section];
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele._id.toString() === fieldData._id.toString()) {
            ele.fieldLabel = values.fieldLabel;
            ele.required = values.required;
            ele.isTooltip = values.isTooltip;
            ele.tooltipMessage = values.tooltipMessage;
            ele.isConverter = values.isConverter;
            ele.isFormula = values.isFormula;
            ele.isMulitFormula = values.isMulitFormula;
            ele.isUneditable = values.isUneditable;
            ele.isVlookup = values.isVlookup;
            ele.isShowFieldDependentOn = values.isShowFieldDependentOn;
            if (values.isShowFieldDependentOn) {
              ele.showFieldDependentOn = values.showFieldDependentOn;
            }
            ele.hiddenField = values.hiddenField;
            ele.showAdditionalInfoPopup = values.showAdditionalInfoPopup;
            ele.additionalInfoSection = values.additionalInfoSection;
            ele.isDefaultValue = values.isDefaultValue;
            ele.disableOnEdit = values.disableOnEdit;
            ele.unique = values.unique;
            ele.primaryField = values.primaryField;
            ele.addManualOptionInExcel = values.addManualOptionInExcel;
            ele.addAdditionalOption = values.addAdditionalOption;
            ele.addBulkOptions = values.addBulkOptions;
            ele.lookup = values.lookup || false;
            ele.lookupResource = values.lookup ? values.lookupResource : '';
            ele.entityWiseLookup = values?.entityWiseLookup || false;
            ele.isMinMaxValue = values?.isMinMaxValue || false;
            ele.minValue = values?.minValue || 0;
            ele.maxValue = values?.maxValue || 0;
            ele.minValueServiceAdd = values.minValueServiceAdd ? values.minValueServiceAdd : '';
            ele.maxValueServiceAdd = values.maxValueServiceAdd ? values.maxValueServiceAdd : '';
            ele.isDropdown = values.isDropdown || false;
            ele.isSystemGenerate = values?.isSystemGenerate || false;
            if (values.isSystemGenerate) {
              ele.systemGeneratedAutoIncrement = values.systemGeneratedAutoIncrement;
              ele.systemGeneratedPrefix = values.systemGeneratedPrefix;
            }
            ele.isColumnEditable = values?.isColumnEditable || false;
            ele.isHideColumnSum = values?.isHideColumnSum || false;

            if (values?.hasOwnProperty('isWarningTooltip')) {
              ele.isWarningTooltip = values.isWarningTooltip;
              ele.warningTooltipMessage = values.warningTooltipMessage;
            }

            if (ele.isDefaultValue) {
              ele.defaultValue = values.defaultValue;
            } else {
              ele.defaultValue = '';
            }

            if (
              fieldData.type === 'dropDown' ||
              fieldData.type === 'multiSelect' ||
              fieldData.type === 'radio' ||
              fieldData.type === 'process' ||
              ele.isDropdown
            ) {
              if (fieldData.type === 'dropDown' || fieldData.type === 'multiSelect') {
                ele.isDependentDropdown = values.isDependentDropdown;
                ele.dropdowDependentOn = values.dropdowDependentOn;
                ele.lookupDependentOnField = values.lookupDependentOnField;
              }
              values.option &&
                values.option.forEach((_option, index) => {
                  _option.order = index + 1;
                  _option.default = false;
                  if (fieldData.type === 'dropDown' && !values['lookup']) {
                    if (values['defaultDropdownOption'] && values['defaultDropdownOption'] !== '') {
                      if (values['defaultDropdownOption'] === _option.optionLabel) {
                        _option.default = true;
                      }
                    }
                  }
                });
              ele.option = values.option;
            }
            if (fieldData.type === 'decimal' || fieldData.type === 'converter' || fieldData.type === 'currencyAmount' || fieldData.type === 'percent') {
              ele.decimalPlaces = values.decimalPlaces;
            }
            if (fieldData.type === 'formula' || values.isFormula === true) {
              ele.formula = values.formula;
              ele.inputFields = values.inputFields;
              ele.returnType = values.returnType ? values.returnType : 'decimal';
              ele.decimalPlaces = values.decimalPlaces ? values.decimalPlaces : 2;
            }
            if (fieldData.type === 'vlookupDropdown' || fieldData.isVlookup) {
              values.option.forEach((ele) => {
                ele.optionValue = ele.optionLabel;
              });
              ele.option = values.option;
              ele.vlookupInputFields = values.vlookupInputFields;
              ele.isvlookupReverse = values.isvlookupReverse;
            }
            if (fieldData.type === 'converter' || fieldData.isConverter === true) {
              ele.unitoption = values.unitoption;
              ele.units = values.units;
              ele.displayUnits = values.displayUnits;
              ele.formulaUnits = values.formulaUnits;
              if (fieldData.type === 'formula' || values.isFormula === true) {
                ele.formulaOnConverter = values.formulaOnConverter;
              }
            }
            if ((fieldData.type === 'vlookupDropdown' || fieldData.isVlookup) && (fieldData.type === 'converter' || fieldData.isConverter === true)) {
              ele.vlookupOnConverter = values.vlookupOnConverter;
            }
            if (fieldData.type === 'currencyAmount') {
              delete ele.currency;
              ele.displayCurrency = values.displayCurrency;
              if (fieldData.type === 'formula' || values.isFormula === true) {
                ele.formulaOnCurrency = values.formulaOnCurrency;
              }
            }
            if (fieldData.isMulitFormula) {
              ele.formulaFields = values.formulaFields;
              ele.formulainputFields = values.formulainputFields;
              ele.formulaoption = values.formulaoption;
            }

            if (ele.isDropdown) {
              ele.dropdownOnConverter = values.dropdownOnConverter;
            }

            if (fieldData.type === 'signature') {
              if (values?.signatureUsers && values?.signatureUsers?.length) {
                ele.signatureUsers = values.signatureUsers;
              } else {
                ele.signatureUsers = [];
              }
            }

            if (fieldData?.lookup) {
              if (values.lookupDependentOn) {
                ele.lookupDependentOn = values.lookupDependentOn;
              } else {
                ele.lookupDependentOn = '';
              }
            }
            if (fieldData?.lookup && values.lookupDependentOn && values.lookupDependentOn !== '') {
              ele.lookupDependentOnField = values.lookupDependentOnField;
            }

            if (fieldData.type === 'lookUpDisplay') {
              ele.lookUpField = values.lookUpField;
              ele.lookUpFieldDisplay = values.lookUpFieldDisplay;
            }

            if (module === 'form-builder-master') {
              ele.editAble = values.editAble || false;
              ele.deletAble = values.deletAble || false;
            }
          }
        });
      }
    });
    setSection(data);
    handleClose();
  };

  function validate(values) {
    const errors = {};
    if (values.type === 'formula' || values.isFormula === true) {
      if (!values.inputFields || values.inputFields.length === 0) {
        errors['inputFields'] = 'Please select input parameters';
      }
      let inputValues = {};
      values.inputFields &&
        values.inputFields.forEach((_input) => {
          inputValues[_input] = 1;
        });
      if (!checkFormula(values.formula, inputValues)) {
        errors['formula'] = 'Please enter valid formula';
      }
    }
    if (values.type === 'currencyAmount') {
      if (!values.displayCurrency || values.displayCurrency.length === 0) {
        errors['displayCurrency'] = 'Please select currency';
      }
    }
    if (values.type === 'converter' || values.isConverter === true) {
      if (!values.units || values.units.length === 0) {
        errors['units'] = 'Please enter units';
      }
      if (!values.displayUnits || values.displayUnits.length === 0) {
        errors['displayUnits'] = 'Please select display unit';
      }
    }
    if (values.isMulitFormula) {
      if (!values.formulaFields || values.formulaFields.length === 0) {
        errors['formulaFields'] = 'Please select formul fields';
      }
      if (!values.formulainputFields || values.formulainputFields.length === 0) {
        errors['formulainputFields'] = 'Please select input parameters';
      }
      if (values.formulaFields && values.formulaFields.length) {
        let inputValues = {};
        values.formulainputFields &&
          values.formulainputFields.forEach((_input) => {
            inputValues[_input] = 1;
          });
        Object.keys(values.formulaoption).forEach((_formula) => {
          if (!checkFormula(values.formulaoption[_formula] ? values.formulaoption[_formula] : '', inputValues))
            errors['formulaoption_' + _formula] = 'Please enter valid formula';
        });
      }
    }
    if (values.type === 'vlookupDropdown' || values.isVlookup) {
      if (!values.vlookupInputFields || values.vlookupInputFields.length === 0) {
        errors['vlookupInputFields'] = 'Please select input parameters';
      }
    }

    if (values.isTooltip && !values.tooltipMessage) {
      errors['tooltipMessage'] = 'Please enter tooltip message.';
    }

    if (values.isWarningTooltip && !values.warningTooltipMessage) {
      errors['warningTooltipMessage'] = 'Please enter warning message.';
    }

    if (values?.isMinMaxValue) {
      if (!values?.minValue) {
        errors['minValue'] = 'Please enter min value';
      }
      if (!values?.maxValue) {
        errors['maxValue'] = 'Please enter max value';
      }
      if (values?.minValue > values?.maxValue) {
        errors['minValue'] = 'Please enter valid min value';
      }
    }

    if (values.type === 'lookUpDisplay') {
      if (!values.lookUpField) {
        errors['lookUpField'] = 'Please enter look up field';
      }
      if (!values.lookUpFieldDisplay) {
        errors['lookUpFieldDisplay'] = 'Please enter look up field display';
      }
    }

    return errors;
  }

  const onKeyPress = (event) => {
    if (event.which === 13) {
      event.preventDefault();
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      className="properties_dialog_height"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} validationSchema={FieldSchema} onSubmit={handleSave} validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              title={`${values['fieldLabel']} - ${FieldList[fieldData?.type?.toUpperCase()]?.label} Properties`}
              onClose={() => {
                if (isEqual(values, initialValues)) handleClose();
                setShowConfirmDialog(true);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Box>
                <Form autoComplete="off" autoCorrect="off" noValidate onKeyPress={onKeyPress}>
                  <TextField
                    variant="outlined"
                    type="text"
                    label="Field Label"
                    required={true}
                    name="fieldLabel"
                    fullWidth
                    margin="dense"
                    disabled={!values['editAble']}
                    value={values['fieldLabel']}
                    error={touched['fieldLabel'] && Boolean(errors['fieldLabel'])}
                    helperText={touched['fieldLabel'] && errors['fieldLabel']}
                    onChange={(e) => {
                      setFieldValue('fieldLabel', e.target.value.trimStart());
                    }}
                  />
                  {(module === 'product-template' || module === 'price-template') && (
                    <Box mb={1}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Field Name"
                        name="fieldName"
                        fullWidth
                        margin="dense"
                        disabled={true}
                        value={values['fieldName'] ? values['fieldName'] : camelCase(values['fieldLabel'].replace(/[^a-zA-Z0-9]/g, ''))}
                      />
                      {/* <FormControlLabel
                        control={
                          <Checkbox
                            name="isChangeFieldName"
                            checked={isChangeFieldName}
                            onChange={(e) => setIsChangeFieldName(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Change Field Name"
                      /> */}
                    </Box>
                  )}
                  {values['type'] === 'currencyAmount' && (
                    <Currency
                      values={values}
                      setFieldValue={(name, value) => {
                        if (!isInitialUpdated['Currency']) {
                          setIsInitialUpdated((prevState) => ({ ...prevState, Currency: true }));
                        }
                        setFieldValue(name, value);
                      }}
                      refrence="form-builder"
                      touched={touched}
                      errors={errors}
                    />
                  )}
                  {(values['type'] === 'decimal' ||
                    values['type'] === 'formula' ||
                    values['type'] === 'converter' ||
                    values['type'] === 'percent' ||
                    values['type'] === 'currencyAmount') && (
                      <Grid spacing={3} container>
                        {values['type'] === 'formula' && (
                          <Grid item xs={12} sm={6} md={6}>
                            <FormControl fullWidth margin="dense" variant="outlined">
                              <InputLabel id="demo-simple-select-outlined-label">Return Type</InputLabel>
                              <Select
                                labelId="demo-simple-select-outlined-label"
                                id="demo-simple-select-outlined"
                                value={values['returnType']}
                                onChange={(e) => {
                                  setFieldValue('returnType', e.target.value);
                                }}
                                label="Return Type"
                                name="returnType"
                              >
                                <MenuItem value="decimal">Decimal</MenuItem>
                                <MenuItem value="string">String</MenuItem>
                                <MenuItem value="boolean">Boolean</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        )}
                        {(values['type'] === 'decimal' ||
                          values['type'] === 'converter' ||
                          values['type'] === 'percent' ||
                          values['type'] === 'currencyAmount' ||
                          values['returnType'] === 'decimal') && (
                            <Grid item xs={12} sm={6} md={6}>
                              <DecimalPlaces
                                values={values}
                                setFieldValue={(name, value) => {
                                  setFieldValue(name, value);
                                }}
                              />
                            </Grid>
                          )}
                      </Grid>
                    )}
                  {(values['type'] === 'dropDown' || values['type'] === 'multiSelect') && (
                    <Fragment>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="lookup"
                            checked={values['lookup']}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setFieldValue('lookup', val);
                              if (val) {
                                setFieldValue('addAdditionalOption', false);
                                setFieldValue('addManualOptionInExcel', false);
                                setFieldValue('addBulkOptions', false);
                              }
                            }}
                            color="primary"
                          />
                        }
                        label="Lookup"
                      />
                      {values['lookup'] && (
                        <Box pt={1} pb={1}>
                          <Autocomplete
                            id="lookupResource"
                            options={lookupResource}
                            getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                            getOptionSelected={(option: any, val) => option.optionValue === val}
                            value={lookupResource && lookupResource?.filter((data) => data.optionValue === values['lookupResource'])?.length
                              ? lookupResource && lookupResource?.filter((data) => data.optionValue === values['lookupResource'])[0]
                              : ''
                            }
                            onChange={(e: any, value) => {
                              setFieldValue('lookupResource', value && value?.optionValue ? value.optionValue : '');
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                margin="dense"
                                variant="outlined"
                                label="Lookup Resource"
                                placeholder="Lookup Resource"
                                name="lookupResource"
                                required
                                error={touched['lookupResource'] && Boolean(errors['lookupResource'])}
                                helperText={touched['lookupResource'] && errors['lookupResource']}
                              />
                            )}
                          />
                          <FieldDependent
                            fields={fields}
                            values={values}
                            fieldSet={(name, value) => {
                              setFieldValue(name, value);
                            }}
                          />
                        </Box>
                      )}
                    </Fragment>
                  )}
                  {(values['type'] === 'dropDown' ||
                    values['type'] === 'multiSelect' ||
                    values['type'] === 'radio' ||
                    values['type'] === 'process') &&
                    !values['lookup'] && (
                      <Option
                        values={values}
                        setFieldValue={(name, value) => {
                          if (!isInitialUpdated['dropDown']) {
                            setIsInitialUpdated((prevState) => ({ ...prevState, dropDown: true }));
                          }
                          setFieldValue(name, value);
                        }}
                        fields={fields}
                        _id={fieldData._id}
                      />
                    )}
                  {(values['type'] === 'currencyAmount' ||
                    values['type'] === 'decimal' ||
                    values['type'] === 'percent' ||
                    values['type'] === 'date' ||
                    values['type'] === 'converter') &&
                    isCalculativeField && (
                      <>
                        <br></br>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="isFormula"
                              checked={values['isFormula']}
                              onChange={(e) => {
                                setFieldValue('isFormula', e.target.checked);
                                setFieldValue('inputFields', '');
                                setFieldValue('formula', '');
                              }}
                              color="primary"
                            />
                          }
                          label="Formula"
                        />
                      </>
                    )}
                  {(values['type'] === 'formula' || values['isFormula']) && (
                    <Formula
                      fields={fields}
                      values={values}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                      }}
                      _id={fieldData._id}
                      touched={touched}
                      errors={errors}
                    />
                  )}
                  {(values['type'] === 'currencyAmount' || values['type'] === 'decimal') && (
                    <Fragment>
                      <br></br>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="isConverter"
                            checked={values['isConverter']}
                            onChange={(e) => {
                              setFieldValue('isConverter', e.target.checked);
                              setFieldValue('units', []);
                              setFieldValue('displayUnits', []);
                              setFieldValue('formulaUnits', []);
                            }}
                            color="primary"
                          />
                        }
                        label="Converter"
                      />
                    </Fragment>
                  )}
                  {(values['type'] === 'converter' || values['isConverter']) && (
                    <Converter
                      fields={fields}
                      values={values}
                      setFieldValue={(name, value) => {
                        if (!isInitialUpdated['Converter']) {
                          setIsInitialUpdated((prevState) => ({ ...prevState, Converter: true }));
                        }
                        setFieldValue(name, value);
                      }}
                      touched={touched}
                      errors={errors}
                    />
                  )}
                  {(values['type'] === 'currencyAmount' ||
                    values['type'] === 'decimal' ||
                    values['type'] === 'percent' ||
                    values['type'] === 'converter') &&
                    isCalculativeField && (
                      <>
                        <br></br>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="isMulitFormula"
                              checked={values['isMulitFormula']}
                              onChange={(e) => {
                                setFieldValue('isMulitFormula', e.target.checked);
                                setFieldValue('formulaFields', []);
                                setFieldValue('formulainputFields', []);
                                setFieldValue('formulaoption', {});
                              }}
                              color="primary"
                            />
                          }
                          label="Multiple Formula"
                        />
                      </>
                    )}
                  {values['isMulitFormula'] && (
                    <MultipleFormula
                      fields={fields}
                      values={values}
                      setFieldValue={(name, value) => {
                        if (!isInitialUpdated['MultipleFormula']) {
                          setIsInitialUpdated((prevState) => ({ ...prevState, MultipleFormula: true }));
                        }
                        setFieldValue(name, value);
                      }}
                      _id={fieldData._id}
                      touched={touched}
                      errors={errors}
                    />
                  )}

                  {(values['type'] === 'currencyAmount' ||
                    values['type'] === 'decimal' ||
                    values['type'] === 'percent' ||
                    values['type'] === 'converter') &&
                    isCalculativeField && (
                      <>
                        <br></br>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="isVlookup"
                              checked={values['isVlookup']}
                              onChange={(e) => {
                                setFieldValue('isVlookup', e.target.checked);
                                setFieldValue('isDropdown', false);
                              }}
                              color="primary"
                            />
                          }
                          label="Vlookup"
                        />
                      </>
                    )}
                  {(values['isVlookup'] || values['type'] === 'vlookupDropdown') && (
                    <Vlookup
                      fields={fields}
                      values={values}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                      }}
                      touched={touched}
                      errors={errors}
                      _id={fieldData._id}
                    />
                  )}
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isShowFieldDependentOn"
                        checked={values['isShowFieldDependentOn']}
                        onChange={(e) => {
                          setFieldValue('isShowFieldDependentOn', e.target.checked);
                        }}
                        color="primary"
                      />
                    }
                    label="Show Field Dependent On"
                  />
                  {(values['isShowFieldDependentOn']) && (
                    <ShowFieldDependentOn
                      values={values}
                      name={'showFieldDependentOn'}
                      setFieldValue={setFieldValue}
                      fields={fields}
                      _id={fieldData._id}
                    />
                  )}
                  {(values['type'] === 'converter' || values['type'] === 'formula') && isCalculativeField && (
                    <>
                      <br></br>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="isDropdown"
                            checked={values['isDropdown']}
                            onChange={(e) => {
                              setFieldValue('isDropdown', e.target.checked);
                              setFieldValue('isVlookup', false);
                            }}
                            color="primary"
                          />
                        }
                        label="Dropdown"
                      />
                    </>
                  )}
                  {values['isDropdown'] && (
                    <Option
                      values={values}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                      }}
                      fields={fields}
                      _id={fieldData._id}
                    />
                  )}
                  {fieldData.type === 'lookUpDisplay' && (
                    <Box pt={1} pb={1}>
                      <LookUpDisplay
                        fields={fields}
                        values={values}
                        fieldSet={(name, value) => {
                          setFieldValue(name, value);
                        }}
                      />
                    </Box>
                  )}
                  <Box pt={1} pb={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="required"
                          //disabled={values['required'] ? true : false}
                          checked={values['required']}
                          onChange={(e) => {
                            setFieldValue('required', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Required"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isTooltip"
                          checked={values['isTooltip']}
                          onChange={(e) => {
                            setFieldValue('isTooltip', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Show Tooltip"
                    />
                    {values['isTooltip'] && (
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Tooltip Message"
                        required={true}
                        name="tooltipMessage"
                        fullWidth
                        margin="dense"
                        value={values['tooltipMessage']}
                        error={touched['isTooltip'] && Boolean(errors['tooltipMessage'])}
                        helperText={touched['isTooltip'] && errors['tooltipMessage']}
                        onChange={(e) => {
                          setFieldValue('tooltipMessage', e.target.value.trimStart());
                        }}
                      />
                    )}
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isWarningTooltip"
                          checked={values['isWarningTooltip']}
                          onChange={(e) => {
                            setFieldValue('isWarningTooltip', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Show Warning Tooltip"
                    />
                    {values['isWarningTooltip'] && (
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Warning Tooltip Message"
                        required={true}
                        name="warningTooltipMessage"
                        fullWidth
                        margin="dense"
                        value={values['warningTooltipMessage']}
                        error={touched['warningTooltipMessage'] && Boolean(errors['warningTooltipMessage'])}
                        helperText={touched['warningTooltipMessage'] && errors['warningTooltipMessage']}
                        onChange={(e) => {
                          setFieldValue('warningTooltipMessage', e.target.value.trimStart());
                        }}
                      />
                    )}

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isDefaultValue"
                          disabled={values['type'] === 'freeStyleMultiSelect'}
                          checked={values['isDefaultValue']}
                          onChange={(e) => {
                            setFieldValue('isDefaultValue', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Default Value"
                    />
                    {values['isDefaultValue'] && (
                      <Box display="block">
                        <TextField
                          variant="outlined"
                          type="text"
                          label="Default Value"
                          name="defaultValue"
                          rows={4}
                          fullWidth
                          margin="dense"
                          value={values['defaultValue']}
                          error={touched['defaultValue'] && Boolean(errors['defaultValue'])}
                          helperText={touched['defaultValue'] && errors['defaultValue']}
                          onChange={(e) => {
                            setFieldValue('defaultValue', e.target.value.trimStart());
                          }}
                        />
                      </Box>
                    )}

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isColumnEditable"
                          checked={values['isColumnEditable']}
                          onChange={(e) => {
                            setFieldValue('isColumnEditable', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Editable Column"
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isHideColumnSum"
                          checked={values['isHideColumnSum']}
                          onChange={(e) => {
                            setFieldValue('isHideColumnSum', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Hide Column Sum"
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="Uneditable"
                          disabled={values['type'] === 'freeStyleMultiSelect'}
                          checked={values['isUneditable']}
                          onChange={(e) => {
                            setFieldValue('isUneditable', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Uneditable"
                    />

                    {initialValues?.hasOwnProperty('disableOnEdit') && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="disableEdit"
                            checked={values['disableOnEdit']}
                            onChange={(e) => {
                              setFieldValue('disableOnEdit', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Disable On Edit"
                      />
                    )}

                    {initialValues.hasOwnProperty('unique') && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="isUnique"
                            checked={values['unique']}
                            onChange={(e) => {
                              setFieldValue('unique', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Unique"
                      />
                    )}
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="primaryField"
                          checked={values['primaryField']}
                          onChange={(e) => {
                            setFieldValue('primaryField', e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Primary Field"
                    />
                    {fieldData.type === 'singleLine' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="isSystemGenerate"
                            checked={values['isSystemGenerate']}
                            onChange={(e) => {
                              setFieldValue('isSystemGenerate', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="System Generated"
                      />
                    )}
                    {values['isSystemGenerate'] && (
                      <>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="systemGeneratedAutoIncrement"
                              checked={values['systemGeneratedAutoIncrement']}
                              onChange={(e) => {
                                setFieldValue('systemGeneratedAutoIncrement', e.target.checked);
                              }}
                              color="primary"
                            />
                          }
                          label="System Generated Auto Increment"
                        />
                        <Box display="block">
                          <TextField
                            variant="outlined"
                            type="text"
                            label="System Generated Prefix"
                            name="systemGeneratedPrefix"
                            rows={4}
                            fullWidth
                            margin="dense"
                            value={values['systemGeneratedPrefix']}
                            error={touched['systemGeneratedPrefix'] && Boolean(errors['systemGeneratedPrefix'])}
                            helperText={touched['systemGeneratedPrefix'] && errors['systemGeneratedPrefix']}
                            onChange={(e) => {
                              setFieldValue('systemGeneratedPrefix', e.target.value.trimStart());
                            }}
                          />
                        </Box></>
                    )}
                    {fieldData.type === 'imageUpload' && values['isDefaultValue'] ? (
                      <FormTypes
                        values={{ defaultValue: values['defaultValue'] }}
                        errors={errors}
                        touched={touched}
                        label={''}
                        name={'defaultValue'}
                        type={fieldData.type}
                        setFieldValue={(name, value) => {
                          setFieldValue(name, value);
                        }}
                        isTooltip={false}
                      />
                    ) : fieldData.type === 'colorPicker' && values['isDefaultValue'] ? (
                      <Box>
                        <input
                          value={values['defaultValue']}
                          type="color"
                          onChange={(e) => {
                            setFieldValue('defaultValue', e.target.value);
                          }}
                        />
                        <Box component="span" ml={2}>
                          {values['defaultValue']}
                        </Box>
                      </Box>
                    ) : (fieldData.type === 'dropDown' || fieldData.type === 'multiSelect') && values['isDefaultValue'] && values['lookup'] ? (
                      <ResourceDropdown
                        type={fieldData.type}
                        lookupResource={values['lookupResource']}
                        value={values['defaultValue']}
                        setFieldValue={setFieldValue}
                      />
                    ) : null}
                    {module !== 'price-template' && module !== 'product-template' ? (
                      <FormControlLabel
                        disabled={values['required']}
                        control={
                          <Checkbox
                            name="ishiddenField"
                            checked={values['required'] ? false : values['hiddenField']}
                            onChange={(e) => {
                              setFieldValue('hiddenField', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Hidden Field"
                      />
                    ) : null}
                    {(fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={values?.lookup}
                            name="isAdditionalOption"
                            checked={values['addAdditionalOption']}
                            onChange={(e) => {
                              setFieldValue('addAdditionalOption', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Add Additional Option"
                      />
                    )}
                    {(fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            // disabled={values?.lookup}
                            name="isAddBukOption"
                            checked={values['addBulkOptions']}
                            onChange={(e) => {
                              setFieldValue('addBulkOptions', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Add Bulk Options"
                      />
                    )}
                    {values['lookup'] && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="entityWiseLookup"
                            checked={values['entityWiseLookup']}
                            onChange={(e) => setFieldValue('entityWiseLookup', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Entity Wise Lookup"
                      />
                    )}
                    {fieldData.type === 'dropDown' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={values?.lookup}
                            name="isManualOption"
                            checked={values['addManualOptionInExcel']}
                            onChange={(e) => {
                              setFieldValue('addManualOptionInExcel', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Add Manual Option In Excel"
                      />
                    )}
                    {fieldData.type === 'process' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="showAdditionalInfoPopup"
                            checked={values['showAdditionalInfoPopup']}
                            onChange={(e) => {
                              setFieldValue('showAdditionalInfoPopup', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Show Additional Information Popup On Close"
                      />
                    )}
                    {values['showAdditionalInfoPopup'] && (
                      <Autocomplete
                        value={values['additionalInfoSection']}
                        size="small"
                        options={section.map((s) => s.sectionName)}
                        getOptionLabel={(option) => option}
                        onChange={(event: any, newValue: string | null) => {
                          setFieldValue('additionalInfoSection', newValue);
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="Additional Info Section" variant="outlined" name="additionalInfoSection" />
                        )}
                      />
                    )}
                  </Box>
                  {fieldData.type === 'signature' && <SignatureUser values={values} setFieldValue={setFieldValue} />}
                  {fieldData.type === 'decimal' && <MinMax values={values} setFieldValue={setFieldValue} errors={errors} touched={touched} />}
                  {module === 'form-builder-master' && (
                    <Box>
                      <hr />
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="editAble"
                            checked={values['editAble']}
                            onChange={(e) => {
                              setFieldValue('editAble', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Editable"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="deletAble"
                            checked={values['deletAble']}
                            onChange={(e) => {
                              setFieldValue('deletAble', e.target.checked);
                            }}
                            color="primary"
                          />
                        }
                        label="Deletable"
                      />
                    </Box>
                  )}
                </Form>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                onClick={() => {
                  if (isEqual(values, initialValues)) handleClose();
                  setShowConfirmDialog(true);
                }}
                color="primary"
              >
                Cancel
              </Button>
              <Button size="small" type="submit" color="primary" variant="contained" onClick={submitForm}>
                Save
              </Button>
            </CustomDialogFooter>

            {showConfirmDialog ? (
              <ConfirmCancelDialog
                close={() => setShowConfirmDialog(false)}
                open={showConfirmDialog}
                onSave={() => {
                  setShowConfirmDialog(false);
                  submitForm();
                }}
                onClose={() => {
                  setShowConfirmDialog(false);
                  handleClose();
                }}
              />
            ) : null}
          </>
        )}
      </Formik>
    </Dialog>
  );
};

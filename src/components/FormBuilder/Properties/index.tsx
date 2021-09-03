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
import Chip from '@material-ui/core/Chip';
import FieldList from '../FieldList';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { camelCase } from './../../../constants/helpers';
import { Vlookup } from '../AddField/vlookup';
import { Formula } from '../AddField/formula';
import { Converter } from '../AddField/converter';
import { Option } from '../AddField/option';
import { Currency } from '../AddField/currency';
import { DecimalPlaces } from '../AddField/decimalPlaces';
import { MultipleFormula } from '../AddField/multipleformula';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Autocomplete } from '@material-ui/lab';
import FormTypes from '../../Helpers/FormTypes';
import { startCase } from 'lodash';
import { checkFormula } from '../../../constants/formulaUtility';
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog"

const FieldSchema = Yup.object().shape({
  fieldLabel: Yup.string().required('please enter field label')
});

const LookupResource = [
  { name: 'Supplier Account', value: 'Supplier Account' },
  { name: 'Customer Account', value: 'Customer Account' },
  { name: 'User', value: 'User' },
  { name: 'Supplier Contact', value: 'Supplier Contact' },
  { name: 'Customer Contact', value: 'Customer Contact' },
  { name: 'Brand', value: 'Brand' },
  { name: 'Entity', value: 'Entity' },
  { name: 'Role', value: 'Role' },
  { name: 'Lead', value: 'Lead' },
  { name: 'Opportunity', value: 'Opportunity' },
  { name: 'Product', value: 'Product' },
  { name: 'Product Category', value: 'Product Category' },
  { name: 'Project Sales', value: 'Project Sales' },
  { name: 'Quotes', value: 'Quotes' },
  { name: 'Price Template', value: 'Price Template' },
  { name: 'Product Template', value: 'Product Template' },
  { name: 'Quote Pdf Template', value: 'Quote Pdf Template' },
  { name: 'Budget', value: 'Budget' },
  { name: 'Market Segment', value: 'Market Segment' }
];

export const Properties = ({ module, handleClose, fieldData, sectionId, section, setSection, extraFields }) => {
  const [initialValues, setInitialValues] = useState({ ...fieldData });

  const inputRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState<any>({
    selectionStart: 0,
    selectionEnd: 0
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  //const [isChangeFieldName, setIsChangeFieldName] = useState(true);

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

      if (!values.disableOnEdit && module !== 'price-template' && module !== 'product-template' && module !== 'pdf-template') {
        values.disableOnEdit = false;
      }

      if (!values.isWarningTooltip && module !== 'price-template' && module !== 'product-template' && module !== 'pdf-template') {
        values.isWarningTooltip = false;
        values.warningTooltipMessage = "";

      }

      if (!values.disableOnEdit && module !== 'price-template' && module !== 'product-template' && module !== 'pdf-template') {
        values.disableOnEdit = false;
      }

      if (!values.hiddenField && module !== 'price-template' && module !== 'product-template' && module !== 'pdf-template') {
        values.hiddenField = false;
      }

      if (!values.addAdditionalOption && (fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') && !fieldData.lookup) {
        values.addAdditionalOption = false;
      }

      if (!values.addManualOptionInExcel && (fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') && !fieldData.lookup) {
        values.addManualOptionInExcel = false;
      }

      if (
        !values.unique &&
        (fieldData.type === 'multiLine' || fieldData.type === 'singleLine' || fieldData.type === 'mobileNumber' || fieldData.type === 'number')
      ) {
        values.unique = false;
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
            ele.hiddenField = values.hiddenField;
            ele.showAdditionalInfoPopup = values.showAdditionalInfoPopup;
            ele.additionalInfoSection = values.additionalInfoSection;
            ele.isDefaultValue = values.isDefaultValue;
            ele.disableOnEdit = values.disableOnEdit;
            ele.unique = values.unique;

            if (values.hasOwnProperty('isWarningTooltip')) {
              ele.isWarningTooltip = values.isWarningTooltip
              ele.warningTooltipMessage = values.warningTooltipMessage
            }

            if (values.hasOwnProperty('addAdditionalOption')) {
              ele.addAdditionalOption = values.addAdditionalOption;
            }

            if (ele.isDefaultValue) {
              ele.defaultValue = values.defaultValue;
            } else {
              ele.defaultValue = '';
            }

            // if (isChangeFieldName && values["editAble"] && (module === "product-template" || module === "price-template")) {
            //   ele.fieldName = camelCase(ele.fieldLabel.replace(/[^a-zA-Z0-9]/g, ''))
            // }

            if (fieldData.type === 'dropDown' || fieldData.type === 'multiSelect' || fieldData.type === 'radio' || fieldData.type === 'process') {
              if (fieldData.type === 'dropDown') {
                ele.isDependentDropdown = values.isDependentDropdown;
                ele.dropdowDependentOn = values.dropdowDependentOn;
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
            if (fieldData.type === 'decimal' || fieldData.type === 'converter' || fieldData.type === 'currencyAmount') {
              ele.decimalPlaces = values.decimalPlaces;
            }
            if (values.lookup) {
              ele.lookup = values.lookup;
              ele.lookupResource = values.lookupResource;
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
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true)
        }
      }}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} validationSchema={FieldSchema} onSubmit={handleSave} validate={validate}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Fragment>
            <CustomDialogHeader title={`${FieldList[fieldData.type.toUpperCase()].label} Properties`}
              onClose={() => setShowConfirmDialog(true)}></CustomDialogHeader>
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
                    onChange={(e) => setFieldValue('fieldLabel', e.target.value.trimStart())}
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
                    <Currency values={values} setFieldValue={setFieldValue} refrence="form-builder" touched={touched} errors={errors} />
                  )}
                  {(values['type'] === 'decimal' ||
                    values['type'] === 'formula' ||
                    values['type'] === 'converter' ||
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
                                onChange={(e) => setFieldValue('returnType', e.target.value)}
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
                          values['type'] === 'currencyAmount' ||
                          values['returnType'] === 'decimal') && (
                            <Grid item xs={12} sm={6} md={6}>
                              <DecimalPlaces values={values} setFieldValue={setFieldValue} />
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
                              const val = e.target.checked
                              setFieldValue('lookup', val);
                              if (val) {
                                setFieldValue('addAdditionalOption', false)
                                setFieldValue('addManualOptionInExcel', false)
                              }
                            }}
                            color="primary"
                          />
                        }
                        label="Lookup"
                      />
                      {values['lookup'] && (
                        <Box pt={1} pb={1}>
                          <FormControl fullWidth margin="dense" variant="outlined">
                            <InputLabel id="demo-simple-select-outlined-label">Lookup Resource</InputLabel>
                            <Select
                              labelId="demo-simple-select-outlined-label"
                              id="demo-simple-select-outlined"
                              value={values['lookupResource']}
                              onChange={(e) => setFieldValue('lookupResource', e.target.value)}
                              label="Lookup Resource"
                              name="lookupResource"
                            >
                              {LookupResource.map((_data) => (
                                <MenuItem value={_data.value}>{_data.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    </Fragment>
                  )}
                  {(values['type'] === 'dropDown' ||
                    values['type'] === 'multiSelect' ||
                    values['type'] === 'radio' ||
                    values['type'] === 'process') &&
                    !values['lookup'] && <Option values={values} setFieldValue={setFieldValue} fields={fields} _id={fieldData._id} />}
                  {(values['type'] === 'currencyAmount' ||
                    values['type'] === 'decimal' ||
                    values['type'] === 'percent' ||
                    values['type'] === 'converter') &&
                    module !== 'form-builder' && (
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
                    <Formula fields={fields} values={values} setFieldValue={setFieldValue} _id={fieldData._id} touched={touched} errors={errors} />
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
                    <Converter fields={fields} values={values} setFieldValue={setFieldValue} touched={touched} errors={errors} />
                  )}
                  {(values['type'] === 'currencyAmount' ||
                    values['type'] === 'decimal' ||
                    values['type'] === 'percent' ||
                    values['type'] === 'converter') &&
                    module !== 'form-builder' && (
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
                      setFieldValue={setFieldValue}
                      _id={fieldData._id}
                      touched={touched}
                      errors={errors}
                    />
                  )}

                  {(values['type'] === 'currencyAmount' ||
                    values['type'] === 'decimal' ||
                    values['type'] === 'percent' ||
                    values['type'] === 'converter') &&
                    module !== 'form-builder' && (
                      <>
                        <br></br>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="isVlookup"
                              checked={values['isVlookup']}
                              onChange={(e) => {
                                setFieldValue('isVlookup', e.target.checked);
                              }}
                              color="primary"
                            />
                          }
                          label="Vlookup"
                        />
                      </>
                    )}
                  {(values['isVlookup'] || values['type'] === 'vlookupDropdown') && (
                    <Vlookup fields={fields} values={values} setFieldValue={setFieldValue} touched={touched} errors={errors} _id={fieldData._id} />
                  )}

                  <Box pt={1} pb={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="required"
                          disabled={!values['editAble'] && values['required'] ? true : false}
                          checked={values['required']}
                          onChange={(e) => setFieldValue('required', e.target.checked)}
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
                          onChange={(e) => setFieldValue('isTooltip', e.target.checked)}
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
                        error={touched['tooltipMessage'] && Boolean(errors['tooltipMessage'])}
                        helperText={touched['tooltipMessage'] && errors['tooltipMessage']}
                        onChange={(e) => setFieldValue('tooltipMessage', e.target.value.trimStart())}
                      />
                    )}
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isWarningTooltip"
                          checked={values['isWarningTooltip']}
                          onChange={(e) => setFieldValue('isWarningTooltip', e.target.checked)}
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
                        onChange={(e) => setFieldValue('warningTooltipMessage', e.target.value.trimStart())}
                      />
                    )}

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isDefaultValue"
                          disabled={values['type'] === 'freeStyleMultiSelect'}
                          checked={values['isDefaultValue']}
                          onChange={(e) => setFieldValue('isDefaultValue', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Default Value"
                    />

                    <FormControlLabel
                      control={
                        <Checkbox
                          name="Uneditable"
                          disabled={values['type'] === 'freeStyleMultiSelect'}
                          checked={values['isUneditable']}
                          onChange={(e) => setFieldValue('isUneditable', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Uneditable"
                    />

                    {initialValues.hasOwnProperty('disableOnEdit') && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="disableEdit"
                            checked={values['disableOnEdit']}
                            onChange={(e) => setFieldValue('disableOnEdit', e.target.checked)}
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
                            onChange={(e) => setFieldValue('unique', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Unique"
                      />
                    )}

                    {fieldData.type === 'imageUpload' && values['isDefaultValue'] ? (
                      <FormTypes
                        values={{ defaultValue: values['defaultValue'] }}
                        errors={errors}
                        touched={touched}
                        label={''}
                        name={'defaultValue'}
                        type={fieldData.type}
                        setFieldValue={setFieldValue}
                        isTooltip={false}
                      />
                    ) : values['isDefaultValue'] ? (
                      <Box display="block">
                        {module === 'pdf-template' &&
                          ['multiLine', 'singleLine'].includes(fieldData.type) &&
                          [
                            'entity',
                            'customerAccountName',
                            'quoteDate',
                            'quoteName',
                            'version',
                            'quoteId',
                            'currency',
                            'expiryDate',
                            'incoTerms'
                          ].map((item) => (
                            <Chip
                              className="ml-1 cursor-pointer"
                              key={item}
                              label={startCase(item)}
                              onClick={() => {
                                const value = values?.defaultValue;
                                if (typeof value === 'string') {
                                  const defVal = [
                                    value.slice(0, cursorPosition.selectionStart),
                                    `{{${item}}}`,
                                    value.slice(cursorPosition.selectionStart)
                                  ].join('');

                                  setFieldValue('defaultValue', defVal);
                                }
                              }}
                            />
                          ))}
                        <TextField
                          inputRef={inputRef}
                          variant="outlined"
                          type="text"
                          label="Default Value"
                          required={true}
                          multiline={fieldData.type === 'multiLine'}
                          name="defaultValue"
                          rows={4}
                          fullWidth
                          margin="dense"
                          value={values['defaultValue']}
                          error={touched['defaultValue'] && Boolean(errors['defaultValue'])}
                          helperText={touched['defaultValue'] && errors['defaultValue']}
                          onChange={(e) => {
                            if (module === 'pdf-template') {
                              if (typeof inputRef.current === 'object' && inputRef.current !== null) {
                                const selectionStart = inputRef.current.selectionStart;
                                if (typeof selectionStart === 'number') {
                                  setFieldValue('defaultValue', e.target.value.trimStart());
                                  setCursorPosition({ selectionStart, selectionEnd: selectionStart });
                                }
                              }
                            } else {
                              setFieldValue('defaultValue', e.target.value.trimStart());
                            }
                          }}
                          onClick={(e) => {
                            if (module === 'pdf-template') {
                              if (typeof inputRef.current === 'object' && inputRef.current !== null) {
                                const selectionStart = inputRef.current.selectionStart;
                                const selectionEnd = inputRef.current.selectionEnd;
                                setCursorPosition({
                                  selectionStart,
                                  selectionEnd: selectionEnd
                                });
                              }
                            }
                          }}
                          onKeyPress={(event) => {
                            event.stopPropagation();
                          }}
                        />
                      </Box>
                    ) : null}
                    {module !== 'price-template' && module !== 'product-template' && module !== 'pdf-template' ? (
                      <FormControlLabel
                        disabled={values['required']}
                        control={
                          <Checkbox
                            name="ishiddenField"
                            checked={values['required'] ? false : values['hiddenField']}
                            onChange={(e) => setFieldValue('hiddenField', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Hidden Field"
                      />
                    ) : null}
                    {(fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') && !fieldData.lookup ? (
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={values?.lookup}
                            name="isAdditionalOption"
                            checked={values['addAdditionalOption']}
                            onChange={(e) => setFieldValue('addAdditionalOption', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Add Additional Option"
                      />
                    ) : null}
                    {(fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') && !fieldData.lookup ? (
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={values?.lookup}
                            name="isManualOption"
                            checked={values['addManualOptionInExcel']}
                            onChange={(e) => setFieldValue('addManualOptionInExcel', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Add Manual Option In Excel"
                      />
                    ) : null}
                    {fieldData.type === 'process' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="showAdditionalInfoPopup"
                            checked={values['showAdditionalInfoPopup']}
                            onChange={(e) => setFieldValue('showAdditionalInfoPopup', e.target.checked)}
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
                </Form>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small"
                onClick={() => {
                  setShowConfirmDialog(true)
                }}
                color="primary">
                Cancel
              </Button>
              <Button size="small" type="submit" color="primary" variant="contained"
                onClick={submitForm}>
                Save
              </Button>
            </CustomDialogFooter>
            {
              showConfirmDialog ?
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false)
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false)
                    handleClose()
                  }}
                /> : null
            }
          </Fragment>
        )}
      </Formik>
    </Dialog>
  );
};

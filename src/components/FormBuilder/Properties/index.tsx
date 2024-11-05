import { Box, Button, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { object, string } from 'yup';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { checkFormula } from '../../../constants/formulaUtility';
import { CustomDialogTransition, fieldLabelToFieldName, gridSize } from '../../../constants/helpers';
import FieldList from '../FieldList';
import General from './General';
import Setting from './Setting';
import Visibility from './Visibility';
import Validation from 'src/components/FormBuilder/Properties/Validation';

const FieldSchema = object().shape({
  fieldLabel: string().required('please enter field label')
});

export const Properties = ({ module, handleClose, fieldData, sectionId, section, setSection, extraFields, isCalculativeField, brandId }) => {
  const [initialValues, setInitialValues] = useState({ ...fieldData });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [tabValue, setTabValue] = useState(0);

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
      if (!values.isFieldEntityWise) {
        values.isFieldEntityWise = false;
        values.fieldEntity = [];
      }
      if (!values.lookup) {
        values.lookup = false;
        values.lookupResource = null;
      }
      if (!values.dataList) {
        values.dataList = false;
        values.dataListId = null;
      }
      if (!values.columnSize) {
        values.columnSize = gridSize(fieldData?.type);
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
      if (!values.hiddenField) {
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
        ele.fieldName = fieldLabelToFieldName(ele.fieldLabel);
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
            ele.fieldLabel = values.fieldLabel?.trim();
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
            ele.primaryField = values.primaryField;
            ele.addManualOptionInExcel = values.addManualOptionInExcel;
            ele.addAdditionalOption = values.addAdditionalOption;
            ele.addBulkOptions = values.addBulkOptions;
            ele.lookup = values.lookup || false;
            ele.lookupResource = values.lookup ? values.lookupResource : '';
            ele.dataList = values.dataList || false;
            ele.dataListId = values.dataList ? values.dataListId : '';
            ele.columnSize = values.columnSize || 6;
            ele.preFilters = values.preFilters?.length > 0 ? values.preFilters : [];
            ele.lookupPreFilterFields = values.lookupPreFilterFields?.length > 0 ? values.lookupPreFilterFields : [];
            ele.htmlDescription = values.htmlDescription || '';
            ele.entityWiseLookup = values?.entityWiseLookup || false;
            ele.isMinMaxValue = values?.isMinMaxValue || false;
            ele.minValue = values?.minValue || 0;
            ele.maxValue = values?.maxValue || 0;
            ele.minValueServiceAdd = values.minValueServiceAdd ? values.minValueServiceAdd : '';
            ele.maxValueServiceAdd = values.maxValueServiceAdd ? values.maxValueServiceAdd : '';
            ele.isDropdown = values.isDropdown || false;
            ele.visibilityCondition = values.visibilityCondition?.length > 0 ? values.visibilityCondition?.filter((v) => v?.fields?.length > 0) : [];
            ele.restrictFutureDate = values.restrictFutureDate || false;
            ele.restrictBackDate = values.restrictBackDate || false;
            ele.dateValidation = values.dateValidation?.length > 0 ? values?.dateValidation : [];
            ele.subFields = values.subFields?.length > 0 ? values.subFields : [];
            ele.isSystemGenerate = values?.isSystemGenerate || false;
            if (values.isSystemGenerate) {
              ele.systemGeneratedAutoIncrement = values.systemGeneratedAutoIncrement;
              ele.systemGeneratedPrefix = values.systemGeneratedPrefix;
              ele.systemGeneratedPrefixDigit = values.systemGeneratedPrefixDigit;
              ele.systemGeneratedStartNumber = values.systemGeneratedStartNumber;
            }
            ele.isFieldEntityWise = values?.isFieldEntityWise || false;
            if (ele.isFieldEntityWise) {
              ele.fieldEntity = values.fieldEntity;
            }
            ele.isColumnEditable = values?.isColumnEditable || false;
            ele.stopHideColumn = values?.stopHideColumn || false;
            ele.isHideColumnSum = values?.isHideColumnSum || false;
            ele.showInPdf = values?.showInPdf || false;

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
              ele.option = fieldData?.dataList ? [] : values.option;
            }
            if (
              fieldData.type === 'decimal' ||
              fieldData.type === 'converter' ||
              fieldData.type === 'currencyAmount' ||
              fieldData.type === 'percent'
            ) {
              ele.decimalPlaces = values.decimalPlaces;
            }
            if (fieldData.type === 'formula' || values.isFormula) {
              ele.formula = values.formula;
              ele.inputFields = values.inputFields;
              ele.returnType = values.returnType ? values.returnType : 'decimal';
              ele.decimalPlaces = values.decimalPlaces ? values.decimalPlaces : 2;
            } else {
              ele.formula = '';
              ele.inputFields = [];
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
            } else {
              ele.formulaFields = [];
              ele.formulainputFields = [];
              ele.formulaoption = {};
            }

            if (ele.isDropdown) {
              ele.dropdownOnConverter = values.dropdownOnConverter;
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

  function validate(values, fieldData) {
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

    if (fieldData.type !== 'checkBox') {
      if (values.isDefaultValue && !values.defaultValue) {
        errors['defaultValue'] = 'Please enter default value.';
      }
    }

    if (values.isTooltip && !values.tooltipMessage) {
      errors['tooltipMessage'] = 'Please enter tooltip message.';
    }

    if (values.isWarningTooltip && !values.warningTooltipMessage) {
      errors['warningTooltipMessage'] = 'Please enter warning message.';
    }

    if (values.isFieldEntityWise && !values.fieldEntity?.length) {
      errors['fieldEntity'] = 'Please select Entity.';
    }

    if (values.lookup && !values.lookupResource) {
      errors['lookupResource'] = 'Please select Lopkup Resource.';
    }

    if (values.dataList && !values.dataListId) {
      errors['dataListId'] = 'Please select Data List.';
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

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangeFieldName = (values) => {
    let data = [...section];
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele._id.toString() === values?._id?.toString()) {
            ele.fieldName = values?.fieldName;
          }
        });
      }
    });
    setSection(data);
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
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={FieldSchema}
        onSubmit={handleSave}
        validate={(v) => validate(v, fieldData)}
      >
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
                  <Box pt={1}>
                    <CustomTabs value={tabValue} onChange={handleTabChange}>
                      <CustomTab value={0} label={'General'} />
                      <CustomTab value={1} label={'Visibility'} />
                      {['date', 'dateTime']?.includes(fieldData?.type) && <CustomTab value={2} label={'Validation'} />}
                      <CustomTab value={3} label={'Setting'} />
                    </CustomTabs>
                    <TabPanel value={tabValue} index={0}>
                      <General
                        values={values}
                        setFieldValue={setFieldValue}
                        fields={fields}
                        fieldData={fieldData}
                        touched={touched}
                        errors={errors}
                        module={module}
                        isCalculativeField={isCalculativeField}
                        handleChangeFieldName={handleChangeFieldName}
                      />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                      <Visibility values={values} setFieldValue={setFieldValue} fields={fields} fieldsToExclude={[fieldData?.fieldName]} />
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                      <Validation values={values} setFieldValue={setFieldValue} fields={fields} fieldsToExclude={[fieldData?.fieldName]} />
                    </TabPanel>
                    <TabPanel value={tabValue} index={3}>
                      <Setting
                        initialValues={initialValues}
                        values={values}
                        setFieldValue={setFieldValue}
                        fields={fields}
                        fieldData={fieldData}
                        section={section}
                        touched={touched}
                        errors={errors}
                        module={module}
                        brandId={brandId}
                      />
                    </TabPanel>
                  </Box>
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

import { Box, Button, Checkbox, Dialog, FormControlLabel, Tab, Tabs, TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import TabPanel from 'src/components/TabPanel';
import { CustomDialogTransition, fieldLabelToFieldName } from 'src/constants/helpers';
import { object, string } from 'yup';
import General from './General';
import Setting from './Setting';
import Advanced from './Advanced';

const FieldSchema = object().shape({
  fieldLabel: string().required('please enter field label')
});

const Properties = ({ section, sectionId, setSection, onClose, fieldData }) => {
  const [initialValues, setInitialValues] = useState({ ...fieldData });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (initialValues) {
      const values = initialValues;
      if (!values.isDefaultValue) {
        values.isDefaultValue = false;
        values.defaultValue = '';
      }
      if (!values.isColumnEditable && fieldData.resource === 'Rental Management Product') {
        values.isColumnEditable = false;
      }
      if (!values.disableOnEdit) {
        values.disableOnEdit = false;
      }
      if (!values.isWarningTooltip) {
        values.isWarningTooltip = false;
        values.warningTooltipMessage = '';
      }
      if (!values.disableOnEdit) {
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

  const fields: any = [];
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

  const handleSubmit = (values) => {
    let data = [...section];
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele._id.toString() === fieldData._id.toString()) {
            ele.fieldLabel = values.fieldLabel;
            ele.type = values.type;
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
              ele.option = values.option;
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
          }
        });
      }
    });
    setSection(data);
    onClose();
  };

  const onKeyPress = (event) => {
    if (event.which === 13) {
      event.preventDefault();
    }
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
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
        }
      }}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} validationSchema={FieldSchema} onSubmit={handleSubmit} validate={() => {}}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              title={`${values['fieldLabel']}`}
              onClose={onClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Box>
                <Form autoComplete="off" autoCorrect="off" noValidate onKeyPress={onKeyPress}>
                  <Box pt={2}>
                    <Tabs
                      className="new-tab-container-v1"
                      value={tabValue}
                      onChange={handleTabChange}
                      textColor="primary"
                      TabIndicatorProps={{
                        style: {
                          height: 0
                        }
                      }}
                    >
                      <Tab
                        className={'tabLayout'}
                        style={{ padding: '0px' }}
                        label={<div className="d-flex align-items-center tab-font">General</div>}
                        value={0}
                        aria-controls="a11y-tabpanel-0"
                        id="a11y-tab-0"
                      />
                      <Tab
                        className={'tabLayout'}
                        label={<div className="d-flex align-items-center tab-font">Setting</div>}
                        value={1}
                        aria-controls="a11y-tabpanel-1"
                        id="a11y-tab-1"
                      />
                      <Tab
                        className={'tabLayout'}
                        label={<div className="d-flex align-items-center tab-font">Advanced</div>}
                        value={2}
                        aria-controls="a11y-tabpanel-2"
                        id="a11y-tab-2"
                      />
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                      <General values={values} touched={touched} errors={errors} setFieldValue={setFieldValue} />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                      <Setting
                        fields={fields}
                        fieldData={fieldData}
                        values={values}
                        touched={touched}
                        errors={errors}
                        setFieldValue={setFieldValue}
                      />
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                      <Advanced
                        fields={fields}
                        fieldData={fieldData}
                        values={values}
                        touched={touched}
                        errors={errors}
                        setFieldValue={setFieldValue}
                      />
                    </TabPanel>
                  </Box>
                </Form>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" onClick={onClose} color="primary">
                Cancel
              </Button>
              <Button size="small" type="submit" color="primary" variant="contained" onClick={submitForm}>
                Save
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default Properties;

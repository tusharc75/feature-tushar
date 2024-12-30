import { Collapse } from '@mui/material';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { Form, Formik } from 'formik';
import { isEqual, map, orderBy, sortBy, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { autoCalculateSpecificFields } from '../../constants/formulaUtility';
import { getObjKeys, yupSchema } from '../../constants/helpers';
import HtmlTooltip from '../CustomTooltipTitle';
import { AddField } from '../FormBuilder/AddField';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import FormTypes from '../Helpers/FormTypes';
import { CustomDialogTransition } from './../../constants/helpers';

var levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];

const CreateProduct = ({ productBuilderId, productId, isClone, handleClose, handleSaveProduct, stage }) => {
  const toastConfig = useContext(CustomToastContext);
  const [productFields, setProductFields] = useState([]);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [productData, setProductData] = useState(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [isAddField, setIsAddField] = useState(false);
  const [fields, setFields] = useState([]);
  const [sectionName, setSectionName] = useState('');
  const [fieldChanges, setFieldChanges] = useState([]);

  const ref = useRef(null);
  const [loading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    axiosInstance()
      .get(`/productbuilder/getoneproduct/${productBuilderId}/${productId}`)
      .then(({ data: { data } }) => {
        const productData = data.productData;
        setProductData(productData);
        let _fields = [];
        productData.fields.forEach((_f) => {
          if (stage === 'product') {
            if (_f.leval === 'product' || _f.leval === 'product-custom' || _f.leval === 'product-template' || _f.leval === 'product-builder-custom') {
              _fields.push(_f);
            }
          } else {
            _fields.push(_f);
          }
        });
        if (productData.fieldChanges) {
          setFieldChanges(productData.fieldChanges);
        }
        _fields = orderBy(_fields, 'order', 'asc');
        _fields = sortBy(_fields, function (item) {
          return levalOrderBy.indexOf(item.leval);
        });
        setFields(_fields.filter((_f) => _f.leval === 'product-builder-custom' || _f.leval === 'price-builder-custom'));
        let values = { ...productData };
        delete values.fields;
        setInitialData({
          fields: _fields,
          values: { ...getObjKeys('', _fields), ...values }
        });
        EvaluteproductFields(_fields);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = (values) => {
    values.fields = fields;
    values.fieldChanges = fieldChanges;
    handleSaveProduct([values]);
  };

  const EvaluteproductFields = (fields) => {
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      return { name, sectionFields };
    });
    setProductFields(customData);
    const _expanded = {};
    customData.forEach((ele: any, index) => {
      _expanded[index] = true;
    });
    setExpanded(_expanded);
  };

  const handleOpenAddField = (name) => {
    setSectionName(name);
    setIsAddField(true);
  };

  const handleCloseAddField = () => {
    setSectionName('');
    setIsAddField(false);
  };

  const handleAddField = (field) => {
    field.sectionName = sectionName;
    field.leval = 'price-builder-custom';
    if (productData.fields.filter((_f) => _f.sectionName === sectionName).length) {
      if (productData.fields.filter((_f) => _f.sectionName === sectionName)[0].leval !== 'price-template') {
        field.leval = 'product-builder-custom';
      }
    }
    fields.push(field);
    setFields(fields);
    let newField = initialData.fields;
    newField.push(field);
    var extraCalculatedValue: any = {};
    if (field.type === 'formula' || field.isFormula) {
      var inputValues = {};
      field.inputFields &&
        field.inputFields.forEach((_f) => {
          inputValues[_f] = ref.current.values[_f] ? ref.current.values[_f] : 0;
        });
      extraCalculatedValue = autoCalculateSpecificFields(inputValues, ref.current.values, newField);
    }
    setInitialData({
      fields: newField,
      values: { ...getObjKeys('', newField), ...ref.current.values, ...extraCalculatedValue }
    });
    EvaluteproductFields(newField);
    setSectionName('');
    setIsAddField(false);
  };

  const handleRemoveField = (field) => {
    let newField = initialData.fields.filter((_f) => _f._id !== field._id);
    setInitialData({
      fields: newField,
      values: { ...getObjKeys('', newField), ...ref.current.values }
    });
    setFields(fields.filter((_f) => _f._id !== field._id));
    EvaluteproductFields(newField);
  };

  const addDisplayType = (displayType, field, displayValue) => {
    let _fieldChanges = fieldChanges;
    if (_fieldChanges.filter((_f) => _f.fieldName === field.fieldName).length === 0) {
      if (displayType === 'currency') {
        _fieldChanges.push({
          fieldName: field.fieldName,
          displayCurrency: [displayValue]
        });
      } else if (displayType === 'converter') {
        _fieldChanges.push({
          fieldName: field.fieldName,
          displayUnits: [displayValue]
        });
      }
    } else {
      _fieldChanges.forEach((_f) => {
        if (_f.fieldName === field.fieldName) {
          if (displayType === 'currency') {
            if (_f.displayCurrency) {
              _f.displayCurrency.push(displayValue);
            } else {
              _f.displayCurrency = [displayValue];
            }
          } else if (displayType === 'converter') {
            if (_f.displayUnits) {
              _f.displayUnits.push(displayValue);
            } else {
              _f.displayUnits = [displayValue];
            }
          }
        }
      });
    }
    let newField = initialData.fields;
    newField.forEach((_e) => {
      if (_e.fieldName === field.fieldName) {
        _e.fieldChanges = _fieldChanges.filter((_f) => _f.fieldName === field.fieldName)[0];
      }
    });
    setInitialData({
      fields: newField,
      values: { ...getObjKeys('', newField), ...ref.current.values }
    });
    EvaluteproductFields(newField);
    setFieldChanges(_fieldChanges);
  };

  const removeDisplayType = (displayType, field, displayValue) => {
    let _fieldChanges = fieldChanges;
    _fieldChanges.forEach((_f) => {
      if (_f.fieldName === field.fieldName) {
        if (displayType === 'currency') {
          _f.displayCurrency = _f.displayCurrency.filter((e) => e !== displayValue);
        } else if (displayType === 'converter') {
          _f.displayUnits = _f.displayUnits.filter((e) => e !== displayValue);
        }
      }
    });
    let newField = initialData.fields;
    newField.forEach((_e) => {
      if (_e.fieldName === field.fieldName) {
        _e.fieldChanges = _fieldChanges.filter((_f) => _f.fieldName === field.fieldName)[0];
      }
    });
    setInitialData({
      fields: newField,
      values: { ...getObjKeys('', newField), ...ref.current.values }
    });
    EvaluteproductFields(newField);
    setFieldChanges(_fieldChanges);
  };

  const replaceUnit = (label, unit, sUnit = null, tUnit = null) => {
    if (!['Unit', 'Secondary Unit', 'Tertiary Unit']?.includes(label)) {
      if (label.includes('Secondary Unit') && sUnit) {
        label = `${label.split(' Secondary Unit')[0]} Secondary Unit (${sUnit})`;
      }
      if (!label.includes('Tertiary Unit') && !label.includes('Secondary Unit') && label.includes('Unit') && unit) {
        label = `${label.split(' Unit')[0]} Unit (${unit})`;
      }
      if (label.includes('Tertiary Unit') && tUnit) {
        label = `${label.split(' Tertiary Unit')[0]} Tertiary Unit (${tUnit})`;
      }
      if (!label.includes('Tertiary Unit') && !label.includes('Secondary Unit') && label.includes('Unit') && unit) {
        label = `${label.split(' Unit')[0]} Unit (${unit})`;
      }
    }
    return label;
  };

  const handleExpand = (index) => {
    const temp = { ...expanded };
    temp[index] = !temp[index];
    setExpanded(temp);
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      {initialData && initialData.fields.length ? (
        <Formik
          innerRef={ref}
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm, setValues }) => (
            <Fragment>
              <CustomDialogHeader
                title={`${isClone ? 'Clone' : 'Edit'} Product - ${values?.productName}`}
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    handleClose();
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Box>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    {productFields &&
                      productFields.map((section: any, i) => (
                        <div key={i}>
                          <div className={'detail-box-content detail-product-box'}>
                            <div className={'product-form-layout'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-product'}`}>{section.name}</h2>
                              <IconButton className="p-0" style={{ marginTop: '-5px', color: 'white' }} size="small" onClick={() => handleExpand(i)}>
                                {expanded[i] ? (
                                  <ExpandLess fontSize="medium" style={{ paddingTop: '5px', color: 'white' }} />
                                ) : (
                                  <ExpandMoreIcon fontSize="medium" style={{ paddingTop: '5px', color: 'white' }} />
                                )}
                              </IconButton>
                            </div>
                            <IconButton
                              style={{ padding: '0px', marginTop: '-5px' }}
                              color="primary"
                              size="small"
                              onClick={(e) => handleOpenAddField(section.name)}
                            >
                              <ControlPointIcon style={{ paddingTop: '2px', color: 'white' }} />
                            </IconButton>
                          </div>
                          <Box marginY={2}>
                            <Collapse in={expanded[i]} timeout="auto" unmountOnExit>
                              <Grid spacing={3} container>
                                {section.sectionFields &&
                                  section.sectionFields.map((field) =>
                                    field.type === 'converter' || field.type === 'currencyAmount' || field.isConverter ? (
                                      <FormTypes
                                        style={{ background: field?.isUneditable ? '#1e768221' : '' }}
                                        fields={initialData.fields}
                                        fieldData={field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={
                                          field.isUneditable
                                            ? `${replaceUnit(
                                                field.fieldLabel,
                                                values?.unit,
                                                values?.secondaryUnit,
                                                values?.tertiaryUnit
                                              )} (Auto Calculated Field)`
                                            : replaceUnit(field.fieldLabel, values?.unit, values?.secondaryUnit, values?.tertiaryUnit)
                                        }
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={setFieldValue}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field.isTooltip}
                                        tooltipMessage={field.tooltipMessage}
                                        doNotShowInfoTooltip={true}
                                        size="small"
                                        addDisplayType={addDisplayType}
                                        removeDisplayType={removeDisplayType}
                                        setValues={setValues}
                                        handleRemoveField={handleRemoveField}
                                        disabled={
                                          stage === 'product'
                                            ? ['productCategory', 'productTemplate', 'entity'].includes(field.fieldName)
                                              ? true
                                              : false
                                            : ['productCategory', 'productTemplate', 'entity', 'priceTemplate'].includes(field.fieldName)
                                              ? true
                                              : false
                                        }
                                      />
                                    ) : (
                                      <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                        <Box display="flex">
                                          <Box flexGrow={1}>
                                            <FormTypes
                                              {...field}
                                              style={{ background: field?.isUneditable ? '#1e768221' : '' }}
                                              productTemplateId={values?.productTemplate}
                                              priceTemplateId={values?.priceTemplate}
                                              fields={initialData.fields}
                                              fieldData={field}
                                              values={values}
                                              errors={errors}
                                              touched={touched}
                                              label={
                                                field.isUneditable
                                                  ? `${replaceUnit(
                                                      field.fieldLabel,
                                                      values?.unit,
                                                      values?.secondaryUnit,
                                                      values?.tertiaryUnit
                                                    )} (Auto Calculated Field)`
                                                  : replaceUnit(field.fieldLabel, values?.unit, values?.secondaryUnit, values?.tertiaryUnit)
                                              }
                                              name={field.fieldName}
                                              type={field.type}
                                              options={field.option}
                                              setFieldValue={setFieldValue}
                                              required={field.required}
                                              fullWidth
                                              isTooltip={field.isTooltip}
                                              tooltipMessage={field.tooltipMessage}
                                              decimalPlaces={field.decimalPlaces}
                                              isvlookupReverse={field.isvlookupReverse}
                                              size="small"
                                              disabled={
                                                stage === 'product'
                                                  ? ['productCategory', 'productTemplate', 'entity'].includes(field.fieldName)
                                                    ? true
                                                    : false
                                                  : ['productCategory', 'productTemplate', 'entity', 'priceTemplate'].includes(field.fieldName)
                                                    ? true
                                                    : false
                                              }
                                              imageOrFileUploadCompletePercentage={
                                                ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                                  ? (completePercentage) => {
                                                      setUploadingImageOrFileProgress(completePercentage);
                                                    }
                                                  : null
                                              }
                                              setValues={setValues}
                                            />
                                          </Box>
                                          {(field.leval === 'product-builder-custom' || field.leval === 'price-builder-custom') && (
                                            <Box>
                                              <HtmlTooltip title="Remove" className="mt-1">
                                                <IconButton onClick={() => handleRemoveField(field)} color="primary" size="small">
                                                  <HighlightOffIcon color="error" />
                                                </IconButton>
                                              </HtmlTooltip>
                                            </Box>
                                          )}
                                        </Box>
                                      </Grid>
                                    )
                                  )}
                              </Grid>
                            </Collapse>
                          </Box>
                        </div>
                      ))}
                  </Form>
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      handleClose();
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={loading}
                  buttonType="theme"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={uploadingImageOrFileProgress > 0}
                >
                  {' '}
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
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
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {isAddField && (
        <AddField refrence="formAdd" fieldData={null} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={initialData.fields} />
      )}
    </Dialog>
  );
};

export default CreateProduct;

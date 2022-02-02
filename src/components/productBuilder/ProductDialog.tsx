import { useRef, useState, useEffect, Fragment, useContext } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import ConfirmationDialog from "../Helpers/ConfirmationDialog";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import FormTypes from '../Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import axiosInstance from '../../axios/axiosInstance';
import { getObjKeys, yupSchema } from '../../constants/helpers';
import CustomButton from '../Helpers/CustomButton';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import IconButton from '@material-ui/core/IconButton';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { AddField } from '../FormBuilder/AddField';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from './../../constants/helpers';
import Tooltip from '@material-ui/core/Tooltip';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { autoCalculateSpecificFields } from '../../constants/formulaUtility';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLess from '@material-ui/icons/ExpandLess';
import { Collapse } from '@material-ui/core';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { FaDiceOne } from 'react-icons/fa';
import { uniq, map, orderBy, sortBy, isEqual } from 'lodash';
import ManageAccountDialog from '../../pages/Account/ManageAccount';
import AddIcon from '@material-ui/icons/AddCircle';
import InfoIcon from '@material-ui/icons/Info';
var levalOrderBy = ['product', 'product-custom', 'product-template', 'price-template', 'product-builder-custom', 'price-builder-custom'];

const CreateProduct = ({ productBuilderId, productId, isClone, handleClose, handleSaveProduct, stage }) => {
  const toastConfig = useContext(CustomToastContext);
  const [showCloseConfirmBox,setShowCloseConfirmBox] = useState(false);
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

  const [showAccountCreateDialog, setShowAccountCreateDialog] = useState(false);

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

  const replaceUnit = (label, unit, sUnit = null) => {
    if (label !== 'Secondary Unit') {
      if (label.includes('Secondary Unit') && sUnit) {
        label = `${label.split(' Secondary Unit')[0]} Secondary Unit (${sUnit})`;
      }

      if (!label.includes('Secondary Unit') && label.includes('Unit') && unit) {
        if (label !== 'Unit') {
          label = `${label.split(' Unit')[0]} Unit (${unit})`;
        }
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
                    setShowCloseConfirmBox(true);
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
                                            ? `${replaceUnit(field.fieldLabel, values?.unit, values?.secondaryUnit)} (Auto Calculated Field)`
                                            : replaceUnit(field.fieldLabel, values?.unit, values?.secondaryUnit)
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
                                    ) : field.fieldName === 'supplier' ? (
                                      <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                        <Box display="flex">
                                          <FormTypes
                                            {...field}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={field.option}
                                            onChange={(e, value) => {
                                              setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                            }}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                            doNotShowInfoTooltip={true}
                                          />
                                          {permissions.supplierAccount.isCreate && (
                                            <Grid>
                                              <Tooltip title="Create Account" className="mt-1">
                                                <IconButton
                                                  onClick={() => {
                                                    setShowAccountCreateDialog(true);
                                                  }}
                                                  size="small"
                                                >
                                                  <AddIcon color={'primary'} />
                                                </IconButton>
                                              </Tooltip>
                                            </Grid>
                                          )}
                                          {field?.tooltipMessage ? (
                                            <Grid>
                                              <Tooltip title={field?.tooltipMessage ?? ''}>
                                                <InfoIcon color="disabled" />
                                              </Tooltip>
                                            </Grid>
                                          ) : null}
                                        </Box>
                                      </Grid>
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
                                                  ? `${replaceUnit(field.fieldLabel, values?.unit, values?.secondaryUnit)} (Auto Calculated Field)`
                                                  : replaceUnit(field.fieldLabel, values?.unit, values?.secondaryUnit)
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
                                              <Tooltip title="Remove" className="mt-1">
                                                <IconButton onClick={() => handleRemoveField(field)} color="primary" size="small">
                                                  <HighlightOffIcon color="error" />
                                                </IconButton>
                                              </Tooltip>
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
                    {showAccountCreateDialog && (
                      <ManageAccountDialog
                        open={showAccountCreateDialog}
                        onClose={() => {
                          setShowAccountCreateDialog(false);
                        }}
                        accountResource={'supplierAccount'}
                        accountApi={'supplier-account'}
                        isRedirectToDetailPage={false}
                        onSuccess={({ data }) => {
                          setShowAccountCreateDialog(false);
                          if (data._id) {
                            setFieldValue('supplier', data._id);
                            const fields = [...productFields];
                            fields.forEach((s) => {
                              s.sectionFields.forEach((f: any) => {
                                if (f.fieldName === 'supplier') {
                                  f.option = [
                                    ...f.option,
                                    {
                                      optionLabel: data?.accountName,
                                      optionValue: data?._id
                                    }
                                  ];
                                }
                              });
                            });
                            setProductFields(fields);
                          }
                        }}
                      />
                    )}
                  </Form>
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      setShowCloseConfirmBox(true);
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={uploadingImageOrFileProgress > 0}
                >
                  {' '}
                  Save
                </CustomButton>
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

              {showCloseConfirmBox && (
                <ConfirmationDialog
                  open={showCloseConfirmBox}
                  message={`Are you sure you want to leave this dialouge?`}
                  onClose={() => {
                    setShowCloseConfirmBox(false);
                  }}
                  onOk={() => {
                    setShowCloseConfirmBox(false);
                    handleClose();
                  }}
                />
              )}
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500} bgcolor="white">
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

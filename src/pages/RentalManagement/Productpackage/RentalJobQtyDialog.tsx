import { FC, useEffect, useState, Fragment, useRef, useContext } from 'react';
import { Button, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { isArray, unionBy, uniqBy } from 'lodash';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema, fieldLabelToFieldName } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, arrayToDropwdownOption } from '..//../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from '../../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { uniq, map, orderBy, isEqual } from 'lodash';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import moment from 'moment';
import {
  calculatePrice,
  calculateRowsField,
  fetch_rental_product_fields,
  resetValueZero,
  sumOnParent
} from '../../../components/RentalManagment/helper';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

interface EditDialogProps {
  onClose: VoidFunction | any;
  handleSaveData: VoidFunction | any;
  rentalManagementData: any;
  rowData?: object | any;
  material: any[];
  selectedProducts: any[];
  isBulkedit: any;
  loading: any;
  from?: any;
  isQtyOnly?: Boolean;
  isInlineEdit?: Boolean;
  showSaveAndNext?: Boolean;
  isRateRequired: Boolean;
}

const rateChangeFields = ['unit', 'pricingMethod', 'pricingCondition'];

const RentalJobQtyDialog: FC<EditDialogProps> = ({
  onClose,
  handleSaveData,
  rentalManagementData,
  rowData,
  material,
  selectedProducts,
  isBulkedit,
  loading,
  isRateRequired,
  isQtyOnly = false,
  from,
  isInlineEdit = false,
  showSaveAndNext = false
}) => {
  const ref = useRef(null);

  const toastConfig = useContext(CustomToastContext);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const { isOffline } = useContext(CustomOfflineContext);

  const [priceConditionListConst, setPriceConditionListConst] = useState([]);
  const [priceMethodListConst, setPriceMethodListConst] = useState([]);
  const [priceConditionList, setPriceConditionList] = useState([]);
  const [priceMethodList, setPriceMethodList] = useState([]);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchData();
  }, [rowData]);

  const fetchTaxRate = async (address: any) => {
    const zipCode = address?.zipCode;
    const state = address?.state;
    const county = address?.county;
    let materialType;
    if (isBulkedit) materialType = rowData[0]?.type;
    else materialType = rowData?.type;
    try {
      const response = await axiosInstance().get(
        `${routes?.taxMaster.path}/by-zipcode?zipCode=${zipCode}&state=${state}&county=${county}&materialType=${materialType}`
      );
      return response?.data?.data || [];
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  useEffect(() => {
    if (ref.current && Object.keys(initialData).length > 0 && isInlineEdit) {
      const { setErrors, setTouched } = ref.current;
      let errors: any = {};
      let touched: any = {};
      initialData.fields.forEach(({ fieldName, required, fieldLabel }) => {
        if (required && !initialData.values[fieldName]) {
          errors[fieldName] = fieldLabel + ' is a required field';
          touched[fieldName] = true;
        }
      });
      setErrors(errors);
      setTouched(touched);
    }
  }, [initialData, ref.current, isInlineEdit]);

  const fetchData = async () => {
    setFetchingData(true);
    var data = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    setAllFields(JSON.parse(JSON.stringify(data)));
    if (isBulkedit) {
      let unitArray: any = [];
      let pricingMethodArray: any = [];
      selectedProducts?.forEach((element) => {
        if (element?.[`${element.type}Detail`]?.unit) {
          unitArray.push([...element?.[`${element?.type}Detail`]?.unit]);
        }
        if (element?.[`${element.type}Detail`]?.pricingMethod) {
          pricingMethodArray.push([...element?.[`${element?.type}Detail`]?.pricingMethod]);
        }
      });
      let unit: any = unitArray?.shift()?.filter(function (v) {
        return unitArray?.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      let pricingMethod: any = pricingMethodArray?.shift()?.filter(function (v) {
        return pricingMethodArray?.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      const unitOptions: any = arrayToDropwdownOption(unit);
      const pricingMethodOptions: any = arrayToDropwdownOption(pricingMethod);
      data.forEach((element) => {
        if (element.fieldName === 'unit') {
          element.option = unitOptions;
        }
        if (element.fieldName === 'pricingMethod') {
          element.option = pricingMethodOptions;
        }
        if (element.fieldName === 'pricingCondition') {
          element.option = [];
        }
        if (element.fieldName === 'wellNumber' && isArray(rentalManagementData?.wellNumber)) {
          element.option = element.option?.filter((ele) => rentalManagementData?.wellNumber?.map((e) => e.optionValue)?.includes(ele.optionValue));
        }
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      });
      data = data.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: data,
        values: {
          ...getObjKeys('', data),
          estimateStartDate: '',
          estimateEndDate: '',
          actualStartDate: '',
          actualEndDate: '',
          estimateJobDuration: '',
          actualJobDuration: ''
        }
      });
    } else {
      let unitOptions: any = [];
      let pricingMethodOptions: any = [];
      if (rowData?.[`${rowData.type}Detail`]?.unit) {
        unitOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`].unit);
      }
      if (rowData?.[`${rowData.type}Detail`]?.pricingMethod) {
        pricingMethodOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`]?.pricingMethod);
      }
      setPriceMethodListConst(pricingMethodOptions);
      await getAllPricingCondition(rowData, unitOptions, pricingMethodOptions);
      data.forEach((element) => {
        if (element.fieldName === 'unit') {
          element.option = unitOptions;
        }
        if (element.fieldName === 'pricingMethod') {
          element.option = pricingMethodOptions;
        }
        if (element.fieldName === 'wellNumber' && isArray(rentalManagementData?.wellNumber)) {
          element.option = element.option?.filter((ele) => rentalManagementData?.wellNumber?.map((e) => e.optionValue)?.includes(ele.optionValue));
        }
      });
      if (rowData?.actualStartDate === '' || rowData?.actualStartDate === '') {
        data = data.filter((e) => !['actualStartDate', 'actualEndDate', 'actualJobDuration'].includes(e.fieldName));
      }
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(rowData, data)
      });
    }
    EvaluteproductFields(data);
    setFetchingData(false);
  };

  const EvaluteproductFields = async (fields) => {
    if (isQtyOnly) {
      fields = fields.filter((d) => d.fieldName === 'qty');
    }
    if (isBulkedit && (from === 'product' || from === 'service')) {
      fields = fields.filter((d) => d.fieldName !== 'pricingCondition' && d.fieldName !== 'pricingMethod');
    }

    const taxApplicableField = user?.user?.brandPolicy?.rentalTaxAppliedOn && user?.user?.brandPolicy?.rentalTaxAppliedOn !== '' ?
      fieldLabelToFieldName(user?.user?.brandPolicy?.rentalTaxAppliedOn) : 'billingAddress'

    if (rentalManagementData?.customerAccount?.taxApplicable &&
      (rentalManagementData?.[taxApplicableField]?.zipCode || rentalManagementData?.[taxApplicableField]?.state || rentalManagementData?.[taxApplicableField]?.county)
    ) {
      const taxCodeOptions = await fetchTaxRate(rentalManagementData?.[taxApplicableField]);
      fields?.forEach((e: any) => {
        if (e?.fieldName === 'taxCode') {
          e.option = taxCodeOptions;
        }
      });
    }

    const sections = uniq(
      map(
        fields?.filter((f) => f?.isRead),
        'sectionName'
      )
    );
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name && field?.isRead);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    setFields(customData);
  };

  const getTitle = () => {
    if (isBulkedit) {
      return 'Bulk Edit';
    }
    if (rowData) {
      let editTitle = `Edit ${showSaveAndNext ? `-${rowData.index}` : ''} -${rowData.detail}`;
      if (rowData.subRows && rowData.subRows?.length > 0) {
        editTitle = `Edit ${showSaveAndNext ? `-${rowData.index}` : ''} -${rowData.detail}`;
      }
      return editTitle;
    } else {
      return 'Edit';
    }
  };

  const handleSubmit = async (values) => {
    const currency = rentalManagementData?.currency?.toLowerCase();
    if (isBulkedit) {
      for (const x in values) {
        if (values[x] === '' || (Array.isArray(values[x]) && values[x].length === 0) || values[x] === 0) {
          delete values[x];
        }
      }
      let rows: any = [];
      let priceData: any = [];
      const priceFieldName = `price_${currency}`;
      const fieldAll: any = allFields.filter((e) => !['actualStartDate', 'actualEndDate', 'actualJobDuration'].includes(e.fieldName));

      if ((values['unit'] || values['pricingMethod']) && !values[priceFieldName]) {
        const material: any = [];
        selectedProducts.forEach((d) => {
          const element: any = {};
          element.materialId = d.materialId;
          element.type = d.type;
          element.unit = values['unit'] || d.unit;
          element.pricingMethod = values['pricingMethod'] || d.pricingMethod;
          element.qty = d.qty;
          material.push(element);
        });
        priceData = await calculatePrice(rentalManagementData, material);
      }

      selectedProducts
        ?.filter((d) => !selectedProducts.some((obj) => obj._id === d.parentId))
        ?.forEach((element) => {
          const rateResult = priceData?.filter(
            (e) =>
              e.materialId === element.materialId &&
              e.materialType === element.type &&
              e.unit === (values['unit'] || element.unit) &&
              e.pricingMethod === (values['pricingMethod'] || element.pricingMethod)
          );

          const tempRate = {};
          if (rateResult.length && rateResult[0].mrp) {
            tempRate[priceFieldName] = rateResult[0].mrp;
          }

          const calValues = autoCalculateSpecificFields(values, { ...element, ...values, ...tempRate }, fieldAll);
          rows.push({ ...element, ...calValues });

          const child: any = resetValueZero(material, allFields, element._id);
          rows = [...rows, ...child];
          if (element.parentId) {
            var parent: any = unionBy(rows, material, '_id').filter((e) => e._id === element.parentId);
            const sameParent: any = unionBy(rows, material, '_id').filter((e) => e.parentId === element.parentId && e._id !== element._id);
            parent = sumOnParent(parent, [...sameParent, { ...element, ...calValues }], allFields, currency);
            rows = [...rows, ...parent];
          }
        });

      //Code for Bulk Update Only Product in Packages
      let packageProducts = selectedProducts.filter((ele) => ele.parentId !== null && !selectedProducts.some((f) => f._id === ele.parentId));
      if (packageProducts.length) {
        const packageIds = uniq(map(packageProducts, 'parentId'));
        packageIds.forEach((_packageId) => {
          var packages: any = material.filter((e) => e._id === _packageId);
          const product: any = material.filter((e) => e.parentId === _packageId);
          product.forEach((element) => {
            if (packageProducts.filter((e) => element._id === e._id).length) {
              const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, fieldAll);
              rows.push({ ...element, ...calValues });
              for (var key in calValues) {
                element[key] = calValues[key];
              }
            }
          });
          packages = sumOnParent(packages, product, allFields, currency);
          rows = [...rows, ...packages];
        });
      }
      const updatedRows: any = [];
      rows?.forEach((ele) => {
        updatedRows.push({ _id: ele._id, ...getObjKeysWithValues(ele, allFields) });
      });
      handleSaveData(updatedRows);
    } else {
      if (rowData.parentId && !showConfirmationDialog && isRateRequired) {
        setShowConfirmationDialog(true);
      } else {
        const rows = await calculateRowsField(material, values, allFields, rowData);
        handleSaveData(rows, saveAndNext);
        setShowConfirmationDialog(false);
      }
    }
  };

  async function getAllPricingCondition(values: any, unitOptions: any, pricingMethodOptions: any) {
    if (rowData) {
      const priceData: any = await calculatePrice(rentalManagementData, [
        {
          materialId: rowData.materialId,
          type: rowData.type,
          qty: 1,
          pricingMethod: pricingMethodOptions?.map((d) => d.optionLabel).join() || '',
          unit: unitOptions?.map((d) => d.optionLabel)
        }
      ]);
      setPriceConditionListConst(priceData || []);
      updateRateChangeState(values, priceData, pricingMethodOptions);
    }
  }

  const updateRateChangeState = (values: any, priceData: any, pricingMethodOptions: any) => {
    var tempPriceCondition = [...priceData];
    if (values['unit'] && values['unit'] !== '') {
      tempPriceCondition = tempPriceCondition?.filter((e) => e.unit === values['unit']);
    }
    if (values['pricingMethod'] && values['pricingMethod'] !== '') {
      tempPriceCondition = tempPriceCondition?.filter((e) => e.pricingMethod === values['pricingMethod']);
    }
    tempPriceCondition = uniqBy(
      tempPriceCondition?.map((d) => {
        return {
          optionLabel: d?.conditionName,
          optionValue: d?.conditionId
        };
      }),
      'optionValue'
    );
    setPriceConditionList(tempPriceCondition);
    var tempPricingMethod = pricingMethodOptions;
    if (values['pricingCondition'] && values['pricingCondition'] !== '') {
      tempPricingMethod = uniqBy(
        priceData
          ?.filter((d) => d.conditionId === values['pricingCondition'] || values['pricingCondition']?.optionValue)
          ?.map((d) => {
            return {
              optionLabel: d?.pricingMethod,
              optionValue: d?.pricingMethod
            };
          }),
        'optionValue'
      );
    }
    setPriceMethodList(tempPricingMethod);

    return { tempPriceCondition, tempPricingMethod };
  };

  function validate(values) {
    const errors = {};
    let estimateStartDate = moment(values?.estimateStartDate);
    let estimateEndDate = moment(values?.estimateEndDate);
    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }
    let rentalManagementEstimateStartDate = moment(rentalManagementData?.estimateStartDate);
    let rentalManagementEstimateEndDate = moment(rentalManagementData?.estimateEndDate);
    if (estimateStartDate.diff(rentalManagementEstimateStartDate, 'days') < 0) {
      errors['estimateStartDate'] = 'Please enter valid estimate start date';
    }
    if (estimateEndDate.diff(rentalManagementEstimateEndDate, 'days') > 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }
    if (rowData && rowData.hideSelection) {
      if (rowData.parentId) {
        const _package = material?.filter((e) => e._id === rowData.parentId);
        if (_package.length) {
          if (values.qty * _package[0].qty < rowData.assetQty || values.qty * _package[0].qty < rowData.nonSerializedQty) {
            errors['qty'] = 'The quantity is less than what was assigned.';
          }
        }
      } else {
        if (values.qty < rowData.assetQty || values.qty < rowData?.nonSerializedQty) {
          errors['qty'] = 'The quantity is less than what was assigned.';
        }
      }
    }
    if (isQtyOnly && rowData && values.qty > rowData.qty) {
      errors['qty'] = `Quantity can not be greater than ${rowData?.qty}`;
    }
    if (isQtyOnly && rowData && values.qty <= 0) {
      errors['qty'] = `Quantity should be greater than 0`;
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      {initialData && !fetchingData && initialData.fields.length ? (
        <Formik
          innerRef={ref}
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields?.filter((f) => f?.isRead))}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={getTitle()}
                onClose={() => {
                  if (!isEqual(ref?.current?.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                {isBulkedit && <h6 className="form-label-style mb-2">* Please enter value you want to bulk update.</h6>}
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {fields &&
                    fields.map((section, i) => (
                      <div key={i}>
                        <div className={'detail-box-content detail-product-box'}>
                          <div className={'product-form-layout'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-product'}`}>{section.name}</h2>
                          </div>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {section.sectionFields &&
                              section.sectionFields.map((field) =>
                                field.type === 'converter' || field.type === 'currencyAmount' || field.isConverter ? (
                                  <FormTypes
                                    fields={initialData.fields}
                                    fieldData={{ ...field, hideConverter: true }}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field.isTooltip}
                                    tooltipMessage={field.tooltipMessage}
                                    size="small"
                                  />
                                ) : rateChangeFields.includes(field.fieldName) && !isBulkedit ? (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    <Box display="flex">
                                      <Box flexGrow={1}>
                                        <FormTypes
                                          {...field}
                                          fields={initialData.fields}
                                          fieldData={field}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          options={
                                            field.fieldName === 'pricingCondition'
                                              ? priceConditionList
                                              : field.fieldName === 'pricingMethod'
                                                ? priceMethodList
                                                : field.option
                                          }
                                          onChange={(e, val) => {
                                            const value = val && val.optionValue ? val.optionValue : '';
                                            const { tempPriceCondition, tempPricingMethod } = updateRateChangeState(
                                              { ...values, [field.fieldName]: value },
                                              priceConditionListConst,
                                              priceMethodListConst
                                            );
                                            if (values['pricingCondition']) {
                                              if (!tempPriceCondition?.find((e) => e.optionValue === values['pricingCondition'])) {
                                                setFieldValue('pricingCondition', '');
                                                setPriceMethodList(priceMethodListConst);
                                              }
                                            }
                                            if (values['pricingMethod']) {
                                              if (!tempPricingMethod?.find((e) => e.optionValue === values['pricingMethod'])) {
                                                setFieldValue('pricingMethod', '');
                                              }
                                            }
                                            let priceValue;
                                            if (field.fieldName === 'pricingCondition') {
                                              priceValue = priceConditionListConst?.find(
                                                (d) =>
                                                  d.conditionId === value && d.pricingMethod === values['pricingMethod'] && d.unit === values['unit']
                                              );
                                            } else if (field.fieldName === 'pricingMethod') {
                                              priceValue = priceConditionListConst?.find(
                                                (d) =>
                                                  d.conditionId === values['pricingCondition'] &&
                                                  d.pricingMethod === value &&
                                                  d.unit === values['unit']
                                              );
                                            } else {
                                              priceValue = priceConditionListConst?.find(
                                                (d) =>
                                                  d.conditionId === values['pricingCondition'] &&
                                                  d.pricingMethod === values['pricingMethod'] &&
                                                  d.unit === value
                                              );
                                            }
                                            let priceFieldName = 'price_' + rentalManagementData?.currency?.toLowerCase();
                                            const result = autoCalculateSpecificFields(
                                              { [priceFieldName]: priceValue?.mrp || 0, [field.fieldName]: value },
                                              values,
                                              initialData.fields
                                            );
                                            if (Object.keys(result).length >= 1) {
                                              for (var x in result) {
                                                setFieldValue(x, result[x]);
                                              }
                                            }
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field.isTooltip}
                                          tooltipMessage={field.tooltipMessage}
                                          size="small"
                                        />
                                      </Box>
                                    </Box>
                                  </Grid>
                                ) : ['estimateStartDate', 'estimateEndDate'].includes(field.fieldName) ? (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    <Box display="flex">
                                      <Box flexGrow={1}>
                                        <FormTypes
                                          {...field}
                                          fields={initialData.fields}
                                          fieldData={field}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field.isTooltip}
                                          tooltipMessage={field.tooltipMessage}
                                          size="small"
                                          minDate={rentalManagementData?.estimateStartDate}
                                          maxDate={rentalManagementData?.estimateEndDate}
                                        />
                                      </Box>
                                    </Box>
                                  </Grid>
                                ) : ['taxCode'].includes(field.fieldName) ? (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    <Box display="flex">
                                      <Box flexGrow={1}>
                                        <FormTypes
                                          {...field}
                                          fields={initialData.fields}
                                          fieldData={field}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                            const taxCode = field.option?.find((d) => d.optionValue === value);
                                            setFieldValue('taxPercentage', taxCode?.taxRate || 0);
                                            const result = autoCalculateSpecificFields(
                                              { ['taxPercentage']: taxCode?.taxRate || 0 },
                                              values,
                                              initialData.fields
                                            );
                                            if (Object.keys(result).length >= 1) {
                                              for (var x in result) {
                                                setFieldValue(x, result[x]);
                                              }
                                            }
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field.isTooltip}
                                          tooltipMessage={field.tooltipMessage}
                                          size="small"
                                        />
                                      </Box>
                                    </Box>
                                  </Grid>
                                ) : (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    <Box display="flex">
                                      <Box flexGrow={1}>
                                        <FormTypes
                                          {...field}
                                          fields={initialData.fields}
                                          fieldData={field}
                                          values={values}
                                          errors={errors}
                                          touched={touched}
                                          label={field.fieldLabel}
                                          name={field.fieldName}
                                          type={field.type}
                                          options={field.option}
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          required={field.required}
                                          fullWidth
                                          isTooltip={field.isTooltip}
                                          tooltipMessage={field.tooltipMessage}
                                          size="small"
                                        />
                                      </Box>
                                    </Box>
                                  </Grid>
                                )
                              )}
                          </Grid>
                        </Box>
                      </div>
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  id="rental-job-qty-dialog-close-button"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  {'Close'}
                </Button>
                {isBulkedit === false && showSaveAndNext && (
                  <CustomButton
                    loading={loading}
                    disabled={loading || (isQtyOnly ? false : isEqual(ref?.current?.values, initialData.values))}
                    variant="contained"
                    color="primary"
                    type="submit"
                    id="rental-job-qty-dialog-save-and-next-button"
                    onClick={() => {
                      setSaveAndNext(true);
                      submitForm();
                    }}
                  >
                    {' '}
                    Save & Next
                  </CustomButton>
                )}
                <CustomButton
                  loading={loading}
                  disabled={loading || (isQtyOnly ? false : isEqual(ref?.current?.values, initialData.values))}
                  variant="contained"
                  color="primary"
                  type="submit"
                  id="rental-job-qty-dialog-save-button"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmationDialog && (
                <ConfirmationDialog
                  open={showConfirmationDialog}
                  message="Would you prefer to override the product-level price configuration?"
                  onOk={() => {
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmationDialog(false);
                  }}
                />
              )}
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
                    onClose();
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
    </Dialog>
  );
};

export default RentalJobQtyDialog;

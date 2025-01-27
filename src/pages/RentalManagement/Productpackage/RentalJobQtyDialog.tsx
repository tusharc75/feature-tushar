import { FC, useEffect, useState, Fragment, useRef, useContext } from 'react';
import { Dialog, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { isArray, uniqBy } from 'lodash';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema, fieldLabelToFieldName } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, arrayToDropwdownOption } from '..//../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from '../../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { uniq, map, orderBy, isEqual } from 'lodash';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { bulkUpdate, calculatePrice, calculateRowsField, fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';
import SelectionConfirmationDialog from 'src/components/Helpers/SelectionConfirmationDialog';
import { getParentMultiplier } from 'src/pages/RentalManagement/rentalOfflineHelper';

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
  dataRows?: any
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
  showSaveAndNext = false,
  dataRows = []
}) => {
  const ref = useRef(null);

  const toastConfig = useContext(CustomToastContext);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState({ open: false, type: '' });
  const [showSelectionConfirmationDialog, setShowSelectionConfirmationDialog] = useState({ open: false, type: '' });

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

  const fetchTaxRate = async (address: any, taxCode: any) => {
    const zipCode = address?.zipCode;
    const state = address?.state;
    const county = address?.county;
    let api = `${routes?.taxMaster.path}/by-zipcode?zipCode=${zipCode}&state=${state}&county=${county}`
    if (!isBulkedit) {
      api += `&materialType=${rowData?.type}`
    }
    if (taxCode) {
      api += `&taxCode=${taxCode}`
    }
    try {
      const response = await axiosInstance().get(api);
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

    if (!rentalManagementData?.taxCode?.optionValue) {
      const taxApplicableField =
        user?.user?.brandPolicy?.rentalTaxAppliedOn && user?.user?.brandPolicy?.rentalTaxAppliedOn !== ''
          ? fieldLabelToFieldName(user?.user?.brandPolicy?.rentalTaxAppliedOn)
          : 'billingAddress';

      if (rentalManagementData?.customerAccount?.taxApplicable &&
        (rentalManagementData?.[taxApplicableField]?.zipCode ||
          rentalManagementData?.[taxApplicableField]?.state ||
          rentalManagementData?.[taxApplicableField]?.county)
      ) {
        const taxCodeOptions = await fetchTaxRate(rentalManagementData?.[taxApplicableField], rentalManagementData?.taxCode?.optionValue);
        fields?.forEach((e: any) => {
          if (e?.fieldName === 'taxCode') {
            e.option = taxCodeOptions;
          }
        });
      }
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
    let currency = rentalManagementData?.currency?.toLowerCase()
    if (isBulkedit) {
      if (values[`price_${currency}`] && selectedProducts?.find((e) => !e.parentId) && !selectedProducts?.every((e) => !e.parentId)) {
        setShowSelectionConfirmationDialog({ open: true, type: '' });
      }
      else {
        const rows = bulkUpdate(values, selectedProducts, material, allFields, rentalManagementData?.currency);
        handleSaveData(rows);
      }
    } else {
      let childResetAlert = false;
      if (!rowData.parentId && material?.find((e) => e.parentId === rowData?._id)) {
        if (values[`finalPrice_${currency}`] !== rowData[`finalPrice_${currency}`] &&
          material?.find((e) => e.parentId === rowData?._id && e[`finalPrice_${currency}`])) {
          childResetAlert = true;
        }
      }
      if (childResetAlert && !showConfirmationDialog.open) {
        setShowConfirmationDialog({ open: true, type: 'child' });
      } else {
        const rows = await calculateRowsField(
          material,
          values,
          allFields,
          rowData,
          rentalManagementData?.currency);
        handleSaveData(rows, saveAndNext);
        setShowConfirmationDialog({ open: false, type: '' });
      }
    }
  };

  const handleUpdateBulk = async (values, type) => {
    const rows = bulkUpdate(values, selectedProducts, material, allFields, rentalManagementData?.currency, type === 'Parent' ? true : false);
    handleSaveData(rows);
    setShowSelectionConfirmationDialog({ open: false, type: '' });
  }

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
    let estimateStartDate = dayjs(values?.estimateStartDate);
    let estimateEndDate = dayjs(values?.estimateEndDate);
    if (isBulkedit) {
      const maxEstimateStartDate = rowData
        ?.map((r) => r?.estimateStartDate)
        ?.reduce((max, current) => (dayjs(current).isAfter(dayjs(max)) ? current : max));
      const estimateStartDateE = dayjs(maxEstimateStartDate);
      if (estimateEndDate.diff(estimateStartDateE, 'day') < 0) {
        errors['estimateEndDate'] = 'Please enter valid estimate end date';
      }
    }
    if (estimateEndDate.diff(estimateStartDate, 'day') < 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }
    let rentalManagementEstimateStartDate = dayjs(rentalManagementData?.estimateStartDate);
    let rentalManagementEstimateEndDate = dayjs(rentalManagementData?.estimateEndDate);
    if (estimateStartDate.diff(rentalManagementEstimateStartDate, 'day') < 0) {
      errors['estimateStartDate'] = 'Please enter valid estimate start date';
    }
    if (estimateEndDate.diff(rentalManagementEstimateEndDate, 'day') > 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }
    if (rowData && !rowData.canDelete) {
      let isValid = true;
      const child: any = dataRows?.filter((e) => e.parentId === rowData?._id);
      if (child?.length) {
        child?.forEach((e) => {
          let qty = values.qty * e?.qty
          if (qty < e?.assetQty || qty < e?.nonSerializedQty) {
            isValid = false;
            return;
          }
        })
      }
      else {
        const qty = getParentMultiplier(material, rowData) * values.qty
        if ((qty < rowData?.assetQty || qty < rowData?.nonSerializedQty)) {
          isValid = false;
        }
      }
      if (!isValid) {
        errors['qty'] = 'The quantity is less than what was assigned.';
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
                                  <Grid key={field.fieldName} size={{ xs: 12, sm: 6, md: 6 }}>
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
                                  <Grid key={field.fieldName} size={{ xs: 12, sm: 6, md: 6 }}>
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
                                  <Grid key={field.fieldName} size={{ xs: 12, sm: 6, md: 6 }}>
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
                                  <Grid key={field.fieldName} size={{ xs: 12, sm: 6, md: 6 }}>
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
                <ThemeButton
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
                </ThemeButton>
                {isBulkedit === false && showSaveAndNext && (
                  <ThemeButton
                    isLoading={loading}
                    buttonType="theme"
                    disabled={loading || (isQtyOnly ? false : isEqual(ref?.current?.values, initialData.values))}
                    id="rental-job-qty-dialog-save-and-next-button"
                    onClick={() => {
                      setSaveAndNext(true);
                      submitForm();
                    }}
                  >
                    {' '}
                    Save & Next
                  </ThemeButton>
                )}
                <ThemeButton
                  isLoading={loading}
                  disabled={loading || (isQtyOnly ? false : isEqual(ref?.current?.values, initialData.values))}
                  buttonType="theme"
                  id="rental-job-qty-dialog-save-button"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmationDialog.open && (
                <ConfirmationDialog
                  open={showConfirmationDialog.open}
                  message={showConfirmationDialog.type === 'child' ?
                    "This action will remove the child line items pricing. Any field update that changes final price will remove the child line items pricing" : ""}
                  onOk={() => {
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmationDialog({ open: false, type: '' });
                  }}
                />
              )}
              {showSelectionConfirmationDialog.open && (
                <SelectionConfirmationDialog
                  open={showSelectionConfirmationDialog.open}
                  message={"Would you like to apply the price at the parent level or the child level?"}
                  onOk={(type) => {
                    handleUpdateBulk(values, type)
                  }}
                  onClose={() => {
                    setShowSelectionConfirmationDialog({ open: false, type: '' });
                  }}
                  selection1={'Parent'}
                  selection2={'Child'}
                />
              )}
              {showConfirmDialog ? (
                <ConfirmCancelDialog
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

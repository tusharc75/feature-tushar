import { FC, useEffect, useState, Fragment, useRef, useContext } from 'react';
import { Button, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { isArray, uniqBy } from 'lodash';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema, CHILD_RESOURCE, MATERIAL_TYPE } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, arrayToDropwdownOption } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from '../../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { uniq, map, orderBy, isEqual } from 'lodash';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import moment from 'moment';
import { bulkUpdate, calculatePrice, calculateRowsField } from '../../../components/RentalManagment/helper';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';

interface EditDialogProps {
  onClose: VoidFunction | any;
  handleSaveData: VoidFunction | any;
  fieldTicketData: any;
  rowData?: object | any;
  material: any[];
  selectedServices: any[];
  isBulkedit: any;
  loading: any;
  isInlineEdit?: Boolean;
  showSaveAndNext?: Boolean;
  referenceType?: any;
}

const rateChangeFields = ['unit', 'pricingMethod', 'pricingCondition'];

const MaterialQtyDialog: FC<EditDialogProps> = ({
  onClose,
  handleSaveData,
  fieldTicketData,
  rowData,
  material,
  selectedServices,
  isBulkedit,
  loading,
  isInlineEdit = false,
  showSaveAndNext = false,
  referenceType = null
}) => {
  const ref = useRef(null);

  const toastConfig = useContext(CustomToastContext);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [fields, setFields] = useState([]);
  const [priceConditionList, setPriceConditionList] = useState([]);
  const [priceConditionListConst, setPriceConditionListConst] = useState([]);
  const [priceMethodListConst, setPriceMethodListConst] = useState([]);
  const [priceMethodList, setPriceMethodList] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const { isOffline } = useContext(CustomOfflineContext);
  const walkmeInstance = useGetWalkmeInstance();
  const isStepDataSet = useRef(false);

  useEffect(() => {
    fetchData();
  }, [rowData]);

  const fetchTaxRate = async (billingAddress: any, taxCode = null) => {
    const zipCode = billingAddress?.zipCode;
    const state = billingAddress?.state;
    const county = billingAddress?.county;

    let materialType;
    if (isBulkedit) {
      materialType = rowData[0]?.type;
    } else {
      materialType = rowData?.type;
    }
    try {
      const response = await axiosInstance().get(
        `${routes?.taxMaster.path}/by-zipcode?zipCode=${zipCode}&state=${state}&county=${county}&materialType=${materialType}${taxCode && `&taxCode=${taxCode}`}`
      );
      return response?.data?.data || [];
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  const fetchData = async () => {
    setFetchingData(true);
    let data = await fetch_child_resource_fields_perm(CHILD_RESOURCE.fieldTicketMateial, fieldTicketData?.currency, true, isOffline);
    setAllFields(JSON.parse(JSON.stringify(data)));
    data = data?.filter((f) => f?.isRead);
    if (isBulkedit) {
      let unitArray: any = [];
      let pricingMethodArray: any = [];
      selectedServices?.forEach((element) => {
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
        if (element.fieldName === 'wellNumber' && isArray(fieldTicketData?.wellNumber)) {
          element.option = element.option?.filter((ele) => fieldTicketData?.wellNumber?.map((e) => e.optionValue)?.includes(ele.optionValue));
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
          estimateEndDate: ''
        }
      });
      setFetchingData(false);
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
      if (!isOffline) {
        await getAllPricingCondition(rowData, unitOptions, pricingMethodOptions);
      } else {
        setPriceMethodList(pricingMethodOptions);
      }
      data.forEach((element) => {
        if (rowData?.type === MATERIAL_TYPE.serializedAsset) {
          if (element.fieldName === 'qty') {
            element.disabled = true;
          }
          if (element.fieldName === 'unit') {
            element.option = [
              {
                optionLabel: 'Piece',
                optionValue: 'Piece'
              }
            ];
            element.value = 'Piece';
          }
          if (element.fieldName === 'pricingMethod') {
            const assetPricingMethod = {
              optionValue: 'Per Job',
              optionLabel: 'Per Job'
            }
            pricingMethodOptions.push(assetPricingMethod)
            element.option = [assetPricingMethod];
            element.value = 'Per Job';
          }
        }
        else {
          if (element.fieldName === 'unit') {
            element.option = unitOptions;
          }
          if (element.fieldName === 'pricingMethod') {
            element.option = pricingMethodOptions;
          }
          if (element.fieldName === 'wellNumber' && isArray(fieldTicketData?.wellNumber)) {
            element.option = element.option?.filter((ele) => fieldTicketData?.wellNumber?.map((e) => e.optionValue)?.includes(ele.optionValue));
          }
        }
      });
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(rowData, data)
      });
      setFetchingData(false);
    }
    EvaluteproductFields(data);
    setFetchingData(false);
  };

  useEffect(() => {
    if (walkmeInstance && !isStepDataSet.current && initialData?.fields?.length > 0) {
      isStepDataSet.current = true;
      walkmeInstance.instance.insertAtCurrentIndex([...generateStepsFormfieldData(initialData?.fields)]);
      walkmeInstance.handleNext();
    }
  }, [initialData]);

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

  const EvaluteproductFields = async (fields) => {
    if (isBulkedit) {
      fields = fields.filter((d) => d.fieldName !== 'pricingCondition');
    }
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });

    if ((fieldTicketData?.taxCode || (fieldTicketData?.billingAddress &&
      (fieldTicketData?.billingAddress?.zipCode || fieldTicketData?.billingAddress?.state || fieldTicketData?.billingAddress?.county))) && !isOffline) {
      const taxCodeOptions = await fetchTaxRate(fieldTicketData?.billingAddress, fieldTicketData?.taxCode?.optionValue || null);
      fields?.forEach((e: any) => {
        if (e?.fieldName === 'taxCode') {
          e.option = taxCodeOptions;
        }
      });
    }
    setFields(customData);
  };

  const handleSubmit = async (values) => {
    if (isBulkedit) {
      const rows = bulkUpdate(values, selectedServices, material, allFields, fieldTicketData?.currency);
      handleSaveData(rows);
    } else {
      const rows = await calculateRowsField(material, values, allFields, rowData, fieldTicketData?.currency);
      handleSaveData(rows, saveAndNext);
      setShowConfirmationDialog(false);
    }
  };

  async function getAllPricingCondition(values: any, unitOptions: any, pricingMethodOptions: any) {
    if (rowData) {
      let priceData: any = await calculatePrice(fieldTicketData, [
        {
          materialId: rowData.materialId,
          type: rowData.type,
          qty: 1,
          pricingMethod: pricingMethodOptions?.map((d) => d.optionLabel).join() || '',
          unit: unitOptions?.map((d) => d.optionLabel)
        }
      ]);
      if (fieldTicketData?.pricingCondition?.optionValue) {
        priceData = priceData?.filter((e) => e.conditionId === fieldTicketData?.pricingCondition?.optionValue);
      }
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
    if (referenceType === 'consumables') {
      if (isBulkedit && rowData?.find((e) => e?.consumedQty || e?.requestedQty)) {
        errors['qty'] = 'Quantity can not be change in bulk edit once consumed';
      }
      else {
        if (values.qty < (rowData?.consumedQty || 0) + (rowData?.requestedQty || 0)) {
          errors['qty'] = 'Quantity can not be less than consumed quantity';
        }
      }
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
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  isBulkedit
                    ? `Bulk Edit`
                    : `Edit - ${rowData.index} (${referenceType === 'consumables' ? rowData?.productName || '' : rowData?.detail || ''})`
                }
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
                                          options={
                                            field.fieldName === 'pricingCondition'
                                              ? priceConditionList
                                              : field.fieldName === 'pricingMethod'
                                                ? priceMethodList
                                                : field.option
                                          }
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
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
                                            let priceFieldName = 'price_' + fieldTicketData?.currency?.toLowerCase();
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
                                          minDate={fieldTicketData?.estimateStartDate}
                                          maxDate={fieldTicketData?.estimateEndDate}
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
                                ) : field.fieldName === 'numberOfWells' ? (
                                  <>
                                    {values?.byWellNumber && (
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
                                    )}
                                  </>
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
                                            if (name === 'byWellNumber') {
                                              if (value) {
                                                setFieldValue('numberOfWells', fieldTicketData?.wellNumber?.length);
                                              } else {
                                                setFieldValue('numberOfWells', 0);
                                              }
                                            }
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
                    disabled={loading || isEqual(ref?.current?.values, initialData.values)}
                    variant="contained"
                    color="primary"
                    type="submit"
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
                  id="dialog-save-button"
                  loading={loading}
                  disabled={loading || isEqual(ref?.current?.values, initialData.values)}
                  variant="contained"
                  color="primary"
                  type="submit"
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

export default MaterialQtyDialog;



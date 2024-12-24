import { FC, useEffect, useState, Fragment, useRef, useContext } from 'react';
import { Button, Dialog, Grid, Box } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema, CHILD_RESOURCE } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, arrayToDropwdownOption } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from '../../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { uniq, map, orderBy, isEqual, uniqBy } from 'lodash';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import moment from 'moment';
import { bulkUpdate, calculateRowsField } from 'src/components/RentalManagment/helper';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
interface EditDialogProps {
  onClose: VoidFunction | any;
  handleSaveData: VoidFunction | any;
  invoiceData: any;
  rowData?: object | any;
  calculatePrice?: VoidFunction | any;
  material: any[];
  selectedProducts: any[];
  isBulkedit: any;
  showSaveAndNext: any;
  loadingEdit: any;
}
const rateChangeFields = ['unit', 'pricingMethod', 'pricingCondition'];

const MaterialDialog: FC<EditDialogProps> = ({
  calculatePrice,
  onClose,
  handleSaveData,
  invoiceData,
  rowData,
  material,
  selectedProducts,
  isBulkedit,
  showSaveAndNext,
  loadingEdit
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [priceConditionListConst, setPriceConditionListConst] = useState([]);
  const [priceMethodListConst, setPriceMethodListConst] = useState([]);
  const [priceConditionList, setPriceConditionList] = useState([]);
  const [pricingMethodList, setPricingMethodList] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    fetchFields();
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

  const fetchFields = async () => {
    setLoading(true);
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceProduct, invoiceData?.currency, true);
    setAllFields(JSON.parse(JSON.stringify(data)));
    if (isBulkedit) {
      let unitArray: any = [];
      let pricingMethodArray: any = [];
      selectedProducts?.forEach((element) => {
        if (element?.[`${element.type}Detail`]?.unit) {
          unitArray.push([...element?.[`${element.type}Detail`]?.unit]);
        }
        if (element?.[`${element.type}Detail`]?.pricingMethod) {
          pricingMethodArray.push([...element?.[`${element.type}Detail`]?.pricingMethod]);
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
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      });
      setInitialData({
        fields: data,
        values: { ...getObjKeys('', data), estimateStartDate: '', estimateEndDate: '', actualStartDate: '', actualEndDate: '' }
      });
    } else {
      let unitOptions: any = [];
      let pricingMethodOptions: any = [];
      if (rowData?.[`${rowData.type}Detail`]?.unit) {
        unitOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`]?.unit);
      }
      if (rowData?.[`${rowData.type}Detail`]?.pricingMethod) {
        pricingMethodOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`]?.pricingMethod);
      }
      setPriceMethodListConst(pricingMethodOptions);
      await getAllPricingCondition(rowData, unitOptions, pricingMethodOptions);
      data.forEach((element) => {
        if (rowData?.type === 'serializedAsset') {
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
            element.option = [
              {
                optionValue: 'Per Job',
                optionLabel: 'Per Job'
              }
            ];
            element.value = 'Per Job';
          }
        } else {
          if (element.fieldName === 'unit') {
            element.option = unitOptions;
          }
          if (element.fieldName === 'pricingMethod') {
            element.option = pricingMethodOptions;
          }
        }
      });
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(rowData, data)
      });
    }
    EvaluteproductFields(data);
    setLoading(false);
  };

  const EvaluteproductFields = async (fields) => {
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    if (
      invoiceData?.taxCode ||
      (invoiceData?.billingAddress &&
        (invoiceData?.billingAddress?.zipCode || invoiceData?.billingAddress?.state || invoiceData?.billingAddress?.county))
    ) {
      const taxCodeOptions = await fetchTaxRate(invoiceData?.billingAddress, invoiceData?.taxCode?.optionValue || null);
      fields?.forEach((e: any) => {
        if (e?.fieldName === 'taxCode') {
          e.option = taxCodeOptions;
        }
      });
    }
    setFields(customData);
  };

  const getTitle = () => {
    if (rowData && !isBulkedit) {
      let editTitle = `Edit - ${rowData.detail}`;
      if (rowData.subRows && rowData.subRows?.length > 0) {
        editTitle = `Edit - ${rowData.detail}(${rowData.subRows.length})`;
      }
      return editTitle;
    } else {
      return 'Bulk Edit';
    }
  };

  const handleSubmit = async (values) => {
    if (isBulkedit) {
      const rows = bulkUpdate(values, selectedProducts, material, allFields, invoiceData?.currency);
      handleSaveData(rows);
    } else {
      if (isEqual(ref?.current?.values, initialData.values)) {
        handleSaveData([rowData], saveAndNext, true);
        return;
      }
      if (rowData.parentId && !showConfirmationDialog) {
        setShowConfirmationDialog(true);
      } else {
        const rows = await calculateRowsField(material, values, allFields, rowData, invoiceData?.currency);
        handleSaveData(rows, saveAndNext);
        setShowConfirmationDialog(false);
      }
    }
  };

  async function getAllPricingCondition(values: any, unitOptions: any, pricingMethodOptions: any) {
    if (rowData) {
      const priceData: any = await calculatePrice([
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
    if (values['pricingMethod'] && values['pricingMethod'] !== '' && allFields?.find((e) => e.fieldName === 'pricingMethod')) {
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
    setPricingMethodList(tempPricingMethod);

    return { tempPriceCondition, tempPricingMethod };
  };

  function validate(values) {
    const errors = {};
    let startDate = moment(values?.estimateStartDate);
    let endDate = moment(values?.estimateEndDate);
    if (endDate.diff(startDate, 'days') < 0) {
      errors['endDate'] = 'Please enter valid end date';
    }
    if (rowData && rowData.hideSelection) {
      if (values.qty < rowData.assetQty) {
        errors['qty'] = 'The quantity is less than what was assigned.';
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
      {initialData && !loading && loadingEdit === false && initialData.fields.length ? (
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
                                          options={
                                            field.fieldName === 'pricingCondition'
                                              ? priceConditionList
                                              : field.fieldName === 'pricingMethod'
                                                ? pricingMethodList
                                                : field.option
                                          }
                                          setFieldValue={(name, value) => {
                                            setFieldValue(name, value);
                                          }}
                                          onChange={(e, val) => {
                                            const value = val && val.optionValue ? val.optionValue : '';
                                            const isPricingMethodField = allFields?.find((e) => e.fieldName === 'pricingMethod');
                                            const { tempPriceCondition, tempPricingMethod } = updateRateChangeState(
                                              { ...values, [field.fieldName]: value },
                                              priceConditionListConst,
                                              priceMethodListConst
                                            );
                                            if (values['pricingCondition']) {
                                              if (!tempPriceCondition?.find((e) => e.optionValue === values['pricingCondition'])) {
                                                setFieldValue('pricingCondition', '');
                                                setPricingMethodList(priceMethodListConst);
                                              }
                                            }
                                            if (values['pricingMethod']) {
                                              if (!tempPricingMethod?.find((e) => e.optionValue === values['pricingMethod'])) {
                                                setFieldValue('pricingMethod', '');
                                              }
                                            }
                                            let priceValue;
                                            if (field.fieldName === 'pricingCondition') {
                                              if (isPricingMethodField) {
                                                priceValue = priceConditionListConst?.find(
                                                  (d) =>
                                                    d.conditionId === value &&
                                                    d.unit === values['unit'] &&
                                                    d.pricingMethod === values['pricingMethod']
                                                );
                                              } else {
                                                priceValue = priceConditionListConst?.find(
                                                  (d) => d.conditionId === value && d.unit === values['unit']
                                                );
                                              }
                                            } else if (field.fieldName === 'pricingMethod') {
                                              priceValue = priceConditionListConst?.find(
                                                (d) =>
                                                  d.conditionId === values['pricingCondition'] &&
                                                  d.unit === values['unit'] &&
                                                  d.pricingMethod === value
                                              );
                                            } else {
                                              if (isPricingMethodField) {
                                                priceValue = priceConditionListConst?.find(
                                                  (d) =>
                                                    d.conditionId === values['pricingCondition'] &&
                                                    d.unit === value &&
                                                    d.pricingMethod === values['pricingMethod']
                                                );
                                              } else {
                                                priceValue = priceConditionListConst?.find(
                                                  (d) => d.conditionId === values['pricingCondition'] && d.unit === value
                                                );
                                              }
                                            }
                                            let priceFieldName = 'price_' + invoiceData?.currency?.toLowerCase();
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

                {isBulkedit === false &&
                  showSaveAndNext &&
                  (isEqual(ref?.current?.values, initialData.values) ? (
                    <CustomButton
                      loading={loading}
                      disabled={loading}
                      variant="contained"
                      color="primary"
                      type="submit"
                      onClick={() => {
                        setSaveAndNext(true);
                        submitForm();
                      }}
                    >
                      {'Next'}
                    </CustomButton>
                  ) : (
                    <CustomButton
                      loading={loadingEdit}
                      disabled={isEqual(ref?.current?.values, initialData.values) || loadingEdit}
                      variant="contained"
                      color="primary"
                      type="submit"
                      onClick={() => {
                        setSaveAndNext(true);
                        submitForm();
                      }}
                    >
                      {'Save & Next'}
                    </CustomButton>
                  ))}

                <CustomButton
                  loading={loading}
                  disabled={isEqual(ref?.current?.values, initialData.values)}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                >
                  {'Save'}
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmationDialog && (
                <ConfirmationDialog
                  open={showConfirmationDialog}
                  message="Would you prefer to override the parent-level price configuration?"
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

export default MaterialDialog;

import { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import { CustomDialogTransition, arrayToDropwdownOption, getObjKeys, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import FormTypes from 'src/components/Helpers/FormTypes';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { orderBy, uniq, map, uniqBy } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { FaDiceOne } from 'react-icons/fa';
import { calculatePrice, fetch_rental_technician_fields } from 'src/components/RentalManagment/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const rateChangeFields = ['pricingMethod', 'pricingCondition'];

const RentalTechnicianQtyDialog = ({ onClose, technicianData, rentalManagementData, handleUpdate, loadingEdit, bulkEdit, showSaveAndNext }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [priceConditionListConst, setPriceConditionListConst] = useState([]);
  const [priceMethodListConst, setPriceMethodListConst] = useState([]);
  const [priceConditionList, setPriceConditionList] = useState([]);
  const [priceMethodList, setPriceMethodList] = useState([]);

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, [technicianData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    let data = await fetch_rental_technician_fields(rentalManagementData?.currency, isOffline);
    if (bulkEdit) {
      data = data.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: data,
        values: getObjKeys('', data)
      });
    } else {
      setAllFields(JSON.parse(JSON.stringify(data)));
      let pricingMethodOptions: any = [];
      let pricingMethodData = technicianData.pricingMethodData?.find((ele) => ele._id === technicianData.competenceId)?.pricingMethod || [];

      if (pricingMethodData?.length) {
        pricingMethodOptions = arrayToDropwdownOption(pricingMethodData);
      }

      setPriceMethodListConst(pricingMethodOptions);
      if (data.some((ele) => ele.fieldName === 'pricingCondition')) {
        await getAllPricingCondition(technicianData, pricingMethodOptions);
      } else {
        setPriceMethodList(pricingMethodOptions);
      }
      data.forEach((element) => {
        if (element.fieldName === 'pricingMethod') {
          element.option = pricingMethodOptions;
        }
        if (element.fieldName === 'competence') {
          element.option = technicianData.competenciesWithIds;
        }
      });
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(technicianData, data)
      });
    }
    EvaluteproductFields(data);
  };

  const EvaluteproductFields = (fields) => {
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

  async function getAllPricingCondition(values: any, pricingMethodOptions: any) {
    if (technicianData) {
      const priceData: any = await calculatePrice(rentalManagementData, [
        {
          materialId: values.competence,
          type: technicianData.type,
          pricingMethod: pricingMethodOptions?.map((d) => d.optionLabel).join() || ''
        }
      ]);

      setPriceConditionListConst(priceData || []);
      updateRateChangeState(values, priceData, pricingMethodOptions);
    }
  }

  const updateRateChangeState = (values: any, priceData: any, pricingMethodOptions: any) => {
    var tempPriceCondition = [...priceData];
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

  const handleSubmit = async (values) => {
    let returnData = [];
    if (bulkEdit) {
      for (const x in values) {
        if (values[x] === '' || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x];
        }
      }
      technicianData.forEach((element) => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        returnData.push({ _id: element._id, ...calValues });
      });
      handleUpdate(returnData);
    } else {
      returnData = [{ _id: technicianData._id, ...values }];
      handleUpdate(returnData, saveAndNext);
    }
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
      >
        {initialData && initialData.fields.length ? (
          <Formik
            enableReinitialize={true}
            initialValues={initialData.values}
            validationSchema={yupSchema(initialData.fields?.filter((f) => f?.isRead))}
            validateOnMount
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={bulkEdit ? 'Bulk Edit' : `Edit - ${technicianData?.technicianName}`}
                  onClose={() => {
                    onClose();
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                ></CustomDialogHeader>
                <CustomDialogContent>
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
                                  ) : rateChangeFields.includes(field.fieldName) && !bulkEdit ? (
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
                                                    d.conditionId === value &&
                                                    d.pricingMethod === values['pricingMethod'] &&
                                                    d.materialId === values['competence']
                                                );
                                              } else if (field.fieldName === 'pricingMethod') {
                                                priceValue = priceConditionListConst?.find(
                                                  (d) =>
                                                    d.conditionId === values['pricingCondition'] &&
                                                    d.pricingMethod === value &&
                                                    d.materialId === values['competence']
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
                                  ) : field.fieldName === 'competence' ? (
                                    <Grid key={field.fieldName} size={{ xs: 12, sm: 6, md: 6 }}>
                                      <Box display="flex">
                                        <Box flexGrow={1}>
                                          <FormTypes
                                            {...field}
                                            fieldData={field}
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={field.option}
                                            setFieldValue={async (name, value) => {
                                              setFieldValue(name, value);
                                              setFieldValue('pricingMethod', '');
                                              const isPricingConditionField = initialData?.fields?.some(
                                                (ele) => ele.fieldName === 'pricingCondition'
                                              );

                                              const pricingMethodData =
                                                technicianData?.pricingMethodData?.find((ele) => ele._id === value)?.pricingMethod || [];
                                              const newMethodOptions = arrayToDropwdownOption(pricingMethodData);

                                              setPriceMethodListConst(newMethodOptions);
                                              if (isPricingConditionField) {
                                                setFieldValue('pricingCondition', '');
                                                if (value !== '') {
                                                  await getAllPricingCondition(
                                                    { ...values, competence: value, pricingCondition: '', pricingMethod: '' },
                                                    newMethodOptions
                                                  );
                                                }
                                              } else {
                                                setPriceMethodList(newMethodOptions);
                                              }

                                              let priceFieldName = 'price_' + rentalManagementData?.currency?.toLowerCase();

                                              const result = autoCalculateSpecificFields({ [priceFieldName]: 0 }, values, initialData.fields);

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
                                            fields={initialData.fields}
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
                                            fields={initialData.fields}
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
                    buttonType="transparent"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    {'Close'}
                  </ThemeButton>
                  {bulkEdit === false && showSaveAndNext && (
                    <ThemeButton
                      isLoading={loadingEdit}
                      disabled={loadingEdit}
                      buttonType="theme"
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
                    isLoading={loadingEdit}
                    disabled={loadingEdit}
                    buttonType="theme"
                    onClick={() => {
                      setSaveAndNext(false);
                      submitForm();
                    }}
                  >
                    Save
                  </ThemeButton>
                </CustomDialogFooter>
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default RentalTechnicianQtyDialog;

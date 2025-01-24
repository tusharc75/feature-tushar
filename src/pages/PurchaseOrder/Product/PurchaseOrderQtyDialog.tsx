import { useEffect, useState, Fragment, useRef } from 'react';
import { Dialog, Box } from '@mui/material';
import { CHILD_RESOURCE, arrayToDropwdownOption } from '../../../constants/helpers';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import InputField from 'src/components/Helpers/InputField';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';

const PurchaseOrderQtyDialog = ({ onClose, onSubmit, productData, bulkEdit, purchaseOrderData, showSaveAndNext, loadingEdit }) => {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allFields, setAllFields] = useState([]);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const walkmeInstance = useGetWalkmeInstance();
  const isStepDataSet = useRef(false);

  useEffect(() => {
    fetchField();
  }, [productData]);

  useEffect(() => {
    if (walkmeInstance && !isStepDataSet.current && initialData?.fields?.length > 0) {
      isStepDataSet.current = true;
      walkmeInstance.instance.insertAtCurrentIndex([...generateStepsFormfieldData(initialData?.fields)]);
      walkmeInstance.handleNext();
    }
  }, [initialData]);

  const fetchField = async () => {
    setInitialData({ fields: [], values: {} });
    var poFields = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseOrderProduct, purchaseOrderData?.currency, true);
    setAllFields(JSON.parse(JSON.stringify(poFields)));
    if (bulkEdit) {
      let unitArray: any = [];
      productData?.forEach((element) => {
        if (element?.productDetail?.unit) {
          unitArray.push([...element?.productDetail?.unit]);
        }
      });
      let unit: any = unitArray?.shift()?.filter(function (v) {
        return unitArray.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      const unitOptions: any = arrayToDropwdownOption(unit);
      poFields.forEach((element) => {
        if (element.fieldName === 'unit') {
          element.option = unitOptions;
          if (unitOptions?.length) {
            element.isDefaultValue = true;
            element.defaultValue = unitOptions[0]?.optionValue;
          }
        }
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      });
      poFields = poFields.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: poFields,
        values: { ...getObjKeys('', poFields), expectedDelivery: '' }
      });
    } else {
      poFields.filter((_f) => {
        if (['unit'].includes(_f.fieldName.toLowerCase())) {
          if (productData?.productDetail?.unit) {
            _f.option = arrayToDropwdownOption(productData?.productDetail?.unit);
          }
        }
      });
      let tempObjKeysWithValues = getObjKeysWithValues(productData, poFields);
      if (!tempObjKeysWithValues['taxSchedule'] && purchaseOrderData['taxSchedule']) {
        tempObjKeysWithValues['taxSchedule'] = purchaseOrderData['taxSchedule'];
      }
      if (!tempObjKeysWithValues['expectedDelivery'] && purchaseOrderData['deliveryDate']) {
        tempObjKeysWithValues['expectedDelivery'] = purchaseOrderData['deliveryDate'];
      }
      setInitialData({
        fields: poFields,
        values: tempObjKeysWithValues
      });
    }
  };

  const handleSubmit = (values) => {
    let returnData = [];
    if (bulkEdit) {
      for (const x in values) {
        if (values[x] === '' || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x];
        }
      }
      productData.forEach((element) => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        returnData.push({ _id: element._id, productId: element.productId, ...calValues });
      });
    } else {
      returnData = [{ ...values, _id: productData._id, productId: productData.productId }];
    }
    onSubmit(returnData, saveAndNext);
  };

  function validate(values) {
    const errors = {};
    if (values?.qty < values?.actualReceived + values?.rejectQuantity || 0) {
      errors['qty'] = 'Quantity should be greater than Actual Received and Reject Quantity';
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
      {initialData && initialData.fields.length ? (
        <Formik
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={bulkEdit ? 'Bulk Edit' : `Edit - ${productData?.index} (${productData?.detail || ''})`}
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
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={(name, value) => {
                      setFieldValue(name, value);
                      if (name === 'taxCode') {
                        const taxCode = initialData?.fields?.find((e) => e?.fieldName === 'taxCode')?.option.find((d) => d.optionValue === value);
                        setFieldValue('taxPercentage', taxCode?.taxRate || 0);
                        const result = autoCalculateSpecificFields({ ['taxPercentage']: taxCode?.taxRate || 0 }, values, initialData.fields);
                        if (Object.keys(result).length >= 1) {
                          for (var x in result) {
                            setFieldValue(x, result[x]);
                          }
                        }
                      }
                    }}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
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
                  id={'dialog-save-button'}
                  isLoading={loadingEdit}
                  disabled={loadingEdit}
                  buttonType="theme"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                >
                  {' '}
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
  );
};

export default PurchaseOrderQtyDialog;

import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { Box, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { CHILD_RESOURCE, CustomDialogTransition, MATERIAL_TYPE, getObjKeys, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { isEqual } from 'lodash';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';
import InputField from 'src/components/Helpers/InputField';
import dayjs from 'dayjs';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const AddCostDialog = ({ costData, onClose, fieldTicketData, handleAddCost, handleUpdateCost, showSaveAndNext, loadingEdit }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const walkmeInstance = useGetWalkmeInstance();
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);
  const isStepDataSet = useRef(false);

  useEffect(() => {
    fetchFields();
  }, [costData]);

  const fetchTaxRate = async (billingAddress: any, taxCode = null) => {
    const zipCode = billingAddress?.zipCode;
    const state = billingAddress?.state;
    const county = billingAddress?.county;
    try {
      const response = await axiosInstance().get(
        `${routes?.taxMaster.path}/by-zipcode?zipCode=${zipCode}&state=${state}&county=${county}&materialType=${MATERIAL_TYPE.manualEntry}${taxCode && `&taxCode=${taxCode}`}`
      );
      return response?.data?.data || [];
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  useEffect(() => {
    if (walkmeInstance && !isStepDataSet.current && initialData?.fields?.length > 0) {
      isStepDataSet.current = true;
      walkmeInstance.instance.insertAtCurrentIndex([...generateStepsFormfieldData(initialData?.fields)]);
      walkmeInstance.handleNext();
    }
  }, [initialData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    let data = await fetch_child_resource_fields_perm(CHILD_RESOURCE.fieldTicketCost, fieldTicketData?.currency, true, isOffline);
    data = data?.filter((f) => f?.isRead);
    if (
      (fieldTicketData?.taxCode ||
        (fieldTicketData?.billingAddress &&
          (fieldTicketData?.billingAddress?.zipCode || fieldTicketData?.billingAddress?.state || fieldTicketData?.billingAddress?.county))) &&
      !isOffline
    ) {
      const taxCodeOptions = await fetchTaxRate(fieldTicketData?.billingAddress, fieldTicketData?.taxCode?.optionValue || null);
      data?.forEach((e: any) => {
        if (e?.fieldName === 'taxCode') {
          e.option = taxCodeOptions;
        }
      });
    }
    setAllFields(JSON.parse(JSON.stringify(data)));
    if (costData) {
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(costData, data)
      });
    } else {
      setInitialData({
        fields: data,
        values: getObjKeys('', data)
      });
    }
  };

  const handleSubmit = (values) => {
    if (costData) {
      let returnData = [];
      returnData = [{ ...getObjKeysWithValues(values, allFields), _id: costData._id }];
      handleUpdateCost(returnData, saveAndNext);
    } else {
      let returnData = [];
      returnData = [{ ...getObjKeysWithValues(values, allFields) }];
      handleAddCost(returnData);
    }
  };

  function validate(values) {
    const errors = {};
    let estimateStartDate = dayjs(values?.estimateStartDate);
    let estimateEndDate = dayjs(values?.estimateEndDate);
    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
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
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={costData ? `Edit Manual Entry` : `Add Manual Entry`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
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
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  buttonType='transparent'
                >
                  Cancel
                </ThemeButton>
                {showSaveAndNext && (
                  <ThemeButton
                    onClick={() => {
                      setSaveAndNext(true);
                      submitForm();
                    }}
                    disabled={loadingEdit}
                    isLoading={loadingEdit}
                    buttonType='theme'
                  >
                    Save & Next
                  </ThemeButton>
                )}
                <ThemeButton
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                  disabled={loadingEdit}
                  isLoading={loadingEdit}
                  buttonType='theme'
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
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

export default AddCostDialog;

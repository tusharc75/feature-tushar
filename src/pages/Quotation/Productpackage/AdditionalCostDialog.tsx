import { FC, useEffect, useState, Fragment, useRef, useContext } from 'react';
import { Dialog, Box } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema, CHILD_RESOURCE, MATERIAL_TYPE } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isEqual } from 'lodash';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import InputField from 'src/components/Helpers/InputField';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';

interface AdditionalCostDialogProps {
  onClose: VoidFunction | any;
  currency: string;
  handleAddCost: VoidFunction | any;
  handleUpdateCost: VoidFunction | any;
  costData?: object | any;
  loadingEdit?: Boolean;
  showSaveAndNext?: Boolean;
  quotationData: object | any;
}

const AdditionalCostDialog: FC<AdditionalCostDialogProps> = ({
  onClose,
  currency,
  handleAddCost,
  handleUpdateCost,
  costData,
  showSaveAndNext,
  loadingEdit,
  quotationData
}) => {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const ref = useRef(null);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    fetchFields();
  }, [costData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    var poFields = await fetch_child_resource_fields_perm(CHILD_RESOURCE.quotationCost, currency, true);
    poFields = poFields?.filter((f) => f?.isRead);
    if (
      quotationData?.taxCode ||
      (quotationData?.billingAddress &&
        (quotationData?.billingAddress?.zipCode || quotationData?.billingAddress?.state || quotationData?.billingAddress?.county))
    ) {
      const taxCodeOptions = await fetchTaxRate(quotationData?.billingAddress, quotationData?.taxCode?.optionValue || null);
      poFields?.forEach((e: any) => {
        if (e?.fieldName === 'taxCode') {
          e.option = taxCodeOptions;
        }
      });
    }
    if (costData) {
      setInitialData({
        fields: poFields,
        values: getObjKeysWithValues(costData, poFields)
      });
    } else {
      setInitialData({
        fields: poFields,
        values: getObjKeys('', poFields)
      });
    }
  };

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

  const handleSubmit = (values) => {
    if (!costData) {
      let returnData = [];
      returnData = [{ ...values }];
      handleAddCost(returnData);
    } else {
      let returnData = [];
      returnData = [{ ...values, _id: costData._id }];
      handleUpdateCost(returnData, saveAndNext);
    }
  };

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
          innerRef={ref}
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={costData ? 'Edit' : 'Add'}
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
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  {'Close'}
                </ThemeButton>
                {showSaveAndNext && (
                  <ThemeButton
                    loading={loadingEdit}
                    disabled={isEqual(ref?.current?.values, initialData.values) || loadingEdit}
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
                  loading={loadingEdit}
                  disabled={isEqual(ref?.current?.values, initialData.values)}
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

export default AdditionalCostDialog;

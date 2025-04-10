import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { Box, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { CHILD_RESOURCE, CustomDialogTransition, MATERIAL_TYPE, getObjKeys, getObjKeysWithValues, yupSchema } from 'src/constants/helpers';
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
import { getTaxList } from 'src/components/PricingCondition';
import { useData } from 'src/StateProvider/Provider';

const AddCostDialog = ({ costData, onClose, fieldTicketData, fieldTicketFields, handleAddCost, handleUpdateCost, showSaveAndNext, loadingEdit }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const walkmeInstance = useGetWalkmeInstance();
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { isOffline } = useContext(CustomOfflineContext);
  const isStepDataSet = useRef(false);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchFields();
  }, [costData]);

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
    if (!isOffline) {
      const taxCodeOptions = await getTaxList(user, fieldTicketData, fieldTicketFields, MATERIAL_TYPE.manualEntry);
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
    if (estimateEndDate.diff(estimateStartDate, 'day') < 0) {
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

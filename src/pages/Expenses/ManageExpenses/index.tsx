import { useState, useEffect, useContext, useRef } from 'react';
import { Formik, Form } from 'formik';
import { Box } from '@mui/material';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeysWithValues,
  expenses,
  yupSchema,
  sidebarResource,
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import { isEqual } from 'lodash';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ManageExpenses = ({ isClone = false, expenseId = null, onClose, onSuccess, referenceType = null, referenceData = null }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();

  const [initialData, setInitialData] = useState({ fields: [], values: {} });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [title, setTitle] = useState('');
  // const walkmeInstance = useGetWalkmeInstance();
  const isStepDataSet = useRef(false);

  // useEffect(() => {
  //   if (walkmeInstance && !isStepDataSet.current && initialData?.fields?.length > 0) {
  //     isStepDataSet.current = true;
  //     const ignoreField = ['currency', 'owner', 'pdfTemplate'];
  //     walkmeInstance.instance.insertAtCurrentIndex([...generateStepsFormfieldData(initialData?.fields, ignoreField)]);
  //     walkmeInstance.handleNext();
  //   }
  // }, [initialData]);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get(`/field?resource=${sidebarResource.expenses}`)
      .then(({ data: { data } }) => {
        // const hideFields = ['rentalJob', 'actualEndDate', 'workOrder'];

        // data = data.filter((obj) => !hideFields?.includes(obj?.fieldData?.fieldName));

        // data?.forEach((e) => {
        //   if (e?.fieldData?.fieldName === 'chartOfAccount' && e?.fieldData?.isDefaultValue && e?.fieldData?.defaultValue) {
        //     const filteredOption = e.fieldData?.option?.filter((obj) => obj?.optionValue === e?.fieldData?.defaultValue) || [];
        //     e.fieldData.option = filteredOption;
        //   }
        // });

        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (expenseId) {
          axiosInstance()
            .get(`${expenses.api}/` + expenseId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, brand, createdBy, history, expensesNumber, updatedBy, ...rest } = data;
                setTitle(`Clone - ${expenses}`);
                // rest.repairJobName = GenerateResourceLineNumber(fieldsDataForCreate);
                // rest.status = REPAIR_JOB_STATUS.new;
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user), expectedCompletionDate: null }
                });
                setLoading(false);
              } else {
                axiosInstance()
                  .get(`${expenses.api}/${expenseId}/assets`)
                  .then(({ data: { data: assetData } }) => {
                    // if (assetData.length) {
                    //   fieldsDataForUpdate?.forEach((e) => {
                    //     if (['supplierAccount', 'warehouse']?.includes(e?.fieldName)) {
                    //       e.disableOnEdit = true;
                    //       e.isUneditable = true;
                    //     }
                    //   });
                    // }
                    setTitle(`Editing - [${data.expensesNumber}]`);
                    setInitialData({
                      fields: fieldsDataForUpdate,
                      values: getObjKeysWithValues(data, fieldsDataForUpdate)
                    });
                  })
                  .catch((error) => {
                    toastConfig.setToastConfig(error);
                  });
                setLoading(false);
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } 
        // else {
        //   setTitle(`Create ${resources?.expenses?.titleSingular}`);
        //   let initialData = getObjKeys('', fieldsDataForCreate);
        //   if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
        //     initialData['currency'] = user.user?.brandCurrency;
        //   }
        //   initialData['repairJobName'] = GenerateResourceLineNumber(fieldsDataForCreate);
        //   if (fieldsDataForCreate?.some((e) => e.fieldName === 'expectedCompletionDate')) {
        //     initialData['expectedCompletionDate'] = null;
        //   }
        //   if (referenceType === 'Rental Job') {
        //     initialData['warehouse'] = referenceData?.warehouse;
        //     initialData['rentalJob'] = referenceData?._id;
        //     if (fieldsDataForCreate.some((e) => e.fieldName === 'wellName')) {
        //       initialData['wellName'] = referenceData?.wellName;
        //     }
        //     if (fieldsDataForCreate.some((e) => e.fieldName === 'wellNumber') && referenceData?.wellNumber) {
        //       initialData['wellNumber'] = referenceData?.wellNumber;
        //     }
        //     if (fieldsDataForCreate.some((e) => e.fieldName === 'afeNumber')) {
        //       initialData['afeNumber'] = referenceData?.afeNumber;
        //     }
        //   }
        //   if (referenceData?.warehouse && fieldsDataForCreate.some((e) => e.fieldName === 'warehouse')) {
        //     initialData['warehouse'] = referenceData?.warehouse;
        //   }
        //   if (referenceType === sidebarResource.workOrder || referenceType === sidebarResource.workOrderTechnician) {
        //     initialData['workOrder'] = referenceData?.workOrder;
        //     fieldsDataForCreate?.forEach((e) => {
        //       if (['warehouse']?.includes(e?.fieldName)) {
        //         e.isUneditable = true;
        //       }
        //     });
        //   }
        //   setInitialData({
        //     fields: fieldsDataForCreate,
        //     values: initialData
        //   });
        //   setLoading(false);
        // }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [expenseId]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (expenseId && isClone === false) {
      values._id = expenseId;
      axiosInstance()
        .put(`${expenses.api}`, values)
        .then(({ data }) => {
          setSubmitting(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      const { expensesData, ...rest } = values;
      axiosInstance()
        .post(`${expenses.api}`, rest)
        .then(({ data: { data, message } }) => {
          if (!referenceType) {
            history.push(`${routes.expensesDetail.path}/${data._id}`);
          }
          setSubmitting(false);
          onSuccess(data);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      open={true}
    >
      {initialData && initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={title}
                onClose={() => {
                  if (isEqual(values, initialData.values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.expenses}
                    referenceId={expenseId || null}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  disabled={submitting}
                  buttonType="transparent"
                  id="dialog-cancel-button"
                  onClick={() => {
                    if (isEqual(values, initialData.values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={loading}
                  buttonType="theme"
                  id="dialog-save-button"
                  disabled={submitting}
                  onClick={(e) => {
                    submitForm();
                  }}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              )}
            </>
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

export default ManageExpenses;

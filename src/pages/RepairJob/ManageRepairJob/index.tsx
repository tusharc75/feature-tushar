import { useState, useEffect, useContext, useRef } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, CircularProgress } from '@mui/material';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  repairJob,
  yupSchema,
  sidebarResource,
  GenerateResourceLineNumber,
  REPAIR_JOB_STATUS
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import { isEqual } from 'lodash';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';
import InputField from 'src/components/Helpers/InputField';

const ManageRepairJob = ({ isClone = false, repairJobId = null, onClose, onSuccess, referenceType = null, referenceData = null }) => {
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
  const walkmeInstance = useGetWalkmeInstance();
  const isStepDataSet = useRef(false);

  useEffect(() => {
    if (walkmeInstance && !isStepDataSet.current && initialData?.fields?.length > 0) {
      isStepDataSet.current = true;
      const ignoreField = ['currency', 'owner', 'pdfTemplate'];
      walkmeInstance.instance.insertAtCurrentIndex([...generateStepsFormfieldData(initialData?.fields, ignoreField)]);
      walkmeInstance.handleNext();
    }
  }, [initialData]);

  useEffect(() => {
    setLoading(true);
    axiosInstance()
      .get(`/field?resource=${sidebarResource.repairJob}`)
      .then(({ data: { data } }) => {
        const hideFields = ['rentalJob', 'actualEndDate', 'workOrder'];

        data = data.filter((obj) => !hideFields?.includes(obj?.fieldData?.fieldName));

        data?.forEach((e) => {
          if (e?.fieldData?.fieldName === 'chartOfAccount' && e?.fieldData?.isDefaultValue && e?.fieldData?.defaultValue) {
            const filteredOption = e.fieldData?.option?.filter((obj) => obj?.optionValue === e?.fieldData?.defaultValue) || [];
            e.fieldData.option = filteredOption;
          }
        });

        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

        if (repairJobId) {
          axiosInstance()
            .get(`${repairJob.api}/` + repairJobId)
            .then(({ data: { data } }) => {
              if (isClone) {
                const { _id, brand, createdBy, history, repairJobName, actualEndDate, updatedBy, ...rest } = data;
                setTitle(`Clone - ${repairJobName}`);
                rest.repairJobName = GenerateResourceLineNumber(fieldsDataForCreate);
                rest.status = REPAIR_JOB_STATUS.new;
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user), expectedCompletionDate: null }
                });
                setLoading(false);
              } else {
                axiosInstance()
                  .get(`${repairJob.api}/${repairJobId}/assets`)
                  .then(({ data: { data: assetData } }) => {
                    if (assetData.length) {
                      fieldsDataForUpdate?.forEach((e) => {
                        if (['supplierAccount', 'warehouse']?.includes(e?.fieldName)) {
                          e.disableOnEdit = true;
                          e.isUneditable = true;
                        }
                      });
                    }
                    setTitle(`Editing - [${data.repairJobName}]`);
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
        } else {
          setTitle(`Create ${resources?.repairJob?.titleSingular}`);
          let initialData = getObjKeys('', fieldsDataForCreate);
          if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
            initialData['currency'] = user.user?.brandCurrency;
          }
          initialData['repairJobName'] = GenerateResourceLineNumber(fieldsDataForCreate);
          if (fieldsDataForCreate?.some((e) => e.fieldName === 'expectedCompletionDate')) {
            initialData['expectedCompletionDate'] = null;
          }
          if (referenceType === 'Rental Job') {
            initialData['warehouse'] = referenceData?.warehouse;
            initialData['rentalJob'] = referenceData?._id;
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellName')) {
              initialData['wellName'] = referenceData?.wellName;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellNumber') && referenceData?.wellNumber) {
              initialData['wellNumber'] = referenceData?.wellNumber;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'afeNumber')) {
              initialData['afeNumber'] = referenceData?.afeNumber;
            }
          }
          if (referenceData?.warehouse && fieldsDataForCreate.some((e) => e.fieldName === 'warehouse')) {
            initialData['warehouse'] = referenceData?.warehouse;
          }
          if (referenceType === sidebarResource.workOrder || referenceType === sidebarResource.workOrderTechnician) {
            initialData['workOrder'] = referenceData?.workOrder;
            fieldsDataForCreate?.forEach((e) => {
              if (['warehouse']?.includes(e?.fieldName)) {
                e.isUneditable = true;
              }
            });
          }
          setInitialData({
            fields: fieldsDataForCreate,
            values: initialData
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [repairJobId]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (repairJobId && isClone === false) {
      values._id = repairJobId;
      axiosInstance()
        .put(`${repairJob.api}`, values)
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
      const { productInventory, ...rest } = values;
      axiosInstance()
        .post(`${repairJob.api}`, rest)
        .then(({ data: { data, message } }) => {
          if (!referenceType) {
            history.push(`${routes.repairJobDetail.path}/${data._id}`);
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
                    resource={sidebarResource.repairJob}
                    referenceId={repairJobId || null}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  disabled={submitting}
                  type="button"
                  variant="outlined"
                  color="primary"
                  id="dialog-cancel-button"
                  size="small"
                  onClick={() => {
                    if (isEqual(values, initialData.values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  id="dialog-save-button"
                  color="primary"
                  startIcon={submitting && <CircularProgress size={20} color="inherit" />}
                  disabled={submitting}
                  onClick={(e) => {
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
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

export default ManageRepairJob;

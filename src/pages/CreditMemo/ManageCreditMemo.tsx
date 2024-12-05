import { Box, Button, CircularProgress, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { CustomDialogTransition, GenerateResourceLineNumber, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import { FaDiceOne } from 'react-icons/fa';
import InputField from 'src/components/Helpers/InputField';

const ManageCreditMemo = ({ onClose, onSuccess, isClone = false, creditMemoId = null,  referenceData = null, isRedirectToDetailPage = true }) => {
  
  const history = useHistory();
  const {
    state: { user }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [formsData, setFormsData] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let data;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource?.creditMemo}`);
      data = response?.data?.data;
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (creditMemoId) {
        axiosInstance()
          .get(`${routes?.creditMemo?.path}/${creditMemoId}`)
          .then(({ data: { data } }: any) => {
            let fields = fieldsDataForUpdate;
            let tempData = data;
            if (isClone) {
              fields = fieldsDataForCreate;
              const { ...rest } = data;
              rest.creditMemoNumber = GenerateResourceLineNumber(fieldsDataForCreate);
              setCloneHeading(rest.creditMemoNumber || data?.creditMemoNumber);
              tempData = rest;
            }
            setInitialData({
              fields: fields,
              values: isClone ? getObjKeysWithValues(tempData, fields, true, user) :getObjKeysWithValues(tempData, fields)
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        const tempInitialData = { ...getObjKeys('', fieldsDataForCreate), currency: user.user?.brandCurrency || '' };
        tempInitialData['creditMemoNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        if (referenceData) {
          for (const key in referenceData) {
            if (referenceData[key] && fieldsDataForCreate?.some((e) => e.fieldName === key)) {
              tempInitialData[key] = referenceData[key];
              const field = fieldsDataForCreate?.find((f) => f?.fieldName === key);
              if (field) {
                field.disableOnEdit = true;
                field.isUneditable = true;
              }
            }
          }
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (creditMemoId && !isClone) {
      values._id = creditMemoId;
      axiosInstance()
        .put(`${routes.creditMemo?.path}`, values)
        .then(({ data }: any) => {
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
      axiosInstance()
        .post(`${routes.creditMemo?.path}`, values)
        .then(({ data: { data, message } }: any) => {
          setLoading(false);
          if (isRedirectToDetailPage) {
            history.push(`${routes.creditMemoDetail.path}/${data._id}`);
          }
          onSuccess(data);
          setSubmitting(true);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setLoading(false);
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
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
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${creditMemoId
                  ? isClone
                    ? `Clone - ${cloneHeading}`
                    : `Update - ${initialData.values?.creditMemoNumber ? `${initialData.values?.creditMemoNumber}` : ''}`
                  : `Create ${routes?.creditMemo?.title}`
                  }`}
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
                      setFieldValue={setFieldValue}
                      touched={touched}
                      fieldsData={initialData.fields}
                      size="small"
                      fullWidth
                      resource={sidebarResource.creditMemo}
                      referenceId={creditMemoId|| null}
                    />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={uploadingImageOrFileProgress > 0 || loading || submitting}
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="small"
                  onClick={submitForm}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
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

export default ManageCreditMemo;

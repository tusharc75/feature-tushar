import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import { Box } from '@mui/material';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  quotation,
  yupSchema,
  GenerateResourceLineNumber,
  QUOTATION_STATUS,
  sidebarResource
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';
import dayjs from 'dayjs';

const ManageQuotationDialog = ({
  isClone,
  quotationId,
  quotationData = null,
  onClose,
  onSuccess,
  open,
  versionId = null,
  referenceData = null,
  isRedirectTodetailPage = true
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, resources }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [quotationId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Quotation');
      fieldData = response?.data?.data?.filter(
        (obj) => !['rentalJob', 'repairOrder', 'salesOrder', 'fieldJob', 'assemblyOrder']?.includes(obj?.fieldData?.fieldName)
      );

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (quotationId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${quotation.api}/` + quotationId);
          data = response?.data?.data;
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, quotationNumber, updatedBy, ...rest } = data;
            rest.status = 'New';
            rest.quotationNumber = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(quotationNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: getObjKeysWithValues(rest, fieldsDataForCreate, true, user)
            });
            setLoading(false);
          } else {
            if (data?.canEdit === false) {
              fieldsDataForUpdate?.forEach((e) => {
                if (['warehouse', 'type']?.includes(e?.fieldName)) {
                  e.isUneditable = true;
                }
                if (
                  ['customerAccount']?.includes(e?.fieldName) &&
                  [QUOTATION_STATUS.sentToCustomer, QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.converted]?.includes(data?.status)
                ) {
                  e.isUneditable = true;
                }
              });
            }
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate), currency: user.user?.brandCurrency || '' };
        initialData['quotationNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        if (referenceData) {
          fieldsDataForCreate?.forEach((field) => {
            if (referenceData[field.fieldName]) {
              field.isUneditable = true;
            }
          });
          for (const key in referenceData) {
            if (referenceData[key] && fieldsDataForCreate?.some((e) => e.fieldName === key)) {
              initialData[key] = referenceData[key];
            }
          }
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (quotationId && isClone === false) {
      values._id = quotationId;
      axiosInstance()
        .put(`${quotation.api}`, values)
        .then(({ data }) => {
          setLoading(false);
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${quotation.api}`, values)
        .then(({ data: { data, message } }) => {
          if (versionId) {
            axiosInstance()
              .post(`${quotation.api}/clone-new-quotation-version`, {
                oldQuotationId: quotationId,
                newQuotationId: data._id,
                versionId: versionId
              })
              .then(() => {
                history.push(`${routes.quotationDetail.path}/${data._id}`);
                setLoading(false);
                onSuccess(data);
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: message
                });
              })
              .catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
              });
          } else {
            if (isRedirectTodetailPage) {
              history.push(`${routes.quotationDetail.path}/${data._id}`);
            }
            setLoading(false);
            onSuccess(data);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: message
            });
          }
        })
        .catch((error) => {
          setLoading(false);
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

  const validate = (values) => {
    const errors = {};
    let estimateStartDate = dayjs(values?.estimateStartDate);
    let estimateEndDate = dayjs(values?.estimateEndDate);
    let supplierSuggestedDeliveryDate = dayjs(values?.supplierSuggestedDeliveryDate);
    let expectedCustomerDeliveryDate = dayjs(values?.expectedCustomerDeliveryDate);

    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }

    if (expectedCustomerDeliveryDate.diff(supplierSuggestedDeliveryDate, 'days') < 0) {
      errors['expectedCustomerDeliveryDate'] = 'Please enter valid expected customer delivery date';
    }

    return errors;
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
      open={open}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={
                  !quotationId
                    ? `Create ${resources?.quotation?.titleSingular}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${quotationData?.quotationNumber}`}`
                }
                onClose={() => {
                  if (!isEqual(values, initialData.values)) {
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
                    resource={sidebarResource.quotation}
                    referenceId={quotationId || null}
                    collaborateTools={true}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
buttonType="transparent"
                  onClick={() => {
                    if (!isEqual(values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={loading}
buttonType="theme"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                  disabled={loading}
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
                    handleScroll(errors);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
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

export default ManageQuotationDialog;

import { useState, useEffect, useContext, Fragment } from 'react';
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
  fieldServiceOrder,
  yupSchema,
  sidebarResource,
  GenerateResourceLineNumber,
  SERVICE_ORDER_STATUS
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

const ManageServiceOrderDialog = ({ isClone, serviceOrderId, onClose, onSuccess, open }) => {
  const {
    state: { user, resources }
  }: any = useData();

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    fetchFields();
  }, [serviceOrderId]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      let fieldData;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource.fieldServiceOrder}`);
      fieldData = response?.data?.data;

      fieldData = fieldData?.filter((e) => !['quotation'].includes(e?.fieldData?.fieldName));

      var statusOptions = [];
      fieldData?.forEach((e: any) => {
        if (e?.fieldData?.fieldName === 'status') {
          statusOptions = e.fieldData.option;
        }
      });
      var fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      var fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (serviceOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${fieldServiceOrder.api}/` + serviceOrderId);
          data = response?.data?.data;
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, fieldServiceOrderNumber, updatedBy, ...rest } = data;
            rest['status'] = SERVICE_ORDER_STATUS.new;
            rest['fieldServiceOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(fieldServiceOrderNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
            });
            setLoading(false);
          } else {
            if (data?.canEdit === false) {
              fieldsDataForUpdate?.forEach((e) => {
                if (['warehouse', 'customerAccount']?.includes(e?.fieldName)) {
                  e.isUneditable = true;
                }
              });
            }
            setServiceDetails(data);
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
        let initialData = getObjKeys('', fieldsDataForCreate);
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          initialData['currency'] = user.user?.brandCurrency;
        }
        initialData['fieldServiceOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
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
    if (serviceOrderId && isClone === false) {
      values._id = serviceOrderId;
      axiosInstance()
        .put(`${fieldServiceOrder.api}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${fieldServiceOrder.api}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          history.push(`${routes?.fieldServiceOrderDetail?.path}/${data?._id}`);
          setLoading(false);
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

  function validate(values) {
    const errors = {};
    let estimateStartDate = dayjs(values?.estimateStartDate);
    let estimateEndDate = dayjs(values?.estimateEndDate);
    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid end date';
    }
    return errors;
  }

  console.log(initialData)

  return (
    <>
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
              <Fragment>
                <CustomDialogHeader
                  title={
                    !serviceOrderId
                      ? `Create ${resources?.fieldServiceOrder?.titleSingular}`
                      : `${isClone ? `Clone - ${cloneHeading}` : `Update ${serviceDetails?.fieldServiceOrderNumber}`}`
                  }
                  onClose={() => {
                    if (isEqual(initialData.values, values)) {
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
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <InputField
                      errors={errors}
                      values={values}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        if (name === 'customerAccount') {
                          const customerAccount = initialData?.fields
                            ?.find((e) => e?.fieldName === 'customerAccount')
                            ?.option.find((d) => d.optionValue === value);
                          const collaborator = [...(customerAccount.fieldServiceManager || []), ...(customerAccount?.lead || [])];
                          if (collaborator?.length) {
                            setFieldValue(
                              'collaborator',
                              collaborator?.filter((e) => e !== values['owner'])
                            );
                          } else {
                            setFieldValue('collaborator', []);
                          }
                        }
                        if (name === 'wellNumber') {
                          if (initialData?.fields.find((e) => e?.fieldName === 'numberOfWells')) {
                            if (value) {
                              setFieldValue('numberOfWells', value?.length);
                            } else {
                              setFieldValue('numberOfWells', 0);
                            }
                          }
                        }
                      }}
                      touched={touched}
                      fieldsData={initialData.fields}
                      size="small"
                      fullWidth
                      resource={sidebarResource.fieldServiceOrder}
                      referenceId={serviceOrderId || null}
                    />
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <ThemeButton
                    buttonType="transparent"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) {
                        onClose();
                      } else {
                        setShowConfirmDialog(true);
                      }
                    }}
                  >
                    Cancel
                  </ThemeButton>
                  <ThemeButton
                    id="dialog-save-button"
                    isLoading={loading}
                    buttonType="theme"
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
                      submitForm();
                    }}
                  >
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

export default ManageServiceOrderDialog;

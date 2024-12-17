import { useState, useEffect, Fragment, useContext, useRef } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  purchaseOrder,
  PURCHASE_ORDER_STATUS,
  GenerateResourceLineNumber,
  sidebarResource,
} from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box } from '@material-ui/core';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { isEqual } from 'lodash';
import InputField from 'src/components/Helpers/InputField';
import { generateStepsFormfieldData, useGetWalkmeInstance } from 'src/components/CustomIntro';

const ManagePurchaseOrder = ({
  isClone = false,
  purchaseOrderId = null,
  onClose,
  onSuccess,
  products = [],
  services = [],
  currency = null,
  rentalManagementId = null,
  warehouseId = null,
  refrenceData = null,
  isRedirectTodetailPage = true
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [purchaseOrderData, setPurchaseOrderData] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('head');
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [requiredCustomerAndProject, setRequiredCustomerAndProject] = useState(false);
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
    axiosInstance()
      .get('/field?resource=Purchase Order')
      .then(({ data: { data } }) => {
        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        fieldsDataForCreate = fieldsDataForCreate.filter((f) => f.fieldName !== 'rentalJob');
        fieldsDataForUpdate = fieldsDataForUpdate.filter((f) => f.fieldName !== 'rentalJob');
        if (purchaseOrderId) {
          axiosInstance()
            .get(`${purchaseOrder.api}/` + purchaseOrderId)
            .then(({ data: { data } }) => {
              setPurchaseOrderData(data);
              if (isClone) {
                const { _id, createdBy, updatedBy, serialNumber, purchaseOrderNumber, ...rest } = data;
                rest['status'] = PURCHASE_ORDER_STATUS.open;
                rest['purchaseOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);

                setInitialData({
                  fields: fieldsDataForCreate,
                  values: getObjKeysWithValues(rest, fieldsDataForCreate, true, user)
                });
                setCloneHeading(purchaseOrderNumber);
                setLoading(false);
              } else {
                if (data?.canEdit === false) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (['warehouse', 'currency', 'expenseItem', 'supplierAccount']?.includes(e?.fieldName)) {
                      e.disableOnEdit = true;
                    }
                  });
                }
                setInitialData({
                  fields: fieldsDataForUpdate,
                  values: getObjKeysWithValues(data, fieldsDataForUpdate)
                });
              }
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          let createValues: any = getObjKeys('', fieldsDataForCreate);
          createValues['purchaseOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
          if (rentalManagementId) {
            createValues['rentalJob'] = rentalManagementId;
          }
          if (warehouseId) {
            createValues['warehouse'] = warehouseId;
          }
          if (currency) {
            createValues['currency'] = currency;
          }
          else {
            if (fieldsDataForCreate?.find((e) => e.fieldName === 'currency')) {
              createValues['currency'] = user.user?.brandCurrency;
            }
          }
          if (refrenceData) {
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellName')) {
              createValues['wellName'] = refrenceData?.wellName;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'wellNumber') && refrenceData?.wellNumber) {
              createValues['wellNumber'] = refrenceData?.wellNumber;
            }
            if (fieldsDataForCreate.some((e) => e.fieldName === 'afeNumber')) {
              createValues['afeNumber'] = refrenceData?.afeNumber;
            }
          }
          setInitialData({
            fields: fieldsDataForCreate,
            values: createValues
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [purchaseOrderId]);

  const handleSubmit = (values) => {
    setLoading(true);
    if (purchaseOrderId && isClone === false) {
      values._id = purchaseOrderId;
      axiosInstance()
        .put(`${purchaseOrder.api}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
    else {
      if (products?.length) {
        values.products = products;
      }
      if (services?.length) {
        values.services = services;
      }
      axiosInstance().post(`${purchaseOrder.api}`, values).then(({ data: { data } }) => {
        setLoading(false);
        if (isRedirectTodetailPage) {
          history.push(`${purchaseOrder.api}/detail/${data._id}`);
        }
        onSuccess(data);
      }).catch((error) => {
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
    if (requiredCustomerAndProject) {
      const customerAccountField = initialData.fields?.find((e) => e.fieldName === 'customerAccount')
      if (requiredCustomerAndProject && !values.customerAccount) {
        errors['customerAccount'] = `${customerAccountField?.fieldLabel} is required`;
      }
      const projectField = initialData.fields?.find((e) => e.fieldName === 'project')
      if (!values.project) {
        errors['project'] = `${projectField?.fieldLabel} is required`;

      }
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
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      fullWidth
    >
      {initialData && initialData.fields.length ? (
        <Formik validate={validate} initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, handleSubmit }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  purchaseOrderId
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update - ${purchaseOrderData?.purchaseOrderNumber || ''}`
                    : 'Create ' + resources?.purchaseOrder?.titleSingular
                }
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
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
                      if (name === 'chartOfAccount') {
                        const chartOfAccountField = initialData.fields?.find((e) => e.fieldName === 'chartOfAccount')
                        if (chartOfAccountField) {
                          const chartOfAccount = chartOfAccountField?.option?.filter((e) => value?.includes(e.optionValue))
                          if (chartOfAccount?.find((e) => e?.optionLabel.includes('55050'))) {
                            setRequiredCustomerAndProject(true)
                          }
                          else {
                            setRequiredCustomerAndProject(false)
                          }
                        }
                      }
                    }}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.purchaseOrder}
                    referenceId={purchaseOrderId || null}
                    collaborateTools={true}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  id="dialog-save-button"
                  loading={loading}
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    handleSubmit();
                  }}
                  disabled={loading}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
                    handleSubmit();
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

export default ManagePurchaseOrder;

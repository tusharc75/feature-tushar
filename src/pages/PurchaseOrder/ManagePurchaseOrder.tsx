import { useState, useEffect, Fragment, useContext } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from '../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  purchaseOrder,
  PURCHASE_ORDER_STATUS,
  setFieldsInAscendingOrder,
  GenerateResourceLineNumber,
} from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Box, Grid } from '@material-ui/core';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { isEqual } from 'lodash';

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
  disableEdit = false,
  refrenceData = null
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [purchaseOrderData, setPurchaseOrderData] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('head');

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

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
                if (fieldsDataForCreate?.filter((e) => e.fieldName === 'purchaseOrderDate').length) {
                  rest['purchaseOrderDate'] = new Date();
                }
                if (fieldsDataForCreate?.filter((e) => e.fieldName === 'deliveryDate').length) {
                  rest['deliveryDate'] = new Date();
                }
                setInitialData({
                  fields: fieldsDataForCreate,
                  values: getObjKeysWithValues(rest, fieldsDataForCreate)
                });
                setCloneHeading(purchaseOrderNumber);
                setLoading(false);
              } else {
                if (disableEdit) {
                  fieldsDataForUpdate?.forEach((e) => {
                    if (['warehouse', 'currency']?.includes(e?.fieldName)) {
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

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

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
    } else {
      if (products?.length) {
        values.products = products;
      }
      if (services?.length) {
        values.services = services;
      }
      axiosInstance()
        .post(`${purchaseOrder.api}`, values)
        .then(({ data: { data } }) => {
          setLoading(false);
          if (products?.length || services?.length) {
            onSuccess(data);
          } else {
            history.push(`${purchaseOrder.api}/detail/${data._id}`);
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
      {formsData && formsData.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues, handleSubmit }) => (
            <Fragment>
              <CustomDialogHeader
                title={
                  purchaseOrderId
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update - ${purchaseOrderData?.purchaseOrderNumber || ''}`
                    : 'Create ' + routes.purchaseOrder.title
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
                  {formsData.length > 0 &&
                    formsData.map((form, i) => (
                      <div key={i}>
                        <div className={'detail-box-content'}>
                          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {form.sectionFields.map((field, index2) => (
                              <Grid key={index2} item xs={12} sm={6} md={6}>
                                {field.fieldName === 'deliveryDate' ? (
                                  <FormTypes
                                    {...field}
                                    disabled={Boolean(purchaseOrderId) && field.disableOnEdit && !isClone}
                                    values={values}
                                    //maxDate={deliveryDateMax ? deliveryDateMax : undefined}
                                    //minDate={deliveryDateMax ? undefined : moment(new Date())}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    fieldData={field}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                  />
                                ) : (
                                  <FormTypes
                                    isNew={Boolean(purchaseOrderId)}
                                    {...field}
                                    disabled={(Boolean(purchaseOrderId) && field.disableOnEdit && !isClone)}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    fieldData={field}
                                    fields={initialData.fields}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                  />
                                )}
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      </div>
                    ))}
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

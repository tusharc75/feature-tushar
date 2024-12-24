import { useState, useEffect, useContext, useRef, Fragment } from 'react';
import { Box, Dialog, Button, Grid, Tooltip, IconButton } from '@mui/material';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  setFieldsInAscendingOrder,
  serializedAsset,
  GenerateResourceLineNumber,
  WORK_ORDER_STATUS,
  WORK_ORDER_TYPE
} from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, workOrder, sidebarResource } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import FormTypes from '../../components/Helpers/FormTypes';
import { FaDiceOne } from 'react-icons/fa';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from 'src/components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { ASSET_STATUS } from '../../constants/helpers';

const disabledFieldArray = ['type', 'product', 'warehouse', 'serializedAsset', 'status'];

const ManageWorkOrder = ({ onClose, onSuccess, isClone = false, workOrderId = null, isRedirectToDetailPage = true }) => {
  const {
    state: { user }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [assetOptions, setAssetOptions] = useState([]);
  const [assetOptionsData, setAssetOptionData] = useState([]);

  useEffect(() => {
    fetchFields();
  }, [workOrderId]);

  const fetchFields = async () => {
    try {
      let data;
      const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}`);
      data = response?.data?.data;

      data = data?.filter(
        (e) => !['productionOrder', 'repairOrder', 'repairJob', 'assemblyOrder', 'serviceProcessStatus'].includes(e?.fieldData?.fieldName)
      );

      let serializedAssetFieldIndex = data.findIndex((obj) => obj?.fieldData.fieldName === 'serializedAsset');
      if (serializedAssetFieldIndex > -1) {
        const deepFilter = [
          {
            field: 'status',
            term: {
              $in: [
                ASSET_STATUS.new,
                ASSET_STATUS.available,
                ASSET_STATUS.scrap,
                ASSET_STATUS.underReview,
                ASSET_STATUS.needRepair,
                ASSET_STATUS.needRecert,
                ASSET_STATUS.customerPossession
              ]
            }
          }
        ];
        const {
          data: { data: lookupResource }
        } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${serializedAsset.resource}&deepFilter=${JSON.stringify(deepFilter)}`);
        if (lookupResource['Serialized Asset']) {
          data[serializedAssetFieldIndex].fieldData.option = lookupResource['Serialized Asset'];
          setAssetOptionData(lookupResource['Serialized Asset']);
        }
      }

      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (workOrderId) {
        let data;
        const response = await axiosInstance().get(`${workOrder.api}/${workOrderId}`);
        data = response?.data?.data;
        setAssetOptions(assetOptionsData.filter((i) => i.warehouse === data?.warehouse?.optionValue));
        if (isClone) {
          const { _id, createdBy, updatedBy, workOrderNumber, status, ...rest } = data;
          rest['workOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
          rest['status'] = WORK_ORDER_STATUS.new;
          setInitialData({
            fields: fieldsDataForUpdate,
            values: getObjKeysWithValues(rest, fieldsDataForUpdate, true, user)
          });
        } else {
          setInitialData({
            fields: fieldsDataForUpdate,
            values: getObjKeysWithValues(data, fieldsDataForUpdate)
          });
        }
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        tempInitialData['workOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = async (values) => {
    if (workOrderId && !isClone) {
      setSubmitting(true);
      values._id = workOrderId;
      axiosInstance()
        .put(`${workOrder.api}`, values)
        .then(({ data }) => {
          setLoading(false);
          onSuccess();
          setSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setLoading(false);
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      setSubmitting(true);
      let updatedValues = { ...values };
      axiosInstance()
        .post(`${workOrder.api}`, updatedValues)
        .then(({ data }) => {
          setLoading(false);
          setSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          if (isRedirectToDetailPage) {
            history.push(`${routes?.workOrderDetail?.path}/${data?.data?._id}`);
          }
          onSuccess();
        })
        .catch((error) => {
          setLoading(false);
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

  const [formsData, setFormsData] = useState([]);

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

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
      {initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (!isEqual(values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                title={`${
                  workOrderId
                    ? isClone
                      ? `Clone ${initialData.values?.workOrderNumber ? `(${initialData.values?.workOrderNumber})` : ''}`
                      : `Update ${initialData.values?.workOrderNumber ? `(${initialData.values?.workOrderNumber})` : ''}`
                    : `Create Work Order`
                }`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {formsData &&
                    formsData?.map((form, i) => {
                      return (
                        form.name && (
                          <div key={i}>
                            <div className="detail-box-content">
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className="form-label-style form-label-quotes">{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field, index2) => (
                                  <Grid key={index2} item xs={12} sm={6} md={6}>
                                    {field.fieldName === 'warehouse' ? (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        disabled={(workOrderId && disabledFieldArray.includes(field.fieldName)) || field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={(name, value) => {
                                          setFieldValue(name, value);
                                          let data = assetOptionsData.filter((i) => {
                                            if (values?.product) {
                                              return values?.product === i.product && i.warehouse === value;
                                            }
                                            return i.warehouse === value;
                                          });
                                          setAssetOptions(data);
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        imageOrFileUploadCompletePercentage={null}
                                      />
                                    ) : field.fieldName === 'serializedAsset' ? (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        disabled={
                                          (workOrderId && disabledFieldArray.includes(field.fieldName)) ||
                                          field.disableOnEdit ||
                                          values['type'] === WORK_ORDER_TYPE.productionOrder
                                        }
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={assetOptions}
                                        setFieldValue={(name, value) => {
                                          setFieldValue(name, value);
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        imageOrFileUploadCompletePercentage={null}
                                      />
                                    ) : field.fieldName === 'product' ? (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        disabled={(workOrderId && disabledFieldArray.includes(field.fieldName)) || field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={(name, value) => {
                                          setFieldValue(name, value);
                                          let data = assetOptionsData.filter((i) => {
                                            if (values?.warehouse) {
                                              return values?.warehouse === i.warehouse && i.product === value;
                                            }
                                            return i.product === value;
                                          });
                                          setAssetOptions(data);
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        imageOrFileUploadCompletePercentage={null}
                                      />
                                    ) : (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        fields={initialData.fields}
                                        disabled={(workOrderId && disabledFieldArray.includes(field.fieldName)) || field.disableOnEdit}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
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
                                        imageOrFileUploadCompletePercentage={null}
                                      />
                                    )}
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </div>
                        )
                      );
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (!isEqual(values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  disabled={isSubmitting || loading}
                  loading={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
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

export default ManageWorkOrder;

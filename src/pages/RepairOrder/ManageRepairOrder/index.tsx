import { useState, useEffect, useContext } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, Grid } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  setFieldsInAscendingOrder,
  yupSchema,
  generateUniqueIdOnly,
  repairOrder,
  REPAIR_ORDER_TYPE
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne } from 'react-icons/fa';
import moment from 'moment';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';

const ManageRepairOrder = ({
  isClone = false,
  repairOrderId = null,
  onClose,
  onSuccess,
  referenceType = null,
  referenceData = null,
  isEditable = true,
  isAnyMaterial = false
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formsData, setFormsData] = useState([]);

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [repairOrderData, setRepairOrderData] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    setFormsData(setFieldsInAscendingOrder(initialData.fields));
  }, [initialData.fields]);

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [repairOrderId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get('/field?resource=Repair Order');
      fieldData = response?.data?.data;

      fieldData = fieldData?.filter((e) => !['rentalJob', 'quotation']?.includes(e.fieldData.fieldName));

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      if (repairOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${repairOrder.api}/` + repairOrderId);
          data = response?.data?.data;
          setRepairOrderData(data);
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, repairOrderNumber, updatedBy, ...rest } = data;
            rest.status = 'New';
            if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
              rest.repairOrderNumber = `RO_${generateUniqueIdOnly()}`;
            }
            setCloneHeading(repairOrderNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: getObjKeysWithValues(rest, fieldsDataForCreate)
            });
            setLoading(false);
          } else {
            if (isAnyMaterial) {
              fieldsDataForUpdate?.forEach((e) => {
                if (e.fieldName === 'customerAccount') {
                  e.disableOnEdit = true;
                }
              })
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
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };
        if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
          initialData['repairOrderNumber'] = `RO_${generateUniqueIdOnly()}`;
        }
        if (referenceType === 'rentalJob') {
          initialData['rentalJob'] = referenceData?._id;
          if (fieldsDataForCreate?.some((e) => e?.fieldName === 'warehouse')) {
            initialData['warehouse'] = referenceData?.warehouse;
          }
          if (fieldsDataForCreate?.some((e) => e?.fieldName === 'customerAccount')) {
            initialData['customerAccount'] = referenceData?.customerAccount;
          }
          if (fieldsDataForCreate?.some((e) => e?.fieldName === 'customerContact')) {
            initialData['customerContact'] = referenceData?.customerContact;
          }
          if (fieldsDataForCreate?.some((e) => e?.fieldName === 'type')) {
            initialData['type'] = REPAIR_ORDER_TYPE.internal;
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
    if (repairOrderId && isClone === false) {
      values._id = repairOrderId;
      axiosInstance()
        .put(`${repairOrder.api}`, values)
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
      const { productInventory, ...rest } = values;
      axiosInstance()
        .post(`${repairOrder.api}`, rest)
        .then(({ data: { data, message } }) => {
          if (!referenceType) {
            history.push(`${routes.repairOrderDetail.path}/${data._id}`);
          }
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
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err?.length) {
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
    if (values?.type === REPAIR_ORDER_TYPE.external && !values?.customerAccount) {
      errors['customerAccount'] = 'Customer Account is required';
    }
    return errors;
  }

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
      {formsData && formsData?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validate={validate} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, handleSubmit }) => (
            <>
              <CustomDialogHeader
                title={
                  !repairOrderId
                    ? `Create ${routes.repairOrder.title}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${repairOrderData?.repairOrderNumber || ''}`}`
                }
                onClose={(e, reason) => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form>
                  {formsData &&
                    formsData.map((form, i) => {
                      return (
                        form.name && (
                          <div key={i}>
                            <div className={'detail-box-content'}>
                              <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                              <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                            </div>
                            <Box marginY={2}>
                              <Grid spacing={3} container>
                                {form.sectionFields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                    {field.fieldName === 'startDate' ? (
                                      <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        disabled={repairOrderId && field.disableOnEdit}
                                        values={values}
                                        fieldData={field}
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
                                        minDate={new Date()}
                                        maxDate={
                                          values['expectedCompletionDate'] ? moment(values['expectedCompletionDate']) : moment().add(5, 'years')
                                        }
                                      />
                                    ) : field.fieldName === 'expectedCompletionDate' ? (
                                      <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        disabled={repairOrderId && field.disableOnEdit}
                                        values={values}
                                        fieldData={field}
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
                                        minDate={values['startDate']}
                                      />
                                    ) : field.fieldName === 'type' ? (
                                      <FormTypes
                                        repairOrderId={repairOrderId}
                                        {...field}
                                        fieldData={field}
                                        disabled={(repairOrderId && field.disableOnEdit) || !isEditable}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        onChange={(e, value) => {
                                          setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                          if (
                                            initialData.fields.find((d) => d.fieldName === 'customerContact') &&
                                            initialData.fields.find((d) => d.fieldName === 'customerAccount')
                                          ) {
                                            setFieldValue('customerContact', '');
                                            setFieldValue('customerAccount', '');
                                          } else if (initialData.fields.find((d) => d.fieldName === 'customerAccount')) {
                                            setFieldValue('customerAccount', '');
                                          } else if (initialData.fields.find((d) => d.fieldName === 'customerContact')) {
                                            setFieldValue('customerContact', '');
                                          }
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                      />
                                    ) : (
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        fields={initialData?.fields}
                                        disabled={(Boolean(repairOrderId) && field.disableOnEdit && !isClone) || field.isUneditable}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        required={field?.fieldName === 'customerAccount' ? values?.type === REPAIR_ORDER_TYPE.external ? true : false : field.required}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={(name, value) => {
                                          setFieldValue(name, value);
                                        }}
                                        fullWidth
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        imageOrFileUploadCompletePercentage={
                                          ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                            ? (completePercentage) => {
                                              setUploadingImageOrFileProgress(completePercentage);
                                            }
                                            : null
                                        }
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
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
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
                  disabled={uploadingImageOrFileProgress > 0 || loading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    handleSubmit();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmCancelDialog
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

export default ManageRepairOrder;

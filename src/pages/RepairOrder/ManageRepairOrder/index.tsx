import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import axiosInstance from '../../../axios/axiosInstance';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import FormTypes from '../../../components/Helpers/FormTypes';
import routes from '../../../components/Helpers/Routes';
import {
  CustomDialogTransition,
  GenerateResourceLineNumber,
  getObjKeys,
  getObjKeysWithValues,
  REPAIR_ORDER_TYPE,
  repairOrder,
  setFieldsInAscendingOrder,
  sidebarResource,
  yupSchema
} from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
  const walkmeInstance = useGetWalkmeInstance();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const isStepPushed = useRef(false);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formsData, setFormsData] = useState([]);

  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, permissions, selectedEntity, resources }
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

      fieldData = fieldData?.filter((e) => !['quotation', 'invoice']?.includes(e.fieldData.fieldName));

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
            rest.repairOrderNumber = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(repairOrderNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: getObjKeysWithValues(rest, fieldsDataForCreate, true, user)
            });
            setLoading(false);
          } else {
            if (isAnyMaterial) {
              fieldsDataForUpdate?.forEach((e) => {
                if (['customerAccount', 'warehouse']?.includes(e.fieldName)) {
                  e.disableOnEdit = true;
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
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };
        initialData['repairOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'currency')) {
          initialData['currency'] = user.user?.brandCurrency;
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
          const disabledField = ['rentalJob', 'warehouse', 'customerAccount', 'type'];
          disabledField?.forEach((field: any) => {
            fieldsDataForCreate?.forEach((e) => {
              if (e.fieldName === field && initialData[field]) {
                e.disableOnEdit = true;
                e.isUneditable = true;
              }
            });
          });
        }
        if (referenceType === sidebarResource.workOrderPlanning) {
          if (referenceData) {
            for (const key in referenceData) {
              if (referenceData[key] && fieldsDataForCreate?.some((e) => e.fieldName === key)) {
                initialData[key] = referenceData[key];
              }
            }
            fieldsDataForCreate?.forEach((e) => {
              if (e.fieldName === 'warehouse') {
                e.disableOnEdit = true;
                e.isUneditable = true;
              }
            });
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
            history.push(`${routes?.repairOrderDetail?.path}/${data._id}`);
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
    if ((values?.type === REPAIR_ORDER_TYPE.external || values?.addQuotationStep) && !values?.customerAccount) {
      errors['customerAccount'] = 'Customer Account is required';
    }
    return errors;
  }

  const isCustomerAccountPresent = useMemo(() => {
    const index = initialData.fields?.findIndex((d) => d['fieldName'] === 'customerAccount');
    if (index > -1) {
      return { data: initialData.fields[index], index };
    }
    return false;
  }, [initialData]);

  const handlePushCustomerAccountStep = (values) => {
    if (
      (values?.type === REPAIR_ORDER_TYPE.external || values?.addQuotationStep) &&
      isCustomerAccountPresent &&
      walkmeInstance &&
      !isStepPushed.current
    ) {
      isStepPushed.current = true;
      walkmeInstance?.instance.insert(
        [
          {
            title: `Select ${isCustomerAccountPresent.data?.fieldLabel}`,
            target: `#field-${isCustomerAccountPresent.data?.fieldLabel?.toLowerCase()?.split(' ').join('-')}`,
            content: '',
            nextOnValueChange: true,
            skipIfValueExist: true,
            fieldType: isCustomerAccountPresent.data?.type
          }
        ],
        isCustomerAccountPresent.index
      );
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
      {formsData && formsData?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validate={validate}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, handleSubmit }) => {
            handlePushCustomerAccountStep(values);
            return (
              <>
                <CustomDialogHeader
                  title={
                    !repairOrderId
                      ? `Create ${resources?.repairOrder?.titleSingular}`
                      : `${isClone ? `Clone - ${cloneHeading}` : `Update ${repairOrderData?.repairOrderNumber || ''}`}`
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
                                    <Grid key={field.fieldName} size={{xs:12, sm:6, md:6}}>
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
                                          required={
                                            field?.fieldName === 'customerAccount'
                                              ? values?.type === REPAIR_ORDER_TYPE.external || values?.addQuotationStep
                                                ? true
                                                : false
                                              : field.required
                                          }
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
                  <ThemeButton
                    buttonType="transparent"
                    id="dialog-cancel-button"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) onClose();
                      else setShowConfirmDialog(true);
                    }}
                  >
                    Cancel
                  </ThemeButton>
                  <ThemeButton
                    isLoading={loading}
                    buttonType="transparent"
                    id="dialog-save-button"
                    disabled={uploadingImageOrFileProgress > 0 || loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(errors);
                      handleSubmit();
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
                      handleSubmit();
                    }}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      onClose();
                    }}
                  />
                )}
              </>
            );
          }}
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

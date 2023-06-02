import { useState, useEffect, useContext, useRef, Fragment } from 'react';
import { Box, Dialog, Button, Grid, Tooltip, IconButton } from '@material-ui/core';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import {
  getOwnerDropdownDataSource,
  getCollaboratorDropdownDataSource,
  CustomDialogTransition,
  setFieldsInAscendingOrder,
  generateUniqueIdOnly,
  serializedAsset
} from '../../constants/helpers';
import { getObjKeysWithValues, getObjKeys, yupSchema, workOrder, sidebarResource } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import FormTypes from '../../components/Helpers/FormTypes';
import { FaDiceOne } from 'react-icons/fa';
import moment from 'moment';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import CustomButton from '../../components/Helpers/CustomButton';
import routes from 'src/components/Helpers/Routes';
import { useHistory } from 'react-router-dom';

const disabledFieldArray = ['workOrderNumber', 'type', 'product', 'repairOrder', 'status'];

const ManageWorkOrder = ({ onClose, onSuccess, isClone = false, workOrderId = null, referenceType = null, referenceData = null }) => {
  const {
    state: { user }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
  const [ownerData, setOwnerData] = useState([]);
  const [collaboratorData, setCollaboratorData] = useState([]);
  const [disableOwnerSelection, setDisableOwnerSelection] = useState(false);
  const [assetOptions, setAssetOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [assetOptionsData, setAssetOptionData] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const fields = initialData.fields;
    if (fields.length > 0) {
      const ownerCollabOptions = fields.filter((d) => ['owner', 'collaborator'].indexOf(d.fieldName) !== -1);
      if (ownerCollabOptions.length > 0) {
        setOwnerCollaboratorData(ownerCollabOptions[0].option);
        setOwnerData(ownerCollabOptions[0].option);
        setCollaboratorData(ownerCollabOptions[0].option);
      }
      const modifiedData = setFieldsInAscendingOrder(fields);

      const newFilteredData = modifiedData.filter((formData) => {
        if (formData.name.includes('Fields')) {
          return false;
        }
        return true;
      });
      setFormsData(newFilteredData);
    }
  }, [initialData.fields, referenceData]);

  useEffect(() => {
    fetchFields();
  }, [workOrderId, referenceData]);

  const fetchFields = async () => {
    try {
      let data;
      const response = await axiosInstance().get(`/field?resource=${sidebarResource['workOrder']}`);
      data = response?.data?.data;
      let serializedAssetFieldIndex = data.findIndex((obj) => obj?.fieldData.fieldName === 'serializedAsset');
      let productFieldIndex = data.findIndex((obj) => obj?.fieldData.fieldName === 'product');
      if (serializedAssetFieldIndex > -1) {
        const {
          data: { data: lookupResource }
        } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${serializedAsset.resource}`);
        if (lookupResource['Serialized Asset']) {
          data[serializedAssetFieldIndex].fieldData.option = lookupResource['Serialized Asset'];
        }
      }
      if (productFieldIndex > -1) {
        const {
          data: { data: lookupResource }
        } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Product`);
        if (lookupResource['Product']) {
          data[productFieldIndex].fieldData.option = lookupResource['Product'];
        }
      }
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      let fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      const productOptionsData = data
        .find((obj) => obj?.fieldData.fieldName === 'product')
        ?.fieldData.option?.filter((obj) => obj?.serializedProduct === true);
      const assetOptionsData = data.find((obj) => obj?.fieldData.fieldName === 'serializedAsset')?.fieldData.option;
      setProductOptions(productOptionsData);
      setAssetOptionData(assetOptionsData);

      if (workOrderId) {
        let data;
        const response = await axiosInstance().get(`${workOrder.api}/${workOrderId}`);
        data = response?.data?.data;
        setDisableOwnerSelection(workOrderId && user.user._id !== data?.owner?.optionValue);
        setAssetOptions(assetOptionsData.filter((i) => i.warehouse === data?.warehouse?.optionValue));
        if (isClone) {
          const { _id, createdBy, updatedBy, workOrderNumber, status, ...rest } = data;
          if (fieldsDataForUpdate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
            rest['workOrderNumber'] = `WO_${generateUniqueIdOnly()}`;
          }
          rest['status'] = 'New';
          rest['estimateCompleteDate'] = new Date();
          rest['createDate'] = new Date();
          setInitialData({
            fields: fieldsDataForUpdate,
            values: getObjKeysWithValues(rest, fieldsDataForUpdate)
          });
        } else {
          setInitialData({
            fields: fieldsDataForUpdate,
            values: getObjKeysWithValues(data, fieldsDataForUpdate)
          });
        }
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        if (referenceType && referenceData) {
          if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
            tempInitialData['workOrderNumber'] = `WO_${generateUniqueIdOnly()}`;
          }
          tempInitialData['type'] = referenceType;
          tempInitialData['product'] = referenceData?.product;
          if (referenceType === 'Repair Order') {
            tempInitialData['repairOrder'] = referenceData?._id;
          }
          if (serializedAssetFieldIndex > -1 && referenceData.serializedAsset) {
            tempInitialData['serializedAsset'] = referenceData.serializedAsset;
          }
        } else {
          if (fieldsDataForCreate?.some((e) => e?.primaryField && e?.isSystemGenerate)) {
            tempInitialData['workOrderNumber'] = `WO_${generateUniqueIdOnly()}`;
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

  const onOwnerDropdownOpen = (selectedCollaborator) => {
    setOwnerData(getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData));
  };

  const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
    setCollaboratorData(getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData));
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
          if (referenceType && referenceData) {
            onSuccess(data?.data);
          } else {
            history.push(`${routes.workOrderDetail.path}/${data?.data?._id}`);
          }
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
    }
  };

  function validate(values) {
    const errors = {};
    return errors;
  }

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
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
          validate={validate}
          innerRef={ref}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
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
                    formsData.map((form, index1) => {
                      return form.name ? (
                        <div key={index1}>
                          <div className="detail-box-content">
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className="form-label-style form-label-quotes">{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) => (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  {field.fieldName === 'owner' ? (
                                    <FormTypes
                                      fieldData={field}
                                      isNew={!workOrderId}
                                      {...field}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={ownerData}
                                      onChange={(e, val) => {
                                        setFieldValue(field.fieldName, val && val.optionValue ? val.optionValue : '');

                                        if (val && val.optionValue !== user?.user?._id) {
                                          const checkOwnerAddedInCollaborator = values['collaborator'].find(
                                            (d) => d?.optionValue === user?.user?._id
                                          );
                                          if (!checkOwnerAddedInCollaborator) {
                                            setFieldValue('collaborator', [
                                              ...values['collaborator'],
                                              collaboratorData.find((d) => d?.optionValue === user?.user?._id).optionValue
                                            ]);
                                          }
                                        }
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      disabled={disableOwnerSelection || (workOrderId && field.disableOnEdit)}
                                      onOpen={() => {
                                        onOwnerDropdownOpen(values['collaborator']);
                                      }}
                                    />
                                  ) : field.fieldName === 'collaborator' ? (
                                    <FormTypes
                                      fieldData={field}
                                      isNew={!workOrderId}
                                      {...field}
                                      disabled={workOrderId && field.disableOnEdit}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={collaboratorData}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      onOpen={() => {
                                        onCollabOwnerMultiselectOpen(values['owner']);
                                      }}
                                    />
                                  ) : field.fieldName === 'warehouse' ? (
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
                                      isNew={!Boolean(workOrderId)}
                                      disabled={
                                        (referenceType && referenceData && disabledFieldArray.includes(field.fieldName)) ||
                                        (referenceData?.warehouse && field.fieldName === 'warehouse') ||
                                        (Boolean(workOrderId) && field.disableOnEdit)
                                      }
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value);
                                        let data = assetOptionsData.filter((i) => i.warehouse === value);
                                        setAssetOptions(data);
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
                                      isNew={!Boolean(workOrderId)}
                                      disabled={
                                        (referenceType && referenceData && disabledFieldArray.includes(field.fieldName)) ||
                                        (referenceData?.product && field.fieldName === 'product') ||
                                        (Boolean(workOrderId) && field.disableOnEdit)
                                      }
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      productOptions
                                      type={field.type}
                                      options={productOptions}
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
                                  ) : field.fieldName === 'serializedAsset' ? (
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
                                      isNew={!Boolean(workOrderId)}
                                      disabled={
                                        (referenceType && referenceData && disabledFieldArray.includes(field.fieldName)) ||
                                        (referenceData?.serializedAsset && field.fieldName === 'serializedAsset') ||
                                        (Boolean(workOrderId) && field.disableOnEdit)
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
                                  ) : (
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
                                      isNew={!Boolean(workOrderId)}
                                      disabled={
                                        (referenceType && referenceData && disabledFieldArray.includes(field.fieldName)) ||
                                        (referenceData?.serializedAsset && field.fieldName === 'serializedAsset') ||
                                        (Boolean(workOrderId) && field.disableOnEdit)
                                      }
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
                      ) : (
                        form.sectionFields.map((field) => (
                          <FormTypes
                            {...field}
                            fieldData={field}
                            disabled={Boolean(workOrderId) && field.disableOnEdit}
                            isNew={Boolean(workOrderId)}
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
                            style={{ visibility: 'hidden' }}
                          />
                        ))
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
                    if (!isEqual(ref.current.values, initialData.values)) {
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
